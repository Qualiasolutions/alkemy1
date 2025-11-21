import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import Button from '@/components/Button';

interface LoginFormProps {
    onSuccess?: () => void;
    onSwitchToRegister?: () => void;
    onForgotPassword?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
    onSuccess,
    onSwitchToRegister,
    onForgotPassword
}) => {
    const { signIn } = useAuth();
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { error } = await signIn(email, password);
            if (error) {
                setError(error.message || 'Invalid email or password');
            } else {
                onSuccess?.();
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                        style={{ color: colors.text_secondary }}
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-2 rounded-lg border transition-colors"
                        style={{
                            backgroundColor: colors.bg_secondary,
                            borderColor: colors.border_primary,
                            color: colors.text_primary,
                        }}
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium mb-2"
                        style={{ color: colors.text_secondary }}
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-2 rounded-lg border transition-colors"
                        style={{
                            backgroundColor: colors.bg_secondary,
                            borderColor: colors.border_primary,
                            color: colors.text_primary,
                        }}
                        placeholder="••••••••"
                    />
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-sm hover:underline transition-colors"
                        style={{ color: colors.accent_primary }}
                        disabled={isLoading}
                    >
                        Forgot password?
                    </button>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading || !email || !password}
                    className="w-full"
                >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <span
                    className="text-sm"
                    style={{ color: colors.text_secondary }}
                >
                    Don't have an account?{' '}
                </span>
                <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="text-sm font-medium hover:underline transition-colors"
                    style={{ color: colors.accent_primary }}
                    disabled={isLoading}
                >
                    Sign up
                </button>
            </div>
        </motion.div>
    );
};

export default LoginForm;