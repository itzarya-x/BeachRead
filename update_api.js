const fs = require('fs');
let code = fs.readFileSync('beach-read-app/api/index.js', 'utf8');

const queryMatch = code.match(/const query = `\n      query \(\$season: MediaSeason!, \$seasonYear: Int!\) \{[\s\S]*?latestNews: Page\(page: 1, perPage: 10\) \{[\s\S]*?\}\n    `;/);

if (!queryMatch) {
  console.log('Query not found');
  process.exit(1);
}

const newQuery = `const query = \`
      query ($season: MediaSeason!, $seasonYear: Int!) {
        hero: Page(page: 1, perPage: 5) {
          media(type: MANGA, sort: TRENDING_DESC, isAdult: false) {
            \${MEDIA_FRAGMENT}
          }
        }
        rankingTrending: Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            averageScore
            popularity
            genres
            status
            episodes
            nextAiringEpisode { episode airingAt timeUntilAiring }
          }
        }
        rankingTrendingManga: Page(page: 1, perPage: 10) {
          media(type: MANGA, sort: TRENDING_DESC, isAdult: false) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            averageScore
            popularity
            genres
            status
            chapters
          }
        }
        rankingPopular: Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            averageScore
            popularity
            genres
            status
            episodes
            nextAiringEpisode { episode airingAt timeUntilAiring }
          }
        }
        rankingPopularManga: Page(page: 1, perPage: 10) {
          media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            averageScore
            popularity
            genres
            status
            chapters
          }
        }
        rankingTopScored: Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            averageScore
            popularity
            genres
            status
            episodes
            nextAiringEpisode { episode airingAt timeUntilAiring }
          }
        }
        rankingTopScoredManga: Page(page: 1, perPage: 10) {
          media(type: MANGA, sort: SCORE_DESC, isAdult: false) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            averageScore
            popularity
            genres
            status
            chapters
          }
        }
        rankingSeasonal: Page(page: 1, perPage: 10) {
          media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            averageScore
            popularity
            genres
            status
            episodes
            nextAiringEpisode { episode airingAt timeUntilAiring }
          }
        }
        rankingAiring: Page(page: 1, perPage: 10) {
          media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            averageScore
            popularity
            genres
            status
            episodes
            nextAiringEpisode { episode airingAt timeUntilAiring }
          }
        }
        updates: Page(page: 1, perPage: 6) {
          media(type: MANGA, sort: UPDATED_AT_DESC, isAdult: false) {
            \${MEDIA_FRAGMENT}
            staff(perPage: 1) {
              edges {
                node {
                  name { full }
                }
              }
            }
          }
        }
        recentlyAdded: Page(page: 1, perPage: 10) {
          media(type: MANGA, sort: ID_DESC, isAdult: false) {
            \${MEDIA_FRAGMENT}
          }
        }
        recentlyAddedAnime: Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: ID_DESC, isAdult: false) {
            \${MEDIA_FRAGMENT}
          }
        }
        latestNews: Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            id
            title { romaji english native }
            description
            bannerImage
            coverImage { extraLarge large }
            siteUrl
          }
        }
      }
    \`;`;

code = code.replace(queryMatch[0], newQuery);

const mapRankingCodeMatch = code.match(/const mapRanking = \(list = \[\]\) =>\n\s*list\.map\(\(m, index\) => \(\{\n[\s\S]*?countdown: formatCountdown\(m\.nextAiringEpisode\?\.timeUntilAiring\),\n\s*\}\)\);/);

const newMapRankingCode = `const mapRanking = (list = [], mediaType = 'ANIME') =>
    list.map((m, index) => ({
      rank: index + 1,
      id: m.id?.toString() || '',
      title: m.title?.romaji || m.title?.english || m.title?.native || 'Untitled',
      titleJp: m.title?.native || '',
      coverUrl: m.coverImage?.extraLarge || m.coverImage?.large || m.bannerImage || '',
      episodes: m.episodes || '?',
      total_episodes: m.episodes || '?',
      chapters: m.chapters || '?',
      score: m.averageScore || 0,
      genres: m.genres || [],
      status: m.status || '',
      mediaType,
      popularity: typeof m.popularity === 'number' ? m.popularity.toLocaleString() : 'N/A',
      nextEpisode: m.nextAiringEpisode?.episode || null,
      countdown: formatCountdown(m.nextAiringEpisode?.timeUntilAiring),
    }));`;

