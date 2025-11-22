import { motion } from 'framer-motion'
import type React from 'react'
import { useEffect } from 'react'
import { Button } from './ui/button'
import { renderCanvas } from './ui/canvas'

// Theme removed - always using dark mode

interface WelcomeScreenProps {
  onStartNewProject: () => void
  onLoadProject: () => void
  onTryDemo: () => void
  onSignIn?: () => void
  onSignUp?: () => void
  isAuthenticated?: boolean
  showAuth?: boolean
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
  // Always using dark theme - removed theme dependency

  useEffect(() => {
    renderCanvas()
  }, [])

  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      {/* Animated Canvas Background */}
      <canvas
        className="pointer-events-none absolute inset-0 w-full h-full"
        id="canvas"
        style={{ background: '#0A0A0A' }}
      ></canvas>

      {/* Gradient Orbs for Depth */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-#DFEC2D/20 blur-[128px] animate-pulse-soft" />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-teal-500/20 blur-[128px] animate-pulse-soft"
        style={{ animationDelay: '1s' }}
      />

      {/* Hero Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-#DFEC2D/20 bg-#DFEC2D/5 px-4 py-2 text-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-#DFEC2D opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-#DFEC2D"></span>
            </span>
            <span className="text-#DFEC2D font-medium">
              Powered by Gemini 2.5 Pro, Imagen 3 & Veo 3.1
            </span>
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
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-#DFEC2D via-#DFEC2D to-teal-400 animate-pulse-soft">
              Alkemy
            </span>
            <span className="block text-[var(--color-text-primary)] mt-2">AI Studio</span>
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
          From script analysis to shot composition, character generation to video animation – your
          complete AI-powered film production pipeline.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Button
              variant="default"
              size="lg"
              onClick={onStartNewProject}
              className="min-w-[240px]"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 4v16m8-8H4"></path>
              </svg>
              Start New Project
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Button variant="outline" size="lg" onClick={onTryDemo} className="min-w-[240px]">
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Try Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Secondary Actions */}
        {!showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                size="lg"
                onClick={onLoadProject}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Load Existing Project
              </Button>
            </motion.div>
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
            <Button variant="secondary" size="lg" onClick={onSignUp}>
              Sign Up
            </Button>
          </motion.div>
        )}

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4"
        >
          {[
            {
              icon: (
                <svg
                  className="w-7 h-7 text-#DFEC2D"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              ),
              title: 'Script Analysis',
              description:
                'AI-powered script breakdown with scene detection, character analysis, and technical shot planning',
              delay: 0.9,
            },
            {
              icon: (
                <svg
                  className="w-7 h-7 text-#DFEC2D"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              ),
              title: 'Visual Generation',
              description:
                'Generate characters, locations, and shot compositions using Imagen 3 and Flux models',
              delay: 1.0,
            },
            {
              icon: (
                <svg
                  className="w-7 h-7 text-#DFEC2D"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              ),
              title: 'Video Animation',
              description:
                'Transform still frames into cinematic video clips with Veo 3.1 and export to timeline',
              delay: 1.1,
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <div className="glass rounded-2xl p-8 border border-[var(--color-border-color)] hover:border-#DFEC2D/40 transition-all duration-300 h-full relative overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-#DFEC2D/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative">
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-#DFEC2D/10 flex items-center justify-center mb-5 group-hover:bg-#DFEC2D/20 transition-colors duration-300 shadow-lg shadow-#DFEC2D/10"
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3 group-hover:text-#DFEC2D transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default WelcomeScreen
