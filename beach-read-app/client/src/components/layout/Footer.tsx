import { Link } from 'react-router-dom';
import { Bird, Code2, MessageSquare, ShieldCheck, Globe, ArrowUpRight } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full mt-32 border-t border-white/5 bg-background relative overflow-hidden transition-all duration-500">
            {/* Aesthetic Background */}
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full -mr-48 -mb-48" />
            
            <div className="max-w-[1400px] mx-auto px-8 md:px-[64px] py-20 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
                    
                    {/* Branding Section */}
                    <div className="md:col-span-4 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-background shadow-lg shadow-primary/20">
                                <ShieldCheck size={20} />
                            </div>
                            <span className="text-lg font-black uppercase tracking-tighter text-foreground">beach<span className="text-primary">Read</span></span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic max-w-xs">
                            "Your personal reading companion. Documenting your favorite stories, one chapter at a time."
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Service Online</span>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">v2.6.0-alpha</span>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div className="md:col-span-2 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Browse</h4>
                        <ul className="space-y-4">
                            <li><Link to="/discover" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Discover</Link></li>
                            <li><Link to="/search" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Search</Link></li>
                            <li><Link to="/analytics" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Stats</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Personal</h4>
                        <ul className="space-y-4">
                            <li><Link to="/library" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Library</Link></li>
                            <li><Link to="/collections" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Collections</Link></li>
                            <li><Link to="/profile" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Profile</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-4 space-y-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Community</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/40 hover:bg-muted/20 hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <Bird size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Twitter</span>
                                </div>
                                <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                            </a>
                            <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/40 hover:bg-muted/20 hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <MessageSquare size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Discord</span>
                                </div>
                                <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                            </a>
                            <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/40 hover:bg-muted/20 hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <Code2 size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Github</span>
                                </div>
                                <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                            </a>
                            <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/40 hover:bg-muted/20 hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <Globe size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Status</span>
                                </div>
                                <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        <span>© 2026 beachRead</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span>All rights reserved</span>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors">Contact</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
