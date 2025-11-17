
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { TABS, TABS_CONFIG } from './constants';
import { SunIcon, MoonIcon, RoadmapIcon } from './components/icons/Icons';
import ScriptTab from './tabs/ScriptTab';
import MoodboardTab from './tabs/MoodboardTab';
import PresentationTab from './tabs/PresentationTab';
import CastLocationsTab from './tabs/CastLocationsTab';
import CompositingTab from './tabs/SceneAssemblerTab';
import FramesTab from './tabs/FramesTab.simple';
import WanTransferTab from './tabs/WanTransferTab';
import PostProductionTab from './tabs/PostProductionTab';
import ExportsTab from './tabs/ExportsTab';
import RoadmapTab from './tabs/RoadmapTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import { BMADStatusTab } from './tabs/BMADStatusTab';
import { ThreeDWorldsTab } from './tabs/3DWorldsTab';
import { ScriptAnalysis, AnalyzedScene, Frame, FrameStatus, AnalyzedCharacter, AnalyzedLocation, Moodboard, MoodboardTemplate, TimelineClip, Project, RoadmapBlock } from './types';
import { analyzeScript } from './services/aiService';
import { commandHistory } from './services/commandHistory';
import Button from './components/Button';
import { DEMO_PROJECT_DATA, DEMO_SCRIPT } from './data/demoProject';
import Toast, { ToastMessage } from './components/Toast';
import ProjectSelectorModal from './components/ProjectSelectorModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { hasGeminiApiKey, hasEnvGeminiApiKey, onGeminiApiKeyChange, clearGeminiApiKey, setGeminiApiKey } from './services/apiKeys';
import { isSupabaseConfigured } from './services/supabase';
import { getProjectService } from './services/projectService';
import { getMediaService } from './services/mediaService';
import { getUsageService, USAGE_ACTIONS, logAIUsage } from './services/usageService';

// Import enterprise data management services
import { saveManager } from './services/saveManager';
import { userDataService, useUserPreferences } from './services/userDataService';

// Import the new auth pages
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import HomePage from './pages/HomePage';
// import GenerationPage from './pages/GenerationPage'; // Commented out - separate Epic 2 demo page

const PROJECT_STORAGE_KEY = 'alkemy_ai_studio_project_data_v2'; // v2 to avoid conflicts with old state structure
const isSupabaseProjectId = (id?: string | null): boolean => {
    if (!id) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
};

const getVideoDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            // DO NOT revoke blob URLs here - they need to persist for video playback
            // Only revoke if it's a temporary blob URL created specifically for duration check
            // In this case, we keep blob URLs alive for timeline playback
            resolve(video.duration);
        };
        video.onerror = () => {
            console.warn(`Could not load video metadata for ${url}. Defaulting duration to 5s.`);
            resolve(5); // Default duration on error
        };
        video.src = url;
    });
};

const createEmptyScriptAnalysis = (): ScriptAnalysis => ({
    title: 'Untitled Project', logline: '', summary: '',
    scenes: [], characters: [], locations: [],
    props: [], styling: [], setDressing: [], makeupAndHair: [], sound: [],
    moodboardTemplates: []
});
const createDefaultMoodboardTemplates = (): MoodboardTemplate[] => ([
    {
        id: `moodboard-${Date.now()}`,
        title: 'Master Moodboard',
        description: 'Upload up to 20 hero references. These visuals influence look & feel across the project.',
        items: [],
        createdAt: new Date().toISOString()
    }
]);



