# Component Architecture & Patterns

## Component Design Philosophy

### Core Principles
- **Composition over Inheritance**: Build complex UIs from simple, reusable components
- **Presentational vs Container**: Separate concerns between UI and business logic
- **Props-First Design**: Components should be configurable through props
- **Accessibility First**: All components must meet WCAG 2.1 AA standards
- **Performance Conscious**: Optimize for render performance and bundle size

### Component Hierarchy

```
App (Root State Management)
├── Layout Components
│   ├── Header (Navigation, User Profile)
│   ├── Sidebar (Tool Panels, Status)
│   └── MainContent (Tab System)
├── Tab System (Smart Containers)
│   ├── ScriptTab (Upload, Analysis)
│   ├── MoodboardTab (Reference Management)
│   ├── CastLocationsTab (Character/Location Generation)
│   ├── SceneAssemblerTab (Shot Composition)
│   ├── ThreeDWorldsTab (3D Environment)
│   ├── PostProductionTab (Timeline, Export)
│   └── AnalyticsTab (Quality, Performance)
├── Shared Components
│   ├── Generation Components
│   ├── UI Components
│   └── Business Logic Components
└── Modals & Overlays
```

## Tab Component Pattern

### Smart Container Pattern
```typescript
// Tab Component Template
interface TabProps {
  projectState: ProjectState;
  setProjectState: Dispatch<SetStateAction<ProjectState>>;
  isLoading: boolean;
  saveStatus: SaveStatus;
}

function ExampleTab({ projectState, setProjectState, isLoading, saveStatus }: TabProps) {
  // Tab-specific state
  const [localState, setLocalState] = useState<LocalState>();

  // Service integration
  const service = useService();

  // Effects for data synchronization
  useEffect(() => {
    // Sync with project state
  }, [projectState]);

  // Event handlers
  const handleAction = useCallback(async () => {
    // Business logic with optimistic updates
    setProjectState(prev => ({ ...prev, updating: true }));
    try {
      const result = await service.performAction();
      setProjectState(prev => ({ ...prev, data: result, updating: false }));
    } catch (error) {
      setProjectState(prev => ({ ...prev, updating: false, error }));
    }
  }, [service]);

  return (
    <TabLayout>
      <TabHeader />
      <TabContent>
        {/* Presentational components */}
      </TabContent>
    </TabLayout>
  );
}
```

### Tab Responsibilities
- **State Synchronization**: Keep local state in sync with global project state
- **Service Integration**: Handle API calls and business logic
- **Progress Tracking**: Manage loading states and progress indicators
- **Error Handling**: Graceful error recovery and user feedback
- **Optimistic Updates**: Immediate UI updates with rollback capability

## Service Layer Pattern

### Unified Service Interface
```typescript
// Base Service Pattern
abstract class BaseService {
  protected abstract client: any;
  protected abstract apiKey: string;

  // Standard error handling
  protected handleError(error: unknown, context: string): never {
    console.error(`[${this.constructor.name}] ${context}:`, error);
    throw new ServiceError(error, context);
  }

  // Standard logging
  protected log(message: string, data?: any): void {
    console.log(`[${this.constructor.name}] ${message}`, data);
  }

  // Progress callback wrapper
  protected withProgress<T>(
    operation: (progress: ProgressCallback) => Promise<T>,
    onProgress?: ProgressCallback
  ): Promise<T> {
    return operation((progress) => {
      onProgress?.(progress);
    });
  }
}
```

### AI Service Pattern
```typescript
class AIService extends BaseService {
  // Model fallback chain
  private modelFallback = [
    'gemini-2.5-pro',
    'gemini-2.5-flash-002',
    'flux-pro',
    'flux-dev'
  ];

  async generateWithFallback<T>(
    prompt: string,
    options: GenerationOptions,
    onProgress?: ProgressCallback
  ): Promise<T> {
    for (const model of this.modelFallback) {
      try {
        return await this.generateWithModel(model, prompt, options, onProgress);
      } catch (error) {
        this.log(`Model ${model} failed, trying next`, { error: error.message });
        continue;
      }
    }
    throw new ServiceError('All models failed', 'generateWithFallback');
  }

  // Automatic safety filter bypass
  async handleSafetyFilter<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isSafetyFilterError(error)) {
        return await this.retryWithAlternativeProvider();
      }
      throw error;
    }
  }
}
```

