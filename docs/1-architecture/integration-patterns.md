# Integration Patterns & External Services

## Integration Architecture Philosophy

### Core Principles
- **Provider Agnostic**: Easy to swap between different service providers
- **Graceful Degradation**: Fallback mechanisms for service failures
- **Cost Optimization**: Intelligent routing based on cost/quality trade-offs
- **Security First**: Secure credential management and data handling
- **Observable**: Comprehensive monitoring and usage tracking

### Integration Categories

```
External Integrations/
├── AI Providers/
│   ├── Google Gemini (Text & Multimodal)
│   ├── Fal.ai (Image Generation & LoRA)
│   ├── HunyuanWorld (3D Generation)
│   └── Future AI Services
├── Cloud Infrastructure/
│   ├── Supabase (Backend & Auth)
│   ├── Vercel (Frontend Hosting)
│   └── Edge Functions
├── Development Tools/
│   ├── MCP (Model Context Protocol)
│   ├── CLI Tools
│   └── Analytics Services
└── Media Services/
    ├── Image Search (Brave Search API)
    ├── CDN Delivery
    └── File Processing
```

## AI Provider Integration Patterns

### Provider Abstraction Layer

```typescript
interface AIProvider {
  name: string;
  capabilities: AICapabilities[];
  generateText(prompt: string, options: TextGenerationOptions): Promise<TextResponse>;
  generateImage(prompt: string, options: ImageGenerationOptions): Promise<ImageResponse>;
  generateVideo(prompt: string, options: VideoGenerationOptions): Promise<VideoResponse>;
  analyzeImage(imageUrl: string, prompt: string): Promise<AnalysisResponse>;
}

interface AICapabilities {
  text: boolean;
  image: boolean;
  video: boolean;
  multimodal: boolean;
  training: boolean;
  cost: {
    perToken: number;
    perImage: number;
    perVideoSecond: number;
  };
  performance: {
    latency: number;
    reliability: number;
  };
}
```

### Google Gemini Integration

```typescript
class GeminiProvider implements AIProvider {
  name = 'Google Gemini';
  private apiKey: string;
  private client: any;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = this.initializeClient();
  }

  private initializeClient() {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    return new GoogleGenerativeAI(this.apiKey);
  }

  async generateText(prompt: string, options: TextGenerationOptions): Promise<TextResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: options.model || 'gemini-2.5-pro',
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 8192,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;

      return {
        text: response.text(),
        usage: response.usageMetadata,
        model: options.model || 'gemini-2.5-pro',
        provider: this.name
      };

    } catch (error) {
      throw new GeminiError('Text generation failed', error);
    }
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<AnalysisResponse> {
    try {
      // Convert image URL to base64 for Gemini
      const imageData = await this.fetchImageAsBase64(imageUrl);
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash-002' });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;

      return {
        text: response.text(),
        usage: response.usageMetadata,
        model: 'gemini-2.5-flash-002',
        provider: this.name
      };

    } catch (error) {
      // Handle safety filter errors
      if (this.isSafetyFilterError(error)) {
        throw new SafetyFilterError('Content blocked by safety filter', error);
      }
      throw new GeminiError('Image analysis failed', error);
    }
  }

  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }

  private isSafetyFilterError(error: any): boolean {
    return error.status === 400 &&
           error.message?.includes('safety') ||
           error.message?.includes('blocked');
  }
}
```

### Fal.ai Integration Pattern

