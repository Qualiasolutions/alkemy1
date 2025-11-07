import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import Button from '@/components/Button';

interface RegisterFormProps {
    onSuccess?: () => void;
    onSwitchToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
    onSuccess,
    onSwitchToLogin
}) => {
    const { signUp } = useAuth();
    const { colors } = useTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

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
            const { error } = await signUp(email, password, name);
            if (error) {
                // Handle specific Supabase errors
                if (error.message?.includes('already registered')) {
                    setError('An account with this email already exists');
                } else if (error.message?.includes('Invalid email')) {
                    setError('Please enter a valid email address');
                } else {
                    setError(error.message || 'Failed to create account');
                }
            } else {
                setSuccessMessage('Account created! Check your email to verify your account.');
                setTimeout(() => {
                    onSuccess?.();
                }, 2000);
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
                        htmlFor="name"
                        className="block text-sm font-medium mb-2"
                        style={{ color: colors.text_secondary }}
                    >
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-2 rounded-lg border transition-colors"
                        style={{
                            backgroundColor: colors.bg_secondary,
                            borderColor: colors.border_primary,
                            color: colors.text_primary,
                        }}
                        placeholder="John Doe"
                    />
                </div>

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
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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

                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg"
                    >
                        {successMessage}
                    </motion.div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading || !email || !password || !name || !confirmPassword}
                    className="w-full"
                >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <span
                    className="text-sm"
                    style={{ color: colors.text_secondary }}
                >
                    Already have an account?{' '}
                </span>
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-sm font-medium hover:underline transition-colors"
                    style={{ color: colors.accent_primary }}
                    disabled={isLoading}
                >
                    Sign in
                </button>
            </div>

            <div className="mt-4 text-center">
                <p
                    className="text-xs"
                    style={{ color: colors.text_tertiary }}
                >
                    By creating an account, you agree to our{' '}
                    <a
                        href="#"
                        className="underline hover:no-underline"
                        style={{ color: colors.accent_primary }}
                    >
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                        href="#"
                        className="underline hover:no-underline"
                        style={{ color: colors.accent_primary }}
                    >
                        Privacy Policy
                    </a>
                </p>
            </div>
        </motion.div>
    );
};

export default RegisterForm;