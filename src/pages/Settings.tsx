import { AccountSection } from "@/components/account/AccountSection";
import { DeviceList, type Device } from "@/components/account/DeviceList";
import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { BackupStatus } from "@/components/sync/BackupStatus";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import {
    BarChart3,
    Bell,
    BookOpen,
    Calendar,
    CloudDownload,
    CloudUpload,
    Crown,
    Download,
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
    RefreshCw,
    Settings2,
    Shield,
    Star,
    Tv,
    Upload,
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
    const { toast } = useToast();

    if (loading || !user) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Mock devices for demo (TODO: replace with actual device data)
    const mockDevices: Device[] = [
        {
            id: "device_1",
            name: "MacBook Pro",
            type: "desktop",
            lastSeen: new Date(),
            isCurrentDevice: true,
            browser: "Chrome 121",
            os: "macOS Sonoma",
            location: "San Francisco, CA",
        },
        {
            id: "device_2",
            name: "iPhone 14",
            type: "mobile",
            lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
            isCurrentDevice: false,
            browser: "Safari",
            os: "iOS 17",
            location: "San Francisco, CA",
        },
    ];

    const handleForceUpload = async () => {
        try {
            toast({
                title: "Starting force upload",
                description: "Uploading all local data to cloud...",
            });
            // TODO: Call sync engine's forceUploadLocalCopy
            setTimeout(() => {
                toast({
                    title: "Upload complete",
                    description: "All local data has been uploaded to cloud.",
                });
            }, 2000);
        } catch (err) {
            toast({
                title: "Upload failed",
                description: err instanceof Error ? err.message : "Something went wrong",
                variant: "destructive",
            });
        }
    };

    const handleForceDownload = async () => {
        try {
            toast({
                title: "Starting force download",
                description: "Downloading all cloud data...",
            });
            // TODO: Call sync engine's forceDownloadCloudCopy
            setTimeout(() => {
                toast({
                    title: "Download complete",
                    description: "All cloud data has been downloaded.",
                });
            }, 2000);
        } catch (err) {
            toast({
                title: "Download failed",
                description: err instanceof Error ? err.message : "Something went wrong",
                variant: "destructive",
            });
        }
    };

    const handleReSync = async () => {
        try {
            toast({
                title: "Starting re-sync",
                description: "Syncing your vault...",
            });
            // TODO: Call sync engine's downloadUpdates
            setTimeout(() => {
                toast({
                    title: "Re-sync complete",
                    description: "Your vault is now up to date.",
                });
            }, 2000);
        } catch (err) {
            toast({
                title: "Re-sync failed",
                description: err instanceof Error ? err.message : "Something went wrong",
                variant: "destructive",
            });
        }
    };

    return (
        <PageWrapper>
            <PageHeader title="Settings" subtitle="Manage your account and vault settings." />
            <PageContent className="space-y-6">
                {/* Cloud Account Section */}
                <AccountSection />

                {/* Backup Status */}
                <BackupStatus isBackedUp={false} itemCount={0} lastBackupTime={undefined} />

                {/* Cloud Sync Controls */}
                <SettingsSection title="Cloud Sync Controls">
                    <div className="px-4 py-4 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Manually control your vault synchronization. Use force operations with caution.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Force Upload */}
                            <Button
                                variant="outline"
                                className="justify-start gap-2 h-auto py-3 flex-col items-start"
                                onClick={handleForceUpload}
                            >
                                <div className="flex items-center gap-2">
                                    <CloudUpload className="w-4 h-4" />
                                    <span className="font-medium">Force Upload</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Push all local data to cloud</span>
                            </Button>

                            {/* Force Download */}
                            <Button
                                variant="outline"
                                className="justify-start gap-2 h-auto py-3 flex-col items-start"
                                onClick={handleForceDownload}
                            >
                                <div className="flex items-center gap-2">
                                    <CloudDownload className="w-4 h-4" />
                                    <span className="font-medium">Force Download</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Pull all cloud data here</span>
                            </Button>

                            {/* Re-Sync */}
                            <Button
                                variant="outline"
                                className="justify-start gap-2 h-auto py-3 flex-col items-start"
                                onClick={handleReSync}
                            >
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="font-medium">Re-Sync</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Check for cloud changes</span>
                            </Button>
                        </div>

                        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-700">
                            <p>
                                ⚠️ <strong>Force operations:</strong> Force upload replaces cloud data with local. Force
                                download replaces local with cloud. Use only if you know what you're doing.
                            </p>
                        </div>
                    </div>
                </SettingsSection>

                {/* Backup & Export */}
                <SettingsSection title="Backup & Export">
                    <div className="px-4 py-4 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Download your vault as a JSON file for manual backup. This is independent of cloud sync.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                // onClick={handleExportBackup}
                            >
                                <Download className="w-4 h-4" />
                                Export Backup
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                // onClick={handleImportBackup}
                            >
                                <Upload className="w-4 h-4" />
                                Import Backup
                            </Button>
                        </div>
                    </div>
                </SettingsSection>

                {/* Device List */}
                <DeviceList devices={mockDevices} />

                {/* GDPR Account Section */}
                <SettingsSection title="GDPR Account Info">
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
