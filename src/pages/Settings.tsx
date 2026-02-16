import { PageContent, PageWrapper } from "@/components/layout/PageWrapper";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/ToastNotification";
import { useFeatures } from "@/context/FeatureFlags";
import { spawnSakuraParticles } from "@/lib/sakura-particles";
import { cn } from "@/lib/utils";
import {
    clearPersonalData,
    exportPersonalData,
    getAppearancePreferences,
    getNotificationPreferences,
    getPrivacyPreferences,
    updateAppearancePreferences,
    updateNotificationPreferences,
    updatePrivacyPreferences,
} from "@/lib/api/preferences";
import {
    connectProvider,
    deleteUser,
    disconnectProvider,
    getProviders,
    getUserProfile,
    getUserSessions,
    logoutAllSessions,
    PasswordPatchSchema,
    ProviderState,
    updateTwoFactor,
    updateUserPassword,
    updateUserProfile,
    UserProfilePatchSchema,
    UserSession,
} from "@/lib/api/user";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    Apple,
    BadgeCheck,
    Bell,
    Bot,
    CircleHelp,
    CloudDownload,
    Disc3,
    Github,
    KeyRound,
    Lock,
    Mail,
    Monitor,
    Palette,
    Phone,
    Shield,
    Smartphone,
    Sparkles,
    User,
} from "lucide-react";
import React from "react";

type SectionKey = "account" | "security" | "signin" | "appearance" | "notifications" | "privacy";

type SignInMethod = {
    key: keyof ProviderState;
    label: string;
    connected: boolean;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const SECTION_META: { key: SectionKey; label: string; subtitle: string }[] = [
    { key: "account", label: "Account", subtitle: "Profile and identity" },
    { key: "security", label: "Security", subtitle: "Sessions and protection" },
    { key: "signin", label: "Sign-In Methods", subtitle: "Connected providers" },
    { key: "appearance", label: "Appearance", subtitle: "Theme and preview" },
    { key: "notifications", label: "Notifications", subtitle: "Alert controls" },
    { key: "privacy", label: "Privacy", subtitle: "Visibility and data" },
];

const LIVE_PREVIEW_BACKGROUNDS: Record<string, string> = {
    gradient: "linear-gradient(135deg, hsl(330 34% 16%), hsl(250 28% 8%))",
    petals: "radial-gradient(circle at 18% 20%, hsl(340 65% 58% / 0.18), transparent 30%), radial-gradient(circle at 78% 24%, hsl(276 72% 72% / 0.24), transparent 34%), linear-gradient(135deg, hsl(334 25% 10%), hsl(248 26% 6%))",
    static: "linear-gradient(140deg, hsl(264 18% 11%), hsl(245 22% 5%))",
};

const transition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

const providerMeta: Omit<SignInMethod, "connected">[] = [
    { key: "email", label: "Email + Password", icon: Mail },
    { key: "google", label: "Google", icon: Sparkles },
    { key: "github", label: "GitHub", icon: Github },
    { key: "discord", label: "Discord", icon: Disc3 },
    { key: "apple", label: "Apple", icon: Apple },
    { key: "otp", label: "Phone OTP", icon: Phone },
];

const phonePattern = /^\+?[0-9\-\s()]{7,20}$/;

function passwordStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
}

