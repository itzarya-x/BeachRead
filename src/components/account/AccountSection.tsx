/**
 * Account Section (PHASE 3: Logout UI)
 *
 * Shows logged-in user info (avatar, email, name)
 * Displays logout button with confirmation
 * Shows login CTA if not authenticated
 *
 * PHASE 3.1: "Signed in as" display
 * PHASE 3.2: Logout button with confirmation
 */

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface AccountSectionProps {
    onLoginClick?: () => void;
}

export function AccountSection({ onLoginClick }: AccountSectionProps) {
    const { user, logout, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            setShowLogoutConfirm(false);
            toast({
                title: "Logged out",
                description: "You've been safely logged out. Local data remains intact.",
            });
            navigate("/");
        } catch (err) {
            toast({
                title: "Logout failed",
                description: err instanceof Error ? err.message : "Something went wrong",
                variant: "destructive",
            });
        }
    };

    const handleLogin = () => {
        if (onLoginClick) {
            onLoginClick();
        } else {
            navigate("/login");
        }
    };

    return (
        <div className="rounded-lg border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold text-lg text-gray-900">Account</h3>

            {isAuthenticated && user ? (
                <div className="space-y-4">
                    {/* PHASE 3.1: "Signed in as" */}
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Signed in as</span>
                            <span className="font-semibold text-gray-900">{user.email}</span>
                        </div>
                    </div>

                    {/* User Info */}
                    {(user.avatar || user.displayName) && (
                        <div className="flex items-center gap-3">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.displayName || user.email}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                                    <User className="w-6 h-6" />
                                </div>
                            )}
                            {user.displayName && (
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{user.displayName}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-gray-600">Cloud sync active</span>
                    </div>

                    {/* Logout Confirmation or Button */}
                    {!showLogoutConfirm ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setShowLogoutConfirm(true)}
                            disabled={loading}
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </Button>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded p-3 space-y-3">
                            <p className="text-sm text-red-900">Are you sure? Your local data will be kept safe.</p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={handleLogout}
                                    disabled={loading}
                                >
                                    {loading ? "Logging out..." : "Yes, logout"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowLogoutConfirm(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        Sign in to enable cloud sync and access your vault on multiple devices.
                    </p>
                    <Button className="w-full justify-center gap-2" onClick={handleLogin} disabled={loading}>
                        <LogIn className="w-4 h-4" />
                        {loading ? "Loading..." : "Sign In"}
                    </Button>
                </div>
            )}
        </div>
    );
}
