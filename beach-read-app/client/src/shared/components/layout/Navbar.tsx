import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut, Bell, Settings, Wind, Menu, X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../features/auth/context/auth-context';
import { useLibrary } from '../../../features/library/hooks/useLibrary';
import { useSearch } from '../../../features/manga/hooks/useSearch';
import { useNotifications } from '../../../features/profile/hooks/useNotifications';
import { SearchOverlay } from '../../../features/manga/components/SearchOverlay';
import { BUTTON_FEEDBACK } from '../../utils/motion-variants';
import { sanitizeCoverUrl } from '../../utils/image';

export default function Navbar() {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
    const { user, logout } = useAuth();
    const { loading: libraryLoading } = useLibrary();
    const { unreadCount } = useNotifications();
    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { search } = useSearch();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOverlayOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 1) {
                search(searchQuery);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, search]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate('/login');
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <motion.nav 
            layoutId="global-navbar"
            className="absolute top-0 left-0 right-0 z-[5000] h-[80px] w-full transition-all duration-500 pointer-events-auto bg-transparent"
        >
            <div className="relative mx-auto flex h-full w-full max-w-[1400px] items-center justify-between px-6 md:px-[64px]">
                <div className="flex items-center gap-[12px]">
                    <motion.div 
                        whileHover={{ rotate: 15 }}
                        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm"
                    >
                        <Wind className="w-5 h-5" />
                    </motion.div>
                    <Link to="/" className="flex flex-col">
                        <span className="text-[18px] font-serif italic text-foreground leading-none tracking-tight">BeachRead</span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-muted-foreground/60">Sanctuary</span>
                    </Link>
                </div>

                <div className="absolute left-1/2 hidden -translate-x-1/2 md:flex items-center gap-6">
                    <div className="relative w-[320px]" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit}>
                            <Search className="pointer-events-none absolute left-[14px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-muted-foreground/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={() => setIsSearchOverlayOpen(true)}
                                placeholder="Search memories..."
                                className="h-[42px] w-full rounded-full border border-border/40 bg-foreground/[0.02] pl-[38px] pr-[14px] text-[13px] font-serif italic text-foreground outline-none cursor-pointer focus:border-primary/40 transition-all"
                            />
                        </form>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-[28px]">
                    <div className="hidden lg:flex items-center gap-[32px]">
                        <motion.div {...BUTTON_FEEDBACK}>
                            <Link to="/discover" className={`text-[11px] font-bold uppercase tracking-[0.2em] hover:text-foreground transition-colors ${location.pathname === '/discover' ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                                Discover
                            </Link>
                        </motion.div>
                        {user && (
                            <motion.div {...BUTTON_FEEDBACK}>
                                <Link to="/library" className={`text-[11px] font-bold uppercase tracking-[0.2em] hover:text-foreground transition-colors ${location.pathname === '/library' ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                                    Archive
                                </Link>
                            </motion.div>
                        )}
                    </div>

                    {user ? (
                        <div className="flex items-center gap-4 md:gap-[24px]">
                            {libraryLoading && (
                                <div className="hidden sm:flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                    <span className={`text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40`}>Syncing</span>
                                </div>
                            )}

                            <motion.div {...BUTTON_FEEDBACK}>
                                <Link
                                    to="/notifications"
                                    className="p-2.5 rounded-full border border-border/40 bg-foreground/[0.02] hover:bg-foreground/[0.05] text-muted-foreground relative block transition-all"
                                    aria-label={`${unreadCount} notifications`}
                                >
                                    <Bell size={18} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                                    )}
                                </Link>
                            </motion.div>

                            <div className="relative" ref={menuRef}>
                                <motion.button 
                                    {...BUTTON_FEEDBACK}
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    aria-label="User menu"
                                    aria-haspopup="true"
                                    aria-expanded={showUserMenu}
                                    className="flex h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-full border border-border/40 bg-foreground/[0.02] p-1 hover:border-primary/40 transition-all shadow-sm"
                                >
                                    {user.avatarUrl ? (
                                        <img 
                                            src={sanitizeCoverUrl(user.avatarUrl)} 
                                            alt={user.displayName} 
                                            referrerPolicy="no-referrer"
                                            className="h-full w-full object-cover rounded-full" 
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                            <User size={20} />
                                        </div>
                                    )}
                                </motion.button>
                                
                                <AnimatePresence>
                                    {showUserMenu && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-[56px] w-[240px] bg-background rounded-3xl shadow-2xl border border-border/40 py-3 z-[1000]"
                                        >
                                            <div className="px-6 py-4 border-b border-border/10 mb-2">
                                                <p className="text-[12px] font-serif italic text-foreground truncate">{user.displayName}</p>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 truncate mt-1">{user.email}</p>
                                            </div>
                                            <Link 
                                                to={`/u/${user.username || user.id}`}
                                                className="flex items-center gap-4 px-6 py-3 hover:bg-muted text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <User size={14} className="opacity-60" />
                                                My Profile
                                            </Link>
                                            <Link 
                                                to="/settings" 
                                                className="flex items-center gap-4 px-6 py-3 hover:bg-muted text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <Settings size={14} className="opacity-60" />
                                                Settings
                                            </Link>
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-red-600 border-t border-border/10 mt-2 transition-colors"
                                                aria-label="Logout of sanctuary"
                                            >
                                                <LogOut size={16} strokeWidth={2.5} />
                                                Sign Out of Sanctuary
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                            {/* Mobile Menu Toggle */}
                            <motion.button
                                {...BUTTON_FEEDBACK}
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="flex lg:hidden h-[44px] w-[44px] items-center justify-center rounded-full border border-border/40 bg-foreground/[0.02] text-muted-foreground"
                                aria-label="Toggle Navigation"
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </motion.button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <motion.div {...BUTTON_FEEDBACK}>
                                <Link to="/login" className="px-6 md:px-8 py-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-full hover:opacity-90 transition-all block shadow-lg">
                                    Begin Journey
                                </Link>
                            </motion.div>
                            
                            <motion.button
                                {...BUTTON_FEEDBACK}
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="flex lg:hidden h-[44px] w-[44px] items-center justify-center rounded-full border border-border/40 bg-foreground/[0.02] text-muted-foreground"
                                aria-label="Toggle Navigation"
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="lg:hidden w-full bg-background/95 backdrop-blur-3xl border-b border-border/20 overflow-hidden shadow-2xl"
                    >
                        <div className="px-6 py-8 flex flex-col gap-6">
                            <div className="relative w-full" ref={searchRef}>
                                <form onSubmit={handleSearchSubmit}>
                                    <Search className="pointer-events-none absolute left-[14px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-muted-foreground/40" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={() => setIsSearchOverlayOpen(true)}
                                        placeholder="Search memories..."
                                        className="h-[48px] w-full rounded-2xl border border-border/40 bg-foreground/[0.02] pl-[38px] pr-[14px] text-[13px] font-serif italic text-foreground outline-none"
                                    />
                                </form>
                            </div>

                            <div className="flex flex-col gap-1">
                                <Link 
                                    to="/discover" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-4 rounded-xl hover:bg-muted text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all"
                                >
                                    Discover
                                </Link>
                                {user && (
                                    <Link 
                                        to="/library" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="px-4 py-4 rounded-xl hover:bg-muted text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        Archive
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />
        </motion.nav>
    );
}
