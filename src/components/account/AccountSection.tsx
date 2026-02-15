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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
            // Store current location as intended path before opening login
            sessionStorage.setItem("intendedPath", window.location.pathname);
        }
    };

    return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Account</h3>

            {isAuthenticated && user ? (
                <div className="space-y-4">
                    {/* PHASE 3.1: "Signed in as" */}
                    <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-accent p-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Signed in as</span>
                            <span className="font-semibold text-foreground">{user.email}</span>
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
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <User className="w-6 h-6" />
                                </div>
                            )}
                            {user.displayName && (
                                <div className="flex-1 min-w-0">
                                    <p className="truncate font-semibold text-foreground">{user.displayName}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-muted-foreground">Cloud sync active</span>
                        <Badge className="ml-1 border border-emerald-300 bg-emerald-100 text-emerald-700">Online</Badge>
                    </div>

                    {/* Logout Action */}
                    <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center gap-2 border-destructive/35 text-destructive hover:bg-destructive/10"
                            onClick={() => setShowLogoutConfirm(true)}
                            disabled={loading}
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </Button>
                        <AlertDialogContent className="border-border bg-card sm:rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Log out from this device?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You can sign back in anytime. Your local vault data stays intact.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleLogout}
                                    disabled={loading}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {loading ? "Logging out..." : "Log out"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
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
