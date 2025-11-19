# Frontend Development Guide

## Frontend Architecture Overview

Alkemy AI Studio V2.0 uses a modern React 19 + TypeScript frontend architecture optimized for AI-powered creative workflows. The frontend is designed to handle complex state management, real-time AI generation, and high-performance media rendering.

### Technology Stack

```typescript
interface FrontendStack {
  framework: {
    react: '19.2.0';
    typescript: '5.8.2';
  };
  build: {
    vite: '6.0.3';
    plugins: ['@vitejs/plugin-react', 'vite-plugin-pwa'];
  };
  styling: {
    tailwindcss: '3.4.17';
    framerMotion: '12.3.4';
    radixUI: 'latest';
  };
  state: {
    reactContext: 'built-in';
    reactHooks: 'built-in';
    localforage: '1.10.0';
  };
  testing: {
    vitest: 'latest';
    testingLibrary: '@testing-library/react';
    jsdom: 'latest';
  };
}
```

## Project Structure

### Frontend Directory Organization

```
src/
├── components/              # Reusable UI components
│   ├── ui/                 # Base UI primitives (Radix UI + extensions)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   └── index.ts         # Barrel exports
│   ├── forms/              # Form components with validation
│   │   ├── script-upload.tsx
│   │   ├── character-form.tsx
│   │   └── location-form.tsx
│   ├── generation/         # AI generation components
│   │   ├── generation-panel.tsx
│   │   ├── progress-indicator.tsx
│   │   ├── variant-selector.tsx
│   │   └── result-display.tsx
│   ├── auth/               # Authentication components
│   │   ├── auth-provider.tsx
│   │   ├── login-form.tsx
│   │   └── user-profile.tsx
│   ├── media/              # Media display and manipulation
│   │   ├── image-viewer.tsx
│   │   ├── video-player.tsx
│   │   ├── media-gallery.tsx
│   │   └── fullscreen-view.tsx
│   └── layout/             # Layout components
│       ├── header.tsx
│       ├── sidebar.tsx
│       ├── main-content.tsx
│       └── tab-container.tsx
├── tabs/                   # Smart containers for workflow tabs
│   ├── script-tab.tsx
│   ├── moodboard-tab.tsx
│   ├── cast-locations-tab.tsx
│   ├── scene-assembler-tab.tsx
│   ├── 3d-worlds-tab.tsx
│   ├── post-production-tab.tsx
│   └── analytics-tab.tsx
├── services/               # API and business logic services
│   ├── ai-service.ts
│   ├── supabase.ts
│   ├── save-manager.ts
│   ├── character-identity.ts
│   └── analytics.ts
├── hooks/                  # Custom React hooks
│   ├── use-save-state.ts
│   ├── use-generation.ts
│   ├── use-auth.ts
│   ├── use-media-upload.ts
│   └── use-progress-tracking.ts
├── types.ts              # Global TypeScript definitions
├── utils/                # Utility functions
│   ├── formatting.ts
│   ├── validation.ts
│   ├── constants.ts
│   └── helpers.ts
├── styles/               # Global styles and configurations
│   ├── globals.css
│   └── components.css
└── App.tsx              # Main application component
```

## Component Architecture

### Component Design Patterns

#### 1. Presentational vs Container Pattern

```typescript
// Presentational Component (UI only)
interface GenerationPanelProps {
  title: string;
  description: string;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  progress: number;
  children?: React.ReactNode;
}

function GenerationPanel({
  title,
  description,
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  progress,
  children
}: GenerationPanelProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe what you want to generate..."
          disabled={isGenerating}
          rows={4}
        />

        {children}

        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Generating... {Math.round(progress)}%
            </p>
          </div>
        )}

        <Button
          onClick={onGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Container Component (Logic + State)
function ImageGenerationContainer() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<GeneratedImage[]>([]);

  const aiService = useAIService();

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress(0);

    try {
      const generatedImages = await aiService.generateImages(prompt, {
        onProgress: (p) => setProgress(p),
        count: 4
      });

      setResults(generatedImages);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [prompt, aiService]);

  return (
    <GenerationPanel
      title="Image Generation"
      description="Generate images using AI models"
      prompt={prompt}
      onPromptChange={setPrompt}
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      progress={progress}
    >
      <ImageOptionsPanel />
    </GenerationPanel>
  );
}
```

#### 2. Compound Component Pattern

