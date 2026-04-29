const crypto = require('crypto');
const { supabaseAdmin } = require('../lib/supabase');

const ANILIST_API = 'https://graphql.anilist.co';
const MAL_API = 'https://api.myanimelist.net/v2';

function nowIso() {
  return new Date().toISOString();
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `title-${crypto.randomUUID().slice(0, 8)}`;
}

function snapshotHash(entry) {
  return crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
}

function normalizeRemoteStatus(rawStatus) {
  const value = String(rawStatus || '').toUpperCase();
  const map = {
    CURRENT: 'READING',
    READING: 'READING',
    COMPLETED: 'COMPLETED',
    PAUSED: 'PAUSED',
    ON_HOLD: 'PAUSED',
    DROPPED: 'DROPPED',
    PLAN_TO_READ: 'PLANNING',
    PLANNING: 'PLANNING',
    REPEATING: 'READING',
  };
  return map[value] || 'PLANNING';
}

function remoteProgress(remote) {
  return Number(remote?.progress ?? remote?.progressChapters ?? 0);
}

function remoteProgressVolumes(remote) {
  return Number(remote?.progressVolumes ?? 0);
}

class SyncService {
  async processJob(jobId) {
    const job = await this.getJob(jobId);

    try {
      await this.updateJob(job.id, {
        status: 'RUNNING',
        started_at: job.started_at || nowIso(),
      });

      if (job.job_type === 'INITIAL_IMPORT') {
        await this.performImportLikeJob(job, true);
      } else if (job.job_type === 'INCREMENTAL_PULL' || job.job_type === 'FULL_RECONCILIATION') {
        await this.performImportLikeJob(job, false);
      } else if (job.job_type === 'INCREMENTAL_PUSH') {
        await this.performPushJob(job);
      } else {
        throw this.buildError('VALIDATION_ERROR', `Unsupported job type ${job.job_type}`, false);
      }
    } catch (error) {
      await this.failJob(job, error);
      throw error;
    }
  }

  async getJob(jobId) {
    const { data, error } = await supabaseAdmin
      .from('sync_jobs')
      .select(`
        *,
        connection:sync_connections (*)
      `)
      .eq('id', jobId)
      .single();

    if (error || !data) {
      throw this.buildError('VALIDATION_ERROR', 'Sync job not found', false);
    }

    return data;
  }

  buildError(code, message, retryable = true) {
    const error = new Error(message);
    error.code = code;
    error.retryable = retryable;
    return error;
  }

  async updateJob(jobId, patch) {
    const { error } = await supabaseAdmin
      .from('sync_jobs')
      .update({
        ...patch,
        updated_at: nowIso(),
      })
      .eq('id', jobId);

    if (error) throw error;
  }

  async completeJob(job, summary = {}) {
    const connectionPatch = {
      updated_at: nowIso(),
    };

    if (job.job_type === 'INITIAL_IMPORT') {
      connectionPatch.last_full_sync_at = nowIso();
    }
    if (job.job_type === 'INCREMENTAL_PULL' || job.job_type === 'FULL_RECONCILIATION') {
      connectionPatch.last_incremental_sync_at = nowIso();
    }
    if (job.job_type === 'INCREMENTAL_PUSH') {
      connectionPatch.last_successful_push_at = nowIso();
    }

    await supabaseAdmin
      .from('sync_connections')
      .update(connectionPatch)
      .eq('id', job.sync_connection_id);

    await this.updateJob(job.id, {
      status: 'COMPLETED',
      finished_at: nowIso(),
      result_summary: summary,
      error_code: null,
      error_message: null,
    });
  }

  async failJob(job, error) {
    const nextAttempt = Number(job.attempt_count || 0) + 1;
    const retryable = error.retryable !== false && nextAttempt < Number(job.max_attempts || 5);
    const delayMinutes = Math.min(Math.pow(2, nextAttempt), 30);

    await this.updateJob(job.id, {
      status: retryable ? 'RETRYABLE_FAILURE' : 'FAILED',
      error_code: error.code || 'UNKNOWN',
      error_message: error.message,
      scheduled_at: retryable ? new Date(Date.now() + delayMinutes * 60 * 1000).toISOString() : job.scheduled_at,
      finished_at: retryable ? null : nowIso(),
    });

    if (error.code === 'TOKEN_EXPIRED') {
      await supabaseAdmin
        .from('sync_connections')
        .update({
          status: 'REQUIRES_REAUTH',
          updated_at: nowIso(),
        })
        .eq('id', job.sync_connection_id);
    }
  }

