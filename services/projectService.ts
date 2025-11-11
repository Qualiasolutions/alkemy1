import { supabase, isSupabaseConfigured } from './supabase';
import { Project, ScriptAnalysis, TimelineClip } from '@/types';

export interface ProjectService {
  // Project CRUD operations
  createProject: (userId: string, title: string) => Promise<{ project: Project | null; error: any }>;
  getProject: (projectId: string) => Promise<{ project: Project | null; error: any }>;
  getProjects: (userId: string) => Promise<{ projects: Project[] | null; error: any }>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<{ project: Project | null; error: any }>;
  deleteProject: (projectId: string) => Promise<{ error: any }>;

  // Project data operations
  saveProjectData: (projectId: string, data: {
    scriptContent?: string;
    scriptAnalysis?: ScriptAnalysis | null;
    timelineClips?: TimelineClip[] | null;
    moodboardData?: any;
  }) => Promise<{ error: any }>;

  // Auto-save operations
  autoSave: (projectId: string, data: any) => Promise<{ error: any }>;

  // Project management
  updateLastAccessed: (projectId: string) => Promise<{ error: any }>;
  duplicateProject: (projectId: string, newTitle: string) => Promise<{ project: Project | null; error: any }>;
}

class ProjectServiceImpl implements ProjectService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = isSupabaseConfigured();
  }

  async createProject(userId: string, title: string = 'Untitled Project'): Promise<{ project: Project | null; error: any }> {
    if (!this.isConfigured) {
      return { project: null, error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          user_id: userId,
          title,
          script_content: null,
          script_analysis: null,
          timeline_clips: null,
          moodboard_data: null,
          project_settings: {},
          is_public: false,
          shared_with: [],
        }])
        .select()
        .single();

      if (error) throw error;

      return { project: this.transformDbProject(data), error: null };
    } catch (error) {
      console.error('Error creating project:', error);
      return { project: null, error };
    }
  }

  async getProject(projectId: string): Promise<{ project: Project | null; error: any }> {
    if (!this.isConfigured) {
      return { project: null, error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      return { project: this.transformDbProject(data), error: null };
    } catch (error) {
      console.error('Error getting project:', error);
      return { project: null, error };
    }
  }

  async getProjects(userId: string, limit: number = 50): Promise<{ projects: Project[] | null; error: any }> {
    if (!this.isConfigured) {
      return { projects: null, error: new Error('Supabase is not configured') };
    }

    try {
      // Fetch only essential fields to avoid timeout on large script_analysis JSONB
      // Full project data is loaded on-demand when opening a specific project
      const { data, error } = await supabase
        .from('projects')
        .select('id, user_id, title, is_public, created_at, updated_at, last_accessed_at')
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;

      // Transform lightweight project list (missing full data, will be loaded on-demand)
      const projects = data.map(project => ({
        ...project,
        script_content: null,
        script_analysis: null,
        timeline_clips: null,
        moodboard_data: null,
        project_settings: {},
        shared_with: [],
      } as Project));

      return { projects, error: null };
    } catch (error) {
      console.error('Error getting projects:', error);
      return { projects: null, error };
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<{ project: Project | null; error: any }> {
    if (!this.isConfigured) {
      return { project: null, error: new Error('Supabase is not configured') };
    }

    try {
      const dbUpdates = this.transformProjectUpdates(updates);

      const { data, error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      return { project: this.transformDbProject(data), error: null };
    } catch (error) {
      console.error('Error updating project:', error);
      return { project: null, error };
    }
  }

  async deleteProject(projectId: string): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { error };
    }
  }

  async saveProjectData(projectId: string, data: {
    scriptContent?: string;
    scriptAnalysis?: ScriptAnalysis | null;
    timelineClips?: TimelineClip[] | null;
    moodboardData?: any;
  }): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const updates: any = {};

      if (data.scriptContent !== undefined) {
        updates.script_content = data.scriptContent;
      }

      if (data.scriptAnalysis !== undefined) {
        updates.script_analysis = data.scriptAnalysis;
      }

      if (data.timelineClips !== undefined) {
        updates.timeline_clips = data.timelineClips;
      }

      if (data.moodboardData !== undefined) {
        updates.moodboard_data = data.moodboardData;
      }

      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error saving project data:', error);
      return { error };
    }
  }

  async autoSave(projectId: string, data: any): Promise<{ error: any }> {
    return this.saveProjectData(projectId, data);
  }

  async updateLastAccessed(projectId: string): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error updating last accessed:', error);
      return { error };
    }
  }

  async duplicateProject(projectId: string, newTitle: string): Promise<{ project: Project | null; error: any }> {
    if (!this.isConfigured) {
      return { project: null, error: new Error('Supabase is not configured') };
    }

    try {
      // First get the original project
      const { project: originalProject, error: getError } = await this.getProject(projectId);
      if (getError || !originalProject) {
        return { project: null, error: getError || new Error('Project not found') };
      }

      // Create a new project with the same data
      const { project: newProject, error: createError } = await this.createProject(
        originalProject.user_id,
        newTitle
      );

      if (createError || !newProject) {
        return { project: null, error: createError };
      }

      // Copy all the data
      const { error: updateError } = await this.saveProjectData(newProject.id, {
        scriptContent: originalProject.script_content,
        scriptAnalysis: originalProject.script_analysis,
        timelineClips: originalProject.timeline_clips,
        moodboardData: originalProject.moodboard_data,
      });

      if (updateError) {
        // If update fails, clean up the created project
        await this.deleteProject(newProject.id);
        return { project: null, error: updateError };
      }

      // Get the final project with all data
      const { project: finalProject, error: getFinalError } = await this.getProject(newProject.id);

      return { project: finalProject, error: getFinalError };
    } catch (error) {
      console.error('Error duplicating project:', error);
      return { project: null, error };
    }
  }

  // Helper methods
  private transformDbProject(dbProject: any): Project {
    return {
      id: dbProject.id,
      user_id: dbProject.user_id,
      title: dbProject.title,
      script_content: dbProject.script_content,
      script_analysis: dbProject.script_analysis,
      timeline_clips: dbProject.timeline_clips,
      moodboard_data: dbProject.moodboard_data,
      project_settings: dbProject.project_settings,
      is_public: dbProject.is_public,
      shared_with: dbProject.shared_with,
      created_at: dbProject.created_at,
      updated_at: dbProject.updated_at,
      last_accessed_at: dbProject.last_accessed_at,
    };
  }

  private transformProjectUpdates(updates: Partial<Project>): any {
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.script_content !== undefined) dbUpdates.script_content = updates.script_content;
    if (updates.script_analysis !== undefined) dbUpdates.script_analysis = updates.script_analysis;
    if (updates.timeline_clips !== undefined) dbUpdates.timeline_clips = updates.timeline_clips;
    if (updates.moodboard_data !== undefined) dbUpdates.moodboard_data = updates.moodboard_data;
    if (updates.project_settings !== undefined) dbUpdates.project_settings = updates.project_settings;
    if (updates.is_public !== undefined) dbUpdates.is_public = updates.is_public;
    if (updates.shared_with !== undefined) dbUpdates.shared_with = updates.shared_with;

    return dbUpdates;
  }
}

