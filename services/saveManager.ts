/**
 * SaveManager Service
 *
 * Enterprise-grade save management with optimistic updates, conflict resolution,
 * and manual save controls. Replaces localStorage with proper database persistence.
 */

import { supabase } from './supabase';
import { Project, ScriptAnalysis, TimelineClip } from '../types';
import { getProjectService } from './projectService';
import { networkDetection } from './networkDetection';

export interface SaveState {
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  lastModified: Date | null;
  pendingChanges: Map<string, any>;
  isSaving: boolean;
  saveError: Error | null;
  conflictData: any | null;
}

export interface SaveOptions {
  showNotification?: boolean;
  createVersion?: boolean;
  forceSave?: boolean;
}

export type SaveCallback = (state: SaveState) => void;
export type ConflictResolver = (local: any, remote: any) => Promise<'keep-local' | 'keep-remote' | 'merge'>;

class SaveManager {
  private pendingChanges: Map<string, any> = new Map();
  private saveDebouncer: NodeJS.Timeout | null = null;
  private lastSaved: Date | null = null;
  private lastModified: Date | null = null;
  private isSaving: boolean = false;
  private saveError: Error | null = null;
  private conflictData: any | null = null;
  private listeners: Set<SaveCallback> = new Set();
  private conflictResolver: ConflictResolver | null = null;
  private currentProjectId: string | null = null;
  private currentUserId: string | null = null;

  // Configuration
  private readonly AUTO_SAVE_DELAY = 30000; // 30 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly CONFLICT_CHECK_INTERVAL = 60000; // 1 minute

  constructor() {
    // Set up beforeunload handler
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
  }

  /**
   * Initialize SaveManager for a project
   */
  initialize(projectId: string, userId: string) {
    this.currentProjectId = projectId;
    this.currentUserId = userId;
    this.reset();
    this.startConflictMonitoring();
  }

  /**
   * Update a field with optimistic updates
   */
  updateOptimistic(field: string, value: any) {
    // Store the change
    this.pendingChanges.set(field, value);
    this.lastModified = new Date();

    // Notify listeners (UI updates immediately)
    this.notifyListeners();

    // Schedule debounced save
    this.scheduleSave();
  }

  /**
   * Batch update multiple fields
   */
  batchUpdate(updates: Record<string, any>) {
    Object.entries(updates).forEach(([field, value]) => {
      this.pendingChanges.set(field, value);
    });
    this.lastModified = new Date();
    this.notifyListeners();
    this.scheduleSave();
  }

  /**
   * Manual save with options
   */
  async saveNow(options: SaveOptions = {}): Promise<boolean> {
    if (this.isSaving) {
      console.warn('[SaveManager] Save already in progress');
      return false;
    }

    if (this.pendingChanges.size === 0 && !options.forceSave) {
      console.log('[SaveManager] No changes to save');
      return true;
    }

    // Check network status before attempting save
    if (!networkDetection.getStatus()) {
      const offlineError = new Error('Cannot save - you appear to be offline. Changes will be saved automatically when your connection is restored.');
      this.saveError = offlineError;
      console.warn('[SaveManager] Save skipped due to offline status');

      if (options.showNotification) {
        this.showNotification('Cannot save while offline', 'warning');
      }

      this.notifyListeners();
      return false;
    }

    // Clear any pending auto-save
    if (this.saveDebouncer) {
      clearTimeout(this.saveDebouncer);
      this.saveDebouncer = null;
    }

    this.isSaving = true;
    this.saveError = null;
    this.notifyListeners();

    try {
      const changes = this.collectChanges();

      // Check for conflicts if not forcing save
      if (!options.forceSave) {
        const hasConflict = await this.checkForConflicts();
        if (hasConflict) {
          const resolution = await this.resolveConflict();
          if (resolution === 'keep-remote') {
            // Discard local changes
            this.pendingChanges.clear();
            this.isSaving = false;
            this.notifyListeners();
            return false;
          }
        }
      }

      // Create version snapshot if requested
      if (options.createVersion) {
        await this.createVersionSnapshot(changes);
      }

      // Persist to database
      await this.persistChanges(changes);

      // Success!
      this.pendingChanges.clear();
      this.lastSaved = new Date();
      this.saveError = null;

      if (options.showNotification) {
        this.showNotification('Changes saved successfully', 'success');
      }

      this.notifyListeners();
      return true;

    } catch (error) {
      console.error('[SaveManager] Save failed:', error);
      this.saveError = error as Error;

      // Retry logic
      const shouldRetry = await this.handleSaveError(error as Error);
      if (shouldRetry) {
        return this.saveNow(options); // Retry
      }

      if (options.showNotification) {
        this.showNotification('Failed to save changes', 'error');
      }

      this.notifyListeners();
      return false;

    } finally {
      this.isSaving = false;
      this.notifyListeners();
    }
  }

