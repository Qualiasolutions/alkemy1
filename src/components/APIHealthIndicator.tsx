/**
 * API Health Indicator Component
 *
 * Displays real-time status of all AI service providers
 * Shows as a small icon in the header with dropdown details
 */

import React, { useState, useEffect } from 'react';
import { performHealthCheck, type HealthCheckResult, getStatusColor, getOverallStatusColor } from '../services/apiHealthService';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';

const APIHealthIndicator: React.FC = () => {
    const { isDark } = useTheme();
    const [health, setHealth] = useState<HealthCheckResult | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initial health check
        const checkHealth = async () => {
            setIsLoading(true);
            try {
                const result = await performHealthCheck();
                setHealth(result);
            } catch (error) {
                console.error('[Health Indicator] Failed to check health:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkHealth();

        // Refresh every 5 minutes
        const interval = setInterval(checkHealth, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    if (!health) {
        return null; // Don't show until first check completes
    }

    const overallColor = getOverallStatusColor(health.overall);

    return (
        <div className="relative">
            {/* Status Indicator Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg transition-all ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
                title="API Health Status"
            >
                <div className="flex items-center gap-2">
                    {/* Status Dot */}
                    <div
                        className={`w-3 h-3 rounded-full ${
                            overallColor === 'green'
                                ? 'bg-green-500 animate-pulse'
                                : overallColor === 'yellow'
                                ? 'bg-yellow-500 animate-pulse'
                                : 'bg-red-500 animate-pulse'
                        }`}
                    />
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {health.overall === 'healthy' ? 'All Systems Operational' :
                         health.overall === 'degraded' ? 'Some Issues' : 'Critical Issues'}
                    </span>
                </div>
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute right-0 mt-2 w-80 rounded-xl border shadow-xl z-50 ${
                            isDark
                                ? 'bg-[#1A1A1A] border-gray-800'
                                : 'bg-white border-gray-200'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Service Status
                            </h3>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                Last checked: {health.timestamp.toLocaleTimeString()}
                            </p>
                        </div>

                        {/* Service List */}
                        <div className="p-4 space-y-3">
                            {Object.entries(health.services).map(([key, service]) => {
                                const color = getStatusColor(service.status);
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-2 h-2 rounded-full ${
                                                    color === 'green'
                                                        ? 'bg-green-500'
                                                        : color === 'yellow'
                                                        ? 'bg-yellow-500'
                                                        : color === 'red'
                                                        ? 'bg-red-500'
                                                        : 'bg-gray-500'
                                                }`}
                                            />
                                            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {service.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {service.responseTime && (
                                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                                    {service.responseTime}ms
                                                </span>
                                            )}
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full ${
                                                    color === 'green'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : color === 'yellow'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : color === 'red'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                }`}
                                            >
                                                {service.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                            <button
                                onClick={async () => {
                                    setIsLoading(true);
                                    const result = await performHealthCheck(true); // Force refresh
                                    setHealth(result);
                                    setIsLoading(false);
                                }}
                                disabled={isLoading}
                                className={`w-full text-xs font-medium py-2 px-3 rounded-lg transition-all ${
                                    isDark
                                        ? 'bg-white/10 hover:bg-white/20 text-white disabled:opacity-50'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50'
                                }`}
                            >
                                {isLoading ? 'Checking...' : 'Refresh Status'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default APIHealthIndicator;
