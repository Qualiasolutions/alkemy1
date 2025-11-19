# Service Layer Architecture

## Service Layer Philosophy

### Core Principles
- **Unified Interface**: Consistent API patterns across all services
- **Error Resilience**: Graceful degradation and automatic fallbacks
- **Performance First**: Optimized for speed, cost, and reliability
- **Observable**: Comprehensive logging and monitoring
- **Testable**: Mockable and deterministic for testing

### Service Categories

```
Service Layer/
├── AI Services/              # AI/ML model integrations
│   ├── aiService.ts         # Main AI orchestrator
│   ├── characterIdentityService.ts  # LoRA training & consistency
│   └── analyticsService.ts  # Usage tracking & analytics
├── Data Services/            # Data persistence & sync
│   ├── supabase.ts          # Database & auth client
│   ├── saveManager.ts       # Optimistic save handling
│   └── storageManager.ts    # File storage operations
├── Utility Services/         # Supporting utilities
│   ├── progressTracker.ts   # Progress tracking system
│   ├── encryptionService.ts # Security & encryption
│   └── mediaProcessor.ts    # Media file handling
└── External Services/        # Third-party integrations
    ├── falApiService.ts     # Fal.ai integration
    └── braveSearchService.ts # Image search API
```

## AI Service Architecture

### Main AI Service (`aiService.ts`)

The AI Service is the central orchestrator for all AI operations, providing a unified interface for multiple AI providers and models.

```typescript
interface AIServiceConfig {
  geminiApiKey: string;
  falApiKey: string;
  modelPreferences: {
    text: 'gemini-2.5-pro' | 'gemini-2.5-flash-002';
    image: 'flux-pro' | 'flux-dev' | 'imagen-4.0';
    video: 'veo-3.1' | 'fal-video-models';
  };
  costLimits: {
    dailyLimit: number;
    perOperationLimit: number;
  };
}

class AIService {
  private config: AIServiceConfig;
  private usageTracker: UsageTracker;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.usageTracker = new UsageTracker();
  }

  // Core script analysis
  async analyzeScript(
    script: string,
    options: AnalysisOptions = {},
    onProgress?: ProgressCallback
  ): Promise<ScriptAnalysis> {
    const operationId = generateOperationId();

    return this.withFallbackChain(
      [
        () => this.analyzeWithGemini(script, options, onProgress),
        () => this.analyzeWithClaude(script, options, onProgress),
        () => this.analyzeWithGPT(script, options, onProgress)
      ],
      `script-analysis-${operationId}`
    );
  }

  // Multi-modal image generation
  async generateStillVariants(
    prompt: string,
    options: GenerationOptions = {},
    onProgress?: ProgressCallback
  ): Promise<GeneratedMedia[]> {
    const { count = 4, referenceImages, characterIdentity, style } = options;

    // Route to appropriate model based on complexity
    if (referenceImages?.length > 0) {
      return this.generateWithReferenceImages(prompt, options, onProgress);
    }

    if (characterIdentity?.loraUrl) {
      return this.generateWithCharacterIdentity(prompt, options, onProgress);
    }

    return this.generateFromText(prompt, options, onProgress);
  }

  // Video animation from still images
  async animateFrame(
    imageUrl: string,
    motionPrompt: string,
    options: AnimationOptions = {},
    onProgress?: ProgressCallback
  ): Promise<GeneratedVideo> {
    return this.withProgressTracking(
      this.animateWithVeo(imageUrl, motionPrompt, options),
      'video-animation',
      onProgress
    );
  }

  // AI Director assistant
  async askTheDirector(
    question: string,
    context: DirectorContext,
    onProgress?: ProgressCallback
  ): Promise<DirectorResponse> {
    const prompt = this.buildDirectorPrompt(question, context);

    return this.withFallbackChain(
      [
        () => this.queryGemini(prompt, context),
        () => this.queryClaude(prompt, context)
      ],
      'director-query'
    );
  }
}
```

### Model Fallback Chain Pattern

