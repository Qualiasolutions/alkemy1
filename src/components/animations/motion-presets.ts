/**
 * Enhanced Animation Presets for Modern UI
 * Sophisticated micro-interactions and smooth transitions
 */

export const animationPresets = {
  // Smooth page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  },

  // Elegant card hover effects
  cardHover: {
    whileHover: {
      scale: 1.02,
      y: -4,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    whileTap: { scale: 0.98 }
  },

  // Sophisticated sidebar slide
  sidebarSlide: {
    initial: { x: -300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
    transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] }
  },

  // Smooth fade with stagger for lists
  staggerContainer: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  },

  // Button press feedback
  buttonPress: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  },

  // Smooth modal appearance
  modalAppear: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Loading skeleton animation
  skeletonPulse: {
    animate: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Smooth height auto transition
  heightAuto: {
    enter: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  }
};

// Spring configurations for different feels
export const springPresets = {
  // Gentle spring for UI elements
  gentle: { type: "spring", stiffness: 300, damping: 30 },

  // Bouncy spring for playful interactions
  bouncy: { type: "spring", stiffness: 400, damping: 10 },

  // Snappy spring for responsive feel
  snappy: { type: "spring", stiffness: 500, damping: 28 }
};

// Duration constants for consistency
export const durations = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  slower: 0.6
};

// Easing functions for different feels
export const easings = {
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  bouncy: [0.68, -0.55, 0.265, 1.55]
};