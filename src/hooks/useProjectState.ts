/**
 * Custom hook to manage project state and operations
 * Extracted from App.tsx to reduce complexity and improve maintainability
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Project, ScriptAnalysis, TimelineClip, RoadmapBlock } from '../types';
import { analyzeScript } from '../services/aiService';
import { getProjectService } from '../services/projectService';
import { getMediaService } from '../services/mediaService';
import { getUsageService, USAGE_ACTIONS, logAIUsage } from '../services/usageService';
import { saveManager } from '../services/saveManager';
import { userDataService } from '../services/userDataService';

const PROJECT_STORAGE_KEY = 'alkemy_ai_studio_project_data_v2';

const isSupabaseProjectId = (id?: string | null): boolean => {
    if (!id) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
};

const createEmptyScriptAnalysis = (): ScriptAnalysis => ({
    title: 'Untitled Project', logline: '', summary: '',
    scenes: [], characters: [], locations: [],
    props: [], styling: [], setDressing: [], makeupAndHair: [], sound: [],
    moodboardTemplates: []
});

export interface ProjectState {
    scriptContent: string | null;
    scriptAnalysis: ScriptAnalysis | null;
    timelineClips: TimelineClip[];
    roadmapBlocks: RoadmapBlock[];
    ui: {
        leftWidth: number;
        rightWidth: number;
        timelineHeight: number;
        zoom: number;
        playhead: number;
    };
}

interface UseProjectStateReturn {
    projectState: ProjectState;
    currentProject: Project | null;
    projectList: Project[];
    isLoadingProjects: boolean;
    hasLoadedInitialProject: boolean;
    setProjectState: React.Dispatch<React.SetStateAction<ProjectState>>;
    setCurrentProject: React.Dispatch<React.SetStateAction<Project | null>>;
    setProjectList: React.Dispatch<React.SetStateAction<Project[]>>;
    setIsLoadingProjects: React.Dispatch<React.SetStateAction<boolean>>;
    setHasLoadedInitialProject: React.Dispatch<React.SetStateAction<boolean>>;
    initializeProject: (user: any, searchParams: URLSearchParams) => Promise<void>;
    handleNewProject: () => Promise<void>;
    handleProjectSelect: (project: Project) => Promise<void>;
    handleProjectUpdate: (updates: Partial<Project>) => void;
    handleProjectDelete: (projectId: string) => Promise<void>;
    saveProject: () => Promise<void>;
    loadProjects: (userId: string) => Promise<void>;
    getSerializableState: () => any;
}

export const useProjectState = (user: any): UseProjectStateReturn => {
    const [projectState, setProjectState] = useState<ProjectState>({
        scriptContent: null,
        scriptAnalysis: null,
        timelineClips: [],
        roadmapBlocks: [],
        ui: {
            leftWidth: 400,
            rightWidth: 400,
            timelineHeight: 200,
            zoom: 1,
            playhead: 0
        }
    });

    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [projectList, setProjectList] = useState<Project[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
    const [hasLoadedInitialProject, setHasLoadedInitialProject] = useState<boolean>(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const getSerializableState = useCallback(() => {
        return {
            scriptContent: projectState.scriptContent,
            scriptAnalysis: projectState.scriptAnalysis,
            timelineClips: projectState.timelineClips,
            roadmapBlocks: projectState.roadmapBlocks,
            ui: projectState.ui
        };
    }, [projectState]);

    const loadProjects = useCallback(async (userId: string) => {
        setIsLoadingProjects(true);
        try {
            const projectService = getProjectService();
            const projects = await projectService.getUserProjects(userId);
            setProjectList(projects || []);
        } catch (error) {
            console.error('[App] Failed to load projects:', error);
        } finally {
            setIsLoadingProjects(false);
        }
    }, []);

    const handleProjectUpdate = useCallback((updates: Partial<Project>) => {
        if (!currentProject) return;

        const updatedProject = { ...currentProject, ...updates };
        setCurrentProject(updatedProject);
        setProjectList(prev =>
            prev.map(p => p.id === updatedProject.id ? updatedProject : p)
        );
    }, [currentProject]);

    const handleProjectDelete = useCallback(async (projectId: string) => {
        if (!user) return;

        try {
            const projectService = getProjectService();
            await projectService.deleteProject(projectId, user.id);

            setProjectList(prev => prev.filter(p => p.id !== projectId));

            if (currentProject?.id === projectId) {
                setCurrentProject(null);
                setProjectState({
                    scriptContent: null,
                    scriptAnalysis: null,
                    timelineClips: [],
                    roadmapBlocks: [],
                    ui: {
                        leftWidth: 400,
                        rightWidth: 400,
                        timelineHeight: 200,
                        zoom: 1,
                        playhead: 0
                    }
                });
            }
        } catch (error) {
            console.error('[App] Failed to delete project:', error);
        }
    }, [user, currentProject]);

    const saveProject = useCallback(async () => {
        if (!currentProject || !user) return;

        try {
            const projectService = getProjectService();
            await projectService.updateProject(currentProject.id, {
                script_content: projectState.scriptContent,
                script_analysis: projectState.scriptAnalysis,
                timeline_clips: projectState.timelineClips,
                moodboard_data: projectState.roadmapBlocks
            });

            handleProjectUpdate({ updated_at: new Date().toISOString() });
        } catch (error) {
            console.error('[App] Failed to save project:', error);
            throw error;
        }
    }, [currentProject, user, projectState, handleProjectUpdate]);

    const initializeProject = useCallback(async (user: any, searchParams: URLSearchParams) => {
        setIsLoadingProjects(true);

        try {
            // Load user's projects
            await loadProjects(user.id);

            // Check for specific project in URL
            const projectId = searchParams.get('project');
            if (projectId) {
                const projectService = getProjectService();
                const project = await projectService.getProject(projectId, user.id);

                if (project) {
                    setCurrentProject(project);
                    if (project.script_content || project.script_analysis) {
                        setProjectState({
                            scriptContent: project.script_content,
                            scriptAnalysis: project.script_analysis,
                            timelineClips: project.timeline_clips || [],
                            roadmapBlocks: project.roadmap_blocks || [],
                            ui: {
                                leftWidth: 400,
                                rightWidth: 400,
                                timelineHeight: 200,
                                zoom: 1,
                                playhead: 0
                            }
                        });
                    }
                    setHasLoadedInitialProject(true);
                    setIsLoadingProjects(false);
                    return;
                }
            }

            // Check for saved state in localStorage
            const savedState = localStorage.getItem(PROJECT_STORAGE_KEY);
            if (savedState) {
                try {
                    const parsedState = JSON.parse(savedState);
                    setProjectState(parsedState);
                } catch (error) {
                    console.warn('[App] Failed to parse saved state:', error);
                }
            }

            setHasLoadedInitialProject(true);
        } catch (error) {
            console.error('[App] Failed to initialize project:', error);
        } finally {
            setIsLoadingProjects(false);
        }
    }, [loadProjects]);

    const handleNewProject = useCallback(async () => {
        if (!user) return;

        try {
            const projectService = getProjectService();
            const newProject = await projectService.createProject(
                'Untitled Project',
                user.id
            );

            setProjectList(prev => [newProject, ...prev]);
            setCurrentProject(newProject);
            setProjectState({
                scriptContent: null,
                scriptAnalysis: null,
                timelineClips: [],
                roadmapBlocks: [],
                ui: {
                    leftWidth: 400,
                    rightWidth: 400,
                    timelineHeight: 200,
                    zoom: 1,
                    playhead: 0
                }
            });

            navigate(`?project=${newProject.id}`);
        } catch (error) {
            console.error('[App] Failed to create new project:', error);
        }
    }, [user, navigate]);

    const handleProjectSelect = useCallback(async (project: Project) => {
        if (!user) return;

        try {
            setCurrentProject(project);
            navigate(`?project=${project.id}`);

            if (project.script_content || project.script_analysis || project.timeline_clips) {
                setProjectState({
                    scriptContent: project.script_content,
                    scriptAnalysis: project.script_analysis,
                    timelineClips: project.timeline_clips || [],
                    roadmapBlocks: project.roadmap_blocks || [],
                    ui: {
                        leftWidth: 400,
                        rightWidth: 400,
                        timelineHeight: 200,
                        zoom: 1,
                        playhead: 0
                    }
                });
            }
        } catch (error) {
            console.error('[App] Failed to select project:', error);
        }
    }, [user, navigate]);

    // Save state to localStorage when it changes
    useEffect(() => {
        if (hasLoadedInitialProject) {
            const serializableState = getSerializableState();
            localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(serializableState));
        }
    }, [projectState, hasLoadedInitialProject, getSerializableState]);

    // Auto-save using SaveManager
    useEffect(() => {
        if (currentProject && user && hasLoadedInitialProject) {
            saveManager.initialize(currentProject.id, user.id);

            // Update SaveManager with changes
            if (projectState.scriptContent !== undefined) {
                saveManager.updateOptimistic('scriptContent', projectState.scriptContent);
            }
            if (projectState.scriptAnalysis !== undefined) {
                saveManager.updateOptimistic('scriptAnalysis', projectState.scriptAnalysis);
            }
            if (projectState.timelineClips !== undefined) {
                saveManager.updateOptimistic('timelineClips', projectState.timelineClips);
            }
        }
    }, [currentProject, user, projectState, hasLoadedInitialProject]);

    return {
        projectState,
        currentProject,
        projectList,
        isLoadingProjects,
        hasLoadedInitialProject,
        setProjectState,
        setCurrentProject,
        setProjectList,
        setIsLoadingProjects,
        setHasLoadedInitialProject,
        initializeProject,
        handleNewProject,
        handleProjectSelect,
        handleProjectUpdate,
        handleProjectDelete,
        saveProject,
        loadProjects,
        getSerializableState
    };
};