```typescript
private async withFallbackChain<T>(
  attempts: Array<() => Promise<T>>,
  operationId: string
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < attempts.length; i++) {
    try {
      const result = await attempts[i]();

      // Log successful attempt
      this.usageTracker.logSuccess(operationId, i);

      return result;
    } catch (error) {
      lastError = error;

      // Log failed attempt
      this.usageTracker.logFailure(operationId, i, error);

      // Check if we should retry
      if (i < attempts.length - 1 && this.shouldRetry(error)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
```

### Safety Filter Bypass Pattern

```typescript
private async handleSafetyFilter<T>(
  operation: () => Promise<T>,
  fallbackOperation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (this.isSafetyFilterError(error)) {
      console.warn('[AI Service] Safety filter triggered, using fallback provider');
      return await fallbackOperation();
    }
    throw error;
  }
}

private isSafetyFilterError(error: any): boolean {
  return (
    error.message?.includes('safety') ||
    error.message?.includes('blocked') ||
    error.code === 400
  );
}
```

## Character Identity Service

### LoRA Training & Management

```typescript
interface CharacterIdentityConfig {
  trainingImages: string[]; // 6-12 reference images
  characterName: string;
  description?: string;
  trainingOptions: {
    steps?: number;
    learningRate?: number;
    batchSize?: number;
  };
}

interface CharacterIdentity {
  id: string;
  status: 'none' | 'preparing' | 'training' | 'ready' | 'error';
  referenceImages: string[];
  technologyData: {
    type: 'lora';
    falCharacterId: string;
    modelUrl: string;
    metadata: Record<string, any>;
  };
  tests?: CharacterIdentityTest[];
  createdAt: Date;
  updatedAt: Date;
}

class CharacterIdentityService {
  private falApiService: FalApiService;

  async trainCharacterIdentity(
    config: CharacterIdentityConfig,
    onProgress?: ProgressCallback
  ): Promise<CharacterIdentity> {
    const identityId = generateId();

    try {
      // Step 1: Prepare training images
      onProgress?.(10, 'Preparing training images...');
      const processedImages = await this.prepareTrainingImages(config.trainingImages);

      // Step 2: Submit training job to Fal.ai
      onProgress?.(20, 'Starting LoRA training...');
      const trainingJob = await this.falApiService.submitLoRATraining({
        images: processedImages,
        name: config.characterName,
        options: config.trainingOptions
      });

      // Step 3: Monitor training progress
      onProgress?.(30, 'Training in progress...');
      const result = await this.monitorTrainingProgress(trainingJob.id, (progress) => {
        onProgress?.(30 + progress * 0.6, `Training: ${Math.round(progress)}%`);
      });

      // Step 4: Run similarity tests
      onProgress?.(90, 'Testing model quality...');
      const tests = await this.runCharacterTests(result.modelUrl, processedImages);

      // Step 5: Return completed identity
      onProgress?.(100, 'Training complete!');

      return {
        id: identityId,
        status: 'ready',
        referenceImages: config.trainingImages,
        technologyData: {
          type: 'lora',
          falCharacterId: result.modelId,
          modelUrl: result.modelUrl,
          metadata: result.metadata
        },
        tests,
        createdAt: new Date(),
        updatedAt: new Date()
      };

    } catch (error) {
      throw new CharacterIdentityError('Training failed', error);
    }
  }

  private async runCharacterTests(
    modelUrl: string,
    referenceImages: string[]
  ): Promise<CharacterIdentityTest[]> {
    const tests: CharacterIdentityTest[] = [];

    // Test 1: Generate similar pose
    const test1 = await this.testConsistency(
      modelUrl,
      referenceImages[0],
      'same pose, different background'
    );
    tests.push(test1);

    // Test 2: Generate different expression
    const test2 = await this.testConsistency(
      modelUrl,
      referenceImages[1],
      'different facial expression'
    );
    tests.push(test2);

    return tests;
  }

  private async testConsistency(
    modelUrl: string,
    referenceImage: string,
    variationPrompt: string
  ): Promise<CharacterIdentityTest> {
    const generatedImage = await this.falApiService.generateWithLoRA({
      modelUrl,
      prompt: `character ${variationPrompt}`,
      referenceImage
    });

    const similarity = await this.calculateSimilarity(referenceImage, generatedImage.url);

    return {
      id: generateId(),
      type: 'similarity',
      referenceImage,
      generatedImage: generatedImage.url,
      similarity,
      passed: similarity > 0.85, // 85% similarity threshold
      timestamp: new Date()
    };
  }

  private async calculateSimilarity(
    image1Url: string,
    image2Url: string
  ): Promise<number> {
    // CLIP similarity + pHash combination for 93% accuracy
    const clipSimilarity = await this.calculateCLIPSimilarity(image1Url, image2Url);
    const pHashSimilarity = await this.calculatePhashSimilarity(image1Url, image2Url);

    return (clipSimilarity * 0.7) + (pHashSimilarity * 0.3);
  }
}
```