  /**
   * Discard all pending changes
   */
  discardChanges() {
    this.pendingChanges.clear();
    this.lastModified = null;
    this.saveError = null;
    this.notifyListeners();
  }

  /**
   * Check if there are unsaved changes
   */
  get hasUnsavedChanges(): boolean {
    return this.pendingChanges.size > 0;
  }

  /**
   * Get current save state
   */
  getState(): SaveState {
    return {
      hasUnsavedChanges: this.hasUnsavedChanges,
      lastSaved: this.lastSaved,
      lastModified: this.lastModified,
      pendingChanges: new Map(this.pendingChanges),
      isSaving: this.isSaving,
      saveError: this.saveError,
      conflictData: this.conflictData
    };
  }

  /**
   * Subscribe to save state changes
   */
  subscribe(callback: SaveCallback): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Set conflict resolver function
   */
  setConflictResolver(resolver: ConflictResolver) {
    this.conflictResolver = resolver;
  }

  // Private methods

  private scheduleSave() {
    if (this.saveDebouncer) {
      clearTimeout(this.saveDebouncer);
    }

    this.saveDebouncer = setTimeout(() => {
      this.saveNow({ showNotification: false });
    }, this.AUTO_SAVE_DELAY);
  }

  private async persistChanges(changes: Record<string, any>) {
    if (!this.currentProjectId || !this.currentUserId) {
      throw new Error('SaveManager not initialized');
    }

    // Prepare data for saving
    const saveData: any = {};

    // Map changes to proper save format
    if (changes.scriptContent !== undefined) {
      saveData.scriptContent = changes.scriptContent;
    }
    if (changes.scriptAnalysis !== undefined) {
      saveData.scriptAnalysis = changes.scriptAnalysis;
    }
    if (changes.timelineClips !== undefined) {
      saveData.timelineClips = changes.timelineClips;
    }
    if (changes.moodboardData !== undefined) {
      saveData.moodboardData = changes.moodboardData;
    }

    // Save to database
    const projectService = getProjectService();
    const { error } = await projectService.saveProjectData(
      this.currentProjectId,
      saveData
    );

    if (error) {
      throw error;
    }

    // Update project metadata using the new columns that were added in migration
    const metadataUpdate: any = {};
    if (Object.keys(changes).length > 0) {
      metadataUpdate.has_unsaved_changes = false;
      metadataUpdate.last_manual_save = new Date().toISOString();
    }

    // Only update version if there are actual changes to project data
    const hasProjectDataChanges = ['scriptContent', 'scriptAnalysis', 'timelineClips', 'moodboardData']
      .some(key => changes[key] !== undefined);

    if (hasProjectDataChanges) {
      metadataUpdate.version = (await this.getCurrentVersion()) + 1;
    }

    // Apply metadata updates if any
    if (Object.keys(metadataUpdate).length > 0) {
      const { error: metadataError } = await supabase
        .from('projects')
        .update(metadataUpdate)
        .eq('id', this.currentProjectId);

      if (metadataError) {
        console.warn('[SaveManager] Failed to update project metadata:', metadataError);
      }
    }
  }

  private async getCurrentVersion(): Promise<number> {
    if (!this.currentProjectId) return 1;

    try {
      const { data } = await supabase
        .from('projects')
        .select('version')
        .eq('id', this.currentProjectId)
        .single();

      return data?.version || 1;
    } catch (error) {
      console.warn('[SaveManager] Failed to get current version:', error);
      return 1;
    }
  }

  private collectChanges(): Record<string, any> {
    const changes: Record<string, any> = {};
    this.pendingChanges.forEach((value, key) => {
      changes[key] = value;
    });
    return changes;
  }