  async performImportLikeJob(job, importMode) {
    const remoteEntries = await this.fetchRemoteLibrary(job.connection);
    let imported = 0;
    let conflicts = 0;

    for (const remote of remoteEntries) {
      const title = await this.ensureTitle(remote, job.provider);
      if (!title) continue;

      console.log(`[SyncService] processing entry for title: ${title.primary_title} (${title.id})`);
      const localEntry = await this.findLocalEntry(job.user_id, title.id);
      const previousSnapshot = await this.findProviderSnapshot(job.user_id, job.provider, title.id);

      await this.upsertProviderSnapshot(job.user_id, job.provider, title.id, remote);

      if (!localEntry) {
        await supabaseAdmin.from('library_entries').insert({
          user_id: job.user_id,
          title_id: title.id,
          status: normalizeRemoteStatus(remote.status),
          progress_chapters: remoteProgress(remote),
          progress_volumes: remoteProgressVolumes(remote),
          score: remote.score,
          is_favorite: !!remote.isFavorite,
          last_mutation_source: 'SYNC_PULL',
          started_at: remote.startedAt || null,
          completed_at: normalizeRemoteStatus(remote.status) === 'COMPLETED' ? (remote.completedAt || nowIso()) : null,
          last_read_at: remote.updatedAt || nowIso(),
        });
        imported += 1;
        continue;
      }

      const change = this.calculateChange(localEntry, remote, previousSnapshot, importMode);

      if (!change.hasConflict) {
        if (change.remoteChanged) {
          console.log(`[SyncService] updating local entry for ${title.primary_title} from remote change`);
          await this.updateLocalEntry(localEntry.id, remote);
          imported += 1;
        } else {
          console.log(`[SyncService] no remote change for ${title.primary_title}, skipping local update`);
        }
        continue;
      }

      // Handle Automatic Conflict Resolution Policies
      const policy = job.connection?.default_conflict_policy || 'ASK';

      if (policy === 'LOCAL_WINS') {
        console.log(`[SyncService] resolving conflict for ${title.primary_title}: LOCAL_WINS`);
        // Just update the snapshot so we don't keep seeing this as a new change from provider
        await this.upsertProviderSnapshot(job.user_id, job.provider, title.id, remote);
        imported += 1;
        continue;
      }

      if (policy === 'REMOTE_WINS') {
        console.log(`[SyncService] resolving conflict for ${title.primary_title}: REMOTE_WINS`);
        await this.updateLocalEntry(localEntry.id, remote);
        imported += 1;
        continue;
      }

      if (policy === 'LATEST_WRITE_WINS') {
        const remoteUpdate = new Date(remote.updatedAt || 0).getTime();
        const localUpdate = new Date(localEntry.updated_at || 0).getTime();

        if (remoteUpdate > localUpdate) {
          console.log(`[SyncService] resolving conflict for ${title.primary_title}: REMOTE is newer`);
          await this.updateLocalEntry(localEntry.id, remote);
        } else {
          console.log(`[SyncService] resolving conflict for ${title.primary_title}: LOCAL is newer`);
        }
        imported += 1;
        continue;
      }

      // Default: Create a conflict record for manual resolution
      await this.createConflict(job, localEntry, title, remote);
      conflicts += 1;
    }

    if (conflicts > 0) {
      await this.updateJob(job.id, {
        status: 'AWAITING_CONFLICT_RESOLUTION',
        finished_at: nowIso(),
        result_summary: {
          imported,
          conflicts,
          remoteCount: remoteEntries.length,
        },
      });
      return;
    }

    await this.completeJob(job, {
      imported,
      conflicts,
      remoteCount: remoteEntries.length,
    });
  }