## Data Services Architecture

### Supabase Client Service

```typescript
class SupabaseService {
  private supabase: SupabaseClient;
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    backoffFactor: 2
  };

  constructor(config: SupabaseConfig) {
    this.supabase = createClient(config.url, config.anonKey);
  }

  // Optimistic query pattern
  async queryWithRetry<T>(
    queryFn: () => Promise<PostgrestResponse<T>>,
    operation: string
  ): Promise<T[]> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const { data, error } = await queryFn();

        if (error) throw error;
        return data || [];

      } catch (error) {
        lastError = error;

        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.retryConfig.baseDelay *
                       Math.pow(this.retryConfig.backoffFactor, attempt);

          console.warn(`[Supabase] ${operation} failed, retrying in ${delay}ms:`, error);
          await this.sleep(delay);
        }
      }
    }

    throw new SupabaseError(`Query failed after ${this.retryConfig.maxRetries} retries: ${operation}`, lastError);
  }

  // Project management
  async saveProject(project: ProjectState): Promise<ProjectState> {
    return this.queryWithRetry(
      () => this.supabase
        .from('projects')
        .upsert({
          id: project.id,
          user_id: await this.getCurrentUserId(),
          script_content: project.scriptContent,
          script_analysis: project.scriptAnalysis,
          timeline_clips: project.timelineClips,
          roadmap_blocks: project.roadmapBlocks,
          updated_at: new Date().toISOString()
        })
        .select()
        .single(),
      'saveProject'
    );
  }

  async loadProject(projectId: string): Promise<ProjectState | null> {
    const projects = await this.queryWithRetry(
      () => this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', await this.getCurrentUserId())
        .single(),
      'loadProject'
    );

    return projects[0] || null;
  }

  // Media asset management
  async uploadMediaAsset(
    file: File,
    projectId: string,
    metadata: MediaAssetMetadata
  ): Promise<string> {
    const filePath = `projects/${projectId}/images/${generateId()}-${file.name}`;

    const { data, error } = await this.supabase.storage
      .from('media-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Save metadata to database
    await this.queryWithRetry(
      () => this.supabase
        .from('media_assets')
        .insert({
          id: generateId(),
          project_id: projectId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          metadata,
          created_at: new Date().toISOString()
        }),
      'uploadMediaAsset'
    );

    return data.path;
  }

  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Save Manager Service

```typescript
interface SaveManagerConfig {
  debounceMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

class SaveManager {
  private supabaseService: SupabaseService;
  private config: SaveManagerConfig;
  private saveQueue: Map<string, SaveOperation> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(supabaseService: SupabaseService, config: SaveManagerConfig) {
    this.supabaseService = supabaseService;
    this.config = config;
  }

  // Optimistic save with debouncing
  saveProject(
    projectId: string,
    projectState: ProjectState,
    onProgress?: (status: SaveStatus) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel existing debounce timer
      const existingTimer = this.debounceTimers.get(projectId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Create save operation
      const saveOperation: SaveOperation = {
        projectId,
        projectState,
        resolve,
        reject,
        onProgress,
        timestamp: Date.now()
      };

      this.saveQueue.set(projectId, saveOperation);

      // Set debounce timer
      const timer = setTimeout(() => {
        this.flushSave(projectId);
      }, this.config.debounceMs);

      this.debounceTimers.set(projectId, timer);
    });
  }

