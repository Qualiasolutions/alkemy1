import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/theme/ThemeContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import Button from '@/components/Button';

const ResetPasswordPage: React.FC = () => {
    const { colors } = useTheme();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Check if we have the required reset token
    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
            setError('Invalid or expired password reset link. Please request a new one.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');

            if (!accessToken || !refreshToken) {
                throw new Error('Invalid reset token');
            }

            // Set the session with the tokens from the URL
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            if (sessionError) throw sessionError;

            // Update the password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) throw updateError;

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (error) {
            console.error('Password reset error:', error);
            setError(error instanceof Error ? error.message : 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
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
                            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                        >
                            <svg
                                className="w-8 h-8 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2
                            className="text-2xl font-bold mb-2"
                            style={{ color: colors.text_primary }}
                        >
                            Password Reset Successful
                        </h2>
                        <p style={{ color: colors.text_secondary }}>
                            Your password has been successfully updated. You'll be redirected to the login page in a few seconds.
                        </p>
                    </div>

                    <Button
                        onClick={() => navigate('/')}
                        className="w-full"
                    >
                        Go to Login
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center min-h-screen ${colors.bg_primary}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 rounded-xl shadow-2xl"
                style={{ backgroundColor: colors.bg_secondary }}
            >
                <div className="mb-8 text-center">
                    <h1
                        className="text-3xl font-bold mb-2"
                        style={{ color: colors.text_primary }}
                    >
                        Reset Password
                    </h1>
                    <p style={{ color: colors.text_secondary }}>
                        Enter your new password below.
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-4 rounded-lg"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium mb-2"
                            style={{ color: colors.text_secondary }}
                        >
                            New Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full px-4 py-3 rounded-lg border transition-colors"
                            style={{
                                backgroundColor: colors.bg_primary,
                                borderColor: colors.border_primary,
                                color: colors.text_primary,
                            }}
                            placeholder="••••••••"
                        />
                        <p
                            className="mt-1 text-xs"
                            style={{ color: colors.text_tertiary }}
                        >
                            At least 6 characters
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium mb-2"
                            style={{ color: colors.text_secondary }}
                        >
                            Confirm New Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full px-4 py-3 rounded-lg border transition-colors"
                            style={{
                                backgroundColor: colors.bg_primary,
                                borderColor: colors.border_primary,
                                color: colors.text_primary,
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isLoading || !password || !confirmPassword}
                        className="w-full"
                    >
                        {isLoading ? 'Resetting Password...' : 'Reset Password'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="text-sm hover:underline transition-colors"
                        style={{ color: colors.accent_primary }}
                    >
                        Back to Sign In
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;