const ApiKeyPrompt: React.FC<{ onKeySelected: () => void; isDark?: boolean }> = ({ onKeySelected, isDark = true }) => {
    const [manualKey, setManualKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    const handleSelectKey = async () => {
        if (!window.aistudio?.openSelectKey) {
            setError('API key selection utility is not available in this environment. Paste your key below instead.');
            return;
        }
        try {
            setIsSelecting(true);
            await window.aistudio.openSelectKey();
            onKeySelected();
        } catch (selectError) {
            console.warn('Failed to launch AI Studio key selector', selectError);
            setError('Unable to open the AI Studio key selector. Paste your key below instead.');
        } finally {
            setIsSelecting(false);
        }
    };

    const handleManualSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = manualKey.trim();
        if (!trimmed) {
            setError('Enter a valid Gemini API key.');
            return;
        }
        setGeminiApiKey(trimmed);
        setError(null);
        onKeySelected();
    };

    return (
        <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-[#0B0B0B]' : 'bg-[#FFFFFF]'}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`${isDark ? 'bg-[#161616] border-[#2A2A2A]' : 'bg-white border-[#D4D4D4]'} border rounded-2xl p-10 text-center max-w-xl shadow-2xl space-y-6`}
            >
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold">Alkemy AI Studio</h2>
                    <p className={`text-lg ${isDark ? 'text-[#A0A0A0]' : 'text-[#505050]'}`}>
                        Choose how you would like to provide your Gemini API key. This key powers all generative features in the studio.
                    </p>
                </div>

                <div className="space-y-3">
                    <Button onClick={handleSelectKey} variant="primary" className="w-full !py-3 !text-base" disabled={isSelecting}>
                        {isSelecting ? 'Opening AI Studio…' : 'Select Key via AI Studio'}
                    </Button>
                    <p className={`text-sm ${isDark ? 'text-[#808080]' : 'text-[#606060]'}`}>
                        Requires running inside Google AI Studio with key selector support.
                    </p>
                </div>

                <div className="relative">
                    <div className={`w-full h-px ${isDark ? 'bg-[#2A2A2A]' : 'bg-[#E5E5E5]'}`} />
                    <span className={`absolute left-1/2 -translate-x-1/2 -top-3 px-3 text-xs uppercase ${isDark ? 'bg-[#161616] text-[#808080]' : 'bg-white text-[#606060]'}`}>or</span>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-3 text-left">
                    <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Paste Gemini API key
                    </label>
                    <input
                        value={manualKey}
                        onChange={(event) => {
                            setManualKey(event.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="AIza..."
                        className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 ${isDark ? 'bg-[#0B0B0B] border-[#2A2A2A] text-white focus:ring-[#dfec2d]/40' : 'bg-white border-[#D4D4D4] text-black focus:ring-[#dfec2d]/40'}`}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <Button type="submit" variant="secondary" className="w-full !py-2.5">Use This Key</Button>
                </form>

                {error && (
                    <div className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</div>
                )}

                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    By using this service, you agree to the Gemini API's terms and pricing. Learn more at{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className={`${isDark ? 'text-[#dfec2d]' : 'text-[#dfec2d]'} hover:underline`}>
                        ai.google.dev/gemini-api/docs/billing
                    </a>.
                </p>
            </motion.div>
        </div>
    );
};


// Wrapper component to handle auth conditionally
const AppContentWithAuth: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  return <AppContentBase user={user} isAuthenticated={isAuthenticated} authLoading={authLoading} />;
};

const AppContentWithoutAuth: React.FC = () => {
  return <AppContentBase user={null} isAuthenticated={false} authLoading={false} />;
};

interface AppContentBaseProps {
  user: any;
  isAuthenticated: boolean;
  authLoading: boolean;
}

const AppContentBase: React.FC<AppContentBaseProps> = ({ user, isAuthenticated, authLoading }) => {
  // IMPORTANT: Get these values BEFORE calling useTheme() to avoid initialization order issues
  const envHasGeminiKey = hasEnvGeminiApiKey();
  const initialHasGeminiKey = hasGeminiApiKey();

  // ALL hooks must be called unconditionally BEFORE any early returns
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isKeyReady, setIsKeyReady] = useState<boolean>(initialHasGeminiKey);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(() => !initialHasGeminiKey);

  // Call useTheme and other hooks BEFORE any early returns
  const { toggleTheme, isDark } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showProjectSelector, setShowProjectSelector] = useState<boolean>(false);
  const loadProjectInputRef = useRef<HTMLInputElement>(null);

  // Initialize services
  const projectService = getProjectService();
  const mediaService = getMediaService();
  const usageService = getUsageService();
  const supabaseEnabled = isSupabaseConfigured();

  // Project state - now supports both localStorage and database
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [hasLoadedInitialProject, setHasLoadedInitialProject] = useState<boolean>(false);

  // Use user preferences hook for UI state management
  const userPreferences = useUserPreferences(user?.id || null);

  // Handle user preferences errors
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  useEffect(() => {
    if (userPreferences.error) {
      setPreferencesError(userPreferences.error);
      console.error('User preferences error:', userPreferences.error);
    }
  }, [userPreferences.error]);

  const [activeTab, setActiveTab] = useState<string>(() => {
    // Will be overridden by userPreferences once loaded
    return 'script';
  });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    // Will be overridden by userPreferences once loaded
    return false; // Collapsed by default for full-screen elegance
  });

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string>('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [autoProjectCreated, setAutoProjectCreated] = useState<boolean>(false); // Moved up to fix hooks order

  // --- Project State Management ---
  // Initialize with empty state - projects will be loaded from Supabase for authenticated users
  const [projectState, setProjectState] = useState<any>({
    scriptContent: null,
    scriptAnalysis: null,
    timelineClips: [],
    roadmapBlocks: [],
    ui: {
      leftWidth: 280,
      rightWidth: 300,
      timelineHeight: 220,
      zoom: 1,
      playhead: 0,
    }
  });

  const { scriptContent, scriptAnalysis, timelineClips, roadmapBlocks } = projectState;

  // Define showToast FIRST before any callbacks that depend on it
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      setToast({ id: `toast-${Date.now()}`, message, type });
      setTimeout(() => setToast(null), 3000);
  }, []);

  // --- Project Loading Functions ---
  const loadUserProjects = useCallback(async () => {
    if (!isAuthenticated || !user || !supabaseEnabled) return;

    setIsLoadingProjects(true);
    try {
      const { projects, error } = await projectService.getProjects(user.id);
      if (error) throw error;
      setProjectList(projects || []);
    } catch (error) {
      console.error('Failed to load user projects:', error);
      showToast('Failed to load projects', 'error');
    } finally {
      setIsLoadingProjects(false);
    }
  }, [isAuthenticated, user, supabaseEnabled, projectService]);

  // Load UI preferences when they change from database
  useEffect(() => {
    if (!userPreferences.loading && userPreferences.preferences.uiState) {
      setActiveTab(userPreferences.preferences.uiState.activeTab || 'script');
      setIsSidebarExpanded(userPreferences.preferences.uiState.isSidebarExpanded ?? true);
    }
  }, [userPreferences.loading, userPreferences.preferences.uiState]);

  // Migrate localStorage data on first load for authenticated users
  useEffect(() => {
    if (user?.id && !userPreferences.loading) {
      userPreferences.migrateFromLocalStorage();
    }
  }, [user?.id, userPreferences.loading]);

  // Load projects when user authenticates and auto-load most recent project (ONCE only)
  useEffect(() => {
    if (isAuthenticated && user && supabaseEnabled && !hasLoadedInitialProject) {
      console.log('[Auth] User authenticated, loading projects from Supabase');

      // Clear localStorage when user signs in - we'll use Supabase from now on
      localStorage.removeItem(PROJECT_STORAGE_KEY);

      loadUserProjects().then(async () => {
        // After loading project list, auto-load the most recent project
        const { projects } = await projectService.getProjects(user.id);
        if (projects && projects.length > 0) {
          // Sort by last_accessed_at and load the most recent
          const mostRecent = projects.sort((a, b) =>
            new Date(b.last_accessed_at || b.updated_at).getTime() -
            new Date(a.last_accessed_at || a.updated_at).getTime()
          )[0];

          console.log('[Auth] Auto-loading most recent project:', mostRecent.title);
          await loadProject(mostRecent);
          setHasLoadedInitialProject(true); // Prevent re-loading
        } else {
          setHasLoadedInitialProject(true); // Mark as loaded even if no projects
        }
      });
    } else if (!isAuthenticated) {
      setProjectList([]);
      setCurrentProject(null);
      setHasLoadedInitialProject(false); // Reset flag when user signs out
    }
  }, [isAuthenticated, user, supabaseEnabled, hasLoadedInitialProject, projectService]);

  // Initialize SaveManager when project changes
  useEffect(() => {
    if (currentProject && user && isSupabaseProjectId(currentProject.id)) {
      saveManager.initialize(currentProject.id, user.id);
    }
  }, [currentProject, user]);

  // Save project to database using SaveManager for optimistic updates
  const saveProject = useCallback(async (projectData?: any) => {
    const dataToSave = projectData || {
      scriptContent,
      scriptAnalysis,
      timelineClips,
    };

    // Authenticated users use SaveManager for optimistic updates
    if (supabaseEnabled && isAuthenticated && user && currentProject && isSupabaseProjectId(currentProject.id)) {
      // Use SaveManager for optimistic updates and debounced saving
      Object.entries(dataToSave).forEach(([field, value]) => {
        saveManager.updateOptimistic(field, value);
      });

      // For immediate save (e.g., manual save button)
      if (projectData === undefined) {
        // This is an auto-save, let SaveManager handle debouncing
        return;
      } else {
        // This is a manual save, save immediately
        const success = await saveManager.saveNow({ showNotification: false });
        if (!success) {
          showToast('Failed to save project to cloud', 'error');
        }
      }
    } else if (!isAuthenticated) {
      // Only use localStorage for anonymous/non-authenticated users
      console.warn('[LocalStorage] Using localStorage for anonymous user - please sign in to save to cloud');
      showToast('Sign in to save your projects to the cloud!', 'warning');
    } else {
      console.error('[Save] Invalid project state - cannot save');
      showToast('Please create a project first', 'error');
    }
  }, [scriptContent, scriptAnalysis, timelineClips, supabaseEnabled, isAuthenticated, user, currentProject, showToast]);

  // Load project from database or localStorage
  const loadProject = useCallback(async (project: Project) => {
    if (!project) return;

    setCurrentProject(project);

    // Extract project data
    const projectData = {
      scriptContent: project.script_content,
      scriptAnalysis: project.script_analysis,
      timelineClips: project.timeline_clips || [],
    };

    setProjectState(prev => ({
      ...prev,
      ...projectData,
      ui: prev.ui // Preserve UI state
    }));

    setActiveTab('script');

    // Log usage
    if (usageService && user) {
      usageService.logUsage(user.id, USAGE_ACTIONS.PROJECT_UPDATED, {
        projectId: project.id,
        metadata: { action: 'loaded_project' }
      });
    }
  }, [usageService, user]);

  // Create new project
  const createNewProject = useCallback(async (title: string = 'Untitled Project') => {
    const newProjectState = {
      scriptContent: '',
      scriptAnalysis: null,
      timelineClips: [],
      ui: { leftWidth: 280, rightWidth: 300, timelineHeight: 220, zoom: 1, playhead: 0 }
    };

    // Authenticated users create projects in Supabase database
    if (supabaseEnabled && isAuthenticated && user) {
      try {
        const { project, error } = await projectService.createProject(user.id, title);
        if (error) throw error;

        setCurrentProject(project);
        setProjectState(newProjectState);

        // Refresh project list
        await loadUserProjects();

        // Log usage
        if (usageService) {
          usageService.logUsage(user.id, USAGE_ACTIONS.PROJECT_CREATED, {
            projectId: project.id,
            metadata: { title }
          });
        }

        console.log('[Database] New project created:', project.title);
        showToast('New project created successfully!', 'success');
        return project;
      } catch (error) {
        console.error('Failed to create project:', error);
        showToast('Failed to create project in database', 'error');
        throw error; // Don't fallback - user must fix their Supabase connection
      }
    }

    // Anonymous users can use local state (but it won't persist)
    const tempProject = {
      id: `temp-${Date.now()}`,
      user_id: 'anonymous',
      title,
      script_content: '',
      script_analysis: null,
      timeline_clips: [],
      moodboard_data: null,
      project_settings: {},
      is_public: false,
      shared_with: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    };

    setCurrentProject(tempProject);
    setProjectState(newProjectState);

    console.log('[Temporary] Created temporary project (will not persist). Sign in to save!');
    showToast('Temporary project created. Sign in to save your work!', 'warning');
    return tempProject;
  }, [supabaseEnabled, isAuthenticated, user, projectService, loadUserProjects, usageService, showToast]);

  const setScriptContent = (content: string | null) => setProjectState((p: any) => ({...p, scriptContent: content}));
  // FIX: Updated setScriptAnalysis to handle functional updates, resolving multiple type errors.
  const setScriptAnalysis = (updater: React.SetStateAction<ScriptAnalysis | null>) => setProjectState((p: any) => ({...p, scriptAnalysis: typeof updater === 'function' ? updater(p.scriptAnalysis) : updater}));
  const setTimelineClips = (updater: React.SetStateAction<TimelineClip[]>) => setProjectState((p: any) => ({...p, timelineClips: typeof updater === 'function' ? updater(p.timelineClips) : updater}));
  const setRoadmapBlocks = (updater: React.SetStateAction<RoadmapBlock[]>) => setProjectState((p: any) => ({...p, roadmapBlocks: typeof updater === 'function' ? updater(p.roadmapBlocks || []) : updater}));

  // --- API Key Management ---
  useEffect(() => {
      const unsubscribe = onGeminiApiKeyChange((value) => {
          setIsKeyReady(value.length > 0);
          if (value.length > 0) {
              setIsCheckingKey(false);
          }
      });
      return unsubscribe;
  }, []);

  useEffect(() => {
      const handleKeyError = () => {
          if (envHasGeminiKey) {
              showToast("The server-configured Gemini API key appears invalid. Please update the Vercel environment variable.", 'error');
              return;
          }
          clearGeminiApiKey();
          setIsKeyReady(false);
          setIsCheckingKey(false);
          showToast("Your API key seems invalid. Please select another.", 'error');
      };
      window.addEventListener('invalid-api-key', handleKeyError);
      return () => window.removeEventListener('invalid-api-key', handleKeyError);
  }, [envHasGeminiKey, showToast]);

  // --- Saving UI state (sidebar/tab) on change ---
  useEffect(() => {
    if (user?.id) {
      // Save UI state to database for authenticated users
      userPreferences.updateUIState({
        activeTab,
        isSidebarExpanded
      });
    }
  }, [activeTab, isSidebarExpanded, user?.id]);
  
  // Convert blob URL to base64 for persistence
  const blobUrlToBase64 = async (blobUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert blob URL to base64:', error);
      return null;
    }
  };

  // Convert base64 back to blob URL for playback
  const base64ToBlobUrl = (base64: string): string => {
    try {
      const byteString = atob(base64.split(',')[1]);
      const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to convert base64 to blob URL:', error);
      return '';
    }
  };

  const getSerializableState = useCallback(async () => {
    // Create a lightweight version of the state for storage by stripping
    // out large, non-essential data like generated image variants to prevent
    // exceeding localStorage quota.
    const stateCopy = JSON.parse(JSON.stringify(projectState));

    if (stateCopy.scriptAnalysis) {
        // Strip generated variants from characters and locations, keeping the main imageUrl
        stateCopy.scriptAnalysis.characters?.forEach((c: AnalyzedCharacter) => {
            delete c.generations;
            delete c.refinedGenerationUrls;
        });
        stateCopy.scriptAnalysis.locations?.forEach((l: AnalyzedLocation) => {
            delete l.generations;
            delete l.refinedGenerationUrls;
        });

        // Strip generated variants from frames, keeping only the final selected media
        stateCopy.scriptAnalysis.scenes?.forEach((scene: AnalyzedScene) => {
            if (scene.frames) {
                scene.frames.forEach((frame: Frame) => {
                    delete frame.generations;
                    delete frame.refinedGenerationUrls;
                    delete frame.videoGenerations;
                });
            }
        });
    }

    // Convert blob URLs to base64 for timeline clips
    if (stateCopy.timelineClips && stateCopy.timelineClips.length > 0) {
      const clipConversions = stateCopy.timelineClips.map(async (clip: TimelineClip) => {
        if (clip.url && clip.url.startsWith('blob:')) {
          const base64 = await blobUrlToBase64(clip.url);
          if (base64) {
            // Don't revoke blob URL here - FramesTab still needs it for playback
            // Cleanup happens in FramesTab when clips are removed or component unmounts
            return { ...clip, url: base64, _isBlobConverted: true };
          }
        }
        return clip;
      });
      stateCopy.timelineClips = await Promise.all(clipConversions);
    }

    return stateCopy;
  }, [projectState]);


  // --- Splash Screen Management ---
  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // --- Project Management ---
  const handleNewProject = useCallback(async (skipConfirm: boolean = false) => {
    const hasExistingProject = scriptContent || scriptAnalysis;
    if (!skipConfirm && hasExistingProject && !window.confirm("Are you sure you want to start a new project? Your current project will be cleared from this browser's storage.")) {
        return;
    }

    await createNewProject('Untitled Project');
    setActiveTab('script');
  }, [scriptContent, scriptAnalysis, createNewProject]);

  const handleSaveProject = useCallback(async () => {
    await saveProject();
    showToast("Project saved successfully!");
  }, [saveProject, showToast]);

  // Download project as JSON file
  const handleDownloadProject = async () => {
      try {
        const dataToSave = await getSerializableState();
        const json = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const projectTitle = scriptAnalysis?.title || 'Untitled_Project';
        const sanitizedTitle = projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.alkemy.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Project downloaded successfully!");
      } catch(e) {
          console.error("Failed to download project", e);
          showToast("Failed to download project.", 'error');
      }
  };

  // Load project from JSON file
  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.alkemy.json')) {
          showToast("Please select a valid .alkemy.json file.", 'error');
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const loadedData = JSON.parse(e.target?.result as string);

              if (window.confirm(`Load project "${loadedData.scriptAnalysis?.title || 'Untitled'}"? Your current project will be replaced.`)) {
                  // Convert base64 back to blob URLs for timeline clips
                  if (loadedData.timelineClips && loadedData.timelineClips.length > 0) {
                    loadedData.timelineClips = loadedData.timelineClips.map((clip: any) => {
                      if (clip._isBlobConverted && clip.url && clip.url.startsWith('data:')) {
                        return { ...clip, url: base64ToBlobUrl(clip.url), _isBlobConverted: undefined };
                      }
                      return clip;
                    });
                  }

                  if (loadedData.scriptAnalysis && !loadedData.scriptAnalysis.moodboardTemplates) {
                      loadedData.scriptAnalysis.moodboardTemplates = createDefaultMoodboardTemplates();
                  }
                  setProjectState(loadedData);

                  // Don't save to localStorage here - let auto-save handle it with proper serialization
                  // This prevents saving blob URLs (which are created above) instead of base64

                  // Clear command history when loading a new project
                  commandHistory.clear();

                  showToast("Project loaded successfully!");
                  setActiveTab('script');
              }
          } catch(error) {
              console.error("Failed to load project", error);
              showToast("Failed to load project. File may be corrupted.", 'error');
          }
      };
      reader.onerror = () => showToast("Failed to read file.", 'error');
      reader.readAsText(file);

      // Reset input so same file can be loaded again
      if (event.target) event.target.value = '';
  };

  // Trigger load project from WelcomeScreen
  const handleLoadProjectFromWelcome = () => {
      loadProjectInputRef.current?.click();
  };

  // Load demo project (creates a temporary project with demo data)
  const handleTryDemo = async () => {
      const demoData = DEMO_PROJECT_DATA();
      const demoState = {
          scriptContent: DEMO_SCRIPT,
          scriptAnalysis: demoData,
          timelineClips: [],
          ui: { leftWidth: 280, rightWidth: 300, timelineHeight: 220, zoom: 1, playhead: 0 }
      };

      if (supabaseEnabled && isAuthenticated && user) {
        // Create actual project in database with demo data
        try {
          const { project, error } = await projectService.createProject(user.id, 'Demo: The Inheritance');
          if (error) throw error;

          setCurrentProject(project);
          setProjectState(demoState);

          // Save demo data to the project
          await projectService.saveProjectData(project.id, demoState);

          // Refresh project list
          await loadUserProjects();

          console.log('[Database] Demo project created in database');
          showToast("Demo project loaded! Explore all features with sample data.", 'success');
        } catch (error) {
          console.error('Failed to create demo project:', error);
          showToast('Failed to create demo project', 'error');
        }
      } else {
        // Anonymous users get temporary demo project
        const tempDemoProject = {
          id: `demo-${Date.now()}`,
          user_id: 'anonymous',
          title: 'Demo: The Inheritance',
          script_content: DEMO_SCRIPT,
          script_analysis: demoData,
          timeline_clips: [],
          moodboard_data: null,
          project_settings: {},
          is_public: false,
          shared_with: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        };

        setCurrentProject(tempDemoProject);
        setProjectState(demoState);
        setActiveTab('script');

        console.log('[Temporary] Demo project loaded (will not persist). Sign in to save!');
        showToast("Demo project loaded! Sign in to save your changes.", 'warning');
      }
  };

  // Auto-save to database or localStorage every 2 minutes
  useEffect(() => {
      const autoSaveInterval = setInterval(async () => {
          try {
              await saveProject();
              console.log(`[Auto-save] Project saved to ${supabaseEnabled && isAuthenticated ? 'database' : 'localStorage'}`);
          } catch(e) {
              console.error('[Auto-save] Failed:', e);
              if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                console.warn('[Auto-save] Storage quota exceeded');
              }
          }
      }, 120000); // 2 minutes

      return () => clearInterval(autoSaveInterval);
  }, [saveProject, supabaseEnabled, isAuthenticated]);

  // Keyboard shortcuts for power users
  useKeyboardShortcuts({
      onNewProject: () => handleNewProject(false),
      onSaveProject: handleSaveProject,
      onLoadProject: () => {
        if (isAuthenticated) {
          setShowProjectSelector(true);
        }
      },
      onTabSwitch: (tabIndex: number) => {
          if (tabIndex < TABS.length) {
              setActiveTab(TABS[tabIndex].id);
          }
      }
  });

  // Show welcome screen if no project exists
  // FIX: Check for actual content, not just non-null values
  // Also handle authenticated user redirect - they should always have a project
  // For authenticated users, having a currentProject object means they have an active project
  const hasActiveProject = currentProject || (scriptContent !== null && scriptContent !== '') || scriptAnalysis;

  const handleScriptUpdate = (content: string | null) => {
    setScriptContent(content);
    if (content === null) {
      setScriptAnalysis(null);
      setAnalysisError(null);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!scriptContent) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setScriptAnalysis(null);
    setAnalysisMessage('Analyzing script...');
    try {
        const analysisResult = await analyzeScript(scriptContent, (message) => {
            setAnalysisMessage(message);
        });
        
        const initialMoodboard: Moodboard = {
          cinematography: { notes: '', items: [] },
          color: { notes: '', items: [] },
          style: { notes: '', items: [] },
          other: { notes: '', items: [] },
        };
        const initialTemplates = analysisResult.moodboardTemplates && analysisResult.moodboardTemplates.length > 0
          ? analysisResult.moodboardTemplates
          : createDefaultMoodboardTemplates();

        setScriptAnalysis({ ...analysisResult, moodboard: initialMoodboard, moodboardTemplates: initialTemplates });

    } catch (error) {
        console.error('Failed to analyze script:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setAnalysisError(errorMessage);
        setScriptAnalysis(null);
    } finally {
        setIsAnalyzing(false);
    }
  }, [scriptContent]);

  const handleAddScene = () => {
    setScriptAnalysis((prev: ScriptAnalysis | null) => {
        const currentAnalysis = prev ?? createEmptyScriptAnalysis();
        const newSceneNumber = currentAnalysis.scenes.length + 1;
        const newScene: AnalyzedScene = {
          id: `scene-${Date.now()}`,
          sceneNumber: newSceneNumber,
          setting: `New Scene ${newSceneNumber}`,
          summary: 'A new scene added by the user.',
          frames: [],
          wardrobeByCharacter: {},
          setDressingItems: [],
        };
        return {
            ...currentAnalysis,
            scenes: [...currentAnalysis.scenes, newScene],
        };
    });
  };

  const handleSetCharacters = (updater: React.SetStateAction<AnalyzedCharacter[]>) => {
    setScriptAnalysis((prev: ScriptAnalysis | null) => {
        const currentAnalysis = prev ?? createEmptyScriptAnalysis();
        const newCharacters = typeof updater === 'function' ? updater(currentAnalysis.characters) : updater;
        return { ...currentAnalysis, characters: newCharacters };
    });
  };

  const handleSetLocations = (updater: React.SetStateAction<AnalyzedLocation[]>) => {
    setScriptAnalysis((prev: ScriptAnalysis | null) => {
        const currentAnalysis = prev ?? createEmptyScriptAnalysis();
        const newLocations = typeof updater === 'function' ? updater(currentAnalysis.locations) : updater;
        return { ...currentAnalysis, locations: newLocations };
    });
  };
  
  const handleSetMoodboard = (updater: React.SetStateAction<Moodboard | undefined>) => {
    setScriptAnalysis((prev: ScriptAnalysis | null) => {
        if (!prev) return null;
        const newMoodboard = typeof updater === 'function' ? updater(prev.moodboard) : updater;
        return { ...prev, moodboard: newMoodboard };
    });
  };

  const handleSetMoodboardTemplates = (updater: React.SetStateAction<MoodboardTemplate[]>) => {
    setScriptAnalysis((prev: ScriptAnalysis | null) => {
        if (!prev) return null;
        const nextTemplates = typeof updater === 'function' ? updater(prev.moodboardTemplates || []) : updater;
        return { ...prev, moodboardTemplates: nextTemplates };
    });
  };

  const handleTransferToTimeline = useCallback(async (frame: Frame, scene: AnalyzedScene) => {
    if (frame.transferredToTimeline) return;

    const url = frame.media?.video_upscaled_url;
    if (!url) {
        console.error("Frame has no upscaled video URL to transfer.");
        return;
    }

    const duration = await getVideoDuration(url);
    const newClip: TimelineClip = {
        id: frame.id,
        timelineId: `clip-${frame.id}-${Date.now()}`,
        sceneNumber: scene.sceneNumber,
        shot_number: frame.shot_number,
        description: frame.description,
        url: url,
        sourceDuration: duration,
        trimStart: 0,
        trimEnd: duration,
    };

    setTimelineClips((prev: TimelineClip[]) => [...prev, newClip]);

    setScriptAnalysis((prev: ScriptAnalysis | null) => {
        if (!prev) return null;
        return {
            ...prev,
            scenes: prev.scenes.map(s => s.id === scene.id
                ? { ...s, frames: (s.frames || []).map(f => f.id === frame.id ? { ...f, transferredToTimeline: true } : f) }
                : s
            )
        };
    });
  }, []);

  const handleTransferAllToTimeline = useCallback(async () => {
    if (!scriptAnalysis) return;

    const clipsToTransfer: { frame: Frame; scene: AnalyzedScene }[] = [];
    scriptAnalysis.scenes.forEach(scene => {
        (scene.frames || []).forEach(frame => {
            if (frame.status === FrameStatus.UpscaledVideoReady && !frame.transferredToTimeline && frame.media?.video_upscaled_url) {
                clipsToTransfer.push({ frame, scene });
            }
        });
    });

    if (clipsToTransfer.length === 0) {
        alert("No new upscaled video shots to transfer.");
        return;
    }

    const newTimelineClips: TimelineClip[] = [];
    const transferredFrameIds: { [sceneId: string]: string[] } = {};

    for (const { frame, scene } of clipsToTransfer) {
        const duration = await getVideoDuration(frame.media!.video_upscaled_url!);
        newTimelineClips.push({
            id: frame.id,
            timelineId: `clip-${frame.id}-${Date.now()}`,
            sceneNumber: scene.sceneNumber,
            shot_number: frame.shot_number,
            description: frame.description,
            url: frame.media!.video_upscaled_url!,
            sourceDuration: duration,
            trimStart: 0,
            trimEnd: duration,
        });

        if (!transferredFrameIds[scene.id]) {
            transferredFrameIds[scene.id] = [];
        }
        transferredFrameIds[scene.id].push(frame.id);
    }

    setTimelineClips((prev: TimelineClip[]) => [...prev, ...newTimelineClips]);

    setScriptAnalysis((prev: ScriptAnalysis | null) => {
        if (!prev) return null;
        return {
            ...prev,
            scenes: prev.scenes.map(scene => {
                if (transferredFrameIds[scene.id]) {
                    return {
                        ...scene,
                        frames: (scene.frames || []).map(frame =>
                            transferredFrameIds[scene.id].includes(frame.id)
                                ? { ...frame, transferredToTimeline: true }
                                : frame
                        )
                    };
                }
                return scene;
            })
        };
    });
  }, [scriptAnalysis]);
  
  const handleAddNewVideoClip = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    const duration = await getVideoDuration(url);
    const newClip: TimelineClip = {
        id: `external-${Date.now()}`,
        timelineId: `clip-external-${Date.now()}`,
        sceneNumber: null,
        shot_number: null,
        description: file.name,
        url: url,
        sourceDuration: duration,
        trimStart: 0,
        trimEnd: duration,
    };
    setTimelineClips((prev: TimelineClip[]) => [...prev, newClip]);
  }, []);


  // If authenticated user has no active project, create one for them automatically
  useEffect(() => {
    if (isAuthenticated && !hasActiveProject && !autoProjectCreated && isKeyReady) {
      console.log('[Auth] Creating new project for authenticated user');
      setAutoProjectCreated(true);
      createNewProject('Untitled Project');
    }
  }, [isAuthenticated, hasActiveProject, autoProjectCreated, isKeyReady, createNewProject]);

  const renderContent = () => {
    switch (activeTab) {
      case 'script':
        return <ScriptTab
                  scriptContent={scriptContent}
                  analysis={scriptAnalysis}
                  onScriptUpdate={handleScriptUpdate}
                  isAnalyzing={isAnalyzing}
                  analysisError={analysisError}
                  analysisMessage={analysisMessage}
                  onAnalyze={handleAnalyze}
                />;
      case 'moodboard':
        return <MoodboardTab
                  moodboardTemplates={scriptAnalysis?.moodboardTemplates || []}
                  onUpdateMoodboardTemplates={handleSetMoodboardTemplates}
                  scriptAnalyzed={!!scriptAnalysis}
                />;
      case 'presentation':
        return <PresentationTab scriptAnalysis={scriptAnalysis} />;
      case 'cast_locations':
        return <CastLocationsTab
                  characters={scriptAnalysis?.characters || []}
                  setCharacters={handleSetCharacters}
                  locations={scriptAnalysis?.locations || []}
                  setLocations={handleSetLocations}
                  moodboard={scriptAnalysis?.moodboard}
                  moodboardTemplates={scriptAnalysis?.moodboardTemplates || []}
                />;
      case '3d_worlds':
        return <ThreeDWorldsTab scriptAnalysis={scriptAnalysis} />;
      case 'compositing':
        return <CompositingTab
                  scriptAnalysis={scriptAnalysis}
                  onUpdateAnalysis={setScriptAnalysis}
                  onAddScene={handleAddScene}
                  onTransferToTimeline={handleTransferToTimeline}
                  onTransferAllToTimeline={handleTransferAllToTimeline}
                  onBack={() => setActiveTab('script')}
                  currentProject={currentProject}
                  user={user}
                />;
      case 'timeline':
        return <FramesTab
                  clips={timelineClips}
                  onUpdateClips={setTimelineClips}
                  onAddNewVideoClip={handleAddNewVideoClip}
                  projectState={projectState}
                  onUpdateProjectState={setProjectState}
                  onSave={handleSaveProject}
                />;
      case 'wan_transfer':
        return <WanTransferTab scriptAnalysis={scriptAnalysis} />;
      case 'post_production':
        return <PostProductionTab />;
      case 'exports':
        return <ExportsTab timelineClips={timelineClips} />;
      case 'analytics':
        return <AnalyticsTab scriptAnalysis={scriptAnalysis} projectId={currentProject?.id || 'temp'} />;
      case 'bmad_status':
        return <BMADStatusTab />;
      case 'roadmap':
        return <RoadmapTab blocks={roadmapBlocks || []} onUpdateBlocks={setRoadmapBlocks} />;
      default:
        return <ScriptTab
                  scriptContent={scriptContent}
                  analysis={scriptAnalysis}
                  onScriptUpdate={handleScriptUpdate}
                  isAnalyzing={isAnalyzing}
                  analysisError={analysisError}
                  analysisMessage={analysisMessage}
                  onAnalyze={handleAnalyze}
                />;
    }
  };

  // Early returns AFTER all hooks have been declared
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (authLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-[#0B0B0B]">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-t-transparent border-[#dfec2d] rounded-full"
            />
        </div>
    );
  }

  // Error boundary for user preferences
  if (preferencesError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0B0B0B]">
        <div className="text-center p-8 max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Configuration Error</h2>
            <p className="text-gray-400 mb-4">Unable to load user preferences. This might be a temporary issue.</p>
            <div className="bg-gray-800 rounded-lg p-3 mb-4 text-left">
              <p className="text-gray-300 text-sm font-mono">{preferencesError}</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-[#dfec2d] text-white rounded-lg hover:bg-[#b3e617] transition-colors"
            >
              Reload Application
            </button>
            <button
              onClick={() => setPreferencesError(null)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCheckingKey) {
    return (
        <div className="flex items-center justify-center h-screen bg-[#0B0B0B]">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-t-transparent border-[#dfec2d] rounded-full"
            />
        </div>
    );
  }

  if (!isKeyReady) {
    return <ApiKeyPrompt onKeySelected={async () => {
      setIsCheckingKey(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 150));
        if (hasGeminiApiKey()) {
          setIsKeyReady(true);
          return;
        }
        const aistudio = window.aistudio;
        if (aistudio?.hasSelectedApiKey && await aistudio.hasSelectedApiKey()) {
          if (hasGeminiApiKey()) {
            setIsKeyReady(true);
            return;
          }
        }
        setIsKeyReady(false);
      } catch (error) {
        console.warn('Could not verify Gemini API key', error);
        setIsKeyReady(false);
      } finally {
        setIsCheckingKey(false);
      }
    }} isDark={isDark} />;
  }

  if (!hasActiveProject) {
    // Show WelcomeScreen for non-authenticated users or while project is being created
    return (
      <>
        <WelcomeScreen
          onStartNewProject={() => handleNewProject(true)}
          onLoadProject={handleLoadProjectFromWelcome}
          onTryDemo={handleTryDemo}
          onSignIn={() => {
            setAuthModalMode('login');
            setShowAuthModal(true);
          }}
          onSignUp={() => {
            setAuthModalMode('register');
            setShowAuthModal(true);
          }}
          isAuthenticated={isAuthenticated}
          showAuth={supabaseEnabled}
        />
        {/* Hidden file input for loading projects */}
        <input
          ref={loadProjectInputRef}
          type="file"
          accept=".alkemy.json"
          onChange={handleLoadProject}
          className="hidden"
        />

        {/* Auth Modal - Show on welcome screen if needed */}
        {supabaseEnabled && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode={authModalMode}
            onSuccess={async () => {
              setShowAuthModal(false);
              showToast('Successfully signed in!', 'success');
              // Project will be auto-created by the useEffect above
            }}
          />
        )}
      </>
    );
  }


const activeTabMeta = TABS.find(tab => tab.id === activeTab);
const activePhase = TABS_CONFIG.find(section => section.tabs.some(tab => tab.id === activeTab))?.name ?? 'Workspace';

return (
  <div className="relative flex min-h-screen overflow-hidden bg-[var(--color-background-primary)]">
    <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#dfec2d]/10 blur-3xl" />
    <div className="pointer-events-none absolute bottom-0 right-[-10%] h-[420px] w-[420px] rounded-full bg-[#dfec2d]/10 blur-3xl" />

    <Sidebar
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isSidebarExpanded={isSidebarExpanded}
      setIsSidebarExpanded={setIsSidebarExpanded}
      onNewProject={handleNewProject}
    />

    <div className="relative flex flex-1 flex-col">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="sticky top-0 z-30 border-b border-[var(--color-border-color)] bg-[var(--color-background-primary)]/95 backdrop-blur-xl text-[var(--color-text-primary)] shadow-lg shadow-black/10"
      >
        <div className="flex items-center justify-between gap-6 px-8 py-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">{activeTabMeta?.name ?? 'Alkemy AI Studio'}</h1>
              {scriptAnalysis?.title && (
                <span className="rounded-full px-3 py-1 text-xs font-medium border border-[var(--color-border-color)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)]">
                  {scriptAnalysis.title}
                </span>
              )}
            </div>
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--color-text-tertiary)]">{activePhase}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-[var(--color-surface-card)] text-[var(--color-text-secondary)]">
              <motion.span
                animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex h-2 w-2 rounded-full bg-[#dfec2d] shadow-[0_0_12px_rgba(223,236,45,0.8)]"
              />
              <span className="text-xs font-medium uppercase tracking-[0.3em]">Live Sync</span>
            </div>

            <motion.button
              onClick={() => setActiveTab('roadmap')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all border border-[var(--color-border-color)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] hover:border-[#dfec2d]/40 hover:text-[var(--color-text-primary)] hover:shadow-lg hover:shadow-[#dfec2d]/20"
              title="Roadmap"
            >
              <RoadmapIcon className="h-5 w-5" />
            </motion.button>

            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all border border-[var(--color-border-color)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] hover:border-[#dfec2d]/40 hover:text-[var(--color-text-primary)] hover:shadow-lg hover:shadow-[#dfec2d]/20"
            >
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
            </motion.button>

            {/* User Menu or Sign In - Only show if Supabase is configured */}
            {isSupabaseConfigured() && (
              isAuthenticated ? (
                <UserMenu
                  onProfileClick={() => console.log('Profile clicked')}
                  onSettingsClick={() => console.log('Settings clicked')}
                  onProjectsClick={() => setShowProjectSelector(true)}
                />
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    setAuthModalMode('login');
                    setShowAuthModal(true);
                  }}
                  className="!py-2"
                >
                  Sign In
                </Button>
              )
            )}
          </div>
        </div>
      </motion.header>

      <main className="relative flex-1 overflow-hidden bg-[var(--color-background-secondary)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(223,236,45,0.06),_transparent_55%)]" />
        <div className="relative h-full w-full overflow-y-auto">
          <div className="mx-auto w-full max-w-[1920px] px-8 py-10 min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-[var(--color-text-primary)]"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>

    <DirectorWidget scriptAnalysis={scriptAnalysis} setScriptAnalysis={setScriptAnalysis} />
    <Toast toast={toast} onClose={() => setToast(null)} />

    {/* Auth Modal - Only render if Supabase is configured */}
    {isSupabaseConfigured() && (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        onSuccess={async () => {
          setShowAuthModal(false);
          showToast('Successfully signed in!', 'success');
          // If user doesn't have an active project, create one
          if (!hasActiveProject) {
            await createNewProject('Untitled Project');
          }
        }}
      />
    )}

    {/* Project Selector Modal */}
    <ProjectSelectorModal
      isOpen={showProjectSelector}
      onClose={() => setShowProjectSelector(false)}
      onSelectProject={loadProject}
      currentProjectId={currentProject?.id}
    />
  </div>
);
};

// Simplified - no protected routes needed


// Main App wrapper with proper provider hierarchy
const AppWithProviders: React.FC = () => {
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <ThemeProvider>
      {supabaseConfigured ? (
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/app" element={<AppContentWithAuth />} />
            {/* <Route path="/generation" element={<GenerationPage />} /> */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
          </Routes>
        </AuthProvider>
      ) : (
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/app" element={<AppContentWithoutAuth />} />
          {/* <Route path="/generation" element={<GenerationPage />} /> */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      )}
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return <AppWithProviders />;
};

export default App;
