import { z } from "zod";

const wait = (ms = 360) => new Promise(resolve => window.setTimeout(resolve, ms));

export const AppearancePreferencesSchema = z.object({
    theme: z.enum(["light", "dark", "system"]),
    accent: z.enum(["sakura", "lavender", "cyan"]),
    backgroundStyle: z.enum(["gradient", "petals", "static"]),
});

export const NotificationPreferencesSchema = z.object({
    email: z.boolean(),
    push: z.boolean(),
    system: z.boolean(),
    weekly: z.boolean(),
    security: z.boolean(),
});

export const PrivacyPreferencesSchema = z.object({
    visibility: z.enum(["public", "friends", "private"]),
    sharing: z.enum(["full", "limited", "none"]),
    analyticsOptOut: z.boolean(),
});

export type AppearancePreferences = z.infer<typeof AppearancePreferencesSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
export type PrivacyPreferences = z.infer<typeof PrivacyPreferencesSchema>;

let appearanceStore: AppearancePreferences = {
    theme: "dark",
    accent: "sakura",
    backgroundStyle: "gradient",
};

let notificationsStore: NotificationPreferences = {
    email: true,
    push: false,
    system: true,
    weekly: true,
    security: true,
};

let privacyStore: PrivacyPreferences = {
    visibility: "friends",
    sharing: "limited",
    analyticsOptOut: true,
};

export async function getAppearancePreferences(): Promise<AppearancePreferences> {
    await wait();
    return AppearancePreferencesSchema.parse(appearanceStore);
}

export async function updateAppearancePreferences(payload: AppearancePreferences): Promise<AppearancePreferences> {
    await wait();
    appearanceStore = AppearancePreferencesSchema.parse(payload);
    return appearanceStore;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
    await wait();
    return NotificationPreferencesSchema.parse(notificationsStore);
}

export async function updateNotificationPreferences(payload: NotificationPreferences): Promise<NotificationPreferences> {
    await wait();
    notificationsStore = NotificationPreferencesSchema.parse(payload);
    return notificationsStore;
}

export async function getPrivacyPreferences(): Promise<PrivacyPreferences> {
    await wait();
    return PrivacyPreferencesSchema.parse(privacyStore);
}

export async function updatePrivacyPreferences(payload: PrivacyPreferences): Promise<PrivacyPreferences> {
    await wait();
    privacyStore = PrivacyPreferencesSchema.parse(payload);
    return privacyStore;
}

export async function exportPersonalData(): Promise<{ ok: false; message: string }> {
    await wait();
    return { ok: false, message: "Feature coming soon" };
}

export async function clearPersonalData(): Promise<{ ok: false; message: string }> {
    await wait();
    return { ok: false, message: "Feature coming soon" };
}