code = code.replace(mapRankingCodeMatch[0], newMapRankingCode);

const payloadCodeMatch = code.match(/const payload = \{\n\s*hero: heroMedias\.map[\s\S]*?url: m\.siteUrl \|\| null,\n\s*\}\)\),\n\s*\};/);

const newPayloadCode = `const recentlyAddedAnimeMedia = result?.data?.recentlyAddedAnime?.media || [];

  const payload = {
    hero: heroMedias.map((m) => ({
      id: m.id.toString(),
      title: m.title.romaji || m.title.english || m.title.native,
      titleJp: m.title.native,
      description: m.description?.replace(/<[^>]*>?/gm, '') || 'No description available.',
      genres: m.genres,
      mediaType: 'MANGA',
      coverUrl: m.bannerImage || m.coverImage.extraLarge,
    })),
    rankings: {
      season,
      seasonYear: year,
      trendingAnime: mapRanking(result?.data?.rankingTrending?.media, 'ANIME'),
      trendingManga: mapRanking(result?.data?.rankingTrendingManga?.media, 'MANGA'),
      popularAnime: mapRanking(result?.data?.rankingPopular?.media, 'ANIME'),
      popularManga: mapRanking(result?.data?.rankingPopularManga?.media, 'MANGA'),
      topScoredAnime: mapRanking(result?.data?.rankingTopScored?.media, 'ANIME'),
      topScoredManga: mapRanking(result?.data?.rankingTopScoredManga?.media, 'MANGA'),
      seasonal: mapRanking(result?.data?.rankingSeasonal?.media, 'ANIME'),
      airingSchedule: mapRanking(result?.data?.rankingAiring?.media, 'ANIME'),
    },
    updates: updatesMedia.map((m) => ({
      id: m.id.toString(),
      title: m.title.romaji || m.title.english || m.title.native,
      author: m.staff?.edges?.[0]?.node?.name?.full || 'Unknown Author',
      genres: m.genres,
      updatedAt: 'Updated recently',
      mediaType: 'MANGA',
      coverUrl: m.coverImage.large,
      chapters: [{ num: \`Chapter \${m.chapters || '?'}\`, title: 'Latest' }],
    })),
    recentlyAdded: recentlyAddedMedia.map((m) => ({
      id: m.id.toString(),
      title: m.title.romaji || m.title.english || m.title.native,
      genres: m.genres,
      mediaType: 'MANGA',
      coverUrl: m.coverImage.large || m.coverImage?.extraLarge || m.bannerImage || '',
    })),
    recentlyAddedAnime: recentlyAddedAnimeMedia.map((m) => ({
      id: m.id.toString(),
      title: m.title.romaji || m.title.english || m.title.native,
      genres: m.genres,
      mediaType: 'ANIME',
      coverUrl: m.coverImage.large || m.coverImage?.extraLarge || m.bannerImage || '',
    })),
    latestNews: (Array.isArray(latestNewsMedia) ? latestNewsMedia : []).map((m) => ({
      id: m.id.toString(),
      title: m.title.romaji || m.title.english || m.title.native,
      description: m.description?.replace(/<[^>]*>?/gm, '') || 'No description available.',
      coverUrl: m.bannerImage || m.coverImage?.extraLarge || m.coverImage?.large || '',
      url: m.siteUrl || null,
    })),
  };`;

code = code.replace(payloadCodeMatch[0], newPayloadCode);

fs.writeFileSync('beach-read-app/api/index.js', code);
console.log('Update successful');
