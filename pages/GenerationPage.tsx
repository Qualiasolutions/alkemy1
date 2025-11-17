import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/theme/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import CharacterIdentityWorkflow from '@/components/generation/CharacterIdentityWorkflow';
import WorldGenerationWorkflow from '@/components/generation/WorldGenerationWorkflow';

type WorkflowType = 'character' | 'world';

const GenerationPage: React.FC = () => {
    const { colors, isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>('character');

    return (
        <div className="min-h-screen" style={{ background: colors.background_primary }}>
            {/* Decorative Gradients */}
            <div className="pointer-events-none fixed -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-lime-500/10 blur-3xl" />
            <div className="pointer-events-none fixed bottom-0 right-[-10%] h-[420px] w-[420px] rounded-full bg-lime-400/10 blur-3xl" />

            {/* Header */}
            <header
                className="sticky top-0 z-30 border-b backdrop-blur-xl"
                style={{
                    borderColor: colors.border_color,
                    background: `${colors.background_primary}95`
                }}
            >
                <div className="mx-auto max-w-7xl px-6 py-5">
                    <div className="flex items-center justify-between">
                        {/* Logo & Title */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-2 transition-opacity hover:opacity-70"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 2L2 7L12 12L22 7L12 2Z"
                                        fill={colors.accent_primary}
                                        opacity="0.8"
                                    />
                                    <path
                                        d="M2 17L12 22L22 17"
                                        stroke={colors.accent_primary}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M2 12L12 17L22 12"
                                        stroke={colors.accent_primary}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <div>
                                    <h1 className="text-xl font-bold" style={{ color: colors.text_primary }}>
                                        Alkemy Generation Studio
                                    </h1>
                                    <p className="text-xs" style={{ color: colors.text_tertiary }}>
                                        Character Identity & World Generation
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                style={{
                                    background: colors.surface_card,
                                    color: colors.text_secondary,
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: colors.border_color
                                }}
                            >
                                ← Back to Main App
                            </button>
                            <motion.button
                                onClick={toggleTheme}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.96 }}
                                className="p-2 rounded-lg"
                                style={{
                                    background: colors.surface_card,
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: colors.border_color
                                }}
                            >
                                {isDark ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.text_secondary} strokeWidth="2">
                                        <circle cx="12" cy="12" r="5" />
                                        <line x1="12" y1="1" x2="12" y2="3" />
                                        <line x1="12" y1="21" x2="12" y2="23" />
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                        <line x1="1" y1="12" x2="3" y2="12" />
                                        <line x1="21" y1="12" x2="23" y2="12" />
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.text_secondary} strokeWidth="2">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                    </svg>
                                )}
                            </motion.button>
                        </div>
                    </div>

                    {/* Workflow Tabs */}
                    <div className="flex gap-2 mt-6">
                        <button
                            onClick={() => setActiveWorkflow('character')}
                            className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all"
                            style={{
                                background: activeWorkflow === 'character' ? 'rgba(16, 163, 127, 0.15)' : colors.surface_card,
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                borderColor: activeWorkflow === 'character' ? colors.accent_primary : colors.border_color,
                                color: activeWorkflow === 'character' ? colors.text_primary : colors.text_secondary
                            }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span>Character Identity</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveWorkflow('world')}
                            className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all"
                            style={{
                                background: activeWorkflow === 'world' ? 'rgba(16, 163, 127, 0.15)' : colors.surface_card,
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                borderColor: activeWorkflow === 'world' ? colors.accent_primary : colors.border_color,
                                color: activeWorkflow === 'world' ? colors.text_primary : colors.text_secondary
                            }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                </svg>
                                <span>World Generation</span>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative mx-auto max-w-7xl px-6 py-10">
                <motion.div
                    key={activeWorkflow}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeWorkflow === 'character' && (
                        <CharacterIdentityWorkflow
                            onComplete={(identity) => {
                                console.log('Character identity training complete:', identity);
                            }}
                        />
                    )}
                    {activeWorkflow === 'world' && (
                        <WorldGenerationWorkflow
                            onComplete={(world) => {
                                console.log('World generation complete:', world);
                            }}
                        />
                    )}
                </motion.div>
            </main>

            {/* Footer */}
            <footer
                className="mt-20 border-t py-8"
                style={{ borderColor: colors.border_color }}
            >
                <div className="mx-auto max-w-7xl px-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm" style={{ color: colors.text_tertiary }}>
                            © 2025 Alkemy AI Studio. Powered by Gemini, Imagen, and World Labs technology.
                        </p>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://ai.google.dev"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm transition-opacity hover:opacity-70"
                                style={{ color: colors.text_secondary }}
                            >
                                Google AI
                            </a>
                            <a
                                href="https://docs.claude.com/claude-code"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm transition-opacity hover:opacity-70"
                                style={{ color: colors.text_secondary }}
                            >
                                Built with Claude Code
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default GenerationPage;
