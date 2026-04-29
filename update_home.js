const fs = require('fs');
let code = fs.readFileSync('beach-read-app/client/src/pages/Home.tsx', 'utf8');

const discoverySectionMatch = code.match(/\{\/\* Global Discovery Sections \*\/\}[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>/);

const newDiscoverySection = `{/* Global Discovery Sections */}
                <div className="space-y-24 pt-12 border-t border-border/20">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black uppercase tracking-tight text-foreground">Global Discoveries</h2>
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-primary">Trending items across the network</p>
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Manga</h3>
                        <DiscoverCarousel
                            title="Trending This Week (Manga)"
                            mangaList={homeFeedData?.rankings?.trendingManga || []}
                            loading={homeFeedLoading}
                            onViewAll={() => navigate('/discover?sort=TRENDING_DESC&type=MANGA')}
                        />
                        <DiscoverCarousel
                            title="Top Rated (Manga)"
                            mangaList={homeFeedData?.rankings?.topScoredManga || []}
                            loading={homeFeedLoading}
                            onViewAll={() => navigate('/discover?sort=SCORE_DESC&type=MANGA')}
                        />
                        <DiscoverCarousel
                            title="Just Added (Manga)"
                            mangaList={homeFeedData?.recentlyAdded || []}
                            loading={homeFeedLoading}
                            onViewAll={() => navigate('/discover?sort=ID_DESC&type=MANGA')}
                        />
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Anime</h3>
                        <DiscoverCarousel
                            title="Trending This Week (Anime)"
                            mangaList={homeFeedData?.rankings?.trendingAnime || []}
                            loading={homeFeedLoading}
                            onViewAll={() => navigate('/discover?sort=TRENDING_DESC&type=ANIME')}
                        />
                        <DiscoverCarousel
                            title="Top Rated (Anime)"
                            mangaList={homeFeedData?.rankings?.topScoredAnime || []}
                            loading={homeFeedLoading}
                            onViewAll={() => navigate('/discover?sort=SCORE_DESC&type=ANIME')}
                        />
                        <DiscoverCarousel
                            title="Just Added (Anime)"
                            mangaList={homeFeedData?.recentlyAddedAnime || []}
                            loading={homeFeedLoading}
                            onViewAll={() => navigate('/discover?sort=ID_DESC&type=ANIME')}
                        />
                    </div>
                </div>
            </div>
        </div>`;

code = code.replace(discoverySectionMatch[0], newDiscoverySection);
fs.writeFileSync('beach-read-app/client/src/pages/Home.tsx', code);
console.log('Home.tsx updated');
