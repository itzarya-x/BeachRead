import { Link } from 'react-router-dom';
import { Bird, Code2, MessageSquare, ShieldCheck, Globe, ArrowUpRight } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full mt-32 border-t border-border/40 bg-background relative overflow-hidden transition-all duration-500">
            {/* Aesthetic Background - Using Theme Accents instead of Blue Primary */}
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-sakura-accent/5 blur-[120px] rounded-full -mr-48 -mb-48 pointer-events-none" />
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full -ml-32 -mt-32 pointer-events-none" />
            
            <div className="max-w-[1400px] mx-auto px-8 md:px-[64px] py-20 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
                    
                    {/* Branding Section */}
                    <div className="md:col-span-4 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <ShieldCheck size={20} />
                            </div>
                            <span className="text-lg font-black uppercase tracking-tighter text-foreground">beach<span className="text-sakura-accent">Read</span></span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic max-w-xs font-serif">
                            "Your personal reading companion. Documenting your favorite stories, one chapter at a time."
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-status-reading/10 border border-status-reading/20 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-status-reading animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-status-reading">Service Online</span>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">v2.6.0-alpha</span>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div className="md:col-span-2 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Browse</h4>
                        <ul className="space-y-4">
                            <li><Link to="/discover" className="text-xs font-bold text-muted-foreground hover:text-sakura-accent transition-colors uppercase tracking-widest">Discover</Link></li>
                            <li><Link to="/search" className="text-xs font-bold text-muted-foreground hover:text-sakura-accent transition-colors uppercase tracking-widest">Search</Link></li>
                            <li><Link to="/analytics" className="text-xs font-bold text-muted-foreground hover:text-sakura-accent transition-colors uppercase tracking-widest">Stats</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Personal</h4>
                        <ul className="space-y-4">
                            <li><Link to="/library" className="text-xs font-bold text-muted-foreground hover:text-sakura-accent transition-colors uppercase tracking-widest">Library</Link></li>
                            <li><Link to="/journal" className="text-xs font-bold text-muted-foreground hover:text-sakura-accent transition-colors uppercase tracking-widest">Diary</Link></li>
                            <li><Link to="/collections" className="text-xs font-bold text-muted-foreground hover:text-sakura-accent transition-colors uppercase tracking-widest">Collections</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-4 space-y-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Community</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/60 hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <Bird size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Twitter</span>
                                </div>
                                <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-status-reading transition-all translate-y-1 group-hover:translate-y-0" />
                            </a>
                            <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/60 hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <MessageSquare size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Discord</span>
                                </div>
                                <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-status-reading transition-all translate-y-1 group-hover:translate-y-0" />
                            </a>
                            <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/60 hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <Code2 size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Github</span>
                                </div>
                                <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-status-reading transition-all translate-y-1 group-hover:translate-y-0" />
                            </a>
                            <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/60 hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <Globe size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Status</span>
                                </div>
                                <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-status-reading transition-all translate-y-1 group-hover:translate-y-0" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                        <span>© 2026 beachRead</span>
                        <div className="w-1 h-1 rounded-full bg-border" />
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
