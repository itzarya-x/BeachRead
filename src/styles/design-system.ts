/**
 * YURA DESIGN SYSTEM
 * 
 * Defines the visual identity, motion language, and interaction patterns
 * for a premium, collector-focused media platform.
 * 
 * Mood: Dark, Intelligent, Precise, Collector Elite
 */

export const accent = {
  primary: "#38bdf8",              // Electric Blue / Cyan (Task 14)
  primaryHover: "#7dd3fc",
  primaryMuted: "rgba(56, 189, 248, 0.1)",
  primaryBorder: "rgba(56, 189, 248, 0.2)",
} as const;

export const radius = {
  sm: "0.5rem",      // 8px
  md: "1rem",        // 16px (Task 20)
  lg: "1.5rem",      // 24px
  xl: "2rem",        // 32px
  xxl: "3rem",       // 48px
  full: "9999px",
} as const;

export const shadow = {
  sm: "0 2px 8px -2px rgba(0, 0, 0, 0.4)",
  md: "0 8px 24px -4px rgba(0, 0, 0, 0.5)",
  lg: "0 16px 40px -8px rgba(0, 0, 0, 0.6)",
  xl: "0 32px 64px -12px rgba(0, 0, 0, 0.7)",
  glow: "0 0 20px rgba(56, 189, 248, 0.25)",
  spotlight: "0 0 60px rgba(56, 189, 248, 0.1)",
  glass: "0 8px 32px 0 rgba(0, 0, 0, 0.6)",
} as const;

export const surface = {
  base: "#101827",           // Level 0: Background (Task 1)
  container: "#0b1220",      // Level 1: Page Container (Task 2)
  card: "#141e33",           // Level 2: Surface/Card (Task 2) - Slightly lighter than background
  elevated1: "#141e33",
  elevated2: "#1e293b",
  elevated3: "#334155",
} as const;

export const glass = {
  base: "backdrop-blur-md bg-white/5 border border-white/10",
  strong: "backdrop-blur-xl bg-black/60 border border-white/10",
  accent: "backdrop-blur-xl bg-primary/10 border border-primary/20",
} as const;

export const typography = {
  hero: {
    size: "clamp(3.5rem, 12vw, 8rem)", // Task 9: Huge bold
    weight: "950",
    lineHeight: "0.85",
    letterSpacing: "-0.06em",
  },
  display: {
    size: "4.5rem",
    weight: "900",
    lineHeight: "1",
    letterSpacing: "-0.04em",
  },
  h1: {
    size: "3rem",
    weight: "800",
    lineHeight: "1.1",
  },
  h2: {
    size: "2.25rem",
    weight: "700",
    lineHeight: "1.2",
  },
  h3: {
    size: "1.5rem",
    weight: "700",
    lineHeight: "1.4",
  },
  body: {
    size: "1rem",
    weight: "450",
    lineHeight: "1.6",
  },
  meta: {
    size: "0.875rem",
    weight: "500",
    lineHeight: "1.5",
    color: "rgba(255, 255, 255, 0.5)", // Task 9: Muted
  },
  micro: {
    size: "0.75rem",
    weight: "700",
    lineHeight: "1.4",
    letterSpacing: "0.1em",
    transform: "uppercase",
  },
} as const;

export const spacing = {
  hero: "10rem",
  section: "8rem",
  block: "4rem",
  group: "2rem",
  inline: "1rem",
} as const;

export const motion = {
  duration: {
    instant: 80,
    fast: 160,     // Task 15: Fast 120-180ms
    normal: 280,
    slow: 450,
    page: 550,
  },
  easing: {
    default: "cubic-bezier(0.16, 1, 0.3, 1)", // Cinematic ease-out-expo
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    soft: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

export const animations = {
  cardEntry: {
    initial: { opacity: 0, y: 30, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration: 0.4,
      ease: motion.easing.default,
    },
  },
  heroEntry: {
    initial: { opacity: 0, scale: 1.05, y: 30 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: {
      duration: 1,
      ease: motion.easing.default,
    },
  },
  hover: {
    y: -8,       // Task 15: Lift
    scale: 1.03, // Task 15: Scale
    transition: { duration: 0.16, ease: [0.23, 1, 0.32, 1] },
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