```typescript
class FalProvider implements AIProvider {
  name = 'Fal.ai';
  private apiKey: string;
  private baseUrl = 'https://fal.run';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(prompt: string, options: ImageGenerationOptions): Promise<ImageResponse> {
    const endpoint = this.selectImageModel(options.quality);

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          num_inference_steps: options.steps || 28,
          guidance_scale: options.guidanceScale || 7.5,
          num_images: options.count || 1,
          width: options.width || 1024,
          height: options.height || 1024,
          // Add LoRA if provided
          adapter_name: options.loraModel,
          adapter_strength: options.loraStrength || 0.8
        })
      });

      if (!response.ok) {
        throw new FalError(`Image generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        images: result.images,
        model: endpoint,
        provider: this.name,
        cost: this.calculateCost(result.images.length, endpoint)
      };

    } catch (error) {
      throw new FalError('Image generation failed', error);
    }
  }

  async trainLoRA(config: LoRATrainingConfig): Promise<LoRATrainingResponse> {
    try {
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
          learning_rate: config.learningRate || 1e-4,
          batch_size: config.batchSize || 1
        })
      });

      if (!response.ok) {
        throw new FalError(`LoRA training submission failed: ${response.statusText}`);
      }

      return response.json();

    } catch (error) {
      throw new FalError('LoRA training failed', error);
    }
  }

  private selectImageModel(quality: 'fast' | 'good' | 'best'): string {
    switch (quality) {
      case 'fast': return 'fal-ai/fast-sdxl';
      case 'good': return 'fal-ai/flux-dev';
      case 'best': return 'fal-ai/flux-pro';
      default: return 'fal-ai/flux-dev';
    }
  }

  private calculateCost(imageCount: number, model: string): number {
    const costs = {
      'fal-ai/fast-sdxl': 0.001,
      'fal-ai/flux-dev': 0.003,
      'fal-ai/flux-pro': 0.005
    };
    return imageCount * (costs[model] || 0.003);
  }
}
```

### Provider Selection & Routing

```typescript
class AIProviderRouter {
  private providers: Map<string, AIProvider> = new Map();
  private costTracker: CostTracker;

  constructor() {
    this.costTracker = new CostTracker();
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  async generateWithIntelligentRouting(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    const candidates = this.selectProviders(request);
    let lastError: Error;

    for (const candidate of candidates) {
      try {
        const provider = this.providers.get(candidate);
        if (!provider) continue;

        const response = await this.executeGeneration(provider, request);

        // Log successful generation
        this.costTracker.logUsage({
          provider: candidate,
          operation: request.type,
          cost: response.cost,
          success: true,
          timestamp: new Date()
        });

        return response;

      } catch (error) {
        lastError = error;

        // Log failed attempt
        this.costTracker.logUsage({
          provider: candidate,
          operation: request.type,
          cost: 0,
          success: false,
          error: error.message,
          timestamp: new Date()
        });

        // Continue to next provider
        continue;
      }
    }

    throw new ProviderExhaustedError('All providers failed', lastError);
  }

  private selectProviders(request: GenerationRequest): string[] {
    const providers = Array.from(this.providers.keys());

    // Sort by cost and performance preferences
    return providers.sort((a, b) => {
      const providerA = this.providers.get(a)!;
      const providerB = this.providers.get(b)!;

      // Prioritize based on request requirements
      if (request.priority === 'cost') {
        return this.getProviderCost(a) - this.getProviderCost(b);
      } else if (request.priority === 'quality') {
        return this.getProviderQuality(b) - this.getProviderQuality(a);
      } else {
        // Balanced approach
        return this.getBalancedScore(b) - this.getBalancedScore(a);
      }
    });
  }

  private async executeGeneration(
    provider: AIProvider,
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    switch (request.type) {
      case 'text':
        return provider.generateText(request.prompt, request.options);
      case 'image':
        return provider.generateImage(request.prompt, request.options);
      case 'video':
        return provider.generateVideo(request.prompt, request.options);
      default:
        throw new Error(`Unsupported generation type: ${request.type}`);
    }
  }
}
```

## Supabase Integration Patterns

### Database Service Pattern

```typescript
class SupabaseDatabaseService {
  private supabase: SupabaseClient;
  private connectionPool: ConnectionPool;

  constructor(config: SupabaseConfig) {
    this.supabase = createClient(config.url, config.anonKey);
    this.connectionPool = new ConnectionPool(config);
  }

  // Generic CRUD operations with type safety
  async create<T extends DatabaseTable>(
    table: T,
    data: DatabaseRow[T]
  ): Promise<DatabaseRow[T]> {
    return this.withRetry(async () => {
      const { data, error } = await this.supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return data;
    }, `create-${table}`);
  }

