/**
 * Modern Card Component with Glassmorphism and Animations
 * Enhanced version of basic card with modern design patterns
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/theme/ThemeContext';
import { animationPresets } from '@/components/animations/motion-presets';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated';
  hover?: boolean;
  delay?: number;
  onClick?: () => void;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true,
  delay = 0,
  onClick
}) => {
  const { colors, mode } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          background: colors.glass_bg,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${colors.glass_border}`,
          boxShadow: colors.shadow_secondary,
        };
      case 'gradient':
        return {
          background: colors.gradient_secondary,
          boxShadow: colors.shadow_primary,
        };
      case 'elevated':
        return {
          background: colors.bg_secondary,
          border: `1px solid ${colors.border_primary}`,
          boxShadow: colors.shadow_primary,
        };
      default:
        return {
          background: colors.bg_secondary,
          border: `1px solid ${colors.border_primary}`,
          boxShadow: mode === 'dark'
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: delay * 0.1,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={hover ? {
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" }
      } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-xl p-6 transition-all duration-200',
        variant === 'glass' && 'bg-white/5',
        onClick && 'cursor-pointer',
        className
      )}
      style={getVariantStyles()}
    >
      {children}
    </motion.div>
  );
};