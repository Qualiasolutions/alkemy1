import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';
import { ChevronRightIcon } from './icons/Icons';

export interface BreadcrumbItem {
    label: string;
    onClick?: () => void;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    const { isDark } = useTheme();

    if (items.length === 0) return null;

    return (
        <nav className="flex items-center gap-2 text-sm">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <React.Fragment key={index}>
                        {item.onClick ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={item.onClick}
                                className={`${
                                    isDark
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-gray-600 hover:text-black'
                                } transition-colors font-medium`}
                            >
                                {item.label}
                            </motion.button>
                        ) : (
                            <span
                                className={`${
                                    isLast
                                        ? isDark
                                            ? 'text-white font-semibold'
                                            : 'text-black font-semibold'
                                        : isDark
                                        ? 'text-gray-500'
                                        : 'text-gray-600'
                                }`}
                            >
                                {item.label}
                            </span>
                        )}
                        {!isLast && (
                            <ChevronRightIcon
                                className={`w-4 h-4 ${
                                    isDark ? 'text-gray-600' : 'text-gray-400'
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumb;
