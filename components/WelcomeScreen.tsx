import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { renderCanvas } from './ui/canvas';
import { Button } from './ui/button';
import { useTheme } from '../theme/ThemeContext';

interface WelcomeScreenProps {
  onStartNewProject: () => void;
  onLoadProject: () => void;
  onTryDemo: () => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
  isAuthenticated?: boolean;
  showAuth?: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartNewProject,
  onLoadProject,
  onTryDemo,
  onSignIn,
  onSignUp,
  isAuthenticated = false,
  showAuth = false,
}) => {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    renderCanvas();
  }, []);

  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      {/* Animated Canvas Background */}
      <canvas
        className="pointer-events-none absolute inset-0 w-full h-full"
        id="canvas"
        style={{ background: isDark ? '#0A0A0A' : '#FFFFFF' }}
      ></canvas>

      {/* Hero Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-medium">Powered by Gemini 2.5 Pro, Imagen 3 & Veo 3.1</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 animate-pulse-soft">
              Alkemy
            </span>
            <span className="block text-[var(--color-text-primary)] mt-2">
              AI Studio
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto max-w-3xl text-lg md:text-2xl text-[var(--color-text-secondary)] mb-4 font-light"
        >
          Transform your screenplays into cinematic reality.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto max-w-2xl text-base md:text-lg text-[var(--color-text-tertiary)] mb-12"
        >
          From script analysis to shot composition, character generation to video animation –
          your complete AI-powered film production pipeline.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <Button
            variant="default"
            size="lg"
            onClick={onStartNewProject}
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-glow-md hover:shadow-glow-lg transition-all duration-300 text-lg px-8 py-6 h-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 4v16m8-8H4"></path>
            </svg>
            Start New Project
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onTryDemo}
            className="border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 text-lg px-8 py-6 h-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Try Demo
          </Button>
        </motion.div>

        {/* Secondary Actions */}
        {!showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Button
              variant="ghost"
              size="lg"
              onClick={onLoadProject}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Load Existing Project
            </Button>
          </motion.div>
        )}

        {showAuth && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex gap-4"
          >
            <Button variant="ghost" size="lg" onClick={onSignIn}>
              Sign In
            </Button>
            <Button variant="ghost" size="lg" onClick={onSignUp}>
              Sign Up
            </Button>
          </motion.div>
        )}

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4"
        >
          <div className="glass rounded-2xl p-6 border border-[var(--color-border-color)]">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Script Analysis</h3>
            <p className="text-[var(--color-text-secondary)] text-sm">
              AI-powered script breakdown with scene detection, character analysis, and technical shot planning
            </p>
          </div>

          <div className="glass rounded-2xl p-6 border border-[var(--color-border-color)]">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Visual Generation</h3>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Generate characters, locations, and shot compositions using Imagen 3 and Flux models
            </p>
          </div>

          <div className="glass rounded-2xl p-6 border border-[var(--color-border-color)]">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Video Animation</h3>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Transform still frames into cinematic video clips with Veo 3.1 and export to timeline
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WelcomeScreen;