## State Management Pattern

### Centralized State Pattern
```typescript
// Global State in App.tsx
const [projectState, setProjectState] = useState<ProjectState>({
  scriptContent: null,
  scriptAnalysis: null,
  timelineClips: [],
  roadmapBlocks: [],
  ui: {
    leftWidth: 300,
    rightWidth: 300,
    timelineHeight: 200,
    zoom: 1,
    playhead: 0
  }
});

// Optimistic Update Pattern
const updateWithOptimism = <T>(
  updateFn: (state: ProjectState) => ProjectState,
  asyncOperation: () => Promise<T>
) => {
  // Apply optimistic update immediately
  setProjectState(prev => ({ ...prev, ...updateFn(prev), updating: true }));

  try {
    const result = await asyncOperation();
    // Confirm update with server result
    setProjectState(prev => ({ ...prev, ...result, updating: false }));
  } catch (error) {
    // Rollback on error
    setProjectState(prev => ({ ...prev, updating: false, error }));
  }
};
```

### Local State Pattern
```typescript
// Custom Hook for Complex Local State
function useGenerationState(initialConfig: GenerationConfig) {
  const [state, setState] = useState<GenerationState>({
    config: initialConfig,
    status: 'idle',
    progress: 0,
    results: [],
    error: null
  });

  const startGeneration = useCallback(async (prompt: string) => {
    setState(prev => ({ ...prev, status: 'generating', progress: 0 }));

    try {
      const results = await aiService.generate(prompt, {
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }));
        }
      });

      setState(prev => ({
        ...prev,
        status: 'completed',
        results,
        progress: 100
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));
    }
  }, []);

  return { state, startGeneration, reset: () => setState(initialState) };
}
```

## Generation Component Pattern

### Generation Panel Template
```typescript
interface GenerationPanelProps {
  title: string;
  description: string;
  onGenerate: (prompt: string, options: GenerationOptions) => Promise<void>;
  defaultOptions: GenerationOptions;
  children?: React.ReactNode;
}

function GenerationPanel({
  title,
  description,
  onGenerate,
  defaultOptions,
  children
}: GenerationPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(defaultOptions);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress(0);

    try {
      await onGenerate(prompt, {
        ...options,
        onProgress: setProgress
      });
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [prompt, options, onGenerate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          disabled={isGenerating}
        />

        {/* Custom options children */}
        {children}

        {/* Progress indicator */}
        {isGenerating && (
          <Progress value={progress} className="w-full" />
        )}

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
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
```

## Modal Pattern

### Modal Management Pattern
```typescript
// Modal State Management
interface ModalState {
  isOpen: boolean;
  data: any;
  config: ModalConfig;
}

function useModal<T = any>(initialConfig?: ModalConfig) {
  const [state, setState] = useState<ModalState>({
    isOpen: false,
    data: null,
    config: initialConfig || {}
  });

  const open = useCallback((data?: T, config?: ModalConfig) => {
    setState({
      isOpen: true,
      data,
      config: { ...initialConfig, ...config }
    });
  }, [initialConfig]);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    config: state.config,
    open,
    close
  };
}

// Modal Component Template
interface ModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  data?: T;
  title: string;
  children: (props: ModalChildrenProps<T>) => React.ReactNode;
}

function Modal<T>({ isOpen, onClose, data, title, children }: ModalProps<T>) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children({ data, onClose })}
      </DialogContent>
    </Dialog>
  );
}
```

## Progress Tracking Pattern