  private async checkForConflicts(): Promise<boolean> {
    if (!this.currentProjectId) return false;

    try {
      // Get latest version from database
      const { data: remoteProject } = await supabase
        .from('projects')
        .select('updated_at')
        .eq('id', this.currentProjectId)
        .single();

      if (!remoteProject) return false;

      // Check if remote has been updated since our last save
      if (this.lastSaved && new Date(remoteProject.updated_at) > this.lastSaved) {
        // Fetch full remote data for conflict resolution
        const projectService = getProjectService();
        const { project } = await projectService.getProject(this.currentProjectId);
        this.conflictData = project;
        return true;
      }

      return false;
    } catch (error) {
      console.error('[SaveManager] Conflict check failed:', error);
      return false;
    }
  }

  private async resolveConflict(): Promise<'keep-local' | 'keep-remote' | 'merge'> {
    if (!this.conflictResolver || !this.conflictData) {
      // Default: keep local changes
      return 'keep-local';
    }

    const localData = this.collectChanges();
    return await this.conflictResolver(localData, this.conflictData);
  }

  private async createVersionSnapshot(changes: Record<string, any>) {
    if (!this.currentProjectId) return;

    try {
      // Get current project state
      const projectService = getProjectService();
      const { project } = await projectService.getProject(this.currentProjectId);
      if (!project) return;

      // Version tracking requires database schema changes (add version column to projects table)
      // FEATURE DEFERRED: Implementation would require:
      // 1. Database migration to add projects.version column
      // 2. Update projectService to support versioned saves
      // 3. UI component for version history
      // 4. Conflict resolution for concurrent edits
      console.log('[SaveManager] Version tracking deferred - requires database schema migration');

    } catch (error) {
      console.error('[SaveManager] Failed to create version snapshot:', error);
    }
  }

  private async handleSaveError(error: Error): Promise<boolean> {
    // Check for network errors using network detection service
    if (networkDetection.isNetworkError(error)) {
      console.warn('[SaveManager] Network error detected, will retry when connection is restored');
      // Don't retry immediately - wait for network to come back
      return false;
    }

    // Check for specific error types
    if (error.message?.includes('network')) {
      // Network error - retry
      return true;
    }

    if (error.message?.includes('conflict')) {
      // Conflict error - need resolution
      this.conflictData = await this.fetchRemoteData();
      return false;
    }

    // Unknown error - don't retry
    return false;
  }

  private async fetchRemoteData() {
    if (!this.currentProjectId) return null;
    const projectService = getProjectService();
    const { project } = await projectService.getProject(this.currentProjectId);
    return project;
  }

  private startConflictMonitoring() {
    // Periodically check for remote changes
    setInterval(() => {
      if (this.hasUnsavedChanges && !this.isSaving) {
        this.checkForConflicts().then(hasConflict => {
          if (hasConflict) {
            this.notifyListeners();
          }
        });
      }
    }, this.CONFLICT_CHECK_INTERVAL);
  }

  private handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (this.hasUnsavedChanges) {
      const message = 'You have unsaved changes. Are you sure you want to leave?';
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
  };

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[SaveManager] Listener error:', error);
      }
    });
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning') {
    // This will be connected to the Toast component in the UI
    const event = new CustomEvent('save-notification', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  }

  private reset() {
    this.pendingChanges.clear();
    this.lastSaved = null;
    this.lastModified = null;
    this.isSaving = false;
    this.saveError = null;
    this.conflictData = null;

    if (this.saveDebouncer) {
      clearTimeout(this.saveDebouncer);
      this.saveDebouncer = null;
    }
  }

  /**
   * Cleanup when component unmounts
   */
  dispose() {
    if (this.saveDebouncer) {
      clearTimeout(this.saveDebouncer);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }

    this.listeners.clear();
    this.reset();
  }
}

// Export singleton instance
export const saveManager = new SaveManager();

// Add React import for the hook
import * as React from 'react';

// Export hooks for React components
export function useSaveManager() {
  const [saveState, setSaveState] = React.useState<SaveState>(saveManager.getState());

  React.useEffect(() => {
    const unsubscribe = saveManager.subscribe(setSaveState);
    return unsubscribe;
  }, []);

  return {
    ...saveState,
    saveNow: (options?: SaveOptions) => saveManager.saveNow(options),
    discardChanges: () => saveManager.discardChanges(),
    updateField: (field: string, value: any) => saveManager.updateOptimistic(field, value),
    batchUpdate: (updates: Record<string, any>) => saveManager.batchUpdate(updates)
  };
}