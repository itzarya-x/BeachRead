import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { CARD_FEEDBACK } from '../utils/motion-variants';

export interface CharacterCardProps {
    name: string;
    image: string;
    role?: string;
    className?: string;
}

export const CharacterCard = ({ name, image, role, className }: CharacterCardProps) => (
    <motion.div 
        {...CARD_FEEDBACK}
        className={cn("group flex flex-col gap-3", className)}
    >
        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted/20 border border-border/10 relative">
            <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            {role && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-bold uppercase tracking-widest text-white/90">
                    {role}
                </div>
            )}
        </div>
        <div>
            <h4 className="text-xs font-bold uppercase tracking-tight text-foreground truncate">{name}</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Character</p>
        </div>
    </motion.div>
);
CharacterCard.displayName = 'CharacterCard';