  async performPushJob(job) {
    const snapshot = job.source_snapshot || {};
    const libraryEntryId = snapshot.libraryEntryId;
    if (!libraryEntryId) {
      await this.completeJob(job, { pushed: 0, skipped: 1 });
      return;
    }

    const { data: entry, error } = await supabaseAdmin
      .from('library_entries')
      .select(`
        *,
        title:titles (
          id,
          primary_title
        )
      `)
      .eq('id', libraryEntryId)
      .eq('user_id', job.user_id)
      .single();

    if (error || !entry) {
      throw this.buildError('VALIDATION_ERROR', 'Library entry for push not found', false);
    }

    const { data: mapping } = await supabaseAdmin
      .from('title_provider_mappings')
      .select('*')
      .eq('title_id', entry.title_id)
      .eq('provider', job.provider)
      .maybeSingle();

    if (!mapping) {
      await this.completeJob(job, { pushed: 0, skipped: 1, reason: 'provider_mapping_missing' });
      return;
    }

    const pushResponse = await this.pushRemoteEntry(job.connection, mapping, entry);

    if (pushResponse) {
      await this.upsertProviderSnapshot(job.user_id, job.provider, entry.title_id, pushResponse);
    }

    await this.completeJob(job, { pushed: 1, libraryEntryId: entry.id });
  }

  async fetchRemoteLibrary(connection) {
    const token = connection.access_token_encrypted;
    if (!token) {
      throw this.buildError('TOKEN_EXPIRED', `No access token stored for ${connection.provider}`, false);
    }

    if (connection.provider === 'ANILIST') {
      return this.fetchAniList(token);
    }
    if (connection.provider === 'MAL') {
      return this.fetchMal(token);
    }

    throw this.buildError('VALIDATION_ERROR', `Unsupported provider ${connection.provider}`, false);
  }