  async read<T extends DatabaseTable>(
    table: T,
    filters: Partial<DatabaseRow[T]> = {},
    options: QueryOptions = {}
  ): Promise<DatabaseRow[T][]> {
    return this.withRetry(async () => {
      let query = this.supabase
        .from(table)
        .select(options.columns || '*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }, `read-${table}`);
  }

  async update<T extends DatabaseTable>(
    table: T,
    id: string,
    data: Partial<DatabaseRow[T]>
  ): Promise<DatabaseRow[T]> {
    return this.withRetry(async () => {
      const { data: result, error } = await this.supabase
        .from(table)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    }, `update-${table}-${id}`);
  }

  // Real-time subscription pattern
  subscribeToTable<T extends DatabaseTable>(
    table: T,
    filters: Partial<DatabaseRow[T]>,
    onChange: (payload: RealtimePostgresChangesPayload<DatabaseRow[T]>) => void
  ): () => void {
    const channel = this.supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: this.buildFilterString(filters)
        },
        onChange
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string
  ): Promise<T> {
    return this.connectionPool.execute(operationId, operation);
  }

  private buildFilterString<T>(filters: Partial<T>): string {
    return Object.entries(filters)
      .map(([key, value]) => `${key}=eq.${value}`)
      .join('&');
  }
}
```

### Storage Service Pattern

```typescript
class SupabaseStorageService {
  private supabase: SupabaseClient;
  private bucketConfigs: Map<string, BucketConfig> = new Map();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.initializeBuckets();
  }

  private initializeBuckets(): void {
    this.bucketConfigs.set('media-assets', {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'video/mp4', 'video/webm'],
      maxSize: 100 * 1024 * 1024, // 100MB
      transformations: ['resize', 'compress', 'format']
    });

    this.bucketConfigs.set('user-uploads', {
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      maxSize: 50 * 1024 * 1024, // 50MB
      transformations: ['resize', 'compress']
    });
  }

  async uploadFile(
    bucket: string,
    file: File,
    metadata: FileMetadata = {}
  ): Promise<UploadResult> {
    const config = this.bucketConfigs.get(bucket);
    if (!config) {
      throw new Error(`Unknown bucket: ${bucket}`);
    }

    // Validate file
    this.validateFile(file, config);

    // Generate unique path
    const fileExt = file.name.split('.').pop();
    const fileName = `${generateId()}.${fileExt}`;
    const filePath = this.buildFilePath(bucket, fileName, metadata);

    try {
      // Upload file
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          metadata: {
            originalName: file.name,
            size: file.size,
            ...metadata
          }
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        path: filePath,
        publicUrl,
        size: file.size,
        mimeType: file.type,
        metadata: {
          originalName: file.name,
          ...metadata
        }
      };

    } catch (error) {
      throw new StorageError(`Upload failed: ${error.message}`, error);
    }
  }

  async uploadWithProgress(
    bucket: string,
    file: File,
    onProgress: (progress: number) => void,
    metadata: FileMetadata = {}
  ): Promise<UploadResult> {
    // For large files, implement chunked upload
    if (file.size > 10 * 1024 * 1024) { // 10MB
      return this.chunkedUpload(bucket, file, onProgress, metadata);
    }

    // For smaller files, use regular upload with simulated progress
    const result = await this.uploadFile(bucket, file, metadata);

    // Simulate progress for better UX
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      onProgress(progress);
    }, 100);

    return result;
  }

  private async chunkedUpload(
    bucket: string,
    file: File,
    onProgress: (progress: number) => void,
    metadata: FileMetadata
  ): Promise<UploadResult> {
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = generateId();

    // Create upload session
    const session = await this.createUploadSession(bucket, fileId, file.name, metadata);

    // Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      await this.uploadChunk(session.id, chunkIndex, chunk);

      // Update progress
      const progress = ((chunkIndex + 1) / totalChunks) * 100;
      onProgress(progress);
    }

    // Complete upload
    return this.completeUploadSession(session.id);
  }

  private validateFile(file: File, config: BucketConfig): void {
    // Check file type
    if (!config.allowedMimeTypes.includes(file.type)) {
      throw new ValidationError(`File type not allowed: ${file.type}`);
    }

    // Check file size
    if (file.size > config.maxSize) {
      throw new ValidationError(`File too large: ${file.size} bytes`);
    }
  }

  private buildFilePath(bucket: string, fileName: string, metadata: FileMetadata): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const parts = [date];

    if (metadata.projectId) {
      parts.push(metadata.projectId);
    }

    if (metadata.category) {
      parts.push(metadata.category);
    }

    parts.push(fileName);
    return parts.join('/');
  }
}
```

## MCP Integration Patterns

### MCP Client Pattern

```typescript
class MCPClient {
  private connections: Map<string, MCPConnection> = new Map();
  private messageQueue: Map<string, MCPMessage[]> = new Map();