// Export singleton instance
export const projectService: ProjectService = new ProjectServiceImpl();

// Utility functions for localStorage fallback
export const localStorageProjectService: ProjectService = {
  createProject: async (userId: string, title: string) => {
    // This would create a project in localStorage as a fallback
    const project: Project = {
      id: `local-${Date.now()}`,
      user_id: userId,
      title,
      script_content: null,
      script_analysis: null,
      timeline_clips: null,
      moodboard_data: null,
      project_settings: {},
      is_public: false,
      shared_with: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    };

    return { project, error: null };
  },

  getProject: async (projectId: string) => {
    // Get from localStorage
    return { project: null, error: new Error('LocalStorage fallback not implemented') };
  },

  getProjects: async (userId: string) => {
    return { projects: [], error: null };
  },

  updateProject: async (projectId: string, updates: Partial<Project>) => {
    return { project: null, error: new Error('LocalStorage fallback not implemented') };
  },

  deleteProject: async (projectId: string) => {
    return { error: null };
  },

  saveProjectData: async (projectId: string, data: any) => {
    return { error: null };
  },

  autoSave: async (projectId: string, data: any) => {
    return { error: null };
  },

  updateLastAccessed: async (projectId: string) => {
    return { error: null };
  },

  duplicateProject: async (projectId: string, newTitle: string) => {
    return { project: null, error: new Error('LocalStorage fallback not implemented') };
  },
};

// Export the appropriate service based on configuration
export const getProjectService = (): ProjectService => {
  return isSupabaseConfigured() ? projectService : localStorageProjectService;
};