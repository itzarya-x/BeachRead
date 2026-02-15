import { z } from "zod";

const wait = (ms = 380) => new Promise(resolve => window.setTimeout(resolve, ms));

export const UserProfileSchema = z.object({
    id: z.string(),
    displayName: z.string().min(1),
    username: z.string().min(3),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[0-9\-\s()]{7,20}$/).nullable(),
});

export const UserProfilePatchSchema = z.object({
    displayName: z.string().min(1, "Display name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Enter a valid email"),
    phone: z.union([z.literal(""), z.string().regex(/^\+?[0-9\-\s()]{7,20}$/, "Enter a valid phone number")]),
});

export const PasswordPatchSchema = z.object({
    currentPassword: z.string().min(8),
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must include an uppercase letter")
        .regex(/[0-9]/, "Password must include a number"),
});

export const SessionSchema = z.object({
    device: z.string(),
    location: z.string(),
    lastActive: z.string(),
});

export const ProviderStateSchema = z.object({
    email: z.boolean(),
    google: z.boolean(),
    github: z.boolean(),
    discord: z.boolean(),
    apple: z.boolean(),
    otp: z.boolean(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserProfilePatch = z.infer<typeof UserProfilePatchSchema>;
export type UserSession = z.infer<typeof SessionSchema>;
export type ProviderState = z.infer<typeof ProviderStateSchema>;

let profileStore: UserProfile = {
    id: "user_001",
    displayName: "Guest",
    username: "guest",
    email: "sakura@example.com",
    phone: null,
};

let providersStore: ProviderState = {
    email: true,
    google: true,
    github: false,
    discord: false,
    apple: false,
    otp: true,
};

const sessionStore: UserSession[] = [
    {
        device: "Chrome on Linux",
        location: "India",
        lastActive: "2 minutes ago",
    },
    {
        device: "Safari on iPhone",
        location: "United States",
        lastActive: "1 hour ago",
    },
];

export async function getUserProfile(): Promise<UserProfile> {
    await wait();
    return UserProfileSchema.parse(profileStore);
}

export async function updateUserProfile(payload: UserProfilePatch): Promise<UserProfile> {
    await wait();
    const validated = UserProfilePatchSchema.parse(payload);

    profileStore = {
        ...profileStore,
        displayName: validated.displayName,
        username: validated.username,
        email: validated.email,
        phone: validated.phone || null,
    };

    return UserProfileSchema.parse(profileStore);
}

export async function updateUserPassword(payload: z.infer<typeof PasswordPatchSchema>): Promise<{ ok: true }> {
    await wait(460);
    PasswordPatchSchema.parse(payload);
    return { ok: true };
}

export async function deleteUser(): Promise<{ ok: false; message: string }> {
    await wait();
    return { ok: false, message: "Feature coming soon" };
}

export async function getUserSessions(): Promise<UserSession[]> {
    await wait();
    return z.array(SessionSchema).parse(sessionStore);
}

export async function logoutAllSessions(): Promise<{ ok: false; message: string }> {
    await wait();
    return { ok: false, message: "Feature coming soon" };
}

export async function updateTwoFactor(enabled: boolean): Promise<{ enabled: boolean; supported: false }> {
    await wait();
    return { enabled, supported: false };
}

export async function getProviders(): Promise<ProviderState> {
    await wait();
    return ProviderStateSchema.parse(providersStore);
}

export async function connectProvider(provider: keyof ProviderState): Promise<{ ok: false; message: string }> {
    await wait();
    void provider;
    return { ok: false, message: "Feature coming soon" };
}

export async function disconnectProvider(provider: keyof ProviderState): Promise<{ ok: false; message: string }> {
    await wait();
    void provider;
    return { ok: false, message: "Feature coming soon" };
}