```typescript
// Media Gallery Compound Component
interface MediaGalleryProps {
  children: React.ReactNode;
  className?: string;
}

interface MediaGalleryContextValue {
  selectedItems: string[];
  toggleSelection: (id: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

const MediaGalleryContext = createContext<MediaGalleryContextValue | null>(null);

function MediaGallery({ children, className }: MediaGalleryProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  const contextValue: MediaGalleryContextValue = {
    selectedItems,
    toggleSelection,
    viewMode,
    setViewMode
  };

  return (
    <MediaGalleryContext.Provider value={contextValue}>
      <div className={cn('media-gallery', className)}>
        {children}
      </div>
    </MediaGalleryContext.Provider>
  );
}

// Sub-components
MediaGallery.Header = function MediaGalleryHeader({ children }: { children: React.ReactNode }) {
  return <div className="media-gallery-header">{children}</div>;
};

MediaGallery.Toolbar = function MediaGalleryToolbar() {
  const { selectedItems, viewMode, setViewMode } = useContext(MediaGalleryContext)!;

  return (
    <div className="media-gallery-toolbar flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">
          {selectedItems.length} selected
        </span>
        {selectedItems.length > 0 && (
          <Button variant="outline" size="sm">
            Delete Selected
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value: 'grid' | 'list') => value && setViewMode(value)}
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid3X3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};

MediaGallery.Grid = function MediaGalleryGrid({ items }: { items: MediaItem[] }) {
  const { selectedItems, toggleSelection, viewMode } = useContext(MediaGalleryContext)!;

  if (viewMode !== 'grid') return null;

  return (
    <div className="media-gallery-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map(item => (
        <MediaGalleryItem
          key={item.id}
          item={item}
          isSelected={selectedItems.includes(item.id)}
          onToggleSelect={() => toggleSelection(item.id)}
        />
      ))}
    </div>
  );
};

// Usage
<MediaGallery>
  <MediaGallery.Header>
    <h2>Media Assets</h2>
  </MediaGallery.Header>
  <MediaGallery.Toolbar />
  <MediaGallery.Grid items={mediaItems} />
</MediaGallery>
```

#### 3. Render Props Pattern

```typescript
// Progress Tracker with Render Props
interface ProgressTrackerProps {
  operationId: string;
  children: (props: ProgressRenderProps) => React.ReactNode;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface ProgressRenderProps {
  progress: number;
  message: string;
  isActive: boolean;
  isComplete: boolean;
  hasError: boolean;
  error?: Error;
}

function ProgressTracker({
  operationId,
  children,
  onComplete,
  onError
}: ProgressTrackerProps) {
  const [state, setState] = useState<ProgressState>({
    progress: 0,
    message: 'Starting...',
    isActive: false,
    isComplete: false,
    hasError: false,
    error: undefined
  });

  useEffect(() => {
    const progressTracker = getProgressTracker();

    const unsubscribe = progressTracker.subscribe(operationId, (update) => {
      setState(prev => ({
        ...prev,
        progress: update.progress,
        message: update.message || prev.message,
        isActive: update.progress >= 0 && update.progress < 100,
        isComplete: update.progress === 100,
        hasError: update.progress === -1,
        error: update.progress === -1 ? new Error(update.message) : undefined
      }));

      if (update.progress === 100) {
        onComplete?.();
      } else if (update.progress === -1) {
        onError?.(new Error(update.message));
      }
    });

    return unsubscribe;
  }, [operationId, onComplete, onError]);

  return <>{children(state)}</>;
}

// Usage
<ProgressTracker
  operationId="image-generation-123"
  onComplete={() => toast.success('Generation complete!')}
  onError={(error) => toast.error(`Generation failed: ${error.message}`)}
>
  {({ progress, message, isActive, isComplete, hasError }) => (
    <div className="progress-container">
      {isActive && (
        <>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">{message}</p>
        </>
      )}
      {isComplete && (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-2" />
          Generation complete
        </div>
      )}
      {hasError && (
        <div className="flex items-center text-red-600">
          <XCircle className="h-4 w-4 mr-2" />
          Generation failed
        </div>
      )}
    </div>
  )}
</ProgressTracker>
```

## State Management Patterns

### Global State with React Context

