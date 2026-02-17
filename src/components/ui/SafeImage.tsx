import { motion, HTMLMotionProps } from "framer-motion";
import { ImageOff } from "lucide-react";

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, keyof HTMLMotionProps<"img">>, HTMLMotionProps<"img"> {
    fallback?: React.ReactNode;
    containerClassName?: string;
    useMotion?: boolean;
}

export function SafeImage({ 
    src, 
    alt, 
    className, 
    fallback, 
    containerClassName,
    useMotion = false,
    ...props 
}: SafeImageProps) {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    // Reset error/loading when src changes
    useEffect(() => {
        setError(false);
        setLoading(true);
    }, [src]);

    const handleError = () => {
        setError(true);
        setLoading(false);
        console.warn(`[SafeImage] Failed to load image: ${src}`);
    };

    const handleLoad = () => {
        setLoading(false);
    };

    if (error || !src) {
        return (
            <div className={cn(
                "flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground/40",
                containerClassName
            )}>
                {fallback || <ImageOff className="h-10 w-10 opacity-20" />}
            </div>
        );
    }

    const ImgComponent = useMotion ? motion.img : "img";

    return (
        <div className={cn("relative h-full w-full overflow-hidden", containerClassName)}>
            {loading && (
                <div className="absolute inset-0 animate-pulse bg-muted/40" />
            )}
            {/* @ts-ignore - motion.img and img have slightly different prop types but it's fine here */}
            <ImgComponent
                src={src}
                alt={alt}
                className={cn(
                    className,
                    loading ? "opacity-0" : "opacity-100",
                    "transition-opacity duration-300"
                )}
                onError={handleError}
                onLoad={handleLoad}
                {...(props as any)}
            />
        </div>
    );
}
