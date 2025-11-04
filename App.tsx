
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import Sidebar from './components/Sidebar';
import DirectorWidget from './components/DirectorWidget';
import SplashScreen from './components/SplashScreen';
import WelcomeScreen from './components/WelcomeScreen';
import { TABS } from './constants';
import { SunIcon, MoonIcon } from './components/icons/Icons';
import ScriptTab from './tabs/ScriptTab';
import MoodboardTab from './tabs/MoodboardTab';
import PresentationTab from './tabs/PresentationTab';
import CastLocationsTab from './tabs/CastLocationsTab';
import CompositingTab from './tabs/SceneAssemblerTab';
import FramesTab from './tabs/FramesTab.simple';
import WanTransferTab from './tabs/WanTransferTab';
import PostProductionTab from './tabs/PostProductionTab';
import ExportsTab from './tabs/ExportsTab';
import SocialSpotsTab from './tabs/SocialSpotsTab';
import SchedulerTab from './tabs/SchedulerTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import { ScriptAnalysis, AnalyzedScene, Frame, FrameStatus, AnalyzedCharacter, AnalyzedLocation, Moodboard, TimelineClip } from './types';
import { analyzeScript } from './services/aiService';
import { commandHistory } from './services/commandHistory';
import Button from './components/Button';
import { DEMO_PROJECT_DATA, DEMO_SCRIPT } from './data/demoProject';
import Toast, { ToastMessage } from './components/Toast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const ENV_GEMINI_API_KEY = (process.env.GEMINI_API_KEY ?? process.env.API_KEY ?? '').trim();
const HAS_ENV_GEMINI_KEY = ENV_GEMINI_API_KEY.length > 0;

const UI_STATE_STORAGE_KEY = 'alkemy_ai_studio_ui_state';
const PROJECT_STORAGE_KEY = 'alkemy_ai_studio_project_data_v2'; // v2 to avoid conflicts with old state structure

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
    props: [], styling: [], setDressing: [], makeupAndHair: [], sound: []
});

