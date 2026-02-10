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
            <h2 className="text-2xl font-bold text-center mb-2 dark:text-gray-100">
                {title}
            </h2>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
                {description}
            </p>

            {/* Storage Mode Indicator */}
            <div className="mb-6 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    💾 Storage Mode: Guest (Offline)
                </p>
            </div>

            {/* Sign In Button */}
            {showSignIn && (
                <button
                    onClick={() => login()}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-md"
                >
                    Sign In with AniList
                </button>
            )}

            {/* Features List */}
            <div className="mt-12 max-w-md">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Get started after signing in:
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start">
                        <span className="mr-3 text-blue-500">✓</span>
                        <span>Sync your AniList library to the cloud</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-3 text-blue-500">✓</span>
                        <span>Track and manage your anime & manga ratings</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-3 text-blue-500">✓</span>
                        <span>Create tier maker lists and rankings</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-3 text-blue-500">✓</span>
                        <span>View detailed statistics about your library</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default GuestExperience;