```typescript
// Application State Types
interface AppState {
  user: User | null;
  currentProject: Project | null;
  projects: Project[];
  ui: {
    sidebarOpen: boolean;
    activeTab: string;
    theme: 'light' | 'dark';
    leftPanelWidth: number;
    rightPanelWidth: number;
  };
  generation: {
    activeOperations: Map<string, GenerationOperation>;
    history: GenerationHistory[];
  };
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    setUser: (user: User | null) => void;
    setCurrentProject: (project: Project | null) => void;
    updateUI: (updates: Partial<AppState['ui']>) => void;
    startGeneration: (operation: GenerationOperation) => void;
    completeGeneration: (operationId: string, result: GenerationResult) => void;
  };
}

// App Context Provider
const AppContext = createContext<AppContextValue | null>(null);

function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  // Memoize actions to prevent unnecessary re-renders
  const actions = useMemo(() => ({
    setUser: (user: User | null) => dispatch({ type: 'SET_USER', payload: user }),
    setCurrentProject: (project: Project | null) =>
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: project }),
    updateUI: (updates: Partial<AppState['ui']>) =>
      dispatch({ type: 'UPDATE_UI', payload: updates }),
    startGeneration: (operation: GenerationOperation) =>
      dispatch({ type: 'START_GENERATION', payload: operation }),
    completeGeneration: (operationId: string, result: GenerationResult) =>
      dispatch({ type: 'COMPLETE_GENERATION', payload: { operationId, result } })
  }), []);

  const contextValue: AppContextValue = {
    state,
    dispatch,
    actions
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook for accessing app state
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
```

### Local State with Custom Hooks

```typescript
// Generation Hook
interface UseGenerationOptions {
  onSuccess?: (result: GenerationResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number, message: string) => void;
}

function useGeneration(options: UseGenerationOptions = {}) {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    message: '',
    result: null,
    error: null
  });

  const { actions } = useApp();

  const generate = useCallback(async (
    prompt: string,
    generationOptions: GenerationOptions = {}
  ) => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      progress: 0,
      message: 'Starting generation...',
      error: null
    }));

    const operationId = generateId();

    try {
      // Register operation with global state
      actions.startGeneration({
        id: operationId,
        type: generationOptions.type || 'image',
        prompt,
        status: 'active',
        startTime: Date.now()
      });

      // Start generation
      const result = await aiService.generate(prompt, {
        ...generationOptions,
        operationId,
        onProgress: (progress, message) => {
          setState(prev => ({
            ...prev,
            progress,
            message: message || prev.message
          }));
          options.onProgress?.(progress, message);
        }
      });

      // Update state with result
      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 100,
        message: 'Complete!',
        result
      }));

      // Complete operation in global state
      actions.completeGeneration(operationId, result);

      options.onSuccess?.(result);

    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error as Error,
        message: 'Generation failed'
      }));

      options.onError?.(error as Error);
    }
  }, [actions, options]);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      message: '',
      result: null,
      error: null
    });
  }, []);

  return {
    ...state,
    generate,
    reset
  };
}
```

### Persistent State with Supabase

```typescript
// Persistent State Hook
function usePersistentState<T>(
  key: string,
  initialValue: T,
  options: {
    userId?: string;
    projectId?: string;
    encrypt?: boolean;
  } = {}
) {
  const [state, setState] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useSupabase();

  // Load state from Supabase on mount
  useEffect(() => {
    async function loadState() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('user_preferences')
          .select('value')
          .eq('key', key)
          .eq('user_id', options.userId || 'anonymous')
          .single();

        if (error && error.code !== 'PGRST116') { // Not found error
          throw error;
        }

        if (data) {
          let value = data.value;

          // Decrypt if needed
          if (options.encrypt) {
            value = await decryptData(value);
          }

          setState(value);
        }
      } catch (error) {
        setError(error as Error);
        console.error(`Failed to load persistent state for key: ${key}`, error);
      } finally {
        setIsLoading(false);
      }
    }

    loadState();
  }, [key, options.userId, supabase, options.encrypt]);

  // Save state to Supabase when it changes
  const saveState = useCallback(async (newValue: T) => {
    try {
      let valueToSave = newValue;

      // Encrypt if needed
      if (options.encrypt) {
        valueToSave = await encryptData(newValue);
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          key,
          value: valueToSave,
          user_id: options.userId || 'anonymous',
          project_id: options.projectId,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      setState(newValue);
    } catch (error) {
      setError(error as Error);
      console.error(`Failed to save persistent state for key: ${key}`, error);
    }
  }, [key, options.userId, options.projectId, supabase, options.encrypt]);

  return [state, saveState, { isLoading, error }] as const;
}
```

## Performance Optimization

### Code Splitting and Lazy Loading

