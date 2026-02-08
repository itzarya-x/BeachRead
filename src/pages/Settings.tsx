import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { useData } from "@/context/DataContext";
import {
    BarChart3,
    Bell,
    BookOpen,
    Calendar,
    Crown,
    Eye,
    EyeOff,
    Hash,
    Languages,
    Layers,
    List,
    Lock,
    Mail,
    Monitor,
    Palette,
    Settings2,
    Shield,
    Star,
    Tv,
    User,
    Wifi,
} from "lucide-react";

const LIST_ORDER_LABELS: Record<number, string> = {
    0: "Score",
    1: "Title",
    2: "Last Updated",
    3: "Last Added",
};

const Settings = () => {
    const { user, loading } = useData();

    if (loading || !user) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <PageWrapper>
            <PageHeader title="Settings" subtitle="Read-only view of every preference from your GDPR export." />
            <PageContent className="space-y-6">
                {/* Account */}
                <SettingsSection title="Account">
                    <SettingRow icon={User} label="Display Name" value={user.displayName} />
                    <SettingRow icon={Mail} label="Username / Login" value={user.userName} />
                    <SettingRow icon={Mail} label="Email" value={user.email} />
                    <SettingRow
                        icon={Calendar}
                        label="Account Created"
                        value={new Date(user.createdAt).toLocaleString()}
                    />
                    <SettingRow
                        icon={Calendar}
                        label="Last Updated"
                        value={new Date(user.updatedAt).toLocaleString()}
                    />
                    <SettingRow icon={Wifi} label="Last Known IP" value={user.ip || "—"} />
                    <SettingRow icon={Crown} label="Donator Level" value={String(user.donator)} />
                    <SettingRow icon={Crown} label="Donator Badge" value={user.donatorBadge || "None"} />
                    <SettingRow
                        icon={Shield}
                        label="Mod Roles"
                        value={user.modRoles === 0 ? "None" : String(user.modRoles)}
                    />
                </SettingsSection>

                {/* Display Preferences */}
                <SettingsSection title="Display Preferences">
                    <SettingRow
                        icon={Star}
                        label="Score Format"
                        value={user.scoreFormat.replace("POINT_", "").replace("_", " ")}
                    />
                    <SettingRow icon={Languages} label="Title Language" value={user.titleLanguage} />
                    <SettingRow icon={Palette} label="Profile Color" value={user.profileColor} />
                    <SettingRow
                        icon={List}
                        label="Default List Order"
                        value={LIST_ORDER_LABELS[user.listOrder] || String(user.listOrder)}
                    />
                    <SettingRow
                        icon={Monitor}
                        label="Forum Homepage"
                        value={user.forumHomepage === 0 ? "Default" : String(user.forumHomepage)}
                    />
                    <SettingRow icon={Layers} label="Legacy Lists" value={user.legacyLists ? "Enabled" : "Disabled"} />
                </SettingsSection>

                {/* Privacy & Content */}
                <SettingsSection title="Privacy & Content">
                    <SettingRow icon={Lock} label="Profile Privacy" value={user.privacy ? "Private" : "Public"} />
                    <SettingRow icon={Eye} label="Adult Content" value={user.adultContent ? "Shown" : "Hidden"} />
                    <SettingRow
                        icon={EyeOff}
                        label="Hidden Categories"
                        value={user.hiddenCategories ? JSON.stringify(user.hiddenCategories) : "None"}
                    />
                </SettingsSection>

                {/* Notifications */}
                <SettingsSection title="Notifications">
                    <SettingRow icon={Bell} label="Notifications" value={String(user.notifications)} />
                    <SettingRow
                        icon={Bell}
                        label="Airing Notifications"
                        value={user.airingNotifications ? "Enabled" : "Disabled"}
                    />
                    <SettingRow
                        icon={Settings2}
                        label="Notification Options"
                        value={user.notificationOptions || "Default"}
                    />
                </SettingsSection>

                {/* Counters */}
                <SettingsSection title="GDPR Counters">
                    <SettingRow icon={Tv} label="Anime Watched (GDPR counter)" value={String(user.animeWatched)} />
                    <SettingRow
                        icon={BookOpen}
                        label="Chapters Read (GDPR counter)"
                        value={String(user.chaptersRead)}
                    />
                    <SettingRow icon={Hash} label="Activity History Total" value={String(user.activityHistoryTotal)} />
                </SettingsSection>

                {/* Advanced Scoring */}
                <SettingsSection title="Advanced Scoring">
                    <SettingRow
                        icon={BarChart3}
                        label="Advanced Scores"
                        value={user.advancedScoresActive ? "Active" : "Inactive"}
                    />
                    {user.advancedScoresNames.length > 0 && (
                        <div className="px-4 pb-3">
                            <p className="text-xs text-muted-foreground mb-1.5">Score Categories:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {user.advancedScoresNames.map(name => (
                                    <span
                                        key={name}
                                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                                    >
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </SettingsSection>

                {/* Custom List Names */}
                <SettingsSection title="Custom List Names">
                    {user.customListNames.manga.length > 0 && (
                        <div className="px-4 py-3">
                            <span className="text-xs text-muted-foreground font-medium">Manga Lists:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {user.customListNames.manga.map(n => (
                                    <span
                                        key={n}
                                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                                    >
                                        {n}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {user.customListNames.anime.length > 0 && (
                        <div className="px-4 py-3">
                            <span className="text-xs text-muted-foreground font-medium">Anime Lists:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {user.customListNames.anime.map(n => (
                                    <span
                                        key={n}
                                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                                    >
                                        {n}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {user.customListNames.anime.length === 0 && user.customListNames.manga.length === 0 && (
                        <div className="px-4 py-3 text-sm text-muted-foreground">No custom lists configured.</div>
                    )}
                </SettingsSection>

                {/* Statistics (parsed JSON) */}
                <SettingsSection title="Parsed Statistics (from GDPR)">
                    <div className="px-4 py-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium mb-2">Anime</p>
                            <StatRow label="Count" value={user.statistics.anime.count} />
                            <StatRow
                                label="Minutes Watched"
                                value={user.statistics.anime.minutesWatched.toLocaleString()}
                            />
                            <StatRow label="Episodes" value={user.statistics.anime.progress.toLocaleString()} />
                            <StatRow label="Volumes" value={user.statistics.anime.progressVolumes} />
                            <StatRow label="Mean Score" value={user.statistics.anime.meanScore.toFixed(1)} />
                            <StatRow label="Std Deviation" value={user.statistics.anime.standardDeviation.toFixed(1)} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium mb-2">Manga</p>
                            <StatRow label="Count" value={user.statistics.manga.count} />
                            <StatRow
                                label="Minutes Watched"
                                value={user.statistics.manga.minutesWatched.toLocaleString()}
                            />
                            <StatRow label="Chapters" value={user.statistics.manga.progress.toLocaleString()} />
                            <StatRow label="Volumes" value={user.statistics.manga.progressVolumes.toLocaleString()} />
                            <StatRow label="Mean Score" value={user.statistics.manga.meanScore.toFixed(1)} />
                            <StatRow label="Std Deviation" value={user.statistics.manga.standardDeviation.toFixed(1)} />
                        </div>
                    </div>
                </SettingsSection>

                {/* Raw Distributions */}
                {(user.statusDistribution.anime.length > 0 ||
                    user.statusDistribution.manga.length > 0 ||
                    user.scoreDistribution.anime.length > 0 ||
                    user.scoreDistribution.manga.length > 0) && (
                    <SettingsSection title="Raw Distributions (from stats)">
                        {user.statusDistribution.anime.length > 0 && (
                            <RawJsonBlock label="Status Distribution (Anime)" data={user.statusDistribution.anime} />
                        )}
                        {user.statusDistribution.manga.length > 0 && (
                            <RawJsonBlock label="Status Distribution (Manga)" data={user.statusDistribution.manga} />
                        )}
                        {user.scoreDistribution.anime.length > 0 && (
                            <RawJsonBlock label="Score Distribution (Anime)" data={user.scoreDistribution.anime} />
                        )}
                        {user.scoreDistribution.manga.length > 0 && (
                            <RawJsonBlock label="Score Distribution (Manga)" data={user.scoreDistribution.manga} />
                        )}
                    </SettingsSection>
                )}

                {/* About / Bio */}
                {user.about && (
                    <SettingsSection title="About / Bio">
                        <div className="px-4 py-3">
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{user.about}</p>
                        </div>
                    </SettingsSection>
                )}
            </PageContent>
        </PageWrapper>
    );
};

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 bg-surface-1/50">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            </div>
            <div className="divide-y divide-border/20">{children}</div>
        </div>
    );
}

function SettingRow({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground flex-1">{label}</span>
            <span className="text-sm text-foreground font-medium text-right max-w-[50%] break-all">{value}</span>
        </div>
    );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex justify-between py-1">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-medium">{String(value)}</span>
        </div>
    );
}

function RawJsonBlock({ label, data }: { label: string; data: unknown }) {
    return (
        <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground font-medium mb-1.5">{label}</p>
            <pre className="text-xs text-foreground bg-surface-1 rounded-lg p-3 overflow-auto max-h-40 font-mono">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

export default Settings;