  async connect(serverId: string, config: MCPServerConfig): Promise<void> {
    try {
      const connection = new MCPConnection(serverId, config);
      await connection.connect();

      this.connections.set(serverId, connection);
      this.messageQueue.set(serverId, []);

      // Set up message handler
      connection.onMessage((message) => {
        this.handleMessage(serverId, message);
      });

      console.log(`[MCP] Connected to server: ${serverId}`);

    } catch (error) {
      throw new MCPError(`Failed to connect to ${serverId}`, error);
    }
  }

  async callMethod(
    serverId: string,
    method: string,
    params: any = {}
  ): Promise<any> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`Not connected to server: ${serverId}`);
    }

    const message: MCPMessage = {
      id: generateId(),
      method,
      params,
      timestamp: new Date()
    };

    return new Promise((resolve, reject) => {
      // Set up response handler
      const timeout = setTimeout(() => {
        reject(new Error(`Method call timeout: ${method}`));
      }, 30000); // 30 second timeout

      // Store response handlers
      message.resolve = (result) => {
        clearTimeout(timeout);
        resolve(result);
      };
      message.reject = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      // Send message
      connection.send(message);
    });
  }

  private handleMessage(serverId: string, message: MCPMessage): void {
    if (message.id && (message.resolve || message.reject)) {
      // This is a response to a method call
      if (message.error) {
        message.reject?.(new Error(message.error));
      } else {
        message.resolve?.(message.result);
      }
    } else {
      // This is a server-initiated message
      this.handleServerMessage(serverId, message);
    }
  }

  private handleServerMessage(serverId: string, message: MCPMessage): void {
    console.log(`[MCP] Server message from ${serverId}:`, message);

    // Add to message queue for processing
    const queue = this.messageQueue.get(serverId);
    if (queue) {
      queue.push(message);
    }
  }
}
```

### Supabase MCP Integration

```typescript
class SupabaseMCPService {
  private mcpClient: MCPClient;
  private serverId = 'supabase';

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  async initialize(config: SupabaseMCPConfig): Promise<void> {
    await this.mcpClient.connect(this.serverId, {
      endpoint: config.endpoint,
      auth: {
        type: 'service_role',
        key: config.serviceRoleKey
      }
    });
  }

  // Database operations via MCP
  async executeQuery(sql: string, params: any[] = []): Promise<QueryResult> {
    return this.mcpClient.callMethod(this.serverId, 'database.query', {
      sql,
      params
    });
  }

  async listTables(): Promise<TableInfo[]> {
    return this.mcpClient.callMethod(this.serverId, 'database.list_tables');
  }

  async getTableSchema(tableName: string): Promise<ColumnSchema[]> {
    return this.mcpClient.callMethod(this.serverId, 'database.get_schema', {
      table: tableName
    });
  }

  // Storage operations via MCP
  async listBuckets(): Promise<BucketInfo[]> {
    return this.mcpClient.callMethod(this.serverId, 'storage.list_buckets');
  }

  async uploadFile(
    bucket: string,
    path: string,
    content: ArrayBuffer,
    metadata: any = {}
  ): Promise<UploadInfo> {
    return this.mcpClient.callMethod(this.serverId, 'storage.upload', {
      bucket,
      path,
      content: Array.from(new Uint8Array(content)),
      metadata
    });
  }

  // Function operations via MCP
  async invokeFunction(
    functionName: string,
    payload: any
  ): Promise<FunctionResult> {
    return this.mcpClient.callMethod(this.serverId, 'functions.invoke', {
      name: functionName,
      payload
    });
  }

  // Development operations via MCP
  async createMigration(name: string, sql: string): Promise<MigrationResult> {
    return this.mcpClient.callMethod(this.serverId, 'development.create_migration', {
      name,
      sql
    });
  }

  async applyMigration(version: string): Promise<ApplyResult> {
    return this.mcpClient.callMethod(this.serverId, 'development.apply_migration', {
      version
    });
  }

  // Branch operations via MCP
  async createBranch(name: string): Promise<BranchInfo> {
    return this.mcpClient.callMethod(this.serverId, 'branching.create', {
      name
    });
  }

