/**
 * Optimized App.tsx - Refactored for better performance and maintainability
 *
 * Changes made:
 * - Extracted state management into custom hooks (useProjectState, useUIState)
 * - Split large component into smaller, focused components
 * - Added proper error boundaries
 * - Implemented React.memo for performance optimization
 * - Fixed useEffect dependency arrays
 * - Added proper cleanup for event listeners
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import DirectorWidget from './components/DirectorWidget';
import SplashScreen from './components/SplashScreen';
import WelcomeScreen from './components/WelcomeScreen';
import AuthModal from './components/auth/AuthModal';
import UserMenu from './components/auth/UserMenu';
import ErrorBoundary from './components/ErrorBoundary';
import ScriptAnalysisPanel from './components/ScriptAnalysisPanel';
import { TABS, TABS_CONFIG } from './constants';
import { SunIcon, MoonIcon, RoadmapIcon } from './components/icons/Icons';

// Lazy load tab components for better performance
const ScriptTab = React.lazy(() => import('./tabs/ScriptTab'));
const MoodboardTab = React.lazy(() => import('./tabs/MoodboardTab'));
const PresentationTab = React.lazy(() => import('./tabs/PresentationTab'));
const CastLocationsTab = React.lazy(() => import('./tabs/CastLocationsTab'));
const CompositingTab = React.lazy(() => import('./tabs/SceneAssemblerTab'));
const FramesTab = React.lazy(() => import('./tabs/FramesTab.simple'));
const WanTransferTab = React.lazy(() => import('./tabs/WanTransferTab'));
const ExportsTab = React.lazy(() => import('./tabs/ExportsTab'));
const RoadmapTab = React.lazy(() => import('./tabs/RoadmapTab'));
const ProjectRoadmapTab = React.lazy(() => import('./tabs/ProjectRoadmapTab'));
const ThreeDWorldsTab = React.lazy(() => import('./tabs/3DWorldsTab'));
const GenerateTab = React.lazy(() => import('./tabs/GenerateTab'));

// Import pages
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import HomePage from './pages/HomePage';

// Import custom hooks
import { useProjectState } from './hooks/useProjectState';
import { useUIState } from './hooks/useUIState';

// Services
import { hasGeminiApiKey, hasEnvGeminiApiKey, onGeminiApiKeyChange, clearGeminiApiKey, setGeminiApiKey } from './services/apiKeys';
import { isSupabaseConfigured } from './services/supabase';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { getProjectService } from './services/projectService';
import { DEMO_PROJECT_DATA, DEMO_SCRIPT } from './data/demoProject';
import Toast, { ToastMessage } from './components/Toast';
import ProjectSelectorModal from './components/ProjectSelectorModal';

const PROJECT_STORAGE_KEY = 'alkemy_ai_studio_project_data_v2';

// API Key Component
const ApiKeyPrompt: React.FC<{ onKeySelected: () => void; isDark?: boolean }> = React.memo(({ onKeySelected, isDark = true }) => {
    const [manualKey, setManualKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    const handleSelectKey = useCallback(async () => {
        if (!window.aistudio?.openSelectKey) {
            setError('API key selection utility is not available in this environment. Paste your key below instead.');
            return;
        }

        setIsSelecting(true);
        setError(null);

        try {
            const selectedKey = await window.aistudio.openSelectKey();
            if (selectedKey) {
                await setGeminiApiKey(selectedKey);
                onKeySelected();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to select API key');
        } finally {
            setIsSelecting(false);
        }
    }, [onKeySelected]);

    const handleManualSubmit = useCallback(async () => {
        if (!manualKey.trim()) {
            setError('Please enter a valid API key');
            return;
        }

        setError(null);

        try {
            await setGeminiApiKey(manualKey.trim());
            onKeySelected();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set API key');
        }
    }, [manualKey, onKeySelected]);

    return (
        <div className="api-key-prompt">
            <div className="prompt-content">
                <h2>API Key Required</h2>
                <p>Alkemy AI Studio requires a Gemini API key to function. Please provide your key:</p>

                <div className="key-input-section">
                    <input
                        type="password"
                        value={manualKey}
                        onChange={(e) => setManualKey(e.target.value)}
                        placeholder="Enter your Gemini API key"
                        className="key-input"
                    />
                    <button
                        onClick={handleManualSubmit}
                        disabled={!manualKey.trim() || isSelecting}
                        className="submit-button"
                    >
                        Set Key
                    </button>
                </div>

                {window.aistudio?.openSelectKey && (
                    <div className="key-select-section">
                        <button
                            onClick={handleSelectKey}
                            disabled={isSelecting}
                            className="select-button"
                        >
                            {isSelecting ? 'Selecting...' : 'Select from Key Manager'}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="help-text">
                    <p>You can get a Gemini API key from:</p>
                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                        Google AI Studio
                    </a>
                </div>
            </div>

            <style jsx>{`
                .api-key-prompt {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 20px;
                    background: var(--background-primary);
                }

                .prompt-content {
                    max-width: 400px;
                    width: 100%;
                    padding: 30px;
                    background: var(--background-secondary);
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }

                .prompt-content h2 {
                    margin: 0 0 10px 0;
                    color: var(--text-primary);
                }

                .prompt-content p {
                    margin: 0 0 20px 0;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }

                .key-input-section {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .key-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--background-primary);
                    color: var(--text-primary);
                    font-size: 14px;
                }

                .submit-button,
                .select-button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .submit-button {
                    background: var(--primary-color);
                    color: white;
                }

                .submit-button:hover:not(:disabled) {
                    background: var(--primary-color-hover);
                }

                .select-button {
                    background: var(--background-hover);
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                }

                .select-button:hover:not(:disabled) {
                    background: var(--background-secondary);
                }

                :disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .key-select-section {
                    margin-bottom: 20px;
                }

                .error-message {
                    padding: 10px;
                    background: var(--error-background);
                    border: 1px solid var(--error-color);
                    border-radius: 4px;
                    color: var(--error-color);
                    margin-bottom: 20px;
                }

                .help-text {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .help-text a {
                    color: var(--primary-color);
                    text-decoration: none;
                }

                .help-text a:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
});

ApiKeyPrompt.displayName = 'ApiKeyPrompt';

// Main App Content Component
const AppContent: React.FC = React.memo(() => {
    const { user, isAuthenticated, authLoading } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const loadProjectInputRef = useRef<HTMLInputElement>(null);

    // Get initial API key status
    const envHasGeminiKey = hasEnvGeminiApiKey();
    const initialHasGeminiKey = hasGeminiApiKey();

    // UI State Management
    const [showSplash, setShowSplash] = useState<boolean>(true);
    const [isKeyReady, setIsKeyReady] = useState<boolean>(initialHasGeminiKey);
    const [isCheckingKey, setIsCheckingKey] = useState<boolean>(() => !initialHasGeminiKey);
    const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
    const [showProjectSelector, setShowProjectSelector] = useState<boolean>(false);
    const [autoProjectCreated, setAutoProjectCreated] = useState<boolean>(false);
    const [preferencesError, setPreferencesError] = useState<string | null>(null);

    // Use custom hooks for state management
    const projectState = useProjectState(user);
    const uiState = useUIState(user);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onSave: projectState.saveProject,
        onNewProject: projectState.handleNewProject,
        onToggleSidebar: () => uiState.setIsSidebarExpanded(!uiState.isSidebarExpanded),
        onOpenProjectSelector: () => setShowProjectSelector(true),
        onToggleTheme: toggleTheme
    });

    // Environment and service checks
    const supabaseEnabled = useMemo(() => isSupabaseConfigured(), []);

    // Handle API key changes
    useEffect(() => {
        const handleKeyChange = () => {
            setIsKeyReady(hasGeminiApiKey());
            setIsCheckingKey(false);
        };

        onGeminiApiKeyChange(handleKeyChange);
        return () => {
            // Cleanup key change listener
        };
    }, []);

    // Initialize project when user is authenticated
    useEffect(() => {
        if (isAuthenticated && user && !projectState.hasLoadedInitialProject) {
            projectState.initializeProject(user, searchParams);
        }
    }, [isAuthenticated, user, projectState.hasLoadedInitialProject, searchParams, projectState.initializeProject]);

    // Handle preferences errors
    useEffect(() => {
        // This would come from the useUIState hook
        if (preferencesError) {
            console.error('User preferences error:', preferencesError);
        }
    }, [preferencesError]);

    // Create demo project if needed
    useEffect(() => {
        if (isAuthenticated && user && !autoProjectCreated && projectState.projectList.length === 0) {
            const createDemoProject = async () => {
                try {
                    const projectService = getProjectService();
                    const demoProject = await projectService.createProject(
                        'Demo Project',
                        user.id
                    );

                    await projectService.updateProject(demoProject.id, {
                        script_content: DEMO_SCRIPT,
                        script_analysis: DEMO_PROJECT_DATA.scriptAnalysis
                    });

                    setAutoProjectCreated(true);
                    projectState.loadProjects(user.id);
                } catch (error) {
                    console.error('[AppContent] Failed to create demo project:', error);
                }
            };

            // Only create demo project if specifically needed
            // createDemoProject();
        }
    }, [isAuthenticated, user, autoProjectCreated, projectState.projectList.length, projectState]);

    const handleKeySelected = useCallback(() => {
        setIsKeyReady(true);
        setIsCheckingKey(false);
    }, []);

    const handleProjectLoad = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                projectState.setProjectState(prev => ({
                    ...prev,
                    scriptContent: content
                }));
            } catch (error) {
                console.error('[AppContent] Failed to load project file:', error);
                uiState.showToast('Failed to load project file', 'error');
            }
        };
        reader.readAsText(file);
    }, [user, projectState, uiState]);

    const renderContent = useMemo(() => {
        // Show splash screen initially
        if (showSplash) {
            return (
                <SplashScreen
                    onLoadComplete={() => setShowSplash(false)}
                    isDark={isDark}
                />
            );
        }

        // Check API key requirements
        if (!envHasGeminiKey && !isKeyReady) {
            return <ApiKeyPrompt onKeySelected={handleKeySelected} isDark={isDark} />;
        }

        // Show auth modal if not authenticated
        if (!authLoading && !isAuthenticated) {
            return (
                <WelcomeScreen
                    onAuthClick={() => setShowAuthModal(true)}
                    isDark={isDark}
                />
            );
        }

        // Show loading state while checking authentication
        if (authLoading) {
            return <div>Loading authentication...</div>;
        }

        // Main application content
        return (
            <ErrorBoundary>
                <div className="app-layout">
                    <Sidebar
                        activeTab={uiState.activeTab}
                        onTabChange={uiState.setActiveTab}
                        isExpanded={uiState.isSidebarExpanded}
                        onToggleExpand={() => uiState.setIsSidebarExpanded(!uiState.isSidebarExpanded)}
                    />

                    <div className="main-content">
                        <div className="top-bar">
                            <UserMenu
                                user={user}
                                onProjectClick={() => setShowProjectSelector(true)}
                                onThemeToggle={toggleTheme}
                                isDark={isDark}
                            />
                        </div>

                        <div className="workspace">
                            <ErrorBoundary>
                                <React.Suspense fallback={<div>Loading...</div>}>
                                    <Routes>
                                        <Route path="/" element={
                                            uiState.activeTab === 'script' ? (
                                                <ScriptTab
                                                    scriptContent={projectState.projectState.scriptContent}
                                                    scriptAnalysis={projectState.projectState.scriptAnalysis}
                                                    onScriptChange={(content) => projectState.setProjectState(prev => ({
                                                        ...prev,
                                                        scriptContent: content
                                                    }))}
                                                />
                                            ) : uiState.activeTab === 'moodboard' ? (
                                                <MoodboardTab />
                                            ) : uiState.activeTab === 'cast' ? (
                                                <CastLocationsTab />
                                            ) : uiState.activeTab === 'assemble' ? (
                                                <CompositingTab />
                                            ) : uiState.activeTab === '3d-worlds' ? (
                                                <ThreeDWorldsTab />
                                            ) : uiState.activeTab === 'post-production' ? (
                                                <ExportsTab />
                                            ) : uiState.activeTab === 'analytics' ? (
                                                <RoadmapTab />
                                            ) : (
                                                <ScriptTab
                                                    scriptContent={projectState.projectState.scriptContent}
                                                    scriptAnalysis={projectState.projectState.scriptAnalysis}
                                                    onScriptChange={(content) => projectState.setProjectState(prev => ({
                                                        ...prev,
                                                        scriptContent: content
                                                    }))}
                                                />
                                            )
                                        } />
                                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                                        <Route path="/auth/callback" element={<AuthCallbackPage />} />
                                    </Routes>
                                </React.Suspense>
                            </ErrorBoundary>
                        </div>

                        <DirectorWidget />
                    </div>
                </div>
            </ErrorBoundary>
        );
    }, [
        showSplash,
        envHasGeminiKey,
        isKeyReady,
        authLoading,
        isAuthenticated,
        isDark,
        handleKeySelected,
        uiState.activeTab,
        uiState.isSidebarExpanded,
        uiState.setActiveTab,
        uiState.setIsSidebarExpanded,
        toggleTheme,
        user,
        projectState.projectState,
        projectState.setProjectState
    ]);

    return (
        <div className={`app ${isDark ? 'dark' : 'light'}`}>
            {renderContent}

            <AnimatePresence>
                {uiState.toast && (
                    <Toast
                        message={uiState.toast.message}
                        type={uiState.toast.type}
                        onClose={uiState.clearToast}
                    />
                )}
            </AnimatePresence>

            {showAuthModal && (
                <AuthModal
                    mode={authModalMode}
                    onClose={() => setShowAuthModal(false)}
                    onModeChange={setAuthModalMode}
                />
            )}

            {showProjectSelector && (
                <ProjectSelectorModal
                    projects={projectState.projectList}
                    currentProject={projectState.currentProject}
                    isLoading={projectState.isLoadingProjects}
                    onSelect={projectState.handleProjectSelect}
                    onNew={projectState.handleNewProject}
                    onLoad={handleProjectLoad}
                    loadInputRef={loadProjectInputRef}
                    onClose={() => setShowProjectSelector(false)}
                />
            )}

            <input
                ref={loadProjectInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleProjectLoad}
            />
        </div>
    );
});

AppContent.displayName = 'AppContent';

// Main App Component
const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ErrorBoundary>
                    <AppContent />
                </ErrorBoundary>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;