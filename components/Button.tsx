
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'default' | 'glass' | 'icon' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  isLoading = false,
  fullWidth = false,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);

    if (props.onClick) {
      props.onClick(e);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const baseClasses = `font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''}`;

  const variantClasses = {
    primary: isDark
      ? `bg-gradient-to-r from-#dfec2d via-#b3e617 to-teal-600 text-white hover:from-#dfec2d hover:via-#dfec2d hover:to-teal-500 shadow-lg shadow-#dfec2d/25 hover:shadow-xl hover:shadow-#dfec2d/40 active:scale-[0.98] transition-all duration-200`
      : `bg-gradient-to-r from-#b3e617 via-lime-700 to-teal-700 text-white hover:from-#dfec2d hover:via-#b3e617 hover:to-teal-600 shadow-lg shadow-#b3e617/30 hover:shadow-xl hover:shadow-#b3e617/50 active:scale-[0.98] transition-all duration-200`,
    secondary: isDark
      ? `bg-transparent text-white border-2 border-gray-700/80 hover:bg-gray-800/60 hover:border-#dfec2d/60 backdrop-blur-sm transition-all duration-200`
      : `bg-transparent text-gray-900 border-2 border-gray-300 hover:bg-gray-50 hover:border-#dfec2d/60 transition-all duration-200`,
    default: isDark
      ? `bg-gray-800/80 text-white border border-gray-700 hover:bg-gray-700/90 hover:border-gray-600 shadow-sm transition-all duration-200`
      : `bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200`,
    glass: isDark
      ? `bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 text-white hover:bg-gray-800/40 hover:border-#dfec2d/30 shadow-lg transition-all duration-200`
      : `bg-white/60 backdrop-blur-xl border border-gray-300/60 text-gray-900 hover:bg-white/80 hover:border-#dfec2d/40 shadow-lg transition-all duration-200`,
    icon: isDark
      ? `p-2 rounded-full bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 hover:border-#dfec2d/50 backdrop-blur-sm transition-all duration-200`
      : `p-2 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-#dfec2d/50 transition-all duration-200`,
    danger: isDark
      ? `bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/50 active:scale-[0.98] transition-all duration-200`
      : `bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 active:scale-[0.98] transition-all duration-200`,
  };

  const loadingSpinner = (
    <motion.svg
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </motion.svg>
  );

  return (
    <motion.button
      whileHover={{ scale: variant === 'icon' ? 1.1 : 1.02 }}
      whileTap={{ scale: variant === 'icon' ? 0.9 : 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effect */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.6s ease-out',
          }}
        />
      ))}

      {isLoading ? (
        <>
          {loadingSpinner}
          <span>Loading...</span>
        </>
      ) : (
        children
      )}

    </motion.button>
  );
};

export default Button;
export { Button };
