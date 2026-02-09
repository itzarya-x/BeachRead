/**
 * Account Section
 *
 * Shows logged-in user info (avatar, email, name)
 * Displays logout button or login CTA
 */

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogIn, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AccountSectionProps {
    onLoginClick?: () => void;
}

export function AccountSection({ onLoginClick }: AccountSectionProps) {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            await logout();
            toast({
                title: "Logged out",
                description: "You've been safely logged out.",
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
                    {/* User Info */}
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
                        <div className="flex-1 min-w-0">
                            {user.displayName && (
                                <p className="font-semibold text-gray-900 truncate">{user.displayName}</p>
                            )}
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-gray-600">Cloud sync enabled</span>
                    </div>

                    {/* Logout Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        Sign in to enable cloud sync and access your vault on multiple devices.
                    </p>
                    <Button className="w-full justify-center gap-2" onClick={handleLogin}>
                        <LogIn className="w-4 h-4" />
                        Sign In
                    </Button>
                </div>
            )}
        </div>
    );
}