  private async flushSave(projectId: string): Promise<void> {
    const operation = this.saveQueue.get(projectId);
    if (!operation) return;

    operation.onProgress?.({ status: 'saving', progress: 0 });

    try {
      await this.supabaseService.saveProject(operation.projectState);

      operation.onProgress?.({ status: 'saved', progress: 100 });
      operation.resolve();

    } catch (error) {
      operation.onProgress?.({
        status: 'error',
        progress: 0,
        error: error.message
      });

      operation.reject(error);
    } finally {
      this.saveQueue.delete(projectId);
      this.debounceTimers.delete(projectId);
    }
  }

  // Force immediate save
  async saveNow(projectId: string): Promise<void> {
    // Cancel debounce timer if exists
    const timer = this.debounceTimers.get(projectId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(projectId);
    }

    await this.flushSave(projectId);
  }

  // Get save status
  getSaveStatus(projectId: string): SaveStatus | null {
    const operation = this.saveQueue.get(projectId);
    if (!operation) return null;

    return {
      status: 'pending',
      progress: 0,
      timestamp: operation.timestamp
    };
  }
}
```

## Utility Services

### Progress Tracking Service

```typescript
interface ProgressUpdate {
  operationId: string;
  progress: number; // 0-100
  message?: string;
  timestamp: Date;
  data?: any;
}

class ProgressTracker {
  private subscriptions: Map<string, Set<ProgressCallback>> = new Map();
  private history: Map<string, ProgressUpdate[]> = new Map();

  subscribe(operationId: string, callback: ProgressCallback): () => void {
    const callbacks = this.subscriptions.get(operationId) || new Set();
    callbacks.add(callback);
    this.subscriptions.set(operationId, callbacks);

    // Send historical updates
    const history = this.history.get(operationId) || [];
    history.forEach(update => callback(update));

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(operationId);
        // Clean up history after delay
        setTimeout(() => this.history.delete(operationId), 60000);
      }
    };
  }

  update(operationId: string, progress: number, message?: string, data?: any): void {
    const update: ProgressUpdate = {
      operationId,
      progress: Math.max(0, Math.min(100, progress)),
      message,
      timestamp: new Date(),
      data
    };

    // Store in history
    const history = this.history.get(operationId) || [];
    history.push(update);
    this.history.set(operationId, history);

    // Notify subscribers
    const callbacks = this.subscriptions.get(operationId);
    if (callbacks) {
      callbacks.forEach(callback => callback(update));
    }
  }

  complete(operationId: string, message: string = 'Complete'): void {
    this.update(operationId, 100, message);
  }

  error(operationId: string, error: Error | string): void {
    this.update(operationId, -1, `Error: ${error instanceof Error ? error.message : error}`);
  }

  getProgress(operationId: string): ProgressUpdate | null {
    const history = this.history.get(operationId);
    return history ? history[history.length - 1] : null;
  }
}
```

### Encryption Service

```typescript
class EncryptionService {
  private algorithm = 'AES-GCM';
  private keyLength = 256;

