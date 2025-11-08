import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { DynamicFrameLayout } from '@/components/ui/dynamic-frame-layout';
import { isSupabaseConfigured } from '@/services/supabase';

/**
 * ALKEMY AI WORKFLOW DEMO VIDEOS
 * ================================
 * Replace these placeholder URLs with your recorded Alkemy demos:
 *
 * VIDEO 1 (Top-Left): Script Analysis
 *   - Show: Script upload → AI analyzing → Scene/Character/Location breakdown
 *   - Duration: 8-10s
 *
 * VIDEO 2 (Top-Center): AI Character Generation
 *   - Show: Cast & Locations → Generate character → Imagen/Flux creating portraits
 *   - Duration: 8-10s
 *
 * VIDEO 3 (Top-Right): AI Location Generation
 *   - Show: Locations → Generate environment → AI creating cinematic settings
 *   - Duration: 8-10s
 *
 * VIDEO 4 (Middle-Left): Moodboard Creation
 *   - Show: Moodboard tab → Adding references → AI description generation
 *   - Duration: 8-10s
 *
 * VIDEO 5 (Middle-Center): Shot Composition ⭐️
 *   - Show: Compositing → Scene shots → Frame with camera specs
 *   - Duration: 10-12s
 *
 * VIDEO 6 (Middle-Right): Veo Animation
 *   - Show: Still frame → Animate button → Progress → Video playing
 *   - Duration: 10-12s
 *
 * VIDEO 7 (Bottom-Left): 3D World Generation
 *   - Show: 3D Worlds → Text prompt → Luma generating → 3D environment
 *   - Duration: 10-12s
 *
 * VIDEO 8 (Bottom-Center): Timeline Editing
 *   - Show: Timeline → Multiple clips → Editing → Preview
 *   - Duration: 10-12s
 *
 * VIDEO 9 (Bottom-Right): Final Output 🎬
 *   - Show: Finished cinema-quality scene with "Made with Alkemy AI"
 *   - Duration: 10-12s
 */