```typescript
// Route-based code splitting
const ScriptTab = lazy(() => import('../tabs/script-tab'));
const MoodboardTab = lazy(() => import('../tabs/moodboard-tab'));
const SceneAssemblerTab = lazy(() => import('../tabs/scene-assembler-tab'));
const ThreeDWorldsTab = lazy(() => import('../tabs/3d-worlds-tab'));

// Component-based lazy loading
const HeavyComponent = lazy(() =>
  import('../components/heavy-component').then(module => ({
    default: module.HeavyComponent
  }))
);

// Tab system with lazy loading
function TabSystem() {
  const [activeTab, setActiveTab] = useState('script');

  const renderTab = useCallback(() => {
    switch (activeTab) {
      case 'script':
        return (
          <Suspense fallback={<TabSkeleton />}>
            <ScriptTab />
          </Suspense>
        );
      case 'moodboard':
        return (
          <Suspense fallback={<TabSkeleton />}>
            <MoodboardTab />
          </Suspense>
        );
      case 'scene-assembler':
        return (
          <Suspense fallback={<TabSkeleton />}>
            <SceneAssemblerTab />
          </Suspense>
        );
      case '3d-worlds':
        return (
          <Suspense fallback={<TabSkeleton />}>
            <ThreeDWorldsTab />
          </Suspense>
        );
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div className="tab-system">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="tab-content">
        {renderTab()}
      </div>
    </div>
  );
}
```

### Memoization and Optimization

```typescript
// Expensive component with memoization
interface ExpensiveListComponentProps {
  items: ComplexItem[];
  selectedItem: string | null;
  onSelectItem: (id: string) => void;
  filter: string;
}

const ExpensiveListComponent = memo(function ExpensiveListComponent({
  items,
  selectedItem,
  onSelectItem,
  filter
}: ExpensiveListComponentProps) {
  // Memoize filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  // Memoize item renderer
  const renderItem = useCallback((item: ComplexItem) => {
    const isSelected = selectedItem === item.id;

    return (
      <ExpensiveListItem
        key={item.id}
        item={item}
        isSelected={isSelected}
        onClick={() => onSelectItem(item.id)}
      />
    );
  }, [selectedItem, onSelectItem]);

  return (
    <div className="expensive-list">
      {filteredItems.map(renderItem)}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.items === nextProps.items &&
    prevProps.selectedItem === nextProps.selectedItem &&
    prevProps.filter === nextProps.filter &&
    prevProps.onSelectItem === nextProps.onSelectItem
  );
});
```

### Virtualization for Large Lists

```typescript
// Virtual list implementation
import { FixedSizeList as List } from 'react-window';

interface VirtualListProps {
  items: any[];
  itemHeight: number;
  height: number;
  renderItem: (props: { index: number; style: CSSProperties }) => React.ReactNode;
}

function VirtualList({ items, itemHeight, height, renderItem }: VirtualListProps) {
  const Row = useCallback(({ index, style }: { index: number; style: CSSProperties }) => {
    return renderItem({ index, style });
  }, [renderItem]);

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
}

// Usage with media gallery
function VirtualMediaGallery({ mediaItems }: { mediaItems: MediaItem[] }) {
  const renderItem = useCallback(({ index, style }: { index: number; style: CSSProperties }) => {
    const item = mediaItems[index];

    return (
      <div style={style}>
        <MediaItemCard item={item} />
      </div>
    );
  }, [mediaItems]);

  return (
    <VirtualList
      items={mediaItems}
      itemHeight={200}
      height={600}
      renderItem={renderItem}
    />
  );
}
```

## Error Handling and Validation

### Error Boundaries

```typescript
// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<
  PropsWithChildren<{
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log to error tracking service
    logError(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error!}
          retry={this.retry}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="error-boundary-fallback p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
        <h2 className="text-lg font-semibold text-red-800">
          Something went wrong
        </h2>
      </div>

      <p className="text-red-600 mb-4">
        An unexpected error occurred while rendering this component.
      </p>

      <details className="mb-4">
        <summary className="cursor-pointer text-sm text-red-500 hover:text-red-700">
          Error details
        </summary>
        <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
          {error.stack || error.message}
        </pre>
      </details>

      <Button onClick={retry} variant="outline">
        Try again
      </Button>
    </div>
  );
}
```

### Form Validation

