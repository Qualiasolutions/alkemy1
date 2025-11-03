
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { TABS, THEME_COLORS } from './constants';
import ScriptTab from './tabs/ScriptTab';
import MoodboardTab from './tabs/MoodboardTab';
import PresentationTab from './tabs/PresentationTab';
import CastLocationsTab from './tabs/CastLocationsTab';
import CompositingTab from './tabs/SceneAssemblerTab';
import FramesTab from './tabs/FramesTab';
import WanTransferTab from './tabs/WanTransferTab';
import PostProductionTab from './tabs/PostProductionTab';
import ExportsTab from './tabs/ExportsTab';
import SocialSpotsTab from './tabs/SocialSpotsTab';
import SchedulerTab from './tabs/SchedulerTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import { ScriptAnalysis, AnalyzedScene, Frame, FrameStatus, AnalyzedCharacter, AnalyzedLocation, Moodboard, TimelineClip } from './types';
import { analyzeScript } from './services/aiService';
import TheDirectorTab from './tabs/TheDirectorTab';
import Button from './components/Button';

const ENV_GEMINI_API_KEY = (process.env.API_KEY ?? '').trim();
const HAS_ENV_GEMINI_KEY = ENV_GEMINI_API_KEY.length > 0;

const UI_STATE_STORAGE_KEY = 'alkemy_ai_studio_ui_state';
const PROJECT_STORAGE_KEY = 'alkemy_ai_studio_project_data_v2'; // v2 to avoid conflicts with old state structure

const getVideoDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
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
        <div className="flex items-center justify-center h-screen bg-[#121212]">
            <div className={`bg-[${THEME_COLORS.surface_card}] border border-[${THEME_COLORS.border_color}] rounded-2xl p-10 text-center max-w-lg shadow-2xl`}>
                <h2 className="text-3xl font-bold mb-4">Alkemy AI Studio</h2>
                <p className={`text-lg text-[${THEME_COLORS.text_secondary}] mb-6`}>
                    To begin, please select your Gemini API key. This key will be used for all generative AI features within the studio.
                </p>
                <Button onClick={handleSelectKey} variant="primary" className="w-full !py-3 !text-base">
                    Select Gemini API Key
                </Button>
                <p className="text-xs text-gray-500 mt-4">
                    By using this service, you agree to the Gemini API's terms and pricing. For more information on billing, please visit{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                        ai.google.dev/gemini-api/docs/billing
                    </a>.
                </p>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
        const saved = localStorage.getItem(UI_STATE_STORAGE_KEY);
        return saved ? JSON.parse(saved).activeTab : 'script';
    } catch { return 'script'; }
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [isKeyReady, setIsKeyReady] = useState<boolean>(() => HAS_ENV_GEMINI_KEY);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(() => !HAS_ENV_GEMINI_KEY);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
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
  
  const getSerializableState = useCallback(() => {
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

    return stateCopy;
  }, [projectState]);


  // --- Project Management ---
  const handleNewProject = () => {
    if (window.confirm("Are you sure you want to start a new project? Your current project will be cleared from this browser's storage.")) {
        const defaultState = {
            scriptContent: null, scriptAnalysis: null, timelineClips: [], 
            ui: { leftWidth: 280, rightWidth: 300, timelineHeight: 220, zoom: 1, playhead: 0 }
        };
        setProjectState(defaultState);
        setActiveTab('script');
        try {
            localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(defaultState));
        } catch (e) {
            console.error("Failed to clear project from storage", e);
        }
        showToast("New project started.");
    }
  };
  
  const handleSaveProject = () => {
      try {
        const dataToSave = getSerializableState();
        localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(dataToSave));
        showToast("Project saved successfully!");
      } catch(e) {
          console.error("Failed to save project", e);
          showToast("Failed to save project.", 'error');
      }
  };


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
      case 'the_director':
        return <TheDirectorTab scriptAnalysis={scriptAnalysis} />;
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
        return <ExportsTab />;
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

  if (isCheckingKey) {
    return (
        <div className="flex items-center justify-center h-screen bg-[#121212]">
            <div className="w-12 h-12 border-4 border-t-transparent border-teal-500 rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!isKeyReady) {
    return <ApiKeyPrompt onKeySelected={() => setIsKeyReady(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#0B0B0B] text-[#FFFFFF]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onNewProject={handleNewProject}
      />
      <main className="relative flex-1 overflow-y-auto p-8 bg-[#121212]">
        <div className="max-w-7xl mx-auto h-full">
          {renderContent()}
        </div>
      </main>
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-5 py-3 rounded-lg shadow-2xl text-white font-semibold transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;
