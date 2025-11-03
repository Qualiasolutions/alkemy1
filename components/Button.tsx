
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'default';
  children: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  children,
  className = '',
  isLoading = false,
  ...props
}) => {
  const { colors, isDark } = useTheme();

  const baseClasses = 'px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: isDark
      ? `bg-gradient-to-r from-[#1AD8B1] via-[${colors.accent_primary}] to-[#0B8070] text-black hover:shadow-lg hover:shadow-[#10A37F]/30`
      : `bg-gradient-to-r from-[#0FB98D] via-[${colors.accent_primary}] to-[#0D8F74] text-white hover:shadow-lg hover:shadow-[#0FB98D]/30`,
    secondary: isDark
      ? `bg-transparent text-white border border-[#2A2A2A] hover:bg-[#1C1C1C] hover:border-[${colors.accent_primary}]`
      : `bg-transparent text-black border border-[#D4D4D4] hover:bg-[#EBEBEB] hover:border-[${colors.accent_primary}]`,
    default: isDark
      ? `bg-[#161616] text-white border border-[#2A2A2A] hover:bg-[#1C1C1C]`
      : `bg-white text-black border border-[#D4D4D4] hover:bg-[#F5F5F5]`,
  };

  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && loadingSpinner}
      {children}
    </motion.button>
  );
};

export default Button;
