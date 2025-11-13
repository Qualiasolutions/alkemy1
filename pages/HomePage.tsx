import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ScrollExpandMedia from '../components/ui/scroll-expansion-hero';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const supabaseConfigured = isSupabaseConfigured();
  // Only use auth hooks if Supabase is configured
  const authContext = supabaseConfigured ? useAuth() : null;
  const { user, isAuthenticated, signOut } = authContext || { user: null, isAuthenticated: false, signOut: async () => {} };

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mediaError, setMediaError] = useState(false);

  // Reset scroll position on mount and add timeout for media loading
  useEffect(() => {
    window.scrollTo(0, 0);
    const resetEvent = new Event('resetSection');
    window.dispatchEvent(resetEvent);

    // Set a timeout - if media doesn't load in 5 seconds, show fallback
    const timeout = setTimeout(() => {
      console.log('Media loading timeout - showing fallback UI');
      setMediaError(true);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Input validation to prevent invalid requests
    if (!email || !password || email.trim() === '' || password.trim() === '') {
      setAuthError('Email and password are required');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setAuthError('Please enter a valid email address');
      return;
    }

    // Password length validation (Supabase requires minimum 6 characters)
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

      // Navigate to the main app after successful sign in
      navigate('/app');
    } catch (error: any) {
      setAuthError(error.message || 'Failed to sign in');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Input validation to prevent invalid requests
    if (!email || !password || email.trim() === '' || password.trim() === '') {
      setAuthError('Email and password are required');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setAuthError('Please enter a valid email address');
      return;
    }

    // Password length validation (Supabase requires minimum 6 characters)
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

      // Show success message
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

  // Media content for Alkemy - using a reliable video URL
  const alkemyMediaContent = {
    src: 'https://cdn.coverr.co/videos/coverr-abstract-digital-particles-7189/1080p.mp4', // More reliable CDN
    poster: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1920&auto=format&fit=crop',
    background: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop',
    title: 'Alkemy AI Studio',
    date: 'Next-Gen Filmmaking',
    scrollToExpand: 'Scroll to Experience the Future',
  };

  const MediaContent = () => (
    <div className='max-w-4xl mx-auto'>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='text-4xl font-bold mb-8 text-white'
      >
        Transform Your Creative Vision into Reality
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='space-y-6 text-lg text-gray-200'
      >
        <p>
          <strong>Alkemy AI Studio</strong> is the revolutionary platform that empowers filmmakers,
          content creators, and storytellers to bring their visions to life with the power of AI.
        </p>

        <div className='grid md:grid-cols-2 gap-6 mt-8'>
          <div className='bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10'>
            <h3 className='text-xl font-semibold mb-3 text-emerald-400'>Script to Screen</h3>
            <p className='text-gray-300'>
              Transform your screenplay into visual storyboards, generate characters,
              locations, and complete scenes with AI-powered tools.
            </p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10'>
            <h3 className='text-xl font-semibold mb-3 text-emerald-400'>AI-Enhanced Production</h3>
            <p className='text-gray-300'>
              Generate moodboards, create 3D worlds, composite scenes, and produce
              professional-grade content faster than ever before.
            </p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10'>
            <h3 className='text-xl font-semibold mb-3 text-emerald-400'>Real-time Collaboration</h3>
            <p className='text-gray-300'>
              Work seamlessly with your team in the cloud. Share projects, iterate on ideas,
              and bring your collective vision to life.
            </p>
          </div>

          <div className='bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10'>
            <h3 className='text-xl font-semibold mb-3 text-emerald-400'>Export & Deliver</h3>
            <p className='text-gray-300'>
              Export your projects in multiple formats, create presentations,
              and deliver professional content ready for any platform.
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className='mt-12 flex flex-col sm:flex-row gap-4 justify-center'
        >
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/app')}
                className='px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg'
              >
                Start Creating Now
              </button>
              <button
                onClick={() => window.open('https://github.com/yourusername/alkemy', '_blank')}
                className='px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all transform hover:scale-105 backdrop-blur-sm border border-white/20'
              >
                View Documentation
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/app')}
              className='px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg'
            >
              Open Studio
            </button>
          )}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className='mt-16 pt-8 border-t border-white/10'
      >
        <p className='text-center text-gray-400'>
          Powered by cutting-edge AI models including Gemini, Stable Diffusion, and more.
        </p>
      </motion.div>
    </div>
  );

  // Show a simple fallback UI if there's an error or while loading
  if (mediaError) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-black to-emerald-950 flex flex-col items-center justify-center px-4'>
        {/* Auth Buttons - Fixed Position */}
        <div className='fixed top-6 right-6 z-50 flex gap-3'>
          {supabaseConfigured ? (
            isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/app')}
                  className='px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all backdrop-blur-sm shadow-lg'
                >
                  Open Studio
                </button>
                <button
                  onClick={handleSignOut}
                  className='px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all backdrop-blur-sm border border-white/20'
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className='px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all backdrop-blur-sm border border-white/20'
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className='px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all backdrop-blur-sm shadow-lg'
                >
                  Sign Up
                </button>
              </>
            )
          ) : (
            <button
              onClick={() => navigate('/app')}
              className='px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all backdrop-blur-sm shadow-lg'
            >
              Open Studio
            </button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='max-w-4xl w-full text-center'
        >
          <h1 className='text-5xl md:text-7xl font-bold text-white mb-6'>
            Alkemy AI Studio
          </h1>
          <p className='text-xl md:text-2xl text-gray-300 mb-12'>
            Next-Gen Filmmaking Platform
          </p>
          <button
            onClick={() => navigate('/app')}
            className='px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg text-lg'
          >
            Launch Studio
          </button>
        </motion.div>

        {/* Auth Modal - Also include in fallback UI */}
        {supabaseConfigured && showAuthModal && (
          <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-800'
            >
              <h2 className='text-2xl font-bold text-white mb-6'>
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>

              <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp}>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Email
                    </label>
                    <input
                      type='email'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className='w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500'
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
                      className='w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500'
                      required
                      minLength={6}
                      placeholder='Minimum 6 characters'
                    />
                  </div>

                  {authError && (
                    <p className='text-red-400 text-sm'>{authError}</p>
                  )}

                  <button
                    type='submit'
                    disabled={isSigningIn || isSigningUp}
                    className='w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all disabled:opacity-50'
                  >
                    {authMode === 'signin'
                      ? (isSigningIn ? 'Signing In...' : 'Sign In')
                      : (isSigningUp ? 'Creating Account...' : 'Sign Up')
                    }
                  </button>
                </div>
              </form>

              <div className='mt-6 text-center'>
                <button
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className='text-emerald-400 hover:text-emerald-300 text-sm'
                >
                  {authMode === 'signin'
                    ? "Don't have an account? Sign up"
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
                className='absolute top-4 right-4 text-gray-400 hover:text-white'
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black relative'>
      {/* Auth Buttons - Fixed Position */}
      <div className='fixed top-6 right-6 z-50 flex gap-3'>
        {supabaseConfigured ? (
          isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/app')}
                className='px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all backdrop-blur-sm shadow-lg'
              >
                Open Studio
              </button>
              <button
                onClick={handleSignOut}
                className='px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all backdrop-blur-sm border border-white/20'
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className='px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all backdrop-blur-sm border border-white/20'
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className='px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all backdrop-blur-sm shadow-lg'
              >
                Sign Up
              </button>
            </>
          )
        ) : (
          <button
            onClick={() => navigate('/app')}
            className='px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all backdrop-blur-sm shadow-lg'
          >
            Open Studio
          </button>
        )}
      </div>

      {/* Hero Section with Scroll Expansion - wrapped in try-catch */}
      <div onError={() => setMediaError(true)}>
        <ScrollExpandMedia
          mediaType='video'
          mediaSrc={alkemyMediaContent.src}
          posterSrc={alkemyMediaContent.poster}
          bgImageSrc={alkemyMediaContent.background}
          title={alkemyMediaContent.title}
          date={alkemyMediaContent.date}
          scrollToExpand={alkemyMediaContent.scrollToExpand}
          textBlend={false}
        >
          <MediaContent />
        </ScrollExpandMedia>
      </div>

      {/* Auth Modal */}
      {supabaseConfigured && showAuthModal && (
        <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className='bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-800'
          >
            <h2 className='text-2xl font-bold text-white mb-6'>
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>

            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp}>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Email
                  </label>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500'
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
                    className='w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500'
                    required
                    minLength={6}
                    placeholder='Minimum 6 characters'
                  />
                </div>

                {authError && (
                  <p className='text-red-400 text-sm'>{authError}</p>
                )}

                <button
                  type='submit'
                  disabled={isSigningIn || isSigningUp}
                  className='w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all disabled:opacity-50'
                >
                  {authMode === 'signin'
                    ? (isSigningIn ? 'Signing In...' : 'Sign In')
                    : (isSigningUp ? 'Creating Account...' : 'Sign Up')
                  }
                </button>
              </div>
            </form>

            <div className='mt-6 text-center'>
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className='text-emerald-400 hover:text-emerald-300 text-sm'
              >
                {authMode === 'signin'
                  ? "Don't have an account? Sign up"
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
              className='absolute top-4 right-4 text-gray-400 hover:text-white'
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HomePage;