const Settings = () => {
    const { flags } = useFeatures();
    const { showToast } = useToast();

    const [activeSection, setActiveSection] = React.useState<SectionKey>("account");
    const [mobileOpen, setMobileOpen] = React.useState<SectionKey>("account");
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [showDangerModal, setShowDangerModal] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    const [displayName, setDisplayName] = React.useState("Guest");
    const [username, setUsername] = React.useState("guest");
    const [email, setEmail] = React.useState("sakura@example.com");
    const [phone, setPhone] = React.useState("");

    const [twoFactor, setTwoFactor] = React.useState(false);
    const [sessions, setSessions] = React.useState<UserSession[]>([]);
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");

    const [memoryMode, setMemoryMode] = React.useState(true);
    const [dataRetention, setDataRetention] = React.useState("90");
    const [modelName, setModelName] = React.useState("gpt-4.1");
    const [contextDepth, setContextDepth] = React.useState([65]);

    const [themeMode, setThemeMode] = React.useState("dark");
    const [accentColor, setAccentColor] = React.useState("sakura");
    const [backgroundStyle, setBackgroundStyle] = React.useState("gradient");

    const [emailNotif, setEmailNotif] = React.useState(true);
    const [pushNotif, setPushNotif] = React.useState(false);
    const [systemAlerts, setSystemAlerts] = React.useState(true);
    const [weeklySummary, setWeeklySummary] = React.useState(true);

    const [profileVisibility, setProfileVisibility] = React.useState("friends");
    const [dataSharing, setDataSharing] = React.useState("limited");
    const [analyticsOptOut, setAnalyticsOptOut] = React.useState(true);

    const [signInMethods, setSignInMethods] = React.useState<SignInMethod[]>(
        providerMeta.map(item => ({ ...item, connected: false })),
    );

    React.useEffect(() => {
        let mounted = true;

        const hydrate = async () => {
            setIsLoading(true);
            try {
                const [profile, sessionList, providers, appearance, notifications, privacy] = await Promise.all([
                    getUserProfile(),
                    getUserSessions(),
                    getProviders(),
                    getAppearancePreferences(),
                    getNotificationPreferences(),
                    getPrivacyPreferences(),
                ]);

                if (!mounted) return;

                setDisplayName(profile.displayName);
                setUsername(profile.username);
                setEmail(profile.email);
                setPhone(profile.phone || "");
                setSessions(sessionList);
                setSignInMethods(providerMeta.map(item => ({ ...item, connected: providers[item.key] })));

                setThemeMode(appearance.theme);
                setAccentColor(appearance.accent);
                setBackgroundStyle(appearance.backgroundStyle);

                setEmailNotif(notifications.email);
                setPushNotif(notifications.push);
                setSystemAlerts(notifications.system);
                setWeeklySummary(notifications.weekly);

                setProfileVisibility(privacy.visibility);
                setDataSharing(privacy.sharing);
                setAnalyticsOptOut(privacy.analyticsOptOut);
            } catch (error) {
                console.error("Settings hydration failed", error);
                if (mounted) showToast("Using local fallback settings", "warning");
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        void hydrate();

        return () => {
            mounted = false;
        };
    }, [showToast]);

    const connectedMethodCount = signInMethods.filter(method => method.connected).length;
    const securityState = flags.TWO_FACTOR
        ? twoFactor
            ? "secure"
            : connectedMethodCount > 0
              ? "warning"
              : "alert"
        : "warning";

    const passwordScore = passwordStrength(newPassword);

    const notifyComingSoon = () => showToast("Feature coming soon", "info");

    const onSave = async () => {
        if (!flags.ACCOUNT_EDIT) {
            showToast("Feature coming soon", "info");
            return;
        }

        const parsedProfile = UserProfilePatchSchema.safeParse({
            displayName,
            username,
            email,
            phone,
        });

        if (!parsedProfile.success) {
            showToast(parsedProfile.error.issues[0]?.message || "Invalid profile data", "error");
            return;
        }

        if (phone && !phonePattern.test(phone)) {
            showToast("Enter a valid phone number", "error");
            return;
        }

        if (newPassword || confirmPassword || currentPassword) {
            if (newPassword !== confirmPassword) {
                showToast("New passwords do not match", "error");
                return;
            }

            const passwordParsed = PasswordPatchSchema.safeParse({
                currentPassword,
                newPassword,
            });

            if (!passwordParsed.success) {
                showToast(passwordParsed.error.issues[0]?.message || "Password validation failed", "error");
                return;
            }
        }

        setIsSaving(true);

        try {
            await updateUserProfile(parsedProfile.data);

            if (currentPassword && newPassword && confirmPassword) {
                await updateUserPassword({ currentPassword, newPassword });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }

            await updateAppearancePreferences({
                theme: themeMode as "light" | "dark" | "system",
                accent: accentColor as "sakura" | "lavender" | "cyan",
                backgroundStyle: backgroundStyle as "gradient" | "petals" | "static",
            });

            await updateNotificationPreferences({
                email: emailNotif,
                push: pushNotif,
                system: systemAlerts,
                weekly: weeklySummary,
                security: true,
            });

            await updatePrivacyPreferences({
                visibility: profileVisibility as "public" | "friends" | "private",
                sharing: dataSharing as "full" | "limited" | "none",
                analyticsOptOut,
            });

            if (flags.TWO_FACTOR) {
                await updateTwoFactor(twoFactor);
            }

            spawnSakuraParticles();
            showToast("Settings saved", "success");
        } catch (error) {
            console.error(error);
            showToast("Save failed. Feature coming soon", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleProviderToggle = async (key: keyof ProviderState) => {
        if (!flags.PROVIDER_CONNECT) {
            notifyComingSoon();
            return;
        }

        const current = signInMethods.find(item => item.key === key)?.connected;
        if (typeof current !== "boolean") return;

        try {
            if (current) {
                await disconnectProvider(key);
            } else {
                await connectProvider(key);
            }
            notifyComingSoon();
        } catch {
            showToast("Provider integration unavailable", "warning");
        }
    };

    const handleExport = async () => {
        if (!flags.DATA_EXPORT) return notifyComingSoon();
        const res = await exportPersonalData();
        showToast(res.message, "info");
    };

    const handleClearData = async () => {
        if (!flags.DATA_EXPORT) return notifyComingSoon();
        const res = await clearPersonalData();
        showToast(res.message, "warning");
    };

    const handleLogoutAll = async () => {
        const res = await logoutAllSessions();
        showToast(res.message, "info");
    };

    const handleDeleteUser = async () => {
        const res = await deleteUser();
        showToast(res.message, "warning");
    };

    if (isLoading) {
        return (
            <PageWrapper>
                <PageContent className="space-y-4">
                    <div className="sakura-glass h-28 animate-pulse" />
                    <div className="grid gap-4 md:grid-cols-[250px_minmax(0,1fr)]">
                        <div className="sakura-glass h-[560px] animate-pulse" />
                        <div className="sakura-glass h-[560px] animate-pulse" />
                    </div>
                </PageContent>
            </PageWrapper>
        );
    }

    const sectionContent: Record<SectionKey, JSX.Element> = {
        account: (
            <AccountSection
                isEditMode={isEditMode}
                onEditToggle={() => setIsEditMode(prev => !prev)}
                displayName={displayName}
                setDisplayName={setDisplayName}
                username={username}
                setUsername={setUsername}
                email={email}
                setEmail={setEmail}
                phone={phone}
                setPhone={setPhone}
                onDelete={handleDeleteUser}
                accountEditable={flags.ACCOUNT_EDIT}
                showComingSoon={notifyComingSoon}
            />
        ),
        security: (
            <SecuritySection
                securityState={securityState}
                twoFactor={twoFactor}
                setTwoFactor={setTwoFactor}
                sessions={sessions}
                twoFactorEnabled={flags.TWO_FACTOR}
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                passwordScore={passwordScore}
                onLogoutAll={handleLogoutAll}
                showComingSoon={notifyComingSoon}
            />
        ),
        signin: (
            <SignInMethodsSection
                methods={signInMethods}
                canConnect={flags.PROVIDER_CONNECT}
                onToggle={handleProviderToggle}
                showComingSoon={notifyComingSoon}
            />
        ),
        appearance: (
            <AppearanceSection
                themeMode={themeMode}
                setThemeMode={setThemeMode}
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                backgroundStyle={backgroundStyle}
                setBackgroundStyle={setBackgroundStyle}
            />
        ),
        notifications: (
            <NotificationsSection
                emailNotif={emailNotif}
                setEmailNotif={setEmailNotif}
                pushNotif={pushNotif}
                setPushNotif={setPushNotif}
                systemAlerts={systemAlerts}
                setSystemAlerts={setSystemAlerts}
                weeklySummary={weeklySummary}
                setWeeklySummary={setWeeklySummary}
                memoryMode={memoryMode}
                setMemoryMode={setMemoryMode}
                dataRetention={dataRetention}
                setDataRetention={setDataRetention}
                modelName={modelName}
                setModelName={setModelName}
                contextDepth={contextDepth}
                setContextDepth={setContextDepth}
                intelligenceEnabled={flags.AI_SETTINGS}
                showComingSoon={notifyComingSoon}
            />
        ),
        privacy: (
            <PrivacySection
                profileVisibility={profileVisibility}
                setProfileVisibility={setProfileVisibility}
                dataSharing={dataSharing}
                setDataSharing={setDataSharing}
                analyticsOptOut={analyticsOptOut}
                setAnalyticsOptOut={setAnalyticsOptOut}
                onOpenDanger={() => setShowDangerModal(true)}
                onExport={handleExport}
                canExport={flags.DATA_EXPORT}
                showComingSoon={notifyComingSoon}
            />
        ),
    };

    return (
        <TooltipProvider>
            <PageWrapper className="min-h-full">
                <div className="min-h-full">
                    <PageContent className="space-y-6 md:space-y-8">
                        <motion.header
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={transition}
                            className="sakura-glass p-5 md:p-6"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <h1 className="sakura-title text-4xl md:text-5xl">Settings</h1>
                                    <p className="text-sm text-white/65">Manage your profile, security and preferences</p>
                                    <div className="sakura-underline" />
                                </div>

                                <Avatar className="h-11 w-11 ring-2 ring-[hsl(340_65%_58%_/_0.7)] shadow-[0_0_24px_hsl(340_65%_58%_/_0.45)]">
                                    <AvatarImage src="" alt="Profile" />
                                    <AvatarFallback className="bg-[hsl(270_26%_18%)] text-[hsl(340_78%_79%)]">
                                        {displayName.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </motion.header>

                        <div className="hidden md:grid md:grid-cols-[250px_minmax(0,1fr)] md:gap-5 lg:gap-6">
                            <aside className="sakura-glass sticky top-6 h-fit p-3">
                                <div className="space-y-1.5">
                                    {SECTION_META.map(section => (
                                        <button
                                            key={section.key}
                                            type="button"
                                            onClick={() => setActiveSection(section.key)}
                                            className={cn(
                                                "sakura-sidebar-button w-full text-left",
                                                activeSection === section.key && "is-active",
                                            )}
                                        >
                                            <span className="text-sm font-semibold text-white/90">{section.label}</span>
                                            <span className="mt-0.5 block text-xs text-white/45">{section.subtitle}</span>
                                        </button>
                                    ))}
                                </div>
                            </aside>

                            <div className="space-y-4">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeSection}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={transition}
                                    >
                                        {sectionContent[activeSection]}
                                    </motion.div>
                                </AnimatePresence>

                                <div className="flex justify-end">
                                    <RippleButton onClick={() => void onSave()} disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </RippleButton>
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden space-y-3 pb-20">
                            <Accordion
                                type="single"
                                collapsible
                                value={mobileOpen}
                                onValueChange={value => {
                                    if (value) setMobileOpen(value as SectionKey);
                                }}
                                className="space-y-3"
                            >
                                {SECTION_META.map(section => (
                                    <AccordionItem
                                        key={section.key}
                                        value={section.key}
                                        className="sakura-glass overflow-hidden border-white/10"
                                    >
                                        <AccordionTrigger className="px-4 py-3 text-left text-white/90 hover:no-underline">
                                            <div>
                                                <p className="text-sm font-semibold">{section.label}</p>
                                                <p className="text-xs text-white/45">{section.subtitle}</p>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-3 pb-4">{sectionContent[section.key]}</AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </PageContent>

                    <div className="md:hidden fixed bottom-4 left-4 right-4 z-30">
                        <RippleButton className="w-full" onClick={() => void onSave()} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </RippleButton>
                    </div>
                </div>

                <Dialog open={showDangerModal} onOpenChange={setShowDangerModal}>
                    <DialogContent className="sakura-glass border-[hsl(0_70%_52%_/_0.45)] bg-[hsl(335_24%_8%_/_0.97)] text-white">
                        <DialogHeader>
                            <DialogTitle className="text-white">Confirm destructive action</DialogTitle>
                            <DialogDescription className="text-white/70">
                                This operation is disabled in scaffold mode until backend safety checks are ready.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowDangerModal(false)}
                                className="border-white/25 bg-white/5 text-white hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                            <WithComingSoonTooltip enabled={flags.DATA_EXPORT}>
                                <Button
                                    variant="destructive"
                                    className="bg-[hsl(0_72%_52%)] text-white hover:bg-[hsl(0_72%_47%)]"
                                    onClick={async () => {
                                        await handleClearData();
                                        setShowDangerModal(false);
                                    }}
                                    disabled={!flags.DATA_EXPORT}
                                >
                                    Confirm
                                </Button>
                            </WithComingSoonTooltip>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageWrapper>
        </TooltipProvider>
    );
};

function AccountSection({
    isEditMode,
    onEditToggle,
    displayName,
    setDisplayName,
    username,
    setUsername,
    email,
    setEmail,
    phone,
    setPhone,
    onDelete,
    accountEditable,
    showComingSoon,
}: {
    isEditMode: boolean;
    onEditToggle: () => void;
    displayName: string;
    setDisplayName: (value: string) => void;
    username: string;
    setUsername: (value: string) => void;
    email: string;
    setEmail: (value: string) => void;
    phone: string;
    setPhone: (value: string) => void;
    onDelete: () => Promise<void>;
    accountEditable: boolean;
    showComingSoon: () => void;
}) {
    return (
        <section className="sakura-glass space-y-5 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
                <SectionHeading icon={User} title="Account" subtitle="Profile details and credentials" />
                <WithComingSoonTooltip enabled={accountEditable}>
                    <RippleButton variant="ghost" onClick={onEditToggle} disabled={!accountEditable}>
                        {isEditMode ? "Done" : "Edit"}
                    </RippleButton>
                </WithComingSoonTooltip>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="sakura-upload-panel">
                    <Avatar className="h-16 w-16 ring-2 ring-[hsl(340_65%_58%_/_0.55)]">
                        <AvatarFallback className="bg-[hsl(280_25%_18%)] text-[hsl(340_72%_76%)]">SA</AvatarFallback>
                    </Avatar>
                    <RippleButton variant="outline" className="mt-3" onClick={showComingSoon}>
                        Upload profile picture
                    </RippleButton>
                </div>

                <div className="grid gap-3">
                    <Field label="Display Name" value={displayName} onChange={setDisplayName} disabled={!isEditMode || !accountEditable} />
                    <Field label="Username" value={username} onChange={setUsername} disabled={!isEditMode || !accountEditable} />
                    <Field label="Email" value={email} onChange={setEmail} disabled={!isEditMode || !accountEditable} />
                    <Field label="Phone (optional)" value={phone} onChange={setPhone} disabled={!isEditMode || !accountEditable} />
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <RippleButton variant="outline" onClick={showComingSoon}>Change password</RippleButton>
                <RippleButton variant="danger" onClick={() => void onDelete()}>Delete account</RippleButton>
            </div>
        </section>
    );
}

function SecuritySection({
    securityState,
    twoFactor,
    setTwoFactor,
    sessions,
    twoFactorEnabled,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordScore,
    onLogoutAll,
    showComingSoon,
}: {
    securityState: "secure" | "warning" | "alert";
    twoFactor: boolean;
    setTwoFactor: (value: boolean) => void;
    sessions: UserSession[];
    twoFactorEnabled: boolean;
    currentPassword: string;
    setCurrentPassword: (value: string) => void;
    newPassword: string;
    setNewPassword: (value: string) => void;
    confirmPassword: string;
    setConfirmPassword: (value: string) => void;
    passwordScore: number;
    onLogoutAll: () => Promise<void>;
    showComingSoon: () => void;
}) {
    return (
        <section className="sakura-glass space-y-5 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
                <SectionHeading icon={Shield} title="Security" subtitle="Protect sessions and account access" />
                <div
                    className={cn(
                        "security-indicator",
                        securityState === "secure" && "is-secure",
                        securityState === "warning" && "is-warning",
                        securityState === "alert" && "is-alert",
                    )}
                >
                    {securityState === "secure" ? "Secure" : securityState === "warning" ? "Warning" : "Alert"}
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <WithComingSoonTooltip enabled={twoFactorEnabled}>
                    <ToggleRow
                        label="Two-factor authentication"
                        description="Require verification code on sign in"
                        checked={twoFactor}
                        onCheckedChange={setTwoFactor}
                        locked={!twoFactorEnabled}
                    />
                </WithComingSoonTooltip>
                <ActionCard title="Login history" subtitle="Last logins from known devices and regions" onClick={showComingSoon} />
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/85">Change password</h3>
                <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Current Password" value={currentPassword} onChange={setCurrentPassword} disabled={false} type="password" />
                    <Field label="New Password" value={newPassword} onChange={setNewPassword} disabled={false} type="password" />
                    <Field label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} disabled={false} type="password" />
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[hsl(0_70%_58%)] via-[hsl(38_88%_62%)] to-[hsl(140_60%_58%)] transition-all"
                        style={{ width: `${(passwordScore / 4) * 100}%` }}
                    />
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/85">Active Sessions</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    {sessions.map(session => (
                        <DeviceCard key={`${session.device}-${session.location}`} name={session.device} location={session.location} subtitle={session.lastActive} />
                    ))}
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <ActionCard title="Connected devices" subtitle="Review and remove untrusted devices" onClick={showComingSoon} />
                <RippleButton variant="outline" onClick={() => void onLogoutAll()}>Sign out from all devices</RippleButton>
            </div>
        </section>
    );
}

function SignInMethodsSection({
    methods,
    canConnect,
    onToggle,
    showComingSoon,
}: {
    methods: SignInMethod[];
    canConnect: boolean;
    onToggle: (key: keyof ProviderState) => Promise<void>;
    showComingSoon: () => void;
}) {
    return (
        <section className="sakura-glass space-y-5 p-4 md:p-5">
            <SectionHeading icon={KeyRound} title="Sign-In Methods" subtitle="Link and manage providers" />

            <div className="grid gap-3">
                {methods.map(method => {
                    const Icon = method.icon;
                    return (
                        <div key={method.key} className="sakura-method-row">
                            <div className="flex items-center gap-3">
                                <div className="sakura-method-icon">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white/88">{method.label}</p>
                                    <p className="text-xs text-white/50">
                                        {method.connected ? "Connected" : "Not connected"}
                                    </p>
                                </div>
                            </div>

                            <WithComingSoonTooltip enabled={canConnect}>
                                <RippleButton
                                    variant={method.connected ? "soft" : "outline"}
                                    onClick={() => void onToggle(method.key)}
                                    disabled={!canConnect}
                                >
                                    {method.connected ? "Disconnect" : "Connect"}
                                </RippleButton>
                            </WithComingSoonTooltip>
                        </div>
                    );
                })}
            </div>

            {!canConnect && (
                <RippleButton variant="ghost" onClick={showComingSoon} className="w-fit">
                    Provider link actions are in scaffold mode
                </RippleButton>
            )}
        </section>
    );
}

function AppearanceSection({
    themeMode,
    setThemeMode,
    accentColor,
    setAccentColor,
    backgroundStyle,
    setBackgroundStyle,
}: {
    themeMode: string;
    setThemeMode: (value: string) => void;
    accentColor: string;
    setAccentColor: (value: string) => void;
    backgroundStyle: string;
    setBackgroundStyle: (value: string) => void;
}) {
    return (
        <section className="sakura-glass space-y-5 p-4 md:p-5">
            <SectionHeading icon={Palette} title="Appearance" subtitle="Theme modes and live preview" />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-4">
                    <SelectRow
                        label="Theme"
                        value={themeMode}
                        onValueChange={setThemeMode}
                        options={[
                            { value: "light", label: "Light" },
                            { value: "dark", label: "Dark" },
                            { value: "system", label: "System" },
                        ]}
                    />

                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Accent color</p>
                        <div className="grid grid-cols-3 gap-2">
                            <AccentButton label="Sakura" color="hsl(340 65% 58%)" active={accentColor === "sakura"} onClick={() => setAccentColor("sakura")} />
                            <AccentButton label="Lavender" color="hsl(274 72% 72%)" active={accentColor === "lavender"} onClick={() => setAccentColor("lavender")} />
                            <AccentButton label="Cyan" color="hsl(190 78% 56%)" active={accentColor === "cyan"} onClick={() => setAccentColor("cyan")} />
                        </div>
                    </div>

                    <SelectRow
                        label="Background style"
                        value={backgroundStyle}
                        onValueChange={setBackgroundStyle}
                        options={[
                            { value: "gradient", label: "Soft gradient" },
                            { value: "petals", label: "Sakura petal animation" },
                            { value: "static", label: "Static minimal dark" },
                        ]}
                    />
                </div>

                <div className="sakura-preview">
                    <div
                        className={cn("sakura-preview-canvas", backgroundStyle === "petals" && "petals")}
                        style={{ background: LIVE_PREVIEW_BACKGROUNDS[backgroundStyle] }}
                    >
                        <div className="preview-chip" style={{ backgroundColor: accentColor === "sakura" ? "hsl(340 65% 58%)" : accentColor === "lavender" ? "hsl(274 72% 72%)" : "hsl(190 78% 56%)" }} />
                        <p className="text-xs text-white/75">Live Preview</p>
                        <p className="text-[11px] text-white/45">{themeMode.toUpperCase()} MODE</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function NotificationsSection({
    emailNotif,
    setEmailNotif,
    pushNotif,
    setPushNotif,
    systemAlerts,
    setSystemAlerts,
    weeklySummary,
    setWeeklySummary,
    memoryMode,
    setMemoryMode,
    dataRetention,
    setDataRetention,
    modelName,
    setModelName,
    contextDepth,
    setContextDepth,
    intelligenceEnabled,
    showComingSoon,
}: {
    emailNotif: boolean;
    setEmailNotif: (value: boolean) => void;
    pushNotif: boolean;
    setPushNotif: (value: boolean) => void;
    systemAlerts: boolean;
    setSystemAlerts: (value: boolean) => void;
    weeklySummary: boolean;
    setWeeklySummary: (value: boolean) => void;
    memoryMode: boolean;
    setMemoryMode: (value: boolean) => void;
    dataRetention: string;
    setDataRetention: (value: string) => void;
    modelName: string;
    setModelName: (value: string) => void;
    contextDepth: number[];
    setContextDepth: (value: number[]) => void;
    intelligenceEnabled: boolean;
    showComingSoon: () => void;
}) {
    return (
        <section className="space-y-4">
            <div className="sakura-glass space-y-4 p-4 md:p-5">
                <SectionHeading icon={Bell} title="Notifications" subtitle="Choose how updates reach you" />

                <div className="grid gap-3 md:grid-cols-2">
                    <ToggleRow label="Email notifications" description="Announcements, updates and billing" checked={emailNotif} onCheckedChange={setEmailNotif} />
                    <ToggleRow label="Push notifications" description="Instant device-level alerts" checked={pushNotif} onCheckedChange={setPushNotif} />
                    <ToggleRow label="System alerts" description="Service state and incident notices" checked={systemAlerts} onCheckedChange={setSystemAlerts} />
                    <ToggleRow label="Weekly summary" description="Digest with activity highlights" checked={weeklySummary} onCheckedChange={setWeeklySummary} />
                    <ToggleRow label="Security alerts" description="Always enabled for account safety" checked onCheckedChange={() => undefined} locked />
                </div>
            </div>

            <div className="sakura-glass space-y-4 p-4 md:p-5">
                <SectionHeading icon={Bot} title="AI / Intelligence" subtitle="Memory and model behavior" />

                <div className="grid gap-3 md:grid-cols-2">
                    <WithComingSoonTooltip enabled={intelligenceEnabled}>
                        <ToggleRow label="Memory mode" description="Retain relevant interactions for continuity" checked={memoryMode} onCheckedChange={setMemoryMode} locked={!intelligenceEnabled} />
                    </WithComingSoonTooltip>
                    <WithComingSoonTooltip enabled={intelligenceEnabled}>
                        <SelectRow
                            label="Data retention"
                            value={dataRetention}
                            onValueChange={setDataRetention}
                            options={[
                                { value: "30", label: "30 days" },
                                { value: "90", label: "90 days" },
                                { value: "365", label: "1 year" },
                            ]}
                            disabled={!intelligenceEnabled}
                        />
                    </WithComingSoonTooltip>
                    <WithComingSoonTooltip enabled={intelligenceEnabled}>
                        <SelectRow
                            label="Model selection"
                            value={modelName}
                            onValueChange={setModelName}
                            options={[
                                { value: "gpt-4.1", label: "GPT-4.1" },
                                { value: "gpt-4.1-mini", label: "GPT-4.1-mini" },
                                { value: "o4-mini", label: "o4-mini" },
                            ]}
                            disabled={!intelligenceEnabled}
                        />
                    </WithComingSoonTooltip>

                    <div className="sakura-control-row">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Actions</p>
                        <div className="flex flex-wrap gap-2">
                            <WithComingSoonTooltip enabled={intelligenceEnabled}>
                                <RippleButton variant="outline" className="text-xs" disabled={!intelligenceEnabled} onClick={showComingSoon}>Export data</RippleButton>
                            </WithComingSoonTooltip>
                            <WithComingSoonTooltip enabled={intelligenceEnabled}>
                                <RippleButton variant="danger" className="text-xs" disabled={!intelligenceEnabled} onClick={showComingSoon}>Clear memory</RippleButton>
                            </WithComingSoonTooltip>
                        </div>
                    </div>
                </div>

                <WithComingSoonTooltip enabled={intelligenceEnabled}>
                    <div className={cn("sakura-control-row", !intelligenceEnabled && "opacity-70")}>
                        <div className="mb-2 flex items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Context depth</p>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" className="text-white/45 transition hover:text-white/75">
                                        <CircleHelp className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="sakura-tooltip">
                                    Higher depth includes broader memory at higher token cost.
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex items-center gap-4">
                            <Slider value={contextDepth} onValueChange={setContextDepth} max={100} step={1} className="sakura-slider" disabled={!intelligenceEnabled} />
                            <span className="text-sm font-semibold text-[hsl(340_78%_76%)]">{contextDepth[0]}%</span>
                        </div>
                    </div>
                </WithComingSoonTooltip>
            </div>
        </section>
    );
}

function PrivacySection({
    profileVisibility,
    setProfileVisibility,
    dataSharing,
    setDataSharing,
    analyticsOptOut,
    setAnalyticsOptOut,
    onOpenDanger,
    onExport,
    canExport,
    showComingSoon,
}: {
    profileVisibility: string;
    setProfileVisibility: (value: string) => void;
    dataSharing: string;
    setDataSharing: (value: string) => void;
    analyticsOptOut: boolean;
    setAnalyticsOptOut: (value: boolean) => void;
    onOpenDanger: () => void;
    onExport: () => Promise<void>;
    canExport: boolean;
    showComingSoon: () => void;
}) {
    return (
        <section className="space-y-4">
            <div className="sakura-glass space-y-4 p-4 md:p-5">
                <SectionHeading icon={Lock} title="Privacy" subtitle="Control visibility and personal data" />

                <div className="grid gap-3 md:grid-cols-2">
                    <SelectRow
                        label="Profile visibility"
                        value={profileVisibility}
                        onValueChange={setProfileVisibility}
                        options={[
                            { value: "public", label: "Public" },
                            { value: "friends", label: "Friends" },
                            { value: "private", label: "Private" },
                        ]}
                    />
                    <SelectRow
                        label="Data sharing"
                        value={dataSharing}
                        onValueChange={setDataSharing}
                        options={[
                            { value: "full", label: "Full" },
                            { value: "limited", label: "Limited" },
                            { value: "none", label: "Disabled" },
                        ]}
                    />
                    <ToggleRow
                        label="Analytics opt-out"
                        description="Disable non-essential telemetry collection"
                        checked={analyticsOptOut}
                        onCheckedChange={setAnalyticsOptOut}
                    />
                    <WithComingSoonTooltip enabled={canExport}>
                        <ActionCard title="Download personal data" subtitle="Generate a full export package" icon={CloudDownload} onClick={() => void onExport()} disabled={!canExport} />
                    </WithComingSoonTooltip>
                </div>

                <div className="sakura-control-row">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Blocked users</p>
                    <div className="flex flex-wrap gap-2">
                        {["kuro.neko", "void.reader", "spoiler.bot"].map(user => (
                            <span key={user} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/75">
                                {user}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="danger-zone-panel p-4 md:p-5">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-[hsl(0_88%_70%)]" />
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-white">Danger Zone</p>
                        <p className="text-xs text-white/65">Clear all account data or permanently delete this account.</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <WithComingSoonTooltip enabled={canExport}>
                                <RippleButton variant="danger" onClick={onOpenDanger} disabled={!canExport}>Clear all data</RippleButton>
                            </WithComingSoonTooltip>
                            <RippleButton variant="danger" onClick={showComingSoon}>Delete account</RippleButton>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function SectionHeading({
    icon: Icon,
    title,
    subtitle,
}: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[hsl(340_78%_76%)]">
                <Icon className="h-4 w-4" />
            </span>
            <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <p className="text-xs text-white/52">{subtitle}</p>
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    disabled,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    type?: "text" | "password";
}) {
    return (
        <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{label}</span>
            <Input
                type={type}
                value={value}
                onChange={event => onChange(event.target.value)}
                disabled={disabled}
                className="sakura-input"
            />
        </label>
    );
}

function SelectRow({
    label,
    value,
    onValueChange,
    options,
    disabled,
}: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
}) {
    return (
        <div className="sakura-control-row">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
            <Select value={value} onValueChange={onValueChange} disabled={disabled}>
                <SelectTrigger className="sakura-select-trigger">
                    <SelectValue placeholder={label} />
                </SelectTrigger>
                <SelectContent className="sakura-select-content">
                    {options.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function ToggleRow({
    label,
    description,
    checked,
    onCheckedChange,
    locked,
}: {
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    locked?: boolean;
}) {
    return (
        <div className="sakura-control-row">
            <div>
                <p className="text-sm font-semibold text-white/88">{label}</p>
                <p className="text-xs text-white/52">{description}</p>
            </div>
            <div className="flex items-center gap-2">
                {locked && <Lock className="h-3.5 w-3.5 text-[hsl(340_78%_76%)]" />}
                <Switch
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                    disabled={locked}
                    className="sakura-switch"
                />
            </div>
        </div>
    );
}

function ActionCard({
    title,
    subtitle,
    icon: Icon,
    onClick,
    disabled,
}: {
    title: string;
    subtitle: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="sakura-control-row h-full">
            <div className="flex items-start gap-2.5">
                {Icon ? <Icon className="mt-0.5 h-4 w-4 text-[hsl(340_78%_76%)]" /> : <BadgeCheck className="mt-0.5 h-4 w-4 text-[hsl(340_78%_76%)]" />}
                <div>
                    <p className="text-sm font-semibold text-white/88">{title}</p>
                    <p className="text-xs text-white/52">{subtitle}</p>
                </div>
            </div>
            <RippleButton variant="outline" onClick={onClick} disabled={disabled}>Open</RippleButton>
        </div>
    );
}

function DeviceCard({ name, location, subtitle }: { name: string; location: string; subtitle?: string }) {
    return (
        <div className="sakura-device-card">
            <div className="flex items-start gap-2.5">
                {name.toLowerCase().includes("iphone") ? <Smartphone className="mt-0.5 h-4 w-4 text-[hsl(340_78%_76%)]" /> : <Monitor className="mt-0.5 h-4 w-4 text-[hsl(140_65%_62%)]" />}
                <div>
                    <p className="text-sm font-semibold text-white/88">{name}</p>
                    <p className="text-xs text-white/52">{location}</p>
                    {subtitle && <p className="text-[11px] text-white/40">{subtitle}</p>}
                </div>
            </div>
            <RippleButton variant="outline" className="text-xs">Logout</RippleButton>
        </div>
    );
}

function AccentButton({
    label,
    color,
    active,
    onClick,
}: {
    label: string;
    color: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn("accent-color-button", active && "is-active")}
        >
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span>{label}</span>
        </button>
    );
}

function WithComingSoonTooltip({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
    if (enabled) {
        return <>{children}</>;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="inline-flex">{children}</div>
            </TooltipTrigger>
            <TooltipContent className="sakura-tooltip">Coming soon</TooltipContent>
        </Tooltip>
    );
}

function RippleButton({
    children,
    className,
    onClick,
    variant = "default",
    disabled,
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: "default" | "outline" | "soft" | "danger" | "ghost";
    disabled?: boolean;
}) {
    const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number }[]>([]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const id = Date.now() + Math.random();

        setRipples(prev => [...prev, { id, x, y }]);
        window.setTimeout(() => setRipples(prev => prev.filter(ripple => ripple.id !== id)), 500);

        onClick?.();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn("sakura-ripple-button", `is-${variant}`, disabled && "opacity-55 cursor-not-allowed", className)}
            disabled={disabled}
        >
            <span className="relative z-10">{children}</span>
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                {ripples.map(ripple => (
                    <span
                        key={ripple.id}
                        className="sakura-ripple-dot"
                        style={{ left: ripple.x, top: ripple.y }}
                    />
                ))}
            </span>
        </button>
    );
}

export default Settings;
