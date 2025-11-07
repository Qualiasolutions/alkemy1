const toTrimmed = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const safeGetImportMetaEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any)?.env) {
    return toTrimmed((import.meta as any).env[key]);
  }
  return '';
};

const getProcessEnvValue = (key: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return toTrimmed(process.env[key]);
  }
  return '';
};

const envCandidates = [
  getProcessEnvValue('GEMINI_API_KEY'),
  getProcessEnvValue('API_KEY'),
  safeGetImportMetaEnv('VITE_GEMINI_API_KEY'),
  safeGetImportMetaEnv('GEMINI_API_KEY'),
];

const ENV_GEMINI_KEY = envCandidates.find((candidate) => candidate.length > 0) ?? '';

const LOCAL_STORAGE_KEYS = ['alkemy_gemini_api_key', 'geminiApiKey'];
const GEMINI_STORAGE_EVENT = 'alkemy:gemini-key-changed';

// Initialize cache with env key, will be overridden by localStorage on first getGeminiApiKey() call
let cachedGeminiKey = ENV_GEMINI_KEY;

// Eagerly load from localStorage on module initialization to prevent re-prompting
const initializeCache = (): string => {
  if (ENV_GEMINI_KEY) {
    return ENV_GEMINI_KEY; // Environment key takes priority
  }
  // Try localStorage immediately on module load
  if (typeof window !== 'undefined') {
    for (const key of LOCAL_STORAGE_KEYS) {
      const value = toTrimmed(window.localStorage.getItem(key));
      if (value) {
        return value;
      }
    }
  }
  return '';
};

// Initialize cache immediately to prevent API key prompt on every load
cachedGeminiKey = initializeCache();

// Debug logging to help diagnose API key issues (deferred to avoid init errors)
if (typeof window !== 'undefined') {
  // Use setTimeout to defer logging until after module initialization completes
  setTimeout(() => {
    console.log('[API Keys] Initialization:', {
      hasEnvKey: !!ENV_GEMINI_KEY,
      hasCachedKey: !!cachedGeminiKey,
      keySource: ENV_GEMINI_KEY ? 'environment' : (cachedGeminiKey ? 'localStorage' : 'none'),
      keyPrefix: cachedGeminiKey ? cachedGeminiKey.substring(0, 10) + '...' : 'N/A'
    });
  }, 0);
}

const readFromLocalStorage = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  for (const key of LOCAL_STORAGE_KEYS) {
    const value = toTrimmed(window.localStorage.getItem(key));
    if (value) {
      return value;
    }
  }
  return '';
};

const writeToLocalStorage = (value: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!value) {
    LOCAL_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  } else {
    window.localStorage.setItem(LOCAL_STORAGE_KEYS[0], value);
  }
  window.dispatchEvent(new CustomEvent(GEMINI_STORAGE_EVENT, { detail: value }));
};

export const getGeminiApiKey = (): string => {
  if (cachedGeminiKey) {
    return cachedGeminiKey;
  }
  const fromStorage = readFromLocalStorage();
  if (fromStorage) {
    cachedGeminiKey = fromStorage;
    return cachedGeminiKey;
  }
  return '';
};

export const setGeminiApiKey = (value: string) => {
  const trimmed = toTrimmed(value);
  cachedGeminiKey = trimmed || ENV_GEMINI_KEY;
  writeToLocalStorage(trimmed);
};

export const clearGeminiApiKey = () => {
  cachedGeminiKey = ENV_GEMINI_KEY;
  writeToLocalStorage('');
};

export const onGeminiApiKeyChange = (callback: (value: string) => void): (() => void) => {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<string>).detail ?? readFromLocalStorage();
    cachedGeminiKey = detail || ENV_GEMINI_KEY;
    callback(cachedGeminiKey);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(GEMINI_STORAGE_EVENT, handler as EventListener);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(GEMINI_STORAGE_EVENT, handler as EventListener);
    }
  };
};

/**
 * Validates if the API key format is compatible with Google AI API
 * AI Studio keys (starting with "AQ.") are NOT compatible with programmatic API access
 * Valid API keys should start with "AIza"
 */
export const isValidGeminiApiKeyFormat = (key: string): boolean => {
  const trimmed = toTrimmed(key);
  if (!trimmed) return false;

  // Check for AI Studio key format (not compatible with API)
  if (trimmed.startsWith('AQ.')) {
    console.error('[API Keys] Invalid API key format detected: AI Studio keys (AQ.*) cannot be used with the Gemini API. Please use a Google AI API key (AIza...) instead.');
    return false;
  }

  // Valid Google AI API keys typically start with "AIza" and are 39 characters
  if (trimmed.startsWith('AIza') && trimmed.length === 39) {
    return true;
  }

  // Warn about unexpected format but don't block (might be a new format)
  console.warn('[API Keys] Unexpected API key format. Expected format: AIzaSy... (39 characters). Key starts with:', trimmed.substring(0, 6));
  return trimmed.length > 20; // Minimum length check
};

export const hasGeminiApiKey = (): boolean => {
  return getGeminiApiKey().length > 0;
};

export const hasValidGeminiApiKey = (): boolean => {
  const key = getGeminiApiKey();
  return isValidGeminiApiKeyFormat(key);
};

export const hasEnvGeminiApiKey = (): boolean => ENV_GEMINI_KEY.length > 0;

export const getApiKeyValidationError = (): string | null => {
  const key = getGeminiApiKey();
  if (!key) {
    return 'No API key configured. Please add a Google AI API key.';
  }
  if (key.startsWith('AQ.')) {
    return 'Invalid API key: AI Studio keys (starting with "AQ.") cannot be used with the Gemini API. Please generate a Google AI API key from https://aistudio.google.com/apikey and use that instead.';
  }
  if (!isValidGeminiApiKeyFormat(key)) {
    return 'API key format appears invalid. Google AI API keys should start with "AIza" and be 39 characters long. Please verify your key at https://aistudio.google.com/apikey';
  }
  return null;
};
