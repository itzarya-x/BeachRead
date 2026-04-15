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
  };
  return map[value] || 'PLANNING';
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
      const localEntry = await this.findLocalEntry(job.user_id, title.id);
      const previousSnapshot = await this.findProviderSnapshot(job.user_id, job.provider, title.id);

      await this.upsertProviderSnapshot(job.user_id, job.provider, title.id, remote);

      if (!localEntry) {
        await supabaseAdmin.from('library_entries').insert({
          user_id: job.user_id,
          title_id: title.id,
          status: normalizeRemoteStatus(remote.status),
          progress_chapters: remote.progress,
          progress_volumes: remote.progressVolumes || 0,
          score: remote.score,
          last_mutation_source: 'SYNC_PULL',
          started_at: remote.startedAt || null,
          completed_at: normalizeRemoteStatus(remote.status) === 'COMPLETED' ? (remote.completedAt || nowIso()) : null,
          last_read_at: remote.updatedAt || nowIso(),
        });
        imported += 1;
        continue;
      }

      if (!this.hasConflict(localEntry, remote, previousSnapshot, importMode)) {
        await supabaseAdmin
          .from('library_entries')
          .update({
            status: normalizeRemoteStatus(remote.status),
            progress_chapters: remote.progress,
            progress_volumes: remote.progressVolumes || 0,
            score: remote.score,
            last_mutation_source: 'SYNC_PULL',
            completed_at: normalizeRemoteStatus(remote.status) === 'COMPLETED' ? (remote.completedAt || localEntry.completed_at || nowIso()) : null,
            last_read_at: remote.updatedAt || localEntry.last_read_at || nowIso(),
            entry_version: Number(localEntry.entry_version) + 1,
            updated_at: nowIso(),
          })
          .eq('id', localEntry.id);
        imported += 1;
        continue;
      }

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
    const query = `
      query {
        anime: MediaListCollection(type: ANIME, userName: null) {
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
        manga: MediaListCollection(type: MANGA, userName: null) {
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
      body: JSON.stringify({ query }),
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

    const entries = [];
    
    // Process Anime
    for (const list of result.data?.anime?.lists || []) {
      for (const entry of list.entries || []) {
        entries.push(this.normalizeAniListEntry(entry, 'ANIME'));
      }
    }

    // Process Manga
    for (const list of result.data?.manga?.lists || []) {
      for (const entry of list.entries || []) {
        entries.push(this.normalizeAniListEntry(entry, 'MANGA'));
      }
    }
    
    return entries;
  }

  normalizeAniListEntry(entry, mediaType) {
    return {
      providerEntryId: String(entry.id),
      providerTitleId: String(entry.media.id),
      mediaType,
      title: entry.media.title,
      primaryTitle: entry.media.title.romaji || entry.media.title.english || entry.media.title.native,
      coverImageUrl: entry.media.coverImage?.extraLarge || null,
      bannerImageUrl: entry.media.bannerImage || null,
      description: entry.media.description || null,
      chapterCount: entry.media.chapters ?? null,
      volumeCount: entry.media.volumes ?? null,
      episodeCount: entry.media.episodes ?? null,
      publishingStatus: entry.media.status || 'RELEASING',
      format: entry.media.format || (mediaType === 'ANIME' ? 'TV' : 'MANGA'),
      genres: entry.media.genres || [],
      status: entry.status,
      progress: Number(entry.progress || 0),
      progressVolumes: Number(entry.progressVolumes || 0),
      score: entry.score ?? null,
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
    const slug = slugify(remote.primaryTitle);
    const baseTitle = {
      canonical_slug: slug,
      primary_title: remote.primaryTitle,
      title_romaji: remote.title.romaji || null,
      title_english: remote.title.english || null,
      title_native: remote.title.native || null,
      media_type: remote.mediaType || 'MANGA',
      format: remote.format || (remote.mediaType === 'ANIME' ? 'TV' : 'MANGA'),
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
      const { data, error } = await supabaseAdmin
        .from('titles')
        .update({
          ...baseTitle,
          metadata_version: 1,
          updated_at: nowIso(),
        })
        .eq('id', existingByMapping.title_id)
        .select('*')
        .single();

      if (error) throw error;
      title = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('titles')
        .upsert(baseTitle, { onConflict: 'canonical_slug' })
        .select('*')
        .single();

      if (error) throw error;
      title = data;
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

    if (mappingError) throw mappingError;

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
        provider_progress_chapters: remote.progress,
        provider_progress_volumes: remote.progressVolumes || 0,
        provider_score: remote.score,
        provider_updated_at: remote.updatedAt || null,
        raw_payload: remote.rawPayload || {},
        snapshot_hash: snapshotHash(remote),
        last_pulled_at: nowIso(),
      }, { onConflict: 'user_id,provider,title_id' });

    if (error) throw error;
  }

  hasConflict(localEntry, remote, previousSnapshot, importMode) {
    if (!localEntry) return false;
    if (importMode) return true;
    if (!previousSnapshot) return false;

    const localChangedSinceSnapshot =
      normalizeRemoteStatus(localEntry.status) !== normalizeRemoteStatus(previousSnapshot.provider_status)
      || Number(localEntry.progress_chapters || 0) !== Number(previousSnapshot.provider_progress_chapters || 0)
      || Number(localEntry.progress_volumes || 0) !== Number(previousSnapshot.provider_progress_volumes || 0)
      || Number(localEntry.score || 0) !== Number(previousSnapshot.provider_score || 0);

    const remoteChangedSinceSnapshot =
      normalizeRemoteStatus(remote.status) !== normalizeRemoteStatus(previousSnapshot.provider_status)
      || Number(remote.progressChapters || 0) !== Number(previousSnapshot.provider_progress_chapters || 0)
      || Number(remote.progressVolumes || 0) !== Number(previousSnapshot.provider_progress_volumes || 0)
      || Number(remote.score || 0) !== Number(previousSnapshot.provider_score || 0);

    if (!localChangedSinceSnapshot || !remoteChangedSinceSnapshot) {
      return false;
    }

    return (
      normalizeRemoteStatus(localEntry.status) !== normalizeRemoteStatus(remote.status)
      || Number(localEntry.progress_chapters || 0) !== Number(remote.progressChapters || 0)
      || Number(localEntry.score || 0) !== Number(remote.score || 0)
    );
  }

  async createConflict(job, localEntry, title, remote) {
    const conflictType =
      normalizeRemoteStatus(localEntry.status) !== normalizeRemoteStatus(remote.status)
        ? 'STATUS_MISMATCH'
        : Number(localEntry.progress_chapters || 0) !== Number(remote.progressChapters || 0)
          ? 'PROGRESS_MISMATCH'
          : 'SCORE_MISMATCH';

    const localSnapshot = {
      status: localEntry.status,
      progressChapters: localEntry.progress_chapters,
      progressVolumes: localEntry.progress_volumes,
      score: localEntry.score,
      updatedAt: localEntry.updated_at,
      source: localEntry.last_mutation_source,
      entryVersion: localEntry.entry_version,
    };

    const remoteSnapshot = {
      provider: job.provider,
      status: normalizeRemoteStatus(remote.status),
      progressChapters: remote.progressChapters,
      progressVolumes: remote.progressVolumes || 0,
      score: remote.score,
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
    const mutation = `
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
      body: JSON.stringify({ query: mutation, variables }),
    });

    if (response.status === 401) throw this.buildError('TOKEN_EXPIRED', 'AniList token expired during push', false);
    if (response.status === 429) throw this.buildError('RATE_LIMITED', 'AniList rate limited push', true);
    if (!response.ok) throw this.buildError('PROVIDER_5XX', `AniList push failed with status ${response.status}`, true);

    const result = await response.json();
    if (result.errors?.length) throw this.buildError('VALIDATION_ERROR', result.errors[0].message || 'AniList push failed', false);

    return {
      providerEntryId: String(result.data.SaveMediaListEntry.id),
      providerTitleId: mapping.provider_title_id,
      status: result.data.SaveMediaListEntry.status,
      progressChapters: Number(result.data.SaveMediaListEntry.progress || 0),
      progressVolumes: Number(result.data.SaveMediaListEntry.progressVolumes || 0),
      score: result.data.SaveMediaListEntry.score ?? null,
      updatedAt: result.data.SaveMediaListEntry.updatedAt ? new Date(Number(result.data.SaveMediaListEntry.updatedAt) * 1000).toISOString() : nowIso(),
      rawPayload: result.data.SaveMediaListEntry,
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