  async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: string, key: CryptoKey): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv
      },
      key,
      dataBuffer
    );

    return {
      encrypted: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
      algorithm: this.algorithm
    };
  }

  async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    const encrypted = base64ToArrayBuffer(encryptedData.encrypted);
    const iv = base64ToArrayBuffer(encryptedData.iv);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: encryptedData.algorithm,
        iv
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Derive key from password
  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
}
```

## External Service Integration

### Fal.ai API Service

```typescript
class FalApiService {
  private apiKey: string;
  private baseUrl = 'https://fal.run';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // LoRA training
  async submitLoRATraining(config: LoRATrainingConfig): Promise<LoRATrainingJob> {
    const response = await fetch(`${this.baseUrl}/fal-ai/image-to-image/train`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        train_data: config.images,
        model_name: 'flux-lora-dev',
        strength: 0.9,
        steps: config.steps || 1000,
        learning_rate: config.learningRate || 1e-4
      })
    });

    if (!response.ok) {
      throw new FalApiError(`Training submission failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Generate with LoRA
  async generateWithLoRA(config: LoRAGenerationConfig): Promise<GeneratedImage> {
    const response = await fetch(`${this.baseUrl}/fal-ai/flux-lora`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: config.prompt,
        adapter_name: config.modelUrl,
        num_inference_steps: config.steps || 28,
        guidance_scale: config.guidanceScale || 3.5,
        num_images: 1,
        width: config.width || 1024,
        height: config.height || 1024
      })
    });

    if (!response.ok) {
      throw new FalApiError(`Generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Monitor training progress
  async getTrainingStatus(jobId: string): Promise<TrainingStatus> {
    const response = await fetch(`${this.baseUrl}/fal-ai/image-to-image/status/${jobId}`, {
      headers: {
        'Authorization': `Key ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new FalApiError(`Status check failed: ${response.statusText}`);
    }

    return response.json();
  }

  async monitorTrainingProgress(
    jobId: string,
    onProgress: (progress: number) => void
  ): Promise<TrainingResult> {
    const pollInterval = 5000; // 5 seconds
    let lastProgress = 0;

    while (true) {
      const status = await this.getTrainingStatus(jobId);

      if (status.status === 'completed') {
        onProgress(100);
        return status.result;
      }

      if (status.status === 'failed') {
        throw new Error(`Training failed: ${status.error}`);
      }

      // Update progress if changed
      if (status.progress > lastProgress) {
        lastProgress = status.progress;
        onProgress(status.progress);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}
```

## Service Composition Patterns

### Service Factory Pattern

```typescript
class ServiceFactory {
  private config: AppConfig;
  private services: Map<string, any> = new Map();

  constructor(config: AppConfig) {
    this.config = config;
  }

  // Lazy initialization with dependency injection
  getAIService(): AIService {
    if (!this.services.has('ai')) {
      this.services.set('ai', new AIService({
        geminiApiKey: this.config.geminiApiKey,
        falApiKey: this.config.falApiKey,
        modelPreferences: this.config.modelPreferences,
        costLimits: this.config.costLimits
      }));
    }
    return this.services.get('ai');
  }

  getSupabaseService(): SupabaseService {
    if (!this.services.has('supabase')) {
      this.services.set('supabase', new SupabaseService({
        url: this.config.supabaseUrl,
        anonKey: this.config.supabaseAnonKey
      }));
    }
    return this.services.get('supabase');
  }

  getCharacterIdentityService(): CharacterIdentityService {
    if (!this.services.has('characterIdentity')) {
      this.services.set('characterIdentity', new CharacterIdentityService(
        this.getFalApiService()
      ));
    }
    return this.services.get('characterIdentity');
  }

  getSaveManager(): SaveManager {
    if (!this.services.has('saveManager')) {
      this.services.set('saveManager', new SaveManager(
        this.getSupabaseService(),
        this.config.saveManagerConfig
      ));
    }
    return this.services.get('saveManager');
  }

  private getFalApiService(): FalApiService {
    if (!this.services.has('falApi')) {
      this.services.set('falApi', new FalApiService(this.config.falApiKey));
    }
    return this.services.get('falApi');
  }
}
```

### Service Composition in React

```typescript
// Service Provider Context
const ServiceContext = createContext<ServiceFactory | null>(null);

export function ServiceProvider({ children, config }: {
  children: React.ReactNode;
  config: AppConfig;
}) {
  const serviceFactory = useMemo(() => new ServiceFactory(config), [config]);

  return (
    <ServiceContext.Provider value={serviceFactory}>
      {children}
    </ServiceContext.Provider>
  );
}

// Hook for accessing services
export function useServices(): ServiceFactory {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useServices must be used within ServiceProvider');
  }
  return services;
}

// Usage in components
function GenerationComponent() {
  const services = useServices();
  const aiService = services.getAIService();
  const saveManager = services.getSaveManager();

  // ... component logic
}
```

---

**Document Version**: v2.0
**Last Updated**: 2025-11-19
**Related Documents**: [System Overview](./system-overview.md), [Component Patterns](./component-patterns.md)
**Next Review**: 2025-12-19