```typescript
// Form validation with Zod
import { z } from 'zod';

const scriptUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  content: z.string().min(100, 'Script must be at least 100 characters'),
  genre: z.enum(['drama', 'comedy', 'action', 'thriller', 'sci-fi'], {
    errorMap: () => ({ message: 'Please select a valid genre' })
  }),
  estimatedRuntime: z.number().min(1, 'Runtime must be at least 1 minute').max(300, 'Runtime cannot exceed 300 minutes'),
  characters: z.array(z.string()).min(1, 'At least one character is required')
});

type ScriptUploadForm = z.infer<typeof scriptUploadSchema>;

function ScriptUploadForm() {
  const [formData, setFormData] = useState<ScriptUploadForm>({
    title: '',
    content: '',
    genre: 'drama',
    estimatedRuntime: 90,
    characters: []
  });

  const [errors, setErrors] = useState<z.ZodIssue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const result = scriptUploadSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.issues);
      return false;
    }

    setErrors([]);
    return true;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit form
      await submitScript(formData);
      toast.success('Script uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload script. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: keyof ScriptUploadForm) => {
    return errors.find(error => error.path[0] === field)?.message;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={getFieldError('title') ? 'border-red-500' : ''}
        />
        {getFieldError('title') && (
          <p className="text-sm text-red-500 mt-1">{getFieldError('title')}</p>
        )}
      </div>

      {/* Other form fields... */}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Uploading...' : 'Upload Script'}
      </Button>
    </form>
  );
}
```

## Testing Strategy

### Component Testing

```typescript
// Component test example
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerationPanel } from '../generation-panel';

// Mock AI service
jest.mock('../../services/ai-service', () => ({
  useAIService: () => ({
    generateImages: jest.fn().mockResolvedValue([
      { id: '1', url: 'image1.jpg' },
      { id: '2', url: 'image2.jpg' }
    ])
  })
}));

describe('GenerationPanel', () => {
  it('renders generation form correctly', () => {
    render(
      <GenerationPanel
        title="Test Generation"
        description="Test description"
        prompt=""
        onPromptChange={jest.fn()}
        onGenerate={jest.fn()}
        isGenerating={false}
        progress={0}
      />
    );

    expect(screen.getByText('Test Generation')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
  });

  it('enables generate button when prompt is provided', async () => {
    const onPromptChange = jest.fn();
    const onGenerate = jest.fn();

    render(
      <GenerationPanel
        title="Test Generation"
        description="Test description"
        prompt=""
        onPromptChange={onPromptChange}
        onGenerate={onGenerate}
        isGenerating={false}
        progress={0}
      />
    );

    const textarea = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: 'Generate' });

    await userEvent.type(textarea, 'A beautiful sunset');

    expect(onPromptChange).toHaveBeenCalledWith('A beautiful sunset');
    expect(button).toBeEnabled();

    await userEvent.click(button);
    expect(onGenerate).toHaveBeenCalled();
  });

  it('shows loading state during generation', () => {
    render(
      <GenerationPanel
        title="Test Generation"
        description="Test description"
        prompt="test prompt"
        onPromptChange={jest.fn()}
        onGenerate={jest.fn()}
        isGenerating={true}
        progress={45}
      />
    );

    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generating...' })).toBeDisabled();
  });
});
```

### Hook Testing

```typescript
// Hook testing example
import { renderHook, act } from '@testing-library/react';
import { useGeneration } from '../hooks/use-generation';

describe('useGeneration', () => {
  it('starts with initial state', () => {
    const { result } = renderHook(() => useGeneration());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.result).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('generates successfully', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useGeneration({ onSuccess }));

    await act(async () => {
      await result.current.generate('test prompt');
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.progress).toBe(100);
    expect(result.current.result).not.toBe(null);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('handles generation errors', async () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useGeneration({ onError }));

    // Mock failed generation
    jest.spyOn(aiService, 'generate').mockRejectedValue(new Error('Generation failed'));

    await act(async () => {
      await result.current.generate('test prompt');
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(onError).toHaveBeenCalled();
  });
});
```

## Accessibility

### Accessibility Best Practices

```typescript
// Accessible component example
function AccessibleDialog({ isOpen, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogRef}
        className="max-w-md mx-auto"
        onKeyDown={handleKeyDown}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">{title}</DialogTitle>
          <DialogDescription id="dialog-description">
            {/* Description content */}
          </DialogDescription>
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={onClose}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Accessible form controls
function AccessibleFormField({
  id,
  label,
  error,
  required,
  children
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {children}

      {error && (
        <p id={`${id}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Usage
<AccessibleFormField
  id="email"
  label="Email Address"
  error={emailError}
  required
>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    aria-invalid={!!emailError}
    aria-describedby={emailError ? 'email-error' : undefined}
  />
</AccessibleFormField>
```

---

**Document Version**: v2.0
**Last Updated**: 2025-11-19
**Related Documents**: [Backend Guide](./backend-guide.md), [BMAD Integration](./bmad-integration.md), [Component Patterns](../1-architecture/component-patterns.md)
**Next Review**: 2025-12-19