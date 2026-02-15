/**
 * Guest Experience Component
 * =============================
 * Displays empty vault message and sign-in prompt for unauthenticated users
 * 
 * PHASE 2 (Guest Experience):
 * - Shows "Your vault is empty" message
 * - Displays sign-in instructions
 * - Provides button to navigate to authentication
 * - Part of graceful degradation for guests
 */

import { useAuth } from "@/context/AuthContext";

interface GuestExperienceProps {
    title?: string;
    description?: string;
    showSignIn?: boolean;
}

export function GuestExperience({
    title = "Your vault is empty",
    description = "Sign in with your AniList account to sync and manage your library.",
    showSignIn = true,
}: GuestExperienceProps) {
    const { login } = useAuth();
    const isGuest = !useAuth().authUser;

    // Only show for guests
    if (!isGuest) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4 py-12">
            {/* Icon */}
            <div className="mb-4">
                <div className="text-6xl">📚</div>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
                {title}
            </h2>

            {/* Description */}
            <p className="mb-8 max-w-md text-center text-muted-foreground">
                {description}
            </p>

            {/* Storage Mode Indicator */}
            <div className="mb-6 rounded-lg border border-primary/25 bg-accent px-4 py-2">
                <p className="text-sm font-medium text-primary">
                    💾 Storage Mode: Guest (Offline)
                </p>
            </div>

            {/* Sign In Button */}
            {showSignIn && (
                <button
                    onClick={() => login()}
                    className="rounded-lg border border-primary/25 bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm"
                >
                    Sign In with AniList
                </button>
            )}

            {/* Features List */}
            <div className="mt-12 max-w-md">
                <p className="mb-4 text-sm font-semibold text-foreground">
                    Get started after signing in:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                        <span className="mr-3 text-primary">✓</span>
                        <span>Sync your AniList library to the cloud</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-3 text-primary">✓</span>
                        <span>Track and manage your anime & manga ratings</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-3 text-primary">✓</span>
                        <span>Create tier maker lists and rankings</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-3 text-primary">✓</span>
                        <span>View detailed statistics about your library</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default GuestExperience;
