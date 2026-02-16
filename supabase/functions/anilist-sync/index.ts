import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

const MEDIA_LIST_QUERY = `
  query ($userId: Int, $type: MediaType) {
    MediaListCollection(userId: $userId, type: $type) {
      lists {
        name
        status
        entries {
          id
          score(format: POINT_100)
          progress
          progressVolumes
          repeat
          priority
          private
          notes
          hiddenFromStatusLists
          startedAt { year month day }
          completedAt { year month day }
          updatedAt
          createdAt
          media {
            id
            type
            format
            status
            episodes
            chapters
            volumes
            duration
            averageScore
            popularity
            season
            seasonYear
            source
            countryOfOrigin
            genres
            description
            title { romaji english native }
            coverImage { large }
            bannerImage
            tags { name }
          }
        }
      }
    }
  }
`;

serve(async (req) => {
  try {
    const { userId, anilistUserId } = await req.json();

    if (!userId || !anilistUserId) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get Integration Token
    const { data: integration, error: intError } = await supabase
      .from("user_integrations")
      .select("access_token")
      .eq("user_id", userId)
      .eq("provider", "anilist")
      .single();

    if (intError || !integration) {
      return new Response(JSON.stringify({ error: "No integration found" }), { status: 404 });
    }

    // 2. Fetch from AniList (Anime & Manga)
    const fetchList = async (type: string) => {
      const response = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${integration.access_token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          query: MEDIA_LIST_QUERY,
          variables: { userId: anilistUserId, type }
        })
      });
      return response.json();
    };

    const [animeData, mangaData] = await Promise.all([
      fetchList("ANIME"),
      fetchList("MANGA")
    ]);

    const entries: any[] = [];

    const processCollection = (collection: any) => {
      if (!collection?.data?.MediaListCollection?.lists) return;
      collection.data.MediaListCollection.lists.forEach((list: any) => {
        list.entries.forEach((entry: any) => {
          const m = entry.media;
          
          // Map Origin
          let origin = 'manga';
          if (m.type === 'MANGA') {
            if (m.countryOfOrigin === 'KR') origin = 'manhwa';
            else if (m.countryOfOrigin === 'CN') origin = 'manhua';
          }

          entries.push({
            user_id: userId,
            anilist_media_id: m.id,
            anilist_list_entry_id: entry.id,
            media_type: m.type,
            status: entry.status,
            score: entry.score,
            progress: entry.progress,
            progress_volumes: entry.progressVolumes,
            repeat: entry.repeat,
            priority: entry.priority,
            private: entry.private,
            hidden: entry.hiddenFromStatusLists,
            notes: entry.notes,
            year: m.seasonYear,
            format: m.format,
            origin: origin,
            country: m.countryOfOrigin,
            source: m.source,
            runtime: m.duration,
            episodes: m.episodes,
            chapters: m.chapters,
            volumes: m.volumes,
            genres: m.genres,
            tags: m.tags?.map((t: any) => t.name),
            average_score: m.averageScore,
            popularity: m.popularity,
            cover_image: m.coverImage?.large,
            banner_image: m.bannerImage,
            title_romaji: m.title?.romaji,
            title_english: m.title?.english,
            title_native: m.title?.native,
            description: m.description,
            raw_media: m,
            raw_list_entry: entry,
            updated_at: new Date().toISOString()
          });
        });
      });
    };

    processCollection(animeData);
    processCollection(mangaData);

    // 3. Upsert into Supabase in chunks
    const CHUNK_SIZE = 100;
    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const chunk = entries.slice(i, i + CHUNK_SIZE);
      const { error: upsertError } = await supabase
        .from("user_media")
        .upsert(chunk, { onConflict: "user_id, anilist_media_id" });
      
      if (upsertError) {
        console.error("Upsert error:", upsertError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      count: entries.length 
    }), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
