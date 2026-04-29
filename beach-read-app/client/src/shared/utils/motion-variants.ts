/**
 * Shared Motion Variants for a Premium, Tactile UI.
 * Focus: Subtlety, Speed (150-200ms), and Responsiveness.
 */

export const TRANSITIONS = {
  smooth: { type: "spring", stiffness: 400, damping: 30 } as const,
  snappy: { type: "spring", stiffness: 500, damping: 25 } as const,
  fast: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } as const,
};

export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: TRANSITIONS.fast,
};

export const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035, // High-end responsive feel (35ms)
    },
  },
};

export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: TRANSITIONS.snappy,
  },
};

export const BUTTON_FEEDBACK = {
  whileHover: { 
    scale: 1.02,
    y: -1,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)"
  },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 600, damping: 22 } as const,
};

export const CARD_FEEDBACK = {
  whileHover: { 
    y: -4,
    scale: 1.01,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" 
  },
  transition: { type: "spring", stiffness: 400, damping: 25 } as const,
};
