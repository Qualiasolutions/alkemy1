/**
 * UserDataService
 *
 * Manages user-specific preferences and settings in Supabase.
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

class UserDataService {
  private cache: Map<string, UserPreferences> = new Map();
  private saveDebouncer: Map<string, NodeJS.Timeout> = new Map();
  private readonly SAVE_DELAY = 1000; // 1 second debounce

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

      const preferences: UserPreferences = {
        uiState: data.ui_state || DEFAULT_PREFERENCES.uiState,
        voiceSettings: data.voice_settings || DEFAULT_PREFERENCES.voiceSettings,
        styleLearningEnabled: data.style_learning_enabled ?? DEFAULT_PREFERENCES.styleLearningEnabled,
        styleOptInShown: data.style_opt_in_shown ?? DEFAULT_PREFERENCES.styleOptInShown,
        apiKeys: data.api_keys || DEFAULT_PREFERENCES.apiKeys,
        createdAt: data.created_at,
        updatedAt: data.updated_at
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

    // Debounce the database update
    this.debouncedSave(userId, key, value);
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

    // Save to database
    try {
      const dbData = this.toDbFormat(updates);

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...dbData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('[UserDataService] Batch update failed:', error);
      // Revert cache on error
      this.cache.delete(userId);
      throw error;
    }
  }

  /**
   * Clear user preferences cache
   */
  clearCache(userId?: string) {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
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

      const preferences: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      this.cache.set(userId, preferences);
      return preferences;

    } catch (error) {
      console.error('[UserDataService] Failed to create default preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  private debouncedSave(userId: string, key: string, value: any) {
    // Clear existing debouncer for this user/key combo
    const debounceKey = `${userId}-${key}`;
    if (this.saveDebouncer.has(debounceKey)) {
      clearTimeout(this.saveDebouncer.get(debounceKey)!);
    }

    // Set new debouncer
    const timeout = setTimeout(async () => {
      await this.persistPreference(userId, key, value);
      this.saveDebouncer.delete(debounceKey);
    }, this.SAVE_DELAY);

    this.saveDebouncer.set(debounceKey, timeout);
  }

  private async persistPreference(userId: string, key: string, value: any) {
    try {
      const dbField = this.getDbField(key);
      const dbValue = key === 'apiKeys' ? this.encryptKeys(value) : value;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          [dbField]: dbValue,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error(`[UserDataService] Failed to persist ${key}:`, error);
      // Clear cache on error to force reload
      this.cache.delete(userId);
    }
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
    // Clear all debouncers
    this.saveDebouncer.forEach(timeout => clearTimeout(timeout));
    this.saveDebouncer.clear();
    this.cache.clear();
  }
}

// Add React import
import * as React from 'react';

// Export singleton instance
export const userDataService = new UserDataService();

// React hook for easy component integration
export function useUserPreferences(userId: string | null) {
  const [preferences, setPreferences] = React.useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }

    // Load preferences
    userDataService.getUserPreferences(userId)
      .then(setPreferences)
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

      // Persist to database
      await userDataService.updatePreference(userId, key, value);
    },
    [userId]
  );

  return {
    preferences,
    loading,
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
      userId ? userDataService.migrateFromLocalStorage(userId) : Promise.resolve()
  };
}