  async fetchAniList(token) {
    // 1. Fetch Viewer to get the username if not known, although we can just use the Viewer query to get the list directly if we use the right structure.
    // However, MediaListCollection is powerful. Let's get the username first.
    const viewerResponse = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query { Viewer { name } }`
      }),
    });

    if (!viewerResponse.ok) {
      if (viewerResponse.status === 401) throw this.buildError('TOKEN_EXPIRED', 'AniList token expired', false);
      throw this.buildError('PROVIDER_5XX', 'Failed to fetch AniList viewer', true);
    }

    const viewerResult = await viewerResponse.json();
    const userName = viewerResult.data?.Viewer?.name;

    if (!userName) {
      throw this.buildError('VALIDATION_ERROR', 'Could not identify AniList user', false);
    }

    const query = `
      query ($userName: String) {
        User(name: $userName) {
          favourites {
            anime { nodes { id } }
            manga { nodes { id } }
          }
        }
        anime: MediaListCollection(type: ANIME, userName: $userName) {
          lists {
            entries {
              id status progress score(format: POINT_10_DECIMAL) updatedAt
              startedAt { year month day }
              completedAt { year month day }
              media {
                id title { romaji english native } coverImage { extraLarge } bannerImage
                description(asHtml: false) episodes status format genres
              }
            }
          }
        }
        manga: MediaListCollection(type: MANGA, userName: $userName) {
          lists {
            entries {
              id status progress progressVolumes score(format: POINT_10_DECIMAL) updatedAt
              startedAt { year month day }
              completedAt { year month day }
              media {
                id title { romaji english native } coverImage { extraLarge } bannerImage
                description(asHtml: false) chapters volumes status format genres
              }
            }
          }
        }
      }
    `;

    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { userName } }),
    });

    if (response.status === 401) {
      throw this.buildError('TOKEN_EXPIRED', 'AniList token expired', false);
    }
    if (response.status === 429) {
      throw this.buildError('RATE_LIMITED', 'AniList rate limited the request', true);
    }
    if (!response.ok) {
      throw this.buildError('PROVIDER_5XX', `AniList request failed with status ${response.status}`, true);
    }

    const result = await response.json();
    if (result.errors?.length) {
      throw this.buildError('VALIDATION_ERROR', result.errors[0].message || 'AniList returned errors', false);
    }

    const favoritesSet = new Set();
    const favs = result.data?.User?.favourites;
    if (favs) {
      favs.anime?.nodes?.forEach(node => favoritesSet.add(String(node.id)));
      favs.manga?.nodes?.forEach(node => favoritesSet.add(String(node.id)));
    }

    const entries = [];

    // Process Anime
    for (const list of result.data?.anime?.lists || []) {
      for (const entry of list.entries || []) {
        entries.push(this.normalizeAniListEntry(entry, 'ANIME', favoritesSet));
      }
    }

    // Process Manga
    for (const list of result.data?.manga?.lists || []) {
      for (const entry of list.entries || []) {
        entries.push(this.normalizeAniListEntry(entry, 'MANGA', favoritesSet));
      }
    }

    return entries;
  }

  normalizeAniListEntry(entry, mediaType, favoritesSet = new Set()) {
    const format = entry.media.format;
    const resolvedMediaType = (format === 'NOVEL' && mediaType === 'MANGA') ? 'NOVEL' : mediaType;
    const providerTitleId = String(entry.media.id);

    return {
      providerEntryId: String(entry.id),
      providerTitleId,
      mediaType: resolvedMediaType,
      title: entry.media.title,
      primaryTitle: entry.media.title.romaji || entry.media.title.english || entry.media.title.native,
      coverImageUrl: entry.media.coverImage?.extraLarge || null,
      bannerImageUrl: entry.media.bannerImage || null,
      description: entry.media.description || null,
      chapterCount: entry.media.chapters ?? null,
      volumeCount: entry.media.volumes ?? null,
      episodeCount: entry.media.episodes ?? null,
      publishingStatus: entry.media.status || 'RELEASING',
      format: format || (mediaType === 'ANIME' ? 'TV' : 'MANGA'),
      genres: entry.media.genres || [],
      status: entry.status,
      progress: Number(entry.progress || 0),
      progressVolumes: Number(entry.progressVolumes || 0),
      score: entry.score ?? null,
      isFavorite: favoritesSet.has(providerTitleId),
      updatedAt: entry.updatedAt ? new Date(Number(entry.updatedAt) * 1000).toISOString() : nowIso(),
      startedAt: this.normalizeAniListDate(entry.startedAt),
      completedAt: this.normalizeAniListDate(entry.completedAt),
      rawPayload: entry,
    };
  }

  normalizeAniListDate(value) {
    if (!value?.year) return null;
    const month = String(value.month || 1).padStart(2, '0');
    const day = String(value.day || 1).padStart(2, '0');
    return `${value.year}-${month}-${day}T00:00:00.000Z`;
  }

  async fetchMal(token) {
    // MAL update for anime/manga needs two calls usually, keeping it simple for now as per user focus on AniList
    const response = await fetch(`${MAL_API}/users/@me/mangalist?fields=list_status,num_chapters,num_volumes,status,synopsis,main_picture,alternative_titles,media_type&limit=1000`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw this.buildError('TOKEN_EXPIRED', 'MyAnimeList token expired', false);
    }
    if (response.status === 429) {
      throw this.buildError('RATE_LIMITED', 'MyAnimeList rate limited the request', true);
    }
    if (!response.ok) {
      throw this.buildError('PROVIDER_5XX', `MyAnimeList request failed with status ${response.status}`, true);
    }

    const result = await response.json();
    return (result.data || []).map((item) => ({
      providerEntryId: String(item.node.id),
      providerTitleId: String(item.node.id),
      mediaType: 'MANGA',
      title: {
        romaji: item.node.title,
        english: item.node.alternative_titles?.en || null,
        native: item.node.alternative_titles?.ja || null,
      },
      primaryTitle: item.node.title,
      coverImageUrl: item.node.main_picture?.large || item.node.main_picture?.medium || null,
      bannerImageUrl: null,
      description: item.node.synopsis || null,
      chapterCount: item.node.num_chapters ?? null,
      volumeCount: item.node.num_volumes ?? null,
      episodeCount: null,
      publishingStatus: item.node.status || 'RELEASING',
      format: item.node.media_type === 'novel' ? 'NOVEL' : 'MANGA',
      genres: [],
      status: item.list_status?.status,
      progress: Number(item.list_status?.num_chapters_read || 0),
      progressVolumes: Number(item.list_status?.num_volumes_read || 0),
      score: item.list_status?.score ?? null,
      updatedAt: nowIso(),
      startedAt: item.list_status?.start_date ? `${item.list_status.start_date}T00:00:00.000Z` : null,
      completedAt: item.list_status?.finish_date ? `${item.list_status.finish_date}T00:00:00.000Z` : null,
      rawPayload: item,
    }));
  }

  async ensureTitle(remote, provider) {
    console.log(`[SyncService] ensuring title: ${remote.primaryTitle} (${remote.providerTitleId})`);

    // Prepare base data (without slug for now)
    const baseTitleData = {
      primary_title: remote.primaryTitle,
      title_romaji: remote.title.romaji || null,
      title_english: remote.title.english || null,
      title_native: remote.title.native || null,
      media_type: remote.mediaType || 'MANGA',
      format: remote.format || (remote.mediaType === 'ANIME' ? 'TV' : remote.mediaType === 'NOVEL' ? 'NOVEL' : 'MANGA'),
      publishing_status: String(remote.publishingStatus || 'RELEASING').toUpperCase(),
      description: remote.description,
      cover_image_url: remote.coverImageUrl,
      banner_image_url: remote.bannerImageUrl,
      chapter_count: remote.chapterCount,
      volume_count: remote.volumeCount,
      total_episodes: remote.episodeCount,
      genres: remote.genres || [],
      source_updated_at: remote.updatedAt || nowIso(),
    };

    let title;
    const { data: existingByMapping } = await supabaseAdmin
      .from('title_provider_mappings')
      .select('title_id')
      .eq('provider', provider)
      .eq('provider_title_id', remote.providerTitleId)
      .maybeSingle();

    if (existingByMapping?.title_id) {
      // 1. Found by mapping - Update existing title. 
      // DO NOT update canonical_slug here to avoid collisions with other titles.
      const { data, error } = await supabaseAdmin
        .from('titles')
        .update({
          ...baseTitleData,
          updated_at: nowIso(),
        })
        .eq('id', existingByMapping.title_id)
        .select('*')
        .single();

      if (error) throw error;
      title = data;
    } else {
      // 2. Not mapped - Find a unique slug or claim an unmapped title
      const baseSlug = slugify(remote.primaryTitle);
      let currentSlug = baseSlug;
      let suffix = 1;
      let foundTitleId = null;

      while (true) {
        const { data: existingBySlug } = await supabaseAdmin
          .from('titles')
          .select('id')
          .eq('canonical_slug', currentSlug)
          .maybeSingle();

        if (!existingBySlug) {
          // Slug is free!
          break;
        }

        // Slug exists. Is it already mapped for THIS provider?
        const { data: mappingForThisSlug } = await supabaseAdmin
          .from('title_provider_mappings')
          .select('provider_title_id')
          .eq('title_id', existingBySlug.id)
          .eq('provider', provider)
          .maybeSingle();

        if (!mappingForThisSlug) {
          // Title exists but is NOT mapped for this provider. We can claim it.
          foundTitleId = existingBySlug.id;
          break;
        }

        if (mappingForThisSlug.provider_title_id === remote.providerTitleId) {
          // It's already our title (unlikely if existingByMapping was null, but safe)
          foundTitleId = existingBySlug.id;
          break;
        }

        // Collision! This slug title is "owned" by another ID for this provider.
        suffix += 1;
        currentSlug = `${slug}-${suffix}`;
        console.log(`[SyncService] slug collision for ${remote.primaryTitle}, trying: ${currentSlug}`);
      }

      if (foundTitleId) {
        // Update the title we found/claimed
        const { data, error } = await supabaseAdmin
          .from('titles')
          .update({
            ...baseTitleData,
            canonical_slug: currentSlug,
            updated_at: nowIso(),
          })
          .eq('id', foundTitleId)
          .select('*')
          .single();
        if (error) throw error;
        title = data;
      } else {
        // Insert new title with unique slug
        const { data, error } = await supabaseAdmin
          .from('titles')
          .insert({
            ...baseTitleData,
            canonical_slug: currentSlug,
          })
          .select('*')
          .single();
        if (error) throw error;
        title = data;
      }
    }

    const { error: mappingError } = await supabaseAdmin
      .from('title_provider_mappings')
      .upsert({
        title_id: title.id,
        provider,
        provider_title_id: remote.providerTitleId,
        provider_payload: remote.rawPayload || {},
        last_seen_at: nowIso(),
      }, { onConflict: 'provider,provider_title_id' });

    if (mappingError) {
      if (mappingError.code === '23505') {
        // This title_id is already taken by another ID for this provider.
        // This shouldn't happen with our while loop, but if it does, it's a critical logic failure.
        console.error(`[SyncService] COLLISION ABORT: ${remote.primaryTitle} (${remote.providerTitleId}) tried to map to ${title.id} which is taken.`);
      }
      throw mappingError;
    }

    return title;
  }

  async findLocalEntry(userId, titleId) {
    const { data } = await supabaseAdmin
      .from('library_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('title_id', titleId)
      .maybeSingle();
    return data;
  }

  async updateLocalEntry(entryId, remote) {
    const { data: current } = await supabaseAdmin
      .from('library_entries')
      .select('entry_version, completed_at, last_read_at')
      .eq('id', entryId)
      .single();

    const status = normalizeRemoteStatus(remote.status);

    await supabaseAdmin
      .from('library_entries')
      .update({
        status,
        progress_chapters: remoteProgress(remote),
        progress_volumes: remoteProgressVolumes(remote),
        score: remote.score,
        is_favorite: !!remote.isFavorite,
        last_mutation_source: 'SYNC_PULL',
        completed_at: status === 'COMPLETED' ? (remote.completedAt || current?.completed_at || nowIso()) : null,
        last_read_at: remote.updatedAt || current?.last_read_at || nowIso(),
        entry_version: Number(current?.entry_version || 0) + 1,
        updated_at: nowIso(),
      })
      .eq('id', entryId);
  }

  async findProviderSnapshot(userId, provider, titleId) {
    const { data } = await supabaseAdmin
      .from('provider_library_snapshots')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('title_id', titleId)
      .maybeSingle();
    return data;
  }

  async upsertProviderSnapshot(userId, provider, titleId, remote) {
    const { error } = await supabaseAdmin
      .from('provider_library_snapshots')
      .upsert({
        user_id: userId,
        provider,
        title_id: titleId,
        provider_entry_id: remote.providerEntryId,
        provider_status: normalizeRemoteStatus(remote.status),
        provider_progress_chapters: remoteProgress(remote),
        provider_progress_volumes: remoteProgressVolumes(remote),
        provider_score: remote.score,
        provider_updated_at: remote.updatedAt || null,
        is_favorite: !!remote.isFavorite,
        raw_payload: remote.rawPayload || {},
        snapshot_hash: snapshotHash(remote),
        last_pulled_at: nowIso(),
      }, { onConflict: 'user_id,provider,title_id' });

    if (error) throw error;
  }

  calculateChange(localEntry, remote, previousSnapshot, importMode) {
    if (!localEntry) return { remoteChanged: true, localChanged: false, hasConflict: false };

    // Check for actual differences between local and remote
    const statusMismatch = normalizeRemoteStatus(localEntry.status) !== normalizeRemoteStatus(remote.status);
    const progressMismatch = Number(localEntry.progress_chapters || 0) !== remoteProgress(remote);
    const scoreMismatch = Number(localEntry.score || 0) !== Number(remote.score || 0);
    const favoriteMismatch = !!localEntry.is_favorite !== !!remote.isFavorite;

    const hasActualDifference = statusMismatch || progressMismatch || scoreMismatch || favoriteMismatch;

    if (importMode) {
      // During initial import, only conflict if data differs from existing local entry
      return { remoteChanged: hasActualDifference, localChanged: false, hasConflict: hasActualDifference };
    }

    if (!previousSnapshot) {
      // No snapshot yet, assume both might have changed or it's a first-time sync
      // To be safe, we treat differences as conflicts or just skip auto-update
      return { remoteChanged: hasActualDifference, localChanged: hasActualDifference, hasConflict: hasActualDifference };
    }

    const localChanged =
      normalizeRemoteStatus(localEntry.status) !== normalizeRemoteStatus(previousSnapshot.provider_status)
      || Number(localEntry.progress_chapters || 0) !== Number(previousSnapshot.provider_progress_chapters || 0)
      || Number(localEntry.progress_volumes || 0) !== Number(previousSnapshot.provider_progress_volumes || 0)
      || Number(localEntry.score || 0) !== Number(previousSnapshot.provider_score || 0)
      || !!localEntry.is_favorite !== !!previousSnapshot.is_favorite;

    const remoteChanged =
      normalizeRemoteStatus(remote.status) !== normalizeRemoteStatus(previousSnapshot.provider_status)
      || remoteProgress(remote) !== Number(previousSnapshot.provider_progress_chapters || 0)
      || remoteProgressVolumes(remote) !== Number(previousSnapshot.provider_progress_volumes || 0)
      || Number(remote.score || 0) !== Number(previousSnapshot.provider_score || 0)
      || !!remote.isFavorite !== !!previousSnapshot.is_favorite;

    // Conflict exists ONLY if both changed AND they are different
    const hasConflict = localChanged && remoteChanged && hasActualDifference;

    return { localChanged, remoteChanged, hasConflict };
  }

  async createConflict(job, localEntry, title, remote) {
    const conflictType =
      normalizeRemoteStatus(localEntry.status) !== normalizeRemoteStatus(remote.status)
        ? 'STATUS_MISMATCH'
        : Number(localEntry.progress_chapters || 0) !== remoteProgress(remote)
          ? 'PROGRESS_MISMATCH'
          : Number(localEntry.score || 0) !== Number(remote.score || 0)
            ? 'SCORE_MISMATCH'
            : !!localEntry.is_favorite !== !!remote.isFavorite
              ? 'DATA_MISMATCH'
              : 'DATA_MISMATCH';

    const localSnapshot = {
      status: localEntry.status,
      progressChapters: localEntry.progress_chapters,
      progressVolumes: localEntry.progress_volumes,
      score: localEntry.score,
      isFavorite: !!localEntry.is_favorite,
      updatedAt: localEntry.updated_at,
      source: localEntry.last_mutation_source,
      entryVersion: localEntry.entry_version,
    };

    const remoteSnapshot = {
      provider: job.provider,
      status: normalizeRemoteStatus(remote.status),
      progressChapters: remoteProgress(remote),
      progressVolumes: remoteProgressVolumes(remote),
      score: remote.score,
      isFavorite: !!remote.isFavorite,
      updatedAt: remote.updatedAt,
    };

    const { data: conflict, error } = await supabaseAdmin
      .from('sync_conflicts')
      .insert({
        sync_job_id: job.id,
        user_id: job.user_id,
        title_id: title.id,
        library_entry_id: localEntry.id,
        provider: job.provider,
        conflict_type: conflictType,
        local_snapshot: localSnapshot,
        remote_snapshot: remoteSnapshot,
        suggested_resolution: 'MANUAL',
      })
      .select('*')
      .single();

    if (error) throw error;

    await supabaseAdmin.rpc('emit_outbox_event', {
      p_event_type: 'SYNC_CONFLICT_CREATED',
      p_aggregate_type: 'SYNC_CONFLICT',
      p_aggregate_id: conflict.id,
      p_user_id: job.user_id,
      p_payload: {
        conflictId: conflict.id,
        titleId: title.id,
        title: {
          id: title.id,
          primaryTitle: title.primary_title,
          coverImageUrl: title.cover_image_url,
        },
        local: localSnapshot,
        remote: remoteSnapshot,
      },
      p_dedupe_key: `sync-conflict:${conflict.id}`,
    });
  }

  async pushRemoteEntry(connection, mapping, entry) {
    if (connection.provider === 'ANILIST') {
      return this.pushAniList(connection.access_token_encrypted, mapping, entry);
    }
    if (connection.provider === 'MAL') {
      return this.pushMal(connection.access_token_encrypted, mapping, entry);
    }
    return null;
  }

  async pushAniList(token, mapping, entry) {
    // 1. Update MediaListEntry (status, progress, score)
    const mediaListMutation = `
      mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $progressVolumes: Int, $score: Float) {
        SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress, progressVolumes: $progressVolumes, scoreRaw: $score) {
          id
          status
          progress
          progressVolumes
          score(format: POINT_10_DECIMAL)
          updatedAt
        }
      }
    `;

    const variables = {
      mediaId: Number(mapping.provider_title_id),
      status: entry.status === 'PLANNING' ? 'PLANNING' : entry.status,
      progress: entry.progress_chapters,
      progressVolumes: entry.progress_volumes,
      score: entry.score == null ? null : Number(entry.score) * 10,
    };

    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mediaListMutation, variables }),
    });

    if (response.status === 401) throw this.buildError('TOKEN_EXPIRED', 'AniList token expired during push', false);
    if (response.status === 429) throw this.buildError('RATE_LIMITED', 'AniList rate limited push', true);
    if (!response.ok) throw this.buildError('PROVIDER_5XX', `AniList push failed with status ${response.status}`, true);

    const result = await response.json();
    if (result.errors?.length) throw this.buildError('VALIDATION_ERROR', result.errors[0].message || 'AniList push failed', false);

    const updatedEntry = result.data.SaveMediaListEntry;

    // 2. Update Favorite Status if different
    // We need to know current remote favorite status. We can check our latest snapshot.
    const { data: snapshot } = await supabaseAdmin
      .from('provider_library_snapshots')
      .select('raw_payload')
      .eq('user_id', entry.user_id)
      .eq('provider', 'ANILIST')
      .eq('title_id', entry.title_id)
      .maybeSingle();

    const remoteIsFavorite = !!snapshot?.raw_payload?.isFavorite;
    const localIsFavorite = !!entry.is_favorite;

    if (localIsFavorite !== remoteIsFavorite) {
      const favMutation = `
        mutation ($animeId: Int, $mangaId: Int) {
          ToggleFavourite(animeId: $animeId, mangaId: $mangaId) {
            anime { nodes { id } }
            manga { nodes { id } }
          }
        }
      `;

      const isAnime = entry.media_type === 'ANIME';
      const favVars = {
        animeId: isAnime ? Number(mapping.provider_title_id) : null,
        mangaId: !isAnime ? Number(mapping.provider_title_id) : null,
      };

      await fetch(ANILIST_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: favMutation, variables: favVars }),
      });
      // We don't strictly fail the whole job if favorite toggle fails, 
      // but AniList is usually stable if the first call succeeded.
    }

    return {
      providerEntryId: String(updatedEntry.id),
      providerTitleId: mapping.provider_title_id,
      status: updatedEntry.status,
      progressChapters: Number(updatedEntry.progress || 0),
      progressVolumes: Number(updatedEntry.progressVolumes || 0),
      score: updatedEntry.score ?? null,
      isFavorite: localIsFavorite,
      updatedAt: updatedEntry.updatedAt ? new Date(Number(updatedEntry.updatedAt) * 1000).toISOString() : nowIso(),
      rawPayload: { ...updatedEntry, isFavorite: localIsFavorite },
    };
  }

  async pushMal(token, mapping, entry) {
    const params = new URLSearchParams();
    params.set('status', entry.status === 'PLANNING' ? 'plan_to_read' : entry.status.toLowerCase());
    params.set('num_chapters_read', String(entry.progress_chapters || 0));
    params.set('num_volumes_read', String(entry.progress_volumes || 0));
    if (entry.score != null) params.set('score', String(Math.round(Number(entry.score))));

    const response = await fetch(`${MAL_API}/manga/${mapping.provider_title_id}/my_list_status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (response.status === 401) throw this.buildError('TOKEN_EXPIRED', 'MyAnimeList token expired during push', false);
    if (response.status === 429) throw this.buildError('RATE_LIMITED', 'MyAnimeList rate limited push', true);
    if (!response.ok) throw this.buildError('PROVIDER_5XX', `MyAnimeList push failed with status ${response.status}`, true);

    const result = await response.json();
    return {
      providerEntryId: String(mapping.provider_title_id),
      providerTitleId: mapping.provider_title_id,
      status: result.status || entry.status,
      progressChapters: Number(result.num_chapters_read || entry.progress_chapters || 0),
      progressVolumes: Number(result.num_volumes_read || entry.progress_volumes || 0),
      score: result.score ?? entry.score ?? null,
      updatedAt: nowIso(),
      rawPayload: result,
    };
  }
}

module.exports = new SyncService();
