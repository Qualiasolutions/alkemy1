import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const supabaseConfigured = isSupabaseConfigured();
  const authContext = supabaseConfigured ? useAuth() : null;
  const { user, isAuthenticated, signOut } = authContext || { user: null, isAuthenticated: false, signOut: async () => {} };

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password || email.trim() === '' || password.trim() === '') {
      setAuthError('Email and password are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setAuthError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long');
      return;
    }

    setIsSigningIn(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      navigate('/app');
    } catch (error: any) {
      setAuthError(error.message || 'Failed to sign in');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password || email.trim() === '' || password.trim() === '') {
      setAuthError('Email and password are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setAuthError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long');
      return;
    }

    setIsSigningUp(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setAuthError(null);
      alert('Check your email to confirm your account!');
      setShowAuthModal(false);
    } catch (error: any) {
      setAuthError(error.message || 'Failed to sign up');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className='min-h-screen relative overflow-hidden'>
      {/* Animated Gradient Background */}
      <div className='absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-950'>
        {/* Animated gradient orbs */}
        <div className='absolute top-1/4 -left-20 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl animate-pulse-soft'></div>
        <div className='absolute bottom-1/4 -right-20 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl animate-pulse-soft' style={{ animationDelay: '1s' }}></div>
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-500/5 rounded-full blur-3xl animate-pulse-soft' style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Sign Out Button (if authenticated) */}
      {supabaseConfigured && isAuthenticated && (
        <div className='absolute top-6 right-6 z-40'>
          <button
            onClick={handleSignOut}
            className='px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all backdrop-blur-sm border border-white/20'
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className='relative z-10 min-h-screen flex flex-col items-center justify-center px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className='text-center max-w-4xl'
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className='mb-12'
          >
            <img
              src='/logo.jpeg'
              alt='Alkemy AI Studio'
              className='w-48 h-48 mx-auto rounded-2xl shadow-2xl shadow-lime-500/20 border border-lime-500/20'
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className='text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-lime-100 to-lime-200 bg-clip-text text-transparent'
          >
            Alkemy AI Studio
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className='text-2xl md:text-3xl text-gray-300 mb-4'
          >
            Next-Gen Film Production
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className='text-lg md:text-xl text-gray-400 mb-16'
          >
            Powered by Artificial Intelligence
          </motion.p>

          {/* CTA Buttons */}
          {!isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className='flex flex-col sm:flex-row gap-6 justify-center items-center'
            >
              {supabaseConfigured ? (
                <>
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setShowAuthModal(true);
                    }}
                    className='group relative px-12 py-5 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg rounded-xl transition-all transform hover:scale-105 backdrop-blur-sm border-2 border-white/20 hover:border-lime-500/50 shadow-xl min-w-[200px]'
                  >
                    <span className='relative z-10'>Sign In</span>
                    <div className='absolute inset-0 rounded-xl bg-lime-500/0 group-hover:bg-lime-500/5 transition-all'></div>
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuthModal(true);
                    }}
                    className='group relative px-12 py-5 bg-lime-500 hover:bg-lime-400 text-black font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-2xl shadow-lime-500/30 hover:shadow-lime-500/50 min-w-[200px]'
                  >
                    <span className='relative z-10'>Sign Up</span>
                    <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-lime-400/50 to-lime-600/50 opacity-0 group-hover:opacity-100 transition-opacity blur'></div>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/app')}
                  className='group relative px-12 py-5 bg-lime-500 hover:bg-lime-400 text-black font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-2xl shadow-lime-500/30 hover:shadow-lime-500/50'
                >
                  <span className='relative z-10'>Launch Studio</span>
                  <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-lime-400/50 to-lime-600/50 opacity-0 group-hover:opacity-100 transition-opacity blur'></div>
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <button
                onClick={() => navigate('/app')}
                className='group relative px-16 py-6 bg-lime-500 hover:bg-lime-400 text-black font-bold text-xl rounded-xl transition-all transform hover:scale-105 shadow-2xl shadow-lime-500/30 hover:shadow-lime-500/50'
              >
                <span className='relative z-10'>Open Studio</span>
                <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-lime-400/50 to-lime-600/50 opacity-0 group-hover:opacity-100 transition-opacity blur'></div>
              </button>
            </motion.div>
          )}

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className='mt-20 text-gray-500 text-sm'
          >
            Transform your creative vision into reality with AI-powered filmmaking tools
          </motion.p>
        </motion.div>
      </div>

      {/* Auth Modal */}
      {supabaseConfigured && showAuthModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md'
          onClick={() => {
            setShowAuthModal(false);
            setAuthError(null);
            setEmail('');
            setPassword('');
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className='bg-gray-900/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full mx-4 border border-lime-500/20 shadow-2xl shadow-lime-500/10'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className='text-3xl font-bold text-white mb-2'>
              {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className='text-gray-400 mb-8'>
              {authMode === 'signin' ? 'Sign in to continue to Alkemy AI Studio' : 'Start your filmmaking journey today'}
            </p>

            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className='space-y-5'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Email Address
                </label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all'
                  placeholder='you@example.com'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Password
                </label>
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all'
                  required
                  minLength={6}
                  placeholder='Minimum 6 characters'
                />
              </div>

              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='p-3 bg-red-500/10 border border-red-500/30 rounded-lg'
                >
                  <p className='text-red-400 text-sm'>{authError}</p>
                </motion.div>
              )}

              <button
                type='submit'
                disabled={isSigningIn || isSigningUp}
                className='w-full py-4 bg-lime-500 hover:bg-lime-400 text-black font-bold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg shadow-lime-500/30 hover:shadow-lime-500/50'
              >
                {authMode === 'signin'
                  ? (isSigningIn ? 'Signing In...' : 'Sign In')
                  : (isSigningUp ? 'Creating Account...' : 'Create Account')
                }
              </button>
            </form>

            <div className='mt-6 text-center'>
              <button
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  setAuthError(null);
                }}
                className='text-lime-400 hover:text-lime-300 text-sm font-medium transition-colors'
              >
                {authMode === 'signin'
                  ? "Don't have an account? Create one"
                  : 'Already have an account? Sign in'
                }
              </button>
            </div>

            <button
              onClick={() => {
                setShowAuthModal(false);
                setAuthError(null);
                setEmail('');
                setPassword('');
              }}
              className='absolute top-6 right-6 text-gray-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default HomePage;