### Progress Manager
```typescript
interface ProgressCallback {
  (progress: number, message?: string): void;
}

class ProgressManager {
  private subscribers: Map<string, ProgressCallback[]> = new Map();

  subscribe(operationId: string, callback: ProgressCallback): () => void {
    const callbacks = this.subscribers.get(operationId) || [];
    callbacks.push(callback);
    this.subscribers.set(operationId, callbacks);

    // Return unsubscribe function
    return () => {
      const current = this.subscribers.get(operationId) || [];
      const filtered = current.filter(cb => cb !== callback);
      this.subscribers.set(operationId, filtered);
    };
  }

  notify(operationId: string, progress: number, message?: string): void {
    const callbacks = this.subscribers.get(operationId) || [];
    callbacks.forEach(callback => callback(progress, message));
  }

  complete(operationId: string): void {
    this.notify(operationId, 100, 'Complete');
    // Clean up after delay
    setTimeout(() => {
      this.subscribers.delete(operationId);
    }, 5000);
  }
}

// Usage in components
function useProgress(operationId: string) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = progressManager.subscribe(operationId, (p, m) => {
      setProgress(p);
      setMessage(m || '');
    });

    return unsubscribe;
  }, [operationId]);

  return { progress, message };
}
```

## Error Handling Pattern

### Error Boundary Pattern
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Log to error tracking service
    logError(error, errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            An error occurred while rendering this component.
          </p>
          <details className="text-sm text-red-500">
            <summary>Error details</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
          <Button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-4"
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Performance Optimization Patterns

### Lazy Loading Pattern
```typescript
// Lazy component loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function LazyLoadedComponent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}

// Route-based code splitting
const routes = [
  {
    path: '/script',
    component: lazy(() => import('../tabs/ScriptTab'))
  },
  {
    path: '/moodboard',
    component: lazy(() => import('../tabs/MoodboardTab'))
  }
];
```

### Memoization Pattern
```typescript
// Expensive component memoization
const ExpensiveComponent = memo(function ExpensiveComponent({
  data,
  options
}: {
  data: ComplexData;
  options: Options;
}) {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data.id]); // Only recompute when data.id changes

  return <div>{/* Render processed data */}</div>;
});

// Hook memoization
function useExpensiveCalculation(input: ComplexInput) {
  return useMemo(() => {
    return performExpensiveCalculation(input);
  }, [input.key]); // Stable key for memoization
}
```

### Virtualization Pattern
```typescript
// Virtual list for large datasets
import { FixedSizeList as List } from 'react-window';

function VirtualizedTimeline({ items }: { items: TimelineItem[] }) {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <TimelineItem item={items[index]} />
    </div>
  );

  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

## Testing Patterns

### Component Testing Pattern
```typescript
// Component test template
describe('GenerationPanel', () => {
  const defaultProps = {
    title: 'Test Panel',
    description: 'Test description',
    onGenerate: vi.fn(),
    defaultOptions: {}
  };

  it('should render correctly', () => {
    render(<GenerationPanel {...defaultProps} />);

    expect(screen.getByText('Test Panel')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should enable generate button when prompt is provided', async () => {
    const mockOnGenerate = vi.fn();
    render(<GenerationPanel {...defaultProps} onGenerate={mockOnGenerate} />);

    const textarea = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: 'Generate' });

    expect(button).toBeDisabled();

    await userEvent.type(textarea, 'Test prompt');
    expect(button).toBeEnabled();

    await userEvent.click(button);
    expect(mockOnGenerate).toHaveBeenCalledWith('Test prompt', expect.any(Object));
  });

  it('should show loading state during generation', async () => {
    const mockOnGenerate = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<GenerationPanel {...defaultProps} onGenerate={mockOnGenerate} />);

    const textarea = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: 'Generate' });

    await userEvent.type(textarea, 'Test prompt');
    await userEvent.click(button);

    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});
```

## Accessibility Patterns

### Accessible Component Pattern
```typescript
// Accessible form component
function AccessibleForm({ onSubmit, children }: FormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset>
        <legend className="sr-only">Form controls</legend>
        {children}
      </fieldset>
    </form>
  );
}

// Accessible button with loading state
function AccessibleButton({
  children,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-describedby={isLoading ? 'loading-description' : undefined}
      {...props}
    >
      {isLoading && (
        <span className="sr-only" id="loading-description">
          Loading, please wait
        </span>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      {isLoading && (
        <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin" />
      )}
    </Button>
  );
}
```

---

**Document Version**: v2.0
**Last Updated**: 2025-11-19
**Related Documents**: [System Overview](./system-overview.md), [Service Layer](./service-layer.md)
**Next Review**: 2025-12-19