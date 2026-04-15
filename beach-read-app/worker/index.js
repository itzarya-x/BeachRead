require('dotenv').config();
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const syncService = require('../api/services/syncService');
const notificationService = require('./notificationService');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in worker');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const WORKER_ID = `worker:${process.pid}`;
let syncLoopRunning = false;
let notificationLoopRunning = false;
let releasePollRunning = false;

async function claimSyncJobs(limit = 5) {
  const { data, error } = await supabase.rpc('app_claim_sync_jobs', {
    p_worker: WORKER_ID,
    p_limit: limit,
  });

  if (error) throw error;
  return data || [];
}

async function processSyncJobs() {
  if (syncLoopRunning) return;
  syncLoopRunning = true;

  try {
    const jobs = await claimSyncJobs(5);
    for (const job of jobs) {
      try {
        await syncService.processJob(job.id);
      } catch (error) {
        console.error(`[sync] job ${job.id} failed`, error.message);
      }
    }
  } catch (error) {
    console.error('[sync] failed to claim jobs', error);
  } finally {
    syncLoopRunning = false;
  }
}

async function processNotificationEvents() {
  if (notificationLoopRunning) return;
  notificationLoopRunning = true;

  try {
    await notificationService.processPendingEvents(`${WORKER_ID}:notifications`);
  } catch (error) {
    console.error('[notifications] processing failed', error);
  } finally {
    notificationLoopRunning = false;
  }
}

async function pollReleases() {
  if (releasePollRunning) return;
  releasePollRunning = true;

  try {
    const { data: activeTitles, error } = await supabase
      .from('library_entries')
      .select('title_id')
      .in('status', ['READING', 'PAUSED'])
      .limit(5000);

    if (error) throw error;
    if (!activeTitles?.length) return;

    const titleIds = [...new Set(activeTitles.map((row) => row.title_id))];
    const { data: mappings, error: mappingError } = await supabase
      .from('title_provider_mappings')
      .select(`
        title_id,
        provider,
        provider_title_id,
        title:titles (
          id,
          primary_title,
          chapter_count,
          total_episodes,
          media_type
        )
      `)
      .in('title_id', titleIds)
      .eq('provider', 'ANILIST');

    if (mappingError) throw mappingError;
    if (!mappings?.length) return;

    for (const mapping of mappings) {
      try {
        const isAnime = mapping.title?.media_type === 'ANIME';
        const query = `
          query ($id: Int, $type: MediaType) {
            Media(id: $id, type: $type) {
              id
              chapters
              episodes
            }
          }
        `;

        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: { 
              id: Number(mapping.provider_title_id),
              type: mapping.title?.media_type || 'MANGA'
            },
          }),
        });

        if (!response.ok) continue;
        const result = await response.json();
        const latestCount = isAnime 
          ? Number(result.data?.Media?.episodes || 0)
          : Number(result.data?.Media?.chapters || 0);
        
        const currentCount = isAnime
          ? Number(mapping.title?.total_episodes || 0)
          : Number(mapping.title?.chapter_count || 0);

        if (!latestCount || latestCount <= currentCount) continue;

        const updateData = isAnime 
          ? { total_episodes: latestCount, updated_at: new Date().toISOString() }
          : { chapter_count: latestCount, updated_at: new Date().toISOString() };

        await supabase
          .from('titles')
          .update(updateData)
          .eq('id', mapping.title_id);

        for (let unit = currentCount + 1; unit <= latestCount; unit += 1) {
          await supabase
            .from('releases')
            .upsert({
              title_id: mapping.title_id,
              provider: 'ANILIST',
              chapter_number: unit, // Still using chapter_number column for episodes?
              released_at: new Date().toISOString(),
              payload: {
                providerTitleId: mapping.provider_title_id,
                detectedBy: WORKER_ID,
                unitType: isAnime ? 'EPISODE' : 'CHAPTER'
              },
            }, { onConflict: 'title_id,chapter_number' });
        }
      } catch (mappingErrorInner) {
        console.error(`[releases] failed to poll title ${mapping.title_id}`, mappingErrorInner.message);
      }
    }
  } catch (error) {
    console.error('[releases] polling failed', error);
  } finally {
    releasePollRunning = false;
  }
}

setInterval(processSyncJobs, 10_000);
setInterval(processNotificationEvents, 10_000);
cron.schedule('*/30 * * * *', pollReleases);

console.log('Worker initialized. Sync, release, and notification processors are active.');
