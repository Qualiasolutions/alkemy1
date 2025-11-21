import { supabase, isSupabaseConfigured } from './supabase';
import { Project, ScriptAnalysis, TimelineClip } from '@/types';

// Enhanced project types for new features
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'documentary' | 'narrative' | 'commercial' | 'music-video' | 'animation' | 'custom';
  scriptContent?: string;
  scriptAnalysis?: any;
  moodboard?: any;
  timelineClips?: any[];
  roadmapBlocks?: any[];
  mediaAssets?: any[];
  tags: string[];
  isSystem: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  rating: number;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'restored' | 'exported' | 'imported' |
          'shared' | 'duplicated' | 'template_created' | 'template_applied' |
          'script_analyzed' | 'generation_completed' | 'auto_saved' | 'manual_saved' | 'version_created';
  details: any;
  metadata?: any;
  createdAt: string;
}

export interface ProjectFilter {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  tags?: string[];
  searchTerm?: string;
  sortBy?: 'name' | 'updated' | 'created' | 'accessed';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProjectService {
  // Project CRUD operations
  createProject: (userId: string, title: string, description?: string) => Promise<{ project: Project | null; error: any }>;
  getProject: (projectId: string) => Promise<{ project: Project | null; error: any }>;
  getProjects: (userId: string, filter?: ProjectFilter) => Promise<{ projects: Project[] | null; error: any }>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<{ project: Project | null; error: any }>;
  deleteProject: (projectId: string) => Promise<{ error: any }>;

  // Soft delete operations
  softDeleteProject: (projectId: string) => Promise<{ error: any }>;
  restoreProject: (projectId: string) => Promise<{ error: any }>;
  permanentlyDeleteProject: (projectId: string) => Promise<{ error: any }>;
  getDeletedProjects: (userId: string) => Promise<{ projects: Project[] | null; error: any }>;
  emptyTrash: (userId: string) => Promise<{ error: any }>;

  // Template operations
  getTemplates: (includeSystem?: boolean) => Promise<{ templates: ProjectTemplate[] | null; error: any }>;
  createTemplate: (project: Project, name: string, category: string, description?: string) => Promise<{ template: ProjectTemplate | null; error: any }>;
  createProjectFromTemplate: (templateId: string, name: string, description?: string) => Promise<{ project: Project | null; error: any }>;
  deleteTemplate: (templateId: string) => Promise<{ error: any }>;
  rateTemplate: (templateId: string, rating: number) => Promise<{ error: any }>;

  // Export/Import operations
  exportProject: (projectId: string, format: 'json' | 'zip') => Promise<{ data: any; error: any }>;
  importProject: (userId: string, data: any, format: 'json' | 'zip') => Promise<{ project: Project | null; error: any }>;

  // Activity logging
  getProjectActivity: (projectId: string, limit?: number) => Promise<{ activities: ProjectActivity[] | null; error: any }>;
  logActivity: (projectId: string, action: string, details?: any) => Promise<{ error: any }>;

  // Bulk operations
  bulkDeleteProjects: (projectIds: string[]) => Promise<{ error: any }>;
  bulkRestoreProjects: (projectIds: string[]) => Promise<{ error: any }>;
  bulkExportProjects: (projectIds: string[]) => Promise<{ data: any[]; error: any }>;

  // Search and filter
  searchProjects: (userId: string, searchTerm: string) => Promise<{ projects: Project[] | null; error: any }>;
  getProjectsByTag: (userId: string, tags: string[]) => Promise<{ projects: Project[] | null; error: any }>;

  // Project data operations
  saveProjectData: (projectId: string, data: {
    scriptContent?: string;
    scriptAnalysis?: ScriptAnalysis | null;
    timelineClips?: TimelineClip[] | null;
    moodboardData?: any;
  }) => Promise<{ error: any }>;

  // Auto-save operations
  autoSave: (projectId: string, data: any) => Promise<{ error: any }>;
  saveAs: (projectId: string, newName: string) => Promise<{ project: Project | null; error: any }>;

  // Project management
  updateLastAccessed: (projectId: string) => Promise<{ error: any }>;
  duplicateProject: (projectId: string, newTitle: string) => Promise<{ project: Project | null; error: any }>;
  updateProjectMetadata: (projectId: string, metadata: { description?: string; tags?: string[] }) => Promise<{ error: any }>;
}

class ProjectServiceImpl implements ProjectService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = isSupabaseConfigured();
  }

  async createProject(userId: string, title: string = 'Untitled Project', description: string = ''): Promise<{ project: Project | null; error: any }> {
    if (!this.isConfigured) {
      return { project: null, error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          user_id: userId,
          title,
          description,
          tags: [],
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

      // Log activity
      await this.logActivity(data.id, 'created', { title });

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

  async getProjects(userId: string, filter?: ProjectFilter): Promise<{ projects: Project[] | null; error: any }> {
    if (!this.isConfigured) {
      return { projects: null, error: new Error('Supabase is not configured') };
    }

    try {
      // Build query based on filter
      let query = supabase
        .from('projects')
        .select('id, user_id, title, description, tags, is_public, deleted_at, created_at, updated_at, last_accessed_at')
        .eq('user_id', userId);

      // Apply soft delete filter
      if (filter?.onlyDeleted) {
        query = query.not('deleted_at', 'is', null);
      } else if (!filter?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      // Apply search filter
      if (filter?.searchTerm) {
        query = query.or(`title.ilike.%${filter.searchTerm}%,description.ilike.%${filter.searchTerm}%`);
      }

      // Apply tag filter
      if (filter?.tags && filter.tags.length > 0) {
        query = query.contains('tags', filter.tags);
      }

      // Apply sorting
      const sortColumn = filter?.sortBy === 'name' ? 'title' :
                        filter?.sortBy === 'updated' ? 'updated_at' :
                        filter?.sortBy === 'created' ? 'created_at' :
                        'last_accessed_at';
      const sortOrder = filter?.sortOrder === 'asc' ? true : false;
      query = query.order(sortColumn, { ascending: sortOrder, nullsFirst: false });

      // Apply pagination
      const limit = filter?.limit || 50;
      const offset = filter?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

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

  // ===== SOFT DELETE OPERATIONS =====

  async softDeleteProject(projectId: string): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const { error } = await supabase.rpc('soft_delete_project', { project_id: projectId });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error soft deleting project:', error);
      return { error };
    }
  }

  async restoreProject(projectId: string): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const { error } = await supabase.rpc('restore_project', { project_id: projectId });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error restoring project:', error);
      return { error };
    }
  }

  async permanentlyDeleteProject(projectId: string): Promise<{ error: any }> {
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
      console.error('Error permanently deleting project:', error);
      return { error };
    }
  }

  async getDeletedProjects(userId: string): Promise<{ projects: Project[] | null; error: any }> {
    return this.getProjects(userId, { onlyDeleted: true, sortBy: 'updated', sortOrder: 'desc' });
  }

  async emptyTrash(userId: string): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', userId)
        .not('deleted_at', 'is', null);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error emptying trash:', error);
      return { error };
    }
  }

  // ===== TEMPLATE OPERATIONS =====

  async getTemplates(includeSystem: boolean = true): Promise<{ templates: ProjectTemplate[] | null; error: any }> {
    if (!this.isConfigured) {
      return { templates: null, error: new Error('Supabase is not configured') };
    }

    try {
      let query = supabase
        .from('project_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (!includeSystem) {
        query = query.eq('is_system', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      const templates = data?.map(t => this.transformDbTemplate(t)) || [];
      return { templates, error: null };
    } catch (error) {
      console.error('Error getting templates:', error);
      return { templates: null, error };
    }
  }

  async createTemplate(project: Project, name: string, category: string, description?: string): Promise<{ template: ProjectTemplate | null; error: any }> {
    if (!this.isConfigured) {
      return { template: null, error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('project_templates')
        .insert([{
          name,
          description: description || '',
          category,
          script_content: project.script_content,
          script_analysis: project.script_analysis,
          moodboard: project.moodboard_data,
          timeline_clips: project.timeline_clips,
          tags: [],
          is_system: false,
          created_by: project.user_id
        }])
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(project.id, 'template_created', { template_name: name });

      return { template: this.transformDbTemplate(data), error: null };
    } catch (error) {
      console.error('Error creating template:', error);
      return { template: null, error };
    }
  }

  async createProjectFromTemplate(templateId: string, name: string, description?: string): Promise<{ project: Project | null; error: any }> {
    if (!this.isConfigured) {
      return { project: null, error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase.rpc('create_project_from_template', {
        template_id: templateId,
        new_name: name,
        new_description: description
      });

      if (error) throw error;

      // Get the created project
      const { project, error: getError } = await this.getProject(data);
      if (getError) throw getError;

      return { project, error: null };
    } catch (error) {
      console.error('Error creating project from template:', error);
      return { project: null, error };
    }
  }

  async deleteTemplate(templateId: string): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const { error } = await supabase
        .from('project_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting template:', error);
      return { error };
    }
  }

  async rateTemplate(templateId: string, rating: number): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const { error } = await supabase
        .from('project_templates')
        .update({ rating })
        .eq('id', templateId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error rating template:', error);
      return { error };
    }
  }

  // ===== EXPORT/IMPORT OPERATIONS =====

  async exportProject(projectId: string, format: 'json' | 'zip'): Promise<{ data: any; error: any }> {
    if (!this.isConfigured) {
      return { data: null, error: new Error('Supabase is not configured') };
    }

    try {
      const { project, error } = await this.getProject(projectId);
      if (error || !project) throw error || new Error('Project not found');

      if (format === 'json') {
        // Simple JSON export
        const exportData = {
          version: '2.0',
          exportedAt: new Date().toISOString(),
          project: project
        };

        await this.logActivity(projectId, 'exported', { format });
        return { data: exportData, error: null };
      } else {
        // ZIP export would include media assets
        // This would require additional implementation with file handling
        return { data: null, error: new Error('ZIP export not yet implemented') };
      }
    } catch (error) {
      console.error('Error exporting project:', error);
      return { data: null, error };
    }
  }

  async importProject(userId: string, data: any, format: 'json' | 'zip'): Promise<{ project: Project | null; error: any }> {
    if (!this.isConfigured) {
      return { project: null, error: new Error('Supabase is not configured') };
    }

    try {
      if (format === 'json') {
        // Validate import data
        if (!data.project || !data.version) {
          throw new Error('Invalid import data format');
        }

        // Create new project with imported data
        const { project: newProject, error: createError } = await this.createProject(
          userId,
          data.project.title + ' (Imported)',
          data.project.description
        );

        if (createError || !newProject) throw createError;

        // Copy all the data
        const { error: updateError } = await this.saveProjectData(newProject.id, {
          scriptContent: data.project.script_content,
          scriptAnalysis: data.project.script_analysis,
          timelineClips: data.project.timeline_clips,
          moodboardData: data.project.moodboard_data,
        });

        if (updateError) {
          await this.deleteProject(newProject.id);
          throw updateError;
        }

        await this.logActivity(newProject.id, 'imported', { format, originalTitle: data.project.title });
        return { project: newProject, error: null };
      } else {
        return { project: null, error: new Error('ZIP import not yet implemented') };
      }
    } catch (error) {
      console.error('Error importing project:', error);
      return { project: null, error };
    }
  }

  // ===== ACTIVITY LOGGING =====

  async getProjectActivity(projectId: string, limit: number = 50): Promise<{ activities: ProjectActivity[] | null; error: any }> {
    if (!this.isConfigured) {
      return { activities: null, error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('project_activity_log')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const activities = data?.map(a => this.transformDbActivity(a)) || [];
      return { activities, error: null };
    } catch (error) {
      console.error('Error getting project activity:', error);
      return { activities: null, error };
    }
  }

  async logActivity(projectId: string, action: string, details?: any): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('project_activity_log')
        .insert([{
          project_id: projectId,
          user_id: user.id,
          action,
          details: details || {}
        }]);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { error };
    }
  }

  // ===== BULK OPERATIONS =====

  async bulkDeleteProjects(projectIds: string[]): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      // Use soft delete for each project
      const promises = projectIds.map(id => this.softDeleteProject(id));
      const results = await Promise.all(promises);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to delete ${errors.length} projects`);
      }

      return { error: null };
    } catch (error) {
      console.error('Error bulk deleting projects:', error);
      return { error };
    }
  }

  async bulkRestoreProjects(projectIds: string[]): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const promises = projectIds.map(id => this.restoreProject(id));
      const results = await Promise.all(promises);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to restore ${errors.length} projects`);
      }

      return { error: null };
    } catch (error) {
      console.error('Error bulk restoring projects:', error);
      return { error };
    }
  }

  async bulkExportProjects(projectIds: string[]): Promise<{ data: any[]; error: any }> {
    if (!this.isConfigured) {
      return { data: [], error: new Error('Supabase is not configured') };
    }

    try {
      const promises = projectIds.map(id => this.exportProject(id, 'json'));
      const results = await Promise.all(promises);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to export ${errors.length} projects`);
      }

      const data = results.map(r => r.data).filter(d => d);
      return { data, error: null };
    } catch (error) {
      console.error('Error bulk exporting projects:', error);
      return { data: [], error };
    }
  }

  // ===== SEARCH AND FILTER =====

  async searchProjects(userId: string, searchTerm: string): Promise<{ projects: Project[] | null; error: any }> {
    return this.getProjects(userId, { searchTerm, sortBy: 'updated', sortOrder: 'desc' });
  }

  async getProjectsByTag(userId: string, tags: string[]): Promise<{ projects: Project[] | null; error: any }> {
    return this.getProjects(userId, { tags, sortBy: 'updated', sortOrder: 'desc' });
  }

  // ===== ADDITIONAL OPERATIONS =====

  async saveAs(projectId: string, newName: string): Promise<{ project: Project | null; error: any }> {
    return this.duplicateProject(projectId, newName);
  }

  async updateProjectMetadata(projectId: string, metadata: { description?: string; tags?: string[] }): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const updates: any = {};
      if (metadata.description !== undefined) updates.description = metadata.description;
      if (metadata.tags !== undefined) updates.tags = metadata.tags;

      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error updating project metadata:', error);
      return { error };
    }
  }

  // Helper methods
  private transformDbProject(dbProject: any): Project {
    return {
      id: dbProject.id,
      user_id: dbProject.user_id,
      title: dbProject.title,
      description: dbProject.description,
      tags: dbProject.tags || [],
      script_content: dbProject.script_content,
      script_analysis: dbProject.script_analysis,
      timeline_clips: dbProject.timeline_clips,
      moodboard_data: dbProject.moodboard_data,
      project_settings: dbProject.project_settings,
      is_public: dbProject.is_public,
      shared_with: dbProject.shared_with,
      deleted_at: dbProject.deleted_at,
      permanently_delete_at: dbProject.permanently_delete_at,
      created_at: dbProject.created_at,
      updated_at: dbProject.updated_at,
      last_accessed_at: dbProject.last_accessed_at,
    };
  }

  private transformDbTemplate(dbTemplate: any): ProjectTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      category: dbTemplate.category,
      scriptContent: dbTemplate.script_content,
      scriptAnalysis: dbTemplate.script_analysis,
      moodboard: dbTemplate.moodboard,
      timelineClips: dbTemplate.timeline_clips,
      roadmapBlocks: dbTemplate.roadmap_blocks,
      mediaAssets: dbTemplate.media_assets,
      tags: dbTemplate.tags || [],
      isSystem: dbTemplate.is_system,
      createdBy: dbTemplate.created_by,
      createdAt: dbTemplate.created_at,
      updatedAt: dbTemplate.updated_at,
      usageCount: dbTemplate.usage_count,
      rating: dbTemplate.rating,
    };
  }

  private transformDbActivity(dbActivity: any): ProjectActivity {
    return {
      id: dbActivity.id,
      projectId: dbActivity.project_id,
      userId: dbActivity.user_id,
      action: dbActivity.action,
      details: dbActivity.details || {},
      metadata: dbActivity.metadata,
      createdAt: dbActivity.created_at,
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

// LAZY EXPORT: Use getter to prevent TDZ errors in minified builds
let _projectService: ProjectService | undefined;
function getProjectServiceInstance(): ProjectService {
  if (!_projectService) {
    _projectService = new ProjectServiceImpl();
  }
  return _projectService;
}

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
export function getProjectService(): ProjectService {
  return isSupabaseConfigured() ? getProjectServiceInstance() : localStorageProjectService;
};