  async switchBranch(branchId: string): Promise<void> {
    return this.mcpClient.callMethod(this.serverId, 'branching.switch', {
      branch_id: branchId
    });
  }
}
```

## Deployment Integration Patterns

### Vercel Integration Pattern

```typescript
class VercelDeploymentService {
  private vercelToken: string;
  private projectId: string;

  constructor(config: VercelConfig) {
    this.vercelToken = config.token;
    this.projectId = config.projectId;
  }

  async deployPreview(
    branch: string,
    buildCommand: string = 'npm run build'
  ): Promise<DeploymentResult> {
    try {
      // Trigger preview deployment
      const response = await fetch('https://api.vercel.com/v1/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: this.projectId,
          target: 'preview',
          gitSource: {
            type: 'github',
            repo: this.getRepoInfo(),
            ref: branch
          },
          buildCommand,
          outputDirectory: 'dist'
        })
      });

      if (!response.ok) {
        throw new VercelError(`Deployment trigger failed: ${response.statusText}`);
      }

      const deployment = await response.json();

      // Monitor deployment status
      return this.monitorDeployment(deployment.id);

    } catch (error) {
      throw new VercelError('Preview deployment failed', error);
    }
  }

  async deployProduction(): Promise<DeploymentResult> {
    try {
      // Trigger production deployment
      const response = await fetch(`https://api.vercel.com/v13/projects/${this.projectId}/deployments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: 'production'
        })
      });

      if (!response.ok) {
        throw new VercelError(`Production deployment failed: ${response.statusText}`);
      }

      const deployment = await response.json();

      return this.monitorDeployment(deployment.id);

    } catch (error) {
      throw new VercelError('Production deployment failed', error);
    }
  }

  private async monitorDeployment(deploymentId: string): Promise<DeploymentResult> {
    let deployment: any;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      // Check deployment status
      const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`
        }
      });

      deployment = await response.json();

      if (deployment.readyState === 'READY') {
        return {
          id: deployment.id,
          url: deployment.url,
          status: 'success',
          buildTime: deployment.building?.duration,
          deployedAt: deployment.createdAt
        };
      }

      if (deployment.readyState === 'ERROR') {
        throw new VercelError(`Deployment failed: ${deployment.error?.message}`);
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new VercelError('Deployment timeout');
  }

  async setEnvironmentVariables(
    variables: EnvironmentVariable[]
  ): Promise<void> {
    for (const variable of variables) {
      await this.setEnvironmentVariable(variable);
    }
  }

  private async setEnvironmentVariable(
    variable: EnvironmentVariable
  ): Promise<void> {
    const response = await fetch(`https://api.vercel.com/v9/projects/${this.projectId}/env`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: variable.key,
        value: variable.value,
        target: variable.targets || ['production', 'preview', 'development'],
        type: variable.type || 'plain'
      })
    });

    if (!response.ok) {
      throw new VercelError(`Failed to set environment variable: ${variable.key}`);
    }
  }

  private getRepoInfo(): RepoInfo {
    // Extract repo info from git or environment
    return {
      owner: process.env.VERCEL_GIT_REPO_OWNER,
      repo: process.env.VERCEL_GIT_REPO_SLUG,
      branch: process.env.VERCEL_GIT_COMMIT_REF
    };
  }
}
```

## Error Handling & Resilience Patterns

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime: number = 0;
  private successCount = 0;

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private recoveryThreshold: number = 3
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new CircuitBreakerOpenError('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;

    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.recoveryThreshold) {
        this.state = 'closed';
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

### Retry Pattern with Exponential Backoff

```typescript
class RetryManager {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      retryCondition = this.defaultRetryCondition
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();

      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !retryCondition(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitter = delay * 0.1 * Math.random();
        const finalDelay = delay + jitter;

        console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${finalDelay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, finalDelay));
      }
    }

    throw lastError;
  }

  private defaultRetryCondition(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      (error.status >= 500 && error.status < 600) ||
      error.message?.includes('timeout')
    );
  }
}
```

---

**Document Version**: v2.0
**Last Updated**: 2025-11-19
**Related Documents**: [System Overview](./system-overview.md), [Service Layer](./service-layer.md)
**Next Review**: 2025-12-19