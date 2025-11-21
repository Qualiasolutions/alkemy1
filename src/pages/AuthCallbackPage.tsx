import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/theme/ThemeContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';

const AuthCallbackPage: React.FC = () => {
    const { colors } = useTheme();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const accessToken = searchParams.get('access_token');
                const refreshToken = searchParams.get('refresh_token');
                const error = searchParams.get('error');
                const errorDescription = searchParams.get('error_description');

                // Handle authentication errors
                if (error) {
                    throw new Error(errorDescription || error);
                }

                if (!accessToken || !refreshToken) {
                    throw new Error('Missing authentication tokens');
                }

                // Set the session with the tokens from the URL
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (sessionError) throw sessionError;

                // Successfully authenticated, redirect to main app
                navigate('/');

            } catch (error) {
                console.error('Auth callback error:', error);
                setError(error instanceof Error ? error.message : 'Authentication failed');
            } finally {
                setIsLoading(false);
            }
        };

        handleAuthCallback();
    }, [searchParams, navigate]);

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${colors.bg_primary}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-6"
                        style={{
                            borderColor: colors.accent_primary,
                            borderTopColor: 'transparent'
                        }}
                    />
                    <h2
                        className="text-xl font-semibold mb-2"
                        style={{ color: colors.text_primary }}
                    >
                        Completing Sign In...
                    </h2>
                    <p style={{ color: colors.text_secondary }}>
                        Please wait while we complete your authentication.
                    </p>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${colors.bg_primary}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md p-8 rounded-xl shadow-2xl text-center"
                    style={{ backgroundColor: colors.bg_secondary }}
                >
                    <div className="mb-6">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        >
                            <svg
                                className="w-8 h-8 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2
                            className="text-2xl font-bold mb-2"
                            style={{ color: colors.text_primary }}
                        >
                            Authentication Failed
                        </h2>
                        <p
                            className="text-sm mb-4"
                            style={{ color: colors.text_secondary }}
                        >
                            {error}
                        </p>
                        <p
                            className="text-xs"
                            style={{ color: colors.text_tertiary }}
                        >
                            Please try signing in again or contact support if the issue persists.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-2 px-4 rounded-lg font-medium transition-colors"
                            style={{
                                backgroundColor: colors.accent_primary,
                                color: '#FFFFFF'
                            }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.close()}
                            className="w-full py-2 px-4 rounded-lg font-medium transition-colors"
                            style={{
                                backgroundColor: colors.bg_primary,
                                color: colors.text_secondary,
                                border: `1px solid ${colors.border_primary}`
                            }}
                        >
                            Close Window
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return null; // Should never reach here as we redirect on success
};

export default AuthCallbackPage;