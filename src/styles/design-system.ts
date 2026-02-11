/**
 * YURA DESIGN SYSTEM
 * 
 * Defines the visual identity, motion language, and interaction patterns
 * for a premium, collector-focused media platform.
 * 
 * Mood: Dark, Intelligent, Precise, Collector Elite
 */

export const accent = {
  primary: "hsl(199, 89%, 58%)",      // Professional blue - signature color
  primaryHover: "hsl(199, 89%, 52%)",
  primaryMuted: "hsl(199, 89%, 58%, 0.1)",
  primaryBorder: "hsl(199, 89%, 58%, 0.2)",
} as const;

export const radius = {
  sm: "0.5rem",      // 8px
  md: "0.75rem",     // 12px
  lg: "1rem",        // 16px
  xl: "1.5rem",      // 24px
  xxl: "2.5rem",     // 40px
  full: "9999px",
} as const;

export const shadow = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.2)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.3)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.4)",
  glow: "0 0 20px hsla(199, 89%, 58%, 0.3)",
  spotlight: "0 0 60px hsla(199, 89%, 58%, 0.15)",
  glass: "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
} as const;

export const surface = {
  base: "hsl(0, 0%, 5%)",           // Deep background
  elevated1: "hsl(0, 0%, 8%)",      // Cards
  elevated2: "hsl(0, 0%, 11%)",     // Modals
  elevated3: "hsl(0, 0%, 14%)",     // Overlays
} as const;

export const glass = {
  base: "backdrop-blur-md bg-white/5 border border-white/10",
  strong: "backdrop-blur-xl bg-black/60 border border-white/10",
  accent: "backdrop-blur-xl bg-primary/10 border border-primary/20",
} as const;

export const typography = {
  hero: {
    size: "clamp(3rem, 10vw, 6rem)", // Dynamic large hero text
    weight: "900",
    lineHeight: "0.95",
    letterSpacing: "-0.05em",
  },
  display: {
    size: "3.5rem",
    weight: "800",
    lineHeight: "1.1",
    letterSpacing: "-0.02em",
  },
  h1: {
    size: "2.5rem",
    weight: "700",
    lineHeight: "1.2",
  },
  h2: {
    size: "1.875rem",
    weight: "600",
    lineHeight: "1.3",
  },
  h3: {
    size: "1.25rem",
    weight: "600",
    lineHeight: "1.4",
  },
  body: {
    size: "1rem",
    weight: "400",
    lineHeight: "1.6",
  },
  meta: {
    size: "0.875rem",
    weight: "500",
    lineHeight: "1.5",
  },
  micro: {
    size: "0.75rem",
    weight: "600",
    lineHeight: "1.4",
    letterSpacing: "0.05em",
    transform: "uppercase",
  },
} as const;

export const spacing = {
  hero: "8rem",
  section: "6rem",
  block: "3rem",
  group: "1.5rem",
  inline: "0.75rem",
} as const;

export const motion = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    page: 600,
  },
  easing: {
    default: "cubic-bezier(0.16, 1, 0.3, 1)", // Cinematic ease-out-expo
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    soft: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

export const animations = {
  cardEntry: {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration: 0.5,
      ease: motion.easing.default,
    },
  },
  heroEntry: {
    initial: { opacity: 0, scale: 1.1, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: {
      duration: 1.2,
      ease: motion.easing.default,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.3, ease: motion.easing.default },
  },
} as const;

export const rarity = {
  sss: {
    color: "hsl(45, 100%, 50%)",
    glow: "0 0 30px hsla(45, 100%, 50%, 0.6)",
    label: "CELESTIAL",
  },
  ss: {
    color: "hsl(280, 100%, 70%)",
    glow: "0 0 20px hsla(280, 100%, 70%, 0.5)",
    label: "MYTHIC",
  },
  s: {
    color: "hsl(199, 100%, 65%)",
    glow: "0 0 15px hsla(199, 100%, 65%, 0.4)",
    label: "RARE",
  },
} as const;

export const status = {
  success: "hsl(142, 76%, 36%)",
  error: "hsl(0, 84%, 60%)",
  warning: "hsl(38, 92%, 50%)",
  info: "hsl(199, 89%, 48%)",
  syncing: accent.primary,
  offline: "hsl(0, 0%, 45%)",
} as const;

export default {
  accent,
  radius,
  shadow,
  surface,
  glass,
  typography,
  spacing,
  motion,
  animations,
  rarity,
  status,
} as const;
