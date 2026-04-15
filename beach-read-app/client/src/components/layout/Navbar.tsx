import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut, Bell, Loader2, Moon, Sun, Settings } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/auth-context';
import { useSearch } from '../../hooks/useSearch';
import { useNotifications } from '../../hooks/useNotifications';
import { handleCoverImageError, sanitizeCoverUrl } from '../../lib/image';
import { SearchOverlay } from '../search/SearchOverlay';

export default function Navbar() {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true; // Default to true (dark)
    });
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { results, search, loading } = useSearch();

    const isHome = location.pathname === '/';
    const isProfileHero = location.pathname === '/profile' || location.pathname.startsWith('/u/');
    const isHeroPage = isHome || isProfileHero;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 40);
        };

        if (isHeroPage) {
            window.addEventListener('scroll', handleScroll);
            handleScroll();
        } else {
            setIsScrolled(true);
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHeroPage]);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

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
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, search]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
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
            setShowSuggestions(false);
        }
    };

    return (
        <nav className={`${isHeroPage ? 'fixed' : 'fixed'} top-0 left-0 z-[1000] h-[72px] w-full transition-all duration-500 ${
            (isScrolled || !isHeroPage) 
                ? 'bg-background/80 backdrop-blur-xl border-b border-border/10 shadow-lg' 
                : 'bg-transparent'
        }`}>
            <div className="relative mx-auto flex h-full w-full max-w-[1400px] items-center justify-between px-[64px]">
                <div className="flex items-center gap-[8px]">
                    <svg
                        viewBox="0 0 32 32"
                        width="30"
                        height="30"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        className={`${(isScrolled || !isHeroPage) ? 'text-foreground' : 'text-white'}`}
                    >
                        <circle cx="16" cy="16" r="11.5" />
                        <path d="M4.5 10 Q16 13.5 27.5 10" />
                        <path d="M4.5 16 Q16 19.5 27.5 16" />
                        <path d="M4.5 22 Q16 18.5 27.5 22" />
                        <line x1="16" y1="4.5" x2="16" y2="27.5" />
                    </svg>
                    <Link to="/" className={`text-[15px] leading-none tracking-[-0.01em] ${(isScrolled || !isHeroPage) ? 'text-foreground' : 'text-white'}`}>
                        <span className="font-normal">beach</span>
                        <span className="font-bold">Read</span>
                    </Link>
                </div>

                <div className="absolute left-1/2 hidden -translate-x-1/2 md:flex" ref={searchRef}>
                    <div className="relative w-[380px]">
                        <form onSubmit={handleSearchSubmit}>
                            <Search className={`pointer-events-none absolute left-[12px] top-1/2 h-[13px] w-[13px] -translate-y-1/2 ${(isScrolled || !isHeroPage) ? 'text-foreground/35' : 'text-white/50'}`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim().length > 1 && setShowSuggestions(true)}
                                onClick={() => setIsSearchOverlayOpen(true)}
                                placeholder="Search for a manga or author"
                                className={`h-[38px] w-full rounded-full border transition-all pl-[36px] pr-[68px] text-[12.5px] outline-none cursor-pointer ${
                                    (isScrolled || !isHeroPage)
                                        ? 'border-foreground/10 bg-foreground/5 text-foreground/65 focus:bg-foreground/10 focus:border-foreground/20'
                                        : 'border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40'
                                }`}
                            />
                            <div className="absolute right-[10px] top-1/2 flex -translate-y-1/2 items-center gap-[3px]">
                                {['Ctrl', 'K'].map((key) => (
                                    <kbd
                                        key={key}
                                        className={`rounded-[3px] border px-[4px] py-[1px] text-[10px] leading-[1.4] ${
                                            (isScrolled || !isHeroPage)
                                                ? 'border-foreground/15 text-foreground/30'
                                                : 'border-white/20 text-white/40'
                                        }`}
                                    >
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </form>

                        {showSuggestions && (
                            <div className="absolute top-[52px] left-0 w-full bg-background/80 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden z-[2000] p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="px-3 py-2 mb-2 border-b border-white/5">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/60">Quick suggestions</p>
                                </div>
                                
                                {loading ? (
                                    <div className="flex items-center justify-center p-8 gap-3">
                                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Scanning...</span>
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className="space-y-1">
                                        {results.slice(0, 5).map((manga) => (
                                            <Link
                                                key={manga.id}
                                                to={`/manga/${manga.id}`}
                                                onClick={() => { setShowSuggestions(false); setSearchQuery(''); }}
                                                className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                                            >
                                                <div className="w-10 h-14 rounded-lg overflow-hidden shadow-lg shrink-0">
                                                    <img src={sanitizeCoverUrl(manga.coverUrl)} onError={handleCoverImageError} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[13px] font-bold text-foreground truncate leading-none mb-1.5">{manga.title}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">{(manga.genres || [])[0]}</span>
                                                        <div className="h-1 w-1 rounded-full bg-border" />
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">{(manga.genres || [])[1]}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center space-y-3">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Zero Entries</p>
                                        <p className="text-[10px] text-muted-foreground/40 italic">Try a different search vector</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-[28px]">
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className={`p-2 rounded-full transition-colors ${
                            (isScrolled || !isHeroPage) ? 'hover:bg-foreground/5 text-foreground/75' : 'hover:bg-white/10 text-white/90'
                        }`}
                        aria-label="Toggle Theme"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    
                    <div className="hidden lg:flex items-center gap-[28px]">
                        <Link to="/discover" className={`text-[12.5px] font-bold tracking-tight transition-colors ${
                            (isScrolled || !isHeroPage) ? 'text-foreground/75 hover:text-foreground' : 'text-white/80 hover:text-white'
                        } ${location.pathname === '/discover' ? 'text-primary' : ''}`}>
                            Discover
                        </Link>
                        {user && (
                            <>
                                <Link to="/profile" className={`text-[12.5px] font-bold tracking-tight transition-colors ${
                                    (isScrolled || !isHeroPage) ? 'text-foreground/75 hover:text-foreground' : 'text-white/80 hover:text-white'
                                } ${location.pathname.startsWith('/u/') || location.pathname === '/profile' ? 'text-primary' : ''}`}>
                                    Profile
                                </Link>
                                <Link to="/settings" className={`text-[12.5px] font-bold tracking-tight transition-colors ${
                                    (isScrolled || !isHeroPage) ? 'text-foreground/75 hover:text-foreground' : 'text-white/80 hover:text-white'
                                } ${location.pathname === '/settings' ? 'text-primary' : ''}`}>
                                    Settings
                                </Link>
                            </>
                        )}
                    </div>

                    {user ? (
                        <div className="flex items-center gap-[24px]">
                            <div className="relative" ref={menuRef}>
                                <button 
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className={`flex h-[36px] w-[36px] items-center justify-center overflow-hidden rounded-full border-2 transition-all relative ${
                                        (isScrolled || !isHeroPage) ? 'border-primary/20 bg-foreground/10 hover:border-primary/50' : 'border-white/20 bg-white/10 hover:border-white/60'
                                    }`}
                                >
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.displayName || user.email}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <User className={`h-[18px] w-[18px] ${ (isScrolled || !isHeroPage) ? 'opacity-65' : 'opacity-90 text-white'}`} />
                                    )}
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-background" />
                                    )}
                                </button>
                                
                                {showUserMenu && (
                                    <div className="absolute right-0 top-[48px] w-[220px] bg-background/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-border/50 mb-1 bg-foreground/5">
                                            <p className="text-[11px] font-bold text-primary truncate">{user.displayName}</p>
                                            <p className="text-[9px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                                        </div>
                                        <Link 
                                            to="/profile" 
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-foreground/5 text-[12px] font-medium transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <User size={14} className="opacity-50" />
                                            View Profile
                                        </Link>
                                        <Link 
                                            to="/profile?tab=notifications" 
                                            className="flex items-center justify-between px-4 py-2.5 hover:bg-foreground/5 text-[12px] font-medium transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Bell size={14} className="opacity-50" />
                                                Notifications
                                            </div>
                                            {unreadCount > 0 && (
                                                <span className="bg-primary text-background text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </Link>
                                        <Link 
                                            to="/settings" 
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-foreground/5 text-[12px] font-medium transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <Settings size={14} className="opacity-50" />
                                            Settings
                                        </Link>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 text-[12px] font-medium text-destructive border-t border-border/30 mt-1 transition-colors"
                                        >
                                            <LogOut size={14} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className={`px-6 py-2 rounded-full text-[12px] font-bold transition-all hover:scale-105 active:scale-95 ${
                            (isScrolled || !isHeroPage) ? 'bg-foreground text-background' : 'bg-white text-black hover:bg-opacity-90'
                        }`}>
                            Login
                        </Link>
                    )}
                </div>
            </div>
            <SearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />
        </nav>
    );
}