const ApiKeyPrompt: React.FC<{ onKeySelected: () => void }> = ({ onKeySelected }) => {
    const { colors, isDark } = useTheme();

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // As per guidelines, assume success after the dialog is invoked.
            onKeySelected();
        } else {
            alert("API key selection utility is not available in this environment.");
        }
    };

    return (
        <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-[#0B0B0B]' : 'bg-[#FFFFFF]'}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`${isDark ? 'bg-[#161616] border-[#2A2A2A]' : 'bg-white border-[#D4D4D4]'} border rounded-2xl p-10 text-center max-w-lg shadow-2xl`}
            >
                <h2 className="text-3xl font-bold mb-4">Alkemy AI Studio</h2>
                <p className={`text-lg ${isDark ? 'text-[#A0A0A0]' : 'text-[#505050]'} mb-6`}>
                    To begin, please select your Gemini API key. This key will be used for all generative AI features within the studio.
                </p>
                <Button onClick={handleSelectKey} variant="primary" className="w-full !py-3 !text-base">
                    Select Gemini API Key
                </Button>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mt-4`}>
                    By using this service, you agree to the Gemini API's terms and pricing. For more information on billing, please visit{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className={`${isDark ? 'text-teal-400' : 'text-teal-600'} hover:underline`}>
                        ai.google.dev/gemini-api/docs/billing
                    </a>.
                </p>
            </motion.div>
        </div>
    );
};


const AppContent: React.FC = () => {
  const { colors, toggleTheme, isDark } = useTheme();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const loadProjectInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(UI_STATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved).activeTab;
        if (typeof parsed === 'string' && TABS.some(tab => tab.id === parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load active tab from storage", e);
    }
    return 'script';
  });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    try {
        const saved = localStorage.getItem(UI_STATE_STORAGE_KEY);
        return saved ? JSON.parse(saved).isSidebarExpanded : true;
    } catch { return true; }
  });
  
  // --- Project State Hydration ---
  const [projectState, setProjectState] = useState<any>(() => {
    try {
      const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to load project from storage", e);
    }
    // Default initial state
    return {
      scriptContent: null,
      scriptAnalysis: null,
      timelineClips: [],
      ui: {
        leftWidth: 280,
        rightWidth: 300,
        timelineHeight: 220,
        zoom: 1,
        playhead: 0,
      }
    };
  });
  
  const { scriptContent, scriptAnalysis, timelineClips } = projectState;
  
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string>('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [isKeyReady, setIsKeyReady] = useState<boolean>(() => HAS_ENV_GEMINI_KEY);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(() => !HAS_ENV_GEMINI_KEY);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      setToast({ id: `toast-${Date.now()}`, message, type });
      setTimeout(() => setToast(null), 3000);
  }, []);
  
  const setScriptContent = (content: string | null) => setProjectState((p: any) => ({...p, scriptContent: content}));
  // FIX: Updated setScriptAnalysis to handle functional updates, resolving multiple type errors.
  const setScriptAnalysis = (updater: React.SetStateAction<ScriptAnalysis | null>) => setProjectState((p: any) => ({...p, scriptAnalysis: typeof updater === 'function' ? updater(p.scriptAnalysis) : updater}));
  const setTimelineClips = (updater: React.SetStateAction<TimelineClip[]>) => setProjectState((p: any) => ({...p, timelineClips: typeof updater === 'function' ? updater(p.timelineClips) : updater}));


  // --- API Key Management ---
    useEffect(() => {
        if (HAS_ENV_GEMINI_KEY) {
            setIsKeyReady(true);
            setIsCheckingKey(false);
            return;
        }

        const checkApiKey = async () => {
            setIsCheckingKey(true);
            try {
                if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                    setIsKeyReady(true);
                }
            } catch (e) {
                console.warn("Could not check for API key:", e);
                setIsKeyReady(false);
            } finally {
                setIsCheckingKey(false);
            }
        };

        const timer = window.setTimeout(checkApiKey, 100); // Delay to ensure aistudio is available
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleKeyError = () => {
            if (HAS_ENV_GEMINI_KEY) {
                showToast("The server-configured Gemini API key appears invalid. Please update the Vercel environment variable.", 'error');
                return;
            }
            setIsKeyReady(false);
            showToast("Your API key seems invalid. Please select another.", 'error');
        };
        window.addEventListener('invalid-api-key', handleKeyError);
        return () => window.removeEventListener('invalid-api-key', handleKeyError);
    }, [showToast]);

  // --- Saving UI state (sidebar/tab) on change ---
  useEffect(() => {
    try {
      const uiState = { activeTab, isSidebarExpanded };
      localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(uiState));
    } catch (e) { console.error("Failed to save UI state to storage", e); }
  }, [activeTab, isSidebarExpanded]);
  
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
  const handleNewProject = (skipConfirm: boolean = false) => {
    const hasExistingProject = scriptContent || scriptAnalysis;
    if (!skipConfirm && hasExistingProject && !window.confirm("Are you sure you want to start a new project? Your current project will be cleared from this browser's storage.")) {
        return;
    }

    const defaultState = {
        scriptContent: '', // Empty string instead of null to trigger app render
        scriptAnalysis: null,
        timelineClips: [],
        ui: { leftWidth: 280, rightWidth: 300, timelineHeight: 220, zoom: 1, playhead: 0 }
    };
    setProjectState(defaultState);
    setActiveTab('script');
    try {
        localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(defaultState));
    } catch (e) {
        console.error("Failed to clear project from storage", e);
    }
    if (hasExistingProject || skipConfirm) {
        showToast("New project started.");
    }
  };
  
  const handleSaveProject = async () => {
      try {
        const dataToSave = await getSerializableState();
        localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(dataToSave));
        showToast("Project saved successfully!");
      } catch(e) {
          console.error("Failed to save project", e);
          if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            showToast("Storage quota exceeded. Try removing some clips or clearing browser data.", 'error');
          } else {
            showToast("Failed to save project.", 'error');
          }
      }
  };

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

  // Load demo project
  const handleTryDemo = () => {
      const demoData = DEMO_PROJECT_DATA();
      const demoState = {
          scriptContent: DEMO_SCRIPT,
          scriptAnalysis: demoData,
          timelineClips: [],
          ui: { leftWidth: 280, rightWidth: 300, timelineHeight: 220, zoom: 1, playhead: 0 }
      };
      setProjectState(demoState);
      setActiveTab('script');
      try {
          localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(demoState));
      } catch (e) {
          console.error("Failed to save demo project", e);
      }
      showToast("Demo project loaded! Explore all features with sample data.", 'success');
  };

  // Auto-save to localStorage every 2 minutes
  useEffect(() => {
      const autoSaveInterval = setInterval(async () => {
          try {
              const dataToSave = await getSerializableState();
              localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(dataToSave));
              console.log('[Auto-save] Project saved to localStorage');
          } catch(e) {
              console.error('[Auto-save] Failed:', e);
              if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                console.warn('[Auto-save] Storage quota exceeded');
              }
          }
      }, 120000); // 2 minutes

      return () => clearInterval(autoSaveInterval);
  }, [getSerializableState]);

  // Keyboard shortcuts for power users
  useKeyboardShortcuts({
      onNewProject: () => handleNewProject(false),
      onSaveProject: handleSaveProject,
      onLoadProject: handleLoadProjectFromWelcome,
      onTabSwitch: (tabIndex: number) => {
          if (tabIndex < TABS.length) {
              setActiveTab(TABS[tabIndex].id);
          }
      }
  });

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

        setScriptAnalysis({ ...analysisResult, moodboard: initialMoodboard });

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
                  moodboard={scriptAnalysis?.moodboard}
                  onUpdateMoodboard={handleSetMoodboard}
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
                />;
      case 'compositing':
        return <CompositingTab 
                  scriptAnalysis={scriptAnalysis}
                  onUpdateAnalysis={setScriptAnalysis}
                  onAddScene={handleAddScene}
                  onTransferToTimeline={handleTransferToTimeline}
                  onTransferAllToTimeline={handleTransferAllToTimeline}
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
      case 'social_spots':
        return <SocialSpotsTab />;
      case 'scheduler':
        return <SchedulerTab />;
      case 'analytics':
        return <AnalyticsTab />;
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

  // Show splash screen on initial load
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (isCheckingKey) {
    return (
        <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-[#0B0B0B]' : 'bg-[#FFFFFF]'}`}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className={`w-12 h-12 border-4 border-t-transparent ${isDark ? 'border-teal-500' : 'border-teal-600'} rounded-full`}
            />
        </div>
    );
  }

  if (!isKeyReady) {
    return <ApiKeyPrompt onKeySelected={() => setIsKeyReady(true)} />;
  }

  // Show welcome screen if no project exists
  // FIX: Check for null explicitly instead of truthy value since empty string '' is falsy
  const hasActiveProject = scriptContent !== null || scriptAnalysis;
  if (!hasActiveProject) {
    return (
      <>
        <WelcomeScreen
          onStartNewProject={() => handleNewProject(true)}
          onLoadProject={handleLoadProjectFromWelcome}
          onTryDemo={handleTryDemo}
        />
        {/* Hidden file input for loading projects */}
        <input
          ref={loadProjectInputRef}
          type="file"
          accept=".alkemy.json"
          onChange={handleLoadProject}
          className="hidden"
        />
      </>
    );
  }

  const mainBg = isDark ? 'bg-[#0B0B0B]' : 'bg-[#FFFFFF]';
  const contentBg = isDark
    ? 'bg-gradient-to-br from-[#0B0B0B] via-[#121212] to-[#0B0B0B]'
    : 'bg-gradient-to-br from-[#FFFFFF] via-[#F8F8F8] to-[#FFFFFF]';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`flex h-screen ${mainBg} ${textPrimary} relative overflow-hidden`}>
      {/* Gradient Halos */}
      <div className={`absolute top-0 left-1/4 w-96 h-96 ${isDark ? 'bg-[#10A37F]/10' : 'bg-[#0FB98D]/15'} rounded-full blur-3xl pointer-events-none`} />
      <div className={`absolute bottom-0 right-1/3 w-80 h-80 ${isDark ? 'bg-[#1AD8B1]/8' : 'bg-[#0D8F74]/12'} rounded-full blur-3xl pointer-events-none`} />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onNewProject={handleNewProject}
        onDownloadProject={handleDownloadProject}
        onLoadProject={handleLoadProject}
      />

      <main className={`relative flex-1 overflow-y-auto p-8 ${contentBg}`}>
        <div className="max-w-7xl mx-auto h-full relative z-10">
          {/* Active Surface Header */}
          <motion.header
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="flex justify-between items-center mb-6"
          >
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wider`}>Active Surface</p>
              <h2 className="text-2xl font-bold">{TABS.find(t => t.id === activeTab)?.name || 'Alkemy'}</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
                <span className={textSecondary}>Realtime sync active</span>
              </div>

              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'
                } transition-colors backdrop-blur-sm ${isDark ? 'bg-[#161616]/50' : 'bg-white/50'}`}
              >
                {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                <span className="text-sm">{isDark ? 'Light mode' : 'Dark mode'}</span>
              </motion.button>
            </div>
          </motion.header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 24, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.985 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <DirectorWidget scriptAnalysis={scriptAnalysis} />

      {/* Enhanced Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