const demoFrames = [
  {
    id: 1,
    title: "Script Analysis", // VIDEO 1: Script Upload & AI Breakdown
    video: "https://static.cdn-luma.com/files/981e483f71aa764b/Company%20Thing%20Exported.mp4", // REPLACE WITH YOUR VIDEO
    defaultPos: { x: 0, y: 0, w: 4, h: 4 },
    mediaSize: 1.1,
  },
  {
    id: 2,
    title: "Character Generation", // VIDEO 2: AI Creating Photorealistic Characters
    video: "https://static.cdn-luma.com/files/58ab7363888153e3/WebGL%20Exported%20(1).mp4", // REPLACE WITH YOUR VIDEO
    defaultPos: { x: 4, y: 0, w: 4, h: 4 },
    mediaSize: 1.1,
  },
  {
    id: 3,
    title: "Location Generation", // VIDEO 3: AI Creating Film Environments
    video: "https://static.cdn-luma.com/files/58ab7363888153e3/Jitter%20Exported%20Poster.mp4", // REPLACE WITH YOUR VIDEO
    defaultPos: { x: 8, y: 0, w: 4, h: 4 },
    mediaSize: 1.1,
  },
  {
    id: 4,
    title: "Moodboard Creation", // VIDEO 4: Visual References & AI Descriptions
    video: "https://static.cdn-luma.com/files/58ab7363888153e3/Exported%20Web%20Video.mp4", // REPLACE WITH YOUR VIDEO
    defaultPos: { x: 0, y: 4, w: 4, h: 4 },
    mediaSize: 1.1,
  },
  {
    id: 5,
    title: "Shot Composition", // VIDEO 5: Compositing Cinematic Frames (HERO)
    video: "https://static.cdn-luma.com/files/58ab7363888153e3/Logo%20Exported.mp4", // REPLACE WITH YOUR VIDEO
    defaultPos: { x: 4, y: 4, w: 4, h: 4 },
    mediaSize: 1.1,
  },
  {
    id: 6,
    title: "Veo Animation", // VIDEO 6: Still → Video Animation
    video: "https://static.cdn-luma.com/files/58ab7363888153e3/Animation%20Exported%20(4).mp4", // REPLACE WITH YOUR VIDEO
    defaultPos: { x: 8, y: 4, w: 4, h: 4 },
    mediaSize: 1.1,
  },
  {
    id: 7,
    title: "3D World Generation", // VIDEO 7: Text-to-3D Environments
    video: "https://static.cdn-luma.com/files/58ab7363888153e3/Illustration%20Exported%20(1).mp4", // REPLACE WITH YOUR VIDEO
    defaultPos: { x: 0, y: 8, w: 4, h: 4 },
    mediaSize: 1.1,
  },
  {
    id: 8,
    title: "Timeline Editing", // VIDEO 8: Professional Video Assembly
    video: "https://static.cdn-luma.com/files/58ab7363888153e3/Art%20Direction%20Exported.mp4", // REPLACE WITH YOUR VIDEO
    defaultPos: { x: 4, y: 8, w: 4, h: 4 },
    mediaSize: 1.1,
  },
  {
    id: 9,
    title: "Final Output", // VIDEO 9: Finished Cinema-Quality Scene
    video: "https://static.cdn-luma.com/files/58ab7363888153e3/Product%20Video.mp4", // REPLACE WITH YOUR VIDEO
    defaultPos: { x: 8, y: 8, w: 4, h: 4 },
    mediaSize: 1.1,
  },
];

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { signIn, signUp, signInWithProvider, isLoading } = useAuth();
    const { isDark } = useTheme();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const supabaseConfigured = isSupabaseConfigured();

    const handleProviderSignIn = async (provider: 'google' | 'github') => {
        const { error } = await signInWithProvider(provider);
        if (error) {
            console.error('Sign in error:', error);
            setError(error.message);
        }
        // Redirect will be handled by Supabase OAuth flow
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (authMode === 'signin') {
            const { error } = await signIn(email, password);
            if (error) {
                setError(error.message);
            } else {
                navigate('/');
            }
        } else {
            if (!name.trim()) {
                setError('Please enter your name');
                return;
            }
            const { error } = await signUp(email, password, name);
            if (error) {
                setError(error.message);
            } else {
                navigate('/');
            }
        }
    };

    // If Supabase is not configured, redirect to main app
    if (!supabaseConfigured) {
        navigate('/');
        return null;
    }

    return (
        <div className="relative min-h-screen w-screen overflow-hidden bg-black">
            {/* Full Screen Video Grid */}
            <div className="absolute inset-0 z-0">
                <DynamicFrameLayout
                    frames={demoFrames}
                    className="w-full h-full"
                    hoverSize={6}
                    gapSize={4}
                />
            </div>

            {/* Top Right Auth Buttons */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute top-6 right-6 z-50 flex items-center gap-3"
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setAuthMode('signin');
                        setShowAuthModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md transition-all border"
                    style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm font-medium text-white">Sign In</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setAuthMode('signup');
                        setShowAuthModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                    style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                    }}
                >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="text-sm font-medium text-white">Sign Up</span>
                </motion.button>
            </motion.div>

            {/* Auth Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAuthModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md rounded-2xl shadow-2xl p-8 border"
                            style={{
                                background: isDark
                                    ? 'rgba(15, 23, 42, 0.95)'
                                    : 'rgba(255, 255, 255, 0.95)',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="text-center space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        {authMode === 'signin' ? 'Welcome Back' : 'Start Creating'}
                                    </h2>
                                    <p className="text-gray-300 text-sm">
                                        {authMode === 'signin'
                                            ? 'Sign in to continue your production'
                                            : 'Transform your screenplay into cinema with AI'}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Error Message */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 rounded-lg"
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#ef4444',
                                            }}
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    {/* Email/Password Form */}
                                    <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
                                        {authMode === 'signup' && (
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-white">
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-lg outline-none transition-all bg-white/5 border border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                    placeholder="John Doe"
                                                    required
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-white">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg outline-none transition-all bg-white/5 border border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                placeholder="you@example.com"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-white">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg outline-none transition-all bg-white/5 border border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                placeholder="••••••••"
                                                required
                                                minLength={6}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{
                                                background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                                            }}
                                        >
                                            {isLoading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                                        </button>
                                    </form>

                                    {/* Divider */}
                                    <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-600" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-transparent text-gray-400">
                                                Or continue with
                                            </span>
                                        </div>
                                    </div>

                                    {/* OAuth Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleProviderSignIn('google')}
                                            disabled={isLoading}
                                            className="py-3 px-4 rounded-xl font-medium transition-all hover:scale-105 border border-gray-600 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                            </svg>
                                            <span className="text-sm">Google</span>
                                        </button>
                                        <button
                                            onClick={() => handleProviderSignIn('github')}
                                            disabled={isLoading}
                                            className="py-3 px-4 rounded-xl font-medium transition-all hover:scale-105 border border-gray-600 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                            <span className="text-sm">GitHub</span>
                                        </button>
                                    </div>

                                    {/* Toggle Mode */}
                                    <div className="pt-2 text-center">
                                        <p className="text-sm text-gray-400">
                                            {authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                                            {' '}
                                            <button
                                                onClick={() => {
                                                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                                                    setError(null);
                                                }}
                                                className="text-emerald-400 hover:text-emerald-300 font-semibold"
                                            >
                                                {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <div className="absolute bottom-6 left-0 right-0 z-10 text-center">
                <p className="text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Alkemy AI Studio. All rights reserved.
                </p>
            </div>
        </div>
    );
};
