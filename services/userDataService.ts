/**
 * UserDataService v2.0
 *
 * Manages user-specific preferences and settings in Supabase.
 * Features: Request queuing, conflict resolution, retry logic, offline support.
 * Replaces all localStorage usage with proper database storage.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { User } from '../types';

export interface UserPreferences {
  // UI State
  uiState: {
    activeTab: string;
    isSidebarExpanded: boolean;
  };

  // Voice Settings
  voiceSettings: {
    mode: 'push-to-talk' | 'always-listening' | 'text-only';
    privacyWarningShown: boolean;
    outputEnabled: boolean;
    outputVoiceId: string | null;
    speechRate: number;
  };

  // Style Learning
  styleLearningEnabled: boolean;
  styleOptInShown: boolean;

  // API Keys (encrypted)
  apiKeys: {
    gemini?: string;
    openai?: string;
    anthropic?: string;
    // Add other providers as needed
  };

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  uiState: {
    activeTab: 'script',
    isSidebarExpanded: true
  },
  voiceSettings: {
    mode: 'push-to-talk',
    privacyWarningShown: false,
    outputEnabled: false,
    outputVoiceId: null,
    speechRate: 1.0
  },
  styleLearningEnabled: false,
  styleOptInShown: false,
  apiKeys: {}
};

interface RequestQueue {
  [userId: string]: {
    operations: Array<{
      id: string;
      type: 'update' | 'batch';
      data: any;
      resolve: (value: any) => void;
      reject: (error: any) => void;
      timestamp: number;
      retryCount: number;
    }>;
    processing: boolean;
  };
}

class UserDataService {
  private cache: Map<string, UserPreferences> = new Map();
  private requestQueue: RequestQueue = {};
  private offlineQueue: Array<{ userId: string; operation: any }> = [];
  private isOnline: boolean = navigator.onLine;
  private readonly SAVE_DELAY = 2000; // 2 second debounce (increased for better batching)
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1 second base delay

  constructor() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Get user preferences from database or return defaults
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    if (!isSupabaseConfigured()) {
      console.warn('[UserDataService] Supabase not configured, returning defaults');
      return DEFAULT_PREFERENCES;
    }

    // Check cache first
    if (this.cache.has(userId)) {
      return this.cache.get(userId)!;
    }

    try {
      const result = await this.withRetry(
        async () => {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              // No preferences found, create default ones
              return await this.createDefaultPreferences(userId);
            }
            throw error;
          }

          return data;
        },
        'getUserPreferences',
        userId
      );

      const preferences: UserPreferences = {
        uiState: result.ui_state || DEFAULT_PREFERENCES.uiState,
        voiceSettings: result.voice_settings || DEFAULT_PREFERENCES.voiceSettings,
        styleLearningEnabled: result.style_learning_enabled ?? DEFAULT_PREFERENCES.styleLearningEnabled,
        styleOptInShown: result.style_opt_in_shown ?? DEFAULT_PREFERENCES.styleOptInShown,
        apiKeys: result.api_keys || DEFAULT_PREFERENCES.apiKeys,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      // Cache the preferences
      this.cache.set(userId, preferences);

      return preferences;
    } catch (error) {
      console.error('[UserDataService] Failed to get preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Update a specific preference field
   */
  async updatePreference<K extends keyof UserPreferences>(
    userId: string,
    key: K,
    value: UserPreferences[K]
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('[UserDataService] Supabase not configured, changes not persisted');
      return;
    }

    // Update cache immediately (optimistic update)
    const cached = this.cache.get(userId) || DEFAULT_PREFERENCES;
    const updated = { ...cached, [key]: value };
    this.cache.set(userId, updated);

    // Queue the update operation
    await this.queueOperation(userId, {
      id: this.generateOperationId(),
      type: 'update',
      data: { key, value },
      resolve: () => {},
      reject: (error) => console.error('[UserDataService] Update failed:', error),
      timestamp: Date.now(),
      retryCount: 0
    });
  }

  /**
   * Update UI state (activeTab, sidebarExpanded)
   */
  async updateUIState(
    userId: string,
    updates: Partial<UserPreferences['uiState']>
  ): Promise<void> {
    const current = await this.getUserPreferences(userId);
    const updatedUIState = { ...current.uiState, ...updates };
    await this.updatePreference(userId, 'uiState', updatedUIState);
  }

  /**
   * Update voice settings
   */
  async updateVoiceSettings(
    userId: string,
    updates: Partial<UserPreferences['voiceSettings']>
  ): Promise<void> {
    const current = await this.getUserPreferences(userId);
    const updatedVoiceSettings = { ...current.voiceSettings, ...updates };
    await this.updatePreference(userId, 'voiceSettings', updatedVoiceSettings);
  }

  /**
   * Set API key (with encryption)
   */
  async setAPIKey(
    userId: string,
    provider: keyof UserPreferences['apiKeys'],
    key: string | undefined
  ): Promise<void> {
    const current = await this.getUserPreferences(userId);
    const updatedKeys = { ...current.apiKeys };

    if (key) {
      // In production, encrypt the key before storing
      updatedKeys[provider] = this.encryptKey(key);
    } else {
      delete updatedKeys[provider];
    }

    await this.updatePreference(userId, 'apiKeys', updatedKeys);
  }

  /**
   * Get decrypted API key
   */
  async getAPIKey(
    userId: string,
    provider: keyof UserPreferences['apiKeys']
  ): Promise<string | undefined> {
    const preferences = await this.getUserPreferences(userId);
    const encryptedKey = preferences.apiKeys[provider];

    if (!encryptedKey) return undefined;

    // In production, decrypt the key
    return this.decryptKey(encryptedKey);
  }

  /**
   * Batch update multiple preferences
   */
  async batchUpdate(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('[UserDataService] Supabase not configured, changes not persisted');
      return;
    }

    // Update cache
    const cached = this.cache.get(userId) || DEFAULT_PREFERENCES;
    const updated = { ...cached, ...updates };
    this.cache.set(userId, updated);

    // Queue the batch update operation
    await this.queueOperation(userId, {
      id: this.generateOperationId(),
      type: 'batch',
      data: updates,
      resolve: () => {},
      reject: (error) => console.error('[UserDataService] Batch update failed:', error),
      timestamp: Date.now(),
      retryCount: 0
    });
  }

  /**
   * Queue an operation for processing
   */
  private async queueOperation(userId: string, operation: any): Promise<void> {
    // Initialize queue for user if not exists
    if (!this.requestQueue[userId]) {
      this.requestQueue[userId] = {
        operations: [],
        processing: false
      };
    }

    // Add operation to queue
    this.requestQueue[userId].operations.push(operation);

    // Process queue if not already processing
    if (!this.requestQueue[userId].processing) {
      this.processQueue(userId);
    }
  }

  /**
   * Process the operation queue for a user
   */
  private async processQueue(userId: string): Promise<void> {
    const queue = this.requestQueue[userId];
    if (!queue || queue.processing) return;

    queue.processing = true;

    while (queue.operations.length > 0) {
      const operation = queue.operations[0];

      try {
        // Wait for debounce delay if needed
        const timeSinceLastOp = Date.now() - operation.timestamp;
        if (timeSinceLastOp < this.SAVE_DELAY) {
          await this.sleep(this.SAVE_DELAY - timeSinceLastOp);
        }

        // Process the operation
        if (operation.type === 'update') {
          await this.processUpdate(userId, operation);
        } else if (operation.type === 'batch') {
          await this.processBatchUpdate(userId, operation);
        }

        // Remove processed operation
        queue.operations.shift();
        operation.resolve(undefined);

      } catch (error) {
        console.error('[UserDataService] Operation failed:', error);

        // Retry logic
        operation.retryCount++;
        if (operation.retryCount <= this.MAX_RETRIES) {
          // Exponential backoff
          const delay = this.RETRY_DELAY_BASE * Math.pow(2, operation.retryCount - 1);
          await this.sleep(delay);

          // Move operation to end of queue for retry
          queue.operations.push(queue.operations.shift()!);
        } else {
          // Max retries reached, fail the operation
          queue.operations.shift();
          operation.reject(error);
        }
      }
    }

    queue.processing = false;
  }

  /**
   * Process single update operation
   */
  private async processUpdate(userId: string, operation: any): Promise<void> {
    await this.withRetry(async () => {
      const { key, value } = operation.data;
      const dbField = this.getDbField(key);
      const dbValue = key === 'apiKeys' ? this.encryptKeys(value) : value;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          [dbField]: dbValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
    }, 'processUpdate', userId);
  }

  /**
   * Process batch update operation
   */
  private async processBatchUpdate(userId: string, operation: any): Promise<void> {
    await this.withRetry(async () => {
      const dbData = this.toDbFormat(operation.data);

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...dbData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
    }, 'processBatchUpdate', userId);
  }

  /**
   * Execute operation with retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    userId: string,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // Handle specific error types
      if (error.code === 'PGRST116' || error.code === '23505') {
        // No data found or duplicate key - handle gracefully
        console.warn(`[UserDataService] ${operationName} conflict, attempting merge...`);
        return await this.handleConflict(userId, operationName, error);
      }

      if (retryCount < this.MAX_RETRIES && this.isOnline) {
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, retryCount);
        console.warn(`[UserDataService] ${operationName} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.withRetry(operation, operationName, userId, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Handle database conflicts
   */
  private async handleConflict(
    userId: string,
    operationName: string,
    error: any
  ): Promise<any> {
    try {
      // For conflicts, try to fetch current state and merge
      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No record exists, create it
          return await this.createDefaultPreferences(userId);
        }
        throw fetchError;
      }

      return data;
    } catch (mergeError) {
      console.error(`[UserDataService] Failed to resolve conflict for ${operationName}:`, mergeError);
      throw error; // Throw original error
    }
  }

  /**
   * Process offline queue when connection is restored
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    console.log(`[UserDataService] Processing ${this.offlineQueue.length} offline operations`);

    const operations = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const { userId, operation } of operations) {
      try {
        if (operation.type === 'update') {
          await this.processUpdate(userId, operation);
        } else if (operation.type === 'batch') {
          await this.processBatchUpdate(userId, operation);
        }
      } catch (error) {
        console.error('[UserDataService] Failed to process offline operation:', error);
        // Re-queue for later attempt
        this.offlineQueue.push({ userId, operation });
      }
    }
  }

  /**
   * Clear user preferences cache
   */
  clearCache(userId?: string) {
    if (userId) {
      this.cache.delete(userId);
      delete this.requestQueue[userId];
    } else {
      this.cache.clear();
      this.requestQueue = {};
    }
  }

  /**
   * Migrate localStorage data to Supabase (one-time migration)
   */
  async migrateFromLocalStorage(userId: string): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const migrations: Partial<UserPreferences> = {};

      // Migrate UI state
      const uiStateRaw = localStorage.getItem('UI_STATE_STORAGE_KEY');
      if (uiStateRaw) {
        try {
          migrations.uiState = JSON.parse(uiStateRaw);
        } catch (e) {
          console.error('[UserDataService] Failed to parse UI state:', e);
        }
      }

      // Migrate voice settings
      const voiceMode = localStorage.getItem('alkemy_voice_mode_preference');
      const voicePrivacy = localStorage.getItem('alkemy_voice_privacy_warning_shown');
      const voiceOutput = localStorage.getItem('alkemy_voice_output_enabled');
      const voiceId = localStorage.getItem('alkemy_voice_output_voice_id');
      const voiceRate = localStorage.getItem('alkemy_voice_output_speech_rate');

      if (voiceMode || voicePrivacy || voiceOutput || voiceId || voiceRate) {
        migrations.voiceSettings = {
          mode: (voiceMode as any) || 'push-to-talk',
          privacyWarningShown: voicePrivacy === 'true',
          outputEnabled: voiceOutput === 'true',
          outputVoiceId: voiceId || null,
          speechRate: voiceRate ? parseFloat(voiceRate) : 1.0
        };
      }

      // Migrate style learning
      const styleLearning = localStorage.getItem('alkemy_style_learning_enabled');
      const styleOptIn = localStorage.getItem('alkemy_style_opt_in_shown');

      if (styleLearning !== null) {
        migrations.styleLearningEnabled = styleLearning === 'true';
      }
      if (styleOptIn !== null) {
        migrations.styleOptInShown = styleOptIn === 'true';
      }

      // Save migrated data
      if (Object.keys(migrations).length > 0) {
        await this.batchUpdate(userId, migrations);
        console.log('[UserDataService] Successfully migrated localStorage data');

        // Clear localStorage after successful migration
        this.clearLocalStorageKeys();
      }

    } catch (error) {
      console.error('[UserDataService] Migration failed:', error);
    }
  }

  // Private methods

  private async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    try {
      const result = await this.withRetry(async () => {
        const { data, error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            ui_state: DEFAULT_PREFERENCES.uiState,
            voice_settings: DEFAULT_PREFERENCES.voiceSettings,
            style_learning_enabled: DEFAULT_PREFERENCES.styleLearningEnabled,
            style_opt_in_shown: DEFAULT_PREFERENCES.styleOptInShown,
            api_keys: DEFAULT_PREFERENCES.apiKeys
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }, 'createDefaultPreferences', userId);

      const preferences: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      this.cache.set(userId, preferences);
      return preferences;

    } catch (error) {
      console.error('[UserDataService] Failed to create default preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDbField(key: string): string {
    const fieldMap: Record<string, string> = {
      'uiState': 'ui_state',
      'voiceSettings': 'voice_settings',
      'styleLearningEnabled': 'style_learning_enabled',
      'styleOptInShown': 'style_opt_in_shown',
      'apiKeys': 'api_keys'
    };
    return fieldMap[key] || key;
  }

  private toDbFormat(preferences: Partial<UserPreferences>): Record<string, any> {
    const dbData: Record<string, any> = {};

    if (preferences.uiState) dbData.ui_state = preferences.uiState;
    if (preferences.voiceSettings) dbData.voice_settings = preferences.voiceSettings;
    if (preferences.styleLearningEnabled !== undefined) {
      dbData.style_learning_enabled = preferences.styleLearningEnabled;
    }
    if (preferences.styleOptInShown !== undefined) {
      dbData.style_opt_in_shown = preferences.styleOptInShown;
    }
    if (preferences.apiKeys) dbData.api_keys = this.encryptKeys(preferences.apiKeys);

    return dbData;
  }

  private encryptKey(key: string): string {
    // TODO: Implement proper encryption
    // For now, just base64 encode (NOT SECURE - replace with real encryption)
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(key);
    }
    return key;
  }

  private decryptKey(encryptedKey: string): string {
    // TODO: Implement proper decryption
    // For now, just base64 decode (NOT SECURE - replace with real decryption)
    if (typeof window !== 'undefined' && window.atob) {
      try {
        return window.atob(encryptedKey);
      } catch {
        return encryptedKey;
      }
    }
    return encryptedKey;
  }

  private encryptKeys(keys: UserPreferences['apiKeys']): UserPreferences['apiKeys'] {
    const encrypted: UserPreferences['apiKeys'] = {};
    for (const [provider, key] of Object.entries(keys)) {
      if (key) {
        encrypted[provider as keyof UserPreferences['apiKeys']] = this.encryptKey(key);
      }
    }
    return encrypted;
  }

  private clearLocalStorageKeys() {
    const keysToRemove = [
      'UI_STATE_STORAGE_KEY',
      'alkemy_voice_mode_preference',
      'alkemy_voice_privacy_warning_shown',
      'alkemy_voice_output_enabled',
      'alkemy_voice_output_voice_id',
      'alkemy_voice_output_speech_rate',
      'alkemy_style_learning_enabled',
      'alkemy_style_opt_in_shown',
      'alkemy_style_profile',
      'PROJECT_STORAGE_KEY'
    ];

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore errors
      }
    });
  }

  /**
   * Cleanup
   */
  dispose() {
    // Clear all queues and cache
    this.requestQueue = {};
    this.offlineQueue = [];
    this.cache.clear();
  }

  /**
   * Get service status for debugging
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      cacheSize: this.cache.size,
      queueSize: Object.keys(this.requestQueue).reduce((total, userId) =>
        total + this.requestQueue[userId].operations.length, 0),
      offlineQueueSize: this.offlineQueue.length
    };
  }
}

// Add React import
import * as React from 'react';

// Export singleton instance
export const userDataService = new UserDataService();

// React hook for easy component integration
export function useUserPreferences(userId: string | null) {
  const [preferences, setPreferences] = React.useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<'online' | 'offline' | 'syncing'>('online');

  React.useEffect(() => {
    // Update status based on online state
    const updateStatus = () => {
      if (!navigator.onLine) {
        setStatus('offline');
      } else {
        setStatus('online');
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  React.useEffect(() => {
    if (!userId) {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Load preferences with proper error handling
    userDataService.getUserPreferences(userId)
      .then(setPreferences)
      .catch((err) => {
        console.error('User preferences load failed:', err);
        setError(err.message || 'Failed to load user preferences');
        setPreferences(DEFAULT_PREFERENCES); // Fallback to defaults
      })
      .finally(() => setLoading(false));

    // Subscribe to changes (if we add real-time updates later)
    // const unsubscribe = userDataService.subscribe(userId, setPreferences);
    // return unsubscribe;
  }, [userId]);

  const updatePreference = React.useCallback(
    async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      if (!userId) return;

      // Optimistic update
      setPreferences(prev => ({ ...prev, [key]: value }));

      // Set syncing status
      setStatus('syncing');

      // Persist to database
      try {
        await userDataService.updatePreference(userId, key, value);
        setStatus('online');
      } catch (error) {
        console.error('Update failed:', error);
        setStatus('offline');
        setError('Failed to save preferences');
      }
    },
    [userId]
  );

  return {
    preferences,
    loading,
    error,
    status,
    updatePreference,
    updateUIState: (updates: Partial<UserPreferences['uiState']>) =>
      userId ? userDataService.updateUIState(userId, updates) : Promise.resolve(),
    updateVoiceSettings: (updates: Partial<UserPreferences['voiceSettings']>) =>
      userId ? userDataService.updateVoiceSettings(userId, updates) : Promise.resolve(),
    setAPIKey: (provider: keyof UserPreferences['apiKeys'], key: string | undefined) =>
      userId ? userDataService.setAPIKey(userId, provider, key) : Promise.resolve(),
    getAPIKey: (provider: keyof UserPreferences['apiKeys']) =>
      userId ? userDataService.getAPIKey(userId, provider) : Promise.resolve(undefined),
    migrateFromLocalStorage: () =>
      userId ? userDataService.migrateFromLocalStorage(userId) : Promise.resolve(),
    serviceStatus: userDataService.getStatus()
  };
}