/**
 * 3D Worlds Tab Component Test Suite
 *
 * Tests for the new HunyuanWorld-powered 3D worlds tab including:
 * - Component rendering and interaction
 * - Service integration
 * - Error handling
 * - User workflows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ThreeDWorldsTab } from '@/tabs/3DWorldsTab';
import { hunyuanWorldService } from '@/services/hunyuanWorldService';
import { ThemeProvider } from '@/theme/ThemeContext';
import type { ScriptAnalysis } from '@/types';

// Mock dependencies
vi.mock('@/services/hunyuanWorldService');
vi.mock('@/theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      bg_primary: '#ffffff',
      bg_secondary: '#f3f4f6',
      bg_tertiary: '#e5e7eb',
      text_primary: '#111827',
      text_secondary: '#6b7280',
      text_tertiary: '#9ca3af',
      border_primary: '#d1d5db',
      accent_primary: '#3b82f6'
    }
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock Three.js and related 3D libraries
vi.mock('three', () => ({
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    setSize: vi.fn(),
    setClearColor: vi.fn(),
    domElement: document.createElement('canvas')
  })),
  PerspectiveCamera: vi.fn(),
  Scene: vi.fn(),
  AmbientLight: vi.fn(),
  DirectionalLight: vi.fn(),
  Box3: vi.fn().mockImplementation(() => ({
    setFromObject: vi.fn(),
    getCenter: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
    getSize: vi.fn(() => ({ x: 1, y: 1, z: 1 }))
  })),
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z, sub: vi.fn() }))
}));

vi.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: vi.fn().mockImplementation(() => ({
    enableDamping: true,
    dampingFactor: 0.05,
    update: vi.fn(),
    target: { set: vi.fn() }
  }))
}));

vi.mock('three/examples/jsm/loaders/GLTFLoader', () => ({
  GLTFLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad) => {
      // Simulate successful GLTF load
      const mockScene = { type: 'Scene', children: [] };
      onLoad({ scene: mockScene });
    })
  }))
}));

// Test utilities
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

const mockScriptAnalysis: ScriptAnalysis = {
  title: 'Test Script',
  logline: 'A test script for 3D generation',
  summary: 'Test summary',
  scenes: [
    {
      id: 'scene-1',
      description: 'A beautiful forest scene with ancient trees',
      location: 'Enchanted Forest',
      mood: 'magical',
      frames: []
    }
  ],
  characters: [],
  locations: []
};

describe('3D Worlds Tab', () => {
  const mockHunyuanWorldService = vi.mocked(hunyuanWorldService);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default service status
    mockHunyuanWorldService.getServiceStatus.mockResolvedValue({
      available: true,
      apiStatus: 'online',
      activeJobs: 0
    });

    mockHunyuanWorldService.isAvailable.mockReturnValue(true);
    mockHunyuanWorldService.generateWorld.mockResolvedValue({
      id: 'test-world-123',
      modelUrl: 'https://test.com/model.glb',
      thumbnailUrl: 'https://test.com/thumb.jpg',
      metadata: {
        prompt: 'A beautiful fantasy castle',
        vertices: 15000,
        triangles: 10000,
        generationTime: 120000,
        modelSize: 2500000,
        quality: 'standard',
        format: 'glb',
        createdAt: new Date().toISOString()
      }
    });
  });

  describe('Component Rendering', () => {
    it('should render the 3D worlds tab with correct title', () => {
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      expect(screen.getByText('HunyuanWorld 3D Generator')).toBeInTheDocument();
      expect(screen.getByText('AI-powered 3D world generation using Tencent\'s HunyuanWorld 1.0')).toBeInTheDocument();
    });

    it('should show service status when online', async () => {
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      await waitFor(() => {
        expect(screen.getByText('Online')).toBeInTheDocument();
      });
    });

    it('should display generation form elements', () => {
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      expect(screen.getByPlaceholderText('Describe the 3D world you want to generate...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('standard')).toBeInTheDocument(); // Quality selector
      expect(screen.getByDisplayValue('GLB')).toBeInTheDocument(); // Format selector
      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
    });

    it('should show empty state when no worlds exist', () => {
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      expect(screen.getByText('No worlds generated yet')).toBeInTheDocument();
    });

    it('should show script generation option when script analysis is available', () => {
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      expect(screen.getByRole('button', { name: /Generate from Script Scene/i })).toBeInTheDocument();
    });

    it('should hide script generation option when no script analysis', () => {
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={null} />);

      expect(screen.queryByRole('button', { name: /Generate from Script Scene/i })).not.toBeInTheDocument();
    });
  });

  describe('World Generation Workflow', () => {
    it('should generate world from prompt', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      const promptInput = screen.getByPlaceholderText('Describe the 3D world you want to generate...');
      const generateButton = screen.getByRole('button', { name: /generate/i });

      await user.type(promptInput, 'A futuristic cyberpunk city');
      await user.click(generateButton);

      expect(mockHunyuanWorldService.generateWorld).toHaveBeenCalledWith({
        prompt: 'A futuristic cyberpunk city',
        quality: 'standard',
        format: 'glb',
        includeTextures: true,
        onProgress: expect.any(Function)
      });

      await waitFor(() => {
        expect(screen.getByText('World generation complete!')).toBeInTheDocument();
      });
    });

    it('should generate world from script scene', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      const scriptGenerateButton = screen.getByRole('button', { name: /Generate from Script Scene/i });
      await user.click(scriptGenerateButton);

      expect(mockHunyuanWorldService.generateWorld).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('A 3D world representing: A beautiful forest scene with ancient trees'),
          quality: 'standard',
          format: 'glb',
          includeTextures: true,
          onProgress: expect.any(Function)
        })
      );
    });

    it('should update progress during generation', async () => {
      const mockProgressCallback = vi.fn();
      mockHunyuanWorldService.generateWorld.mockImplementation(async (options) => {
        options.onProgress?.(25, 'Generating 3D world...');
        options.onProgress?.(50, 'Processing AI model...');
        options.onProgress?.(75, 'Uploading to storage...');
        options.onProgress?.(100, 'Complete!');
        return {
          id: 'test-world',
          modelUrl: 'https://test.com/model.glb',
          thumbnailUrl: 'https://test.com/thumb.jpg',
          metadata: {
            prompt: options.prompt,
            vertices: 10000,
            triangles: 6700,
            generationTime: 60000,
            modelSize: 1500000,
            quality: options.quality || 'standard',
            format: options.format || 'glb',
            createdAt: new Date().toISOString()
          }
        };
      });

      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      const promptInput = screen.getByPlaceholderText('Describe the 3D world you want to generate...');
      const generateButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(promptInput, { target: { value: 'Test world' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generating 3D world...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Processing AI model...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('World generation complete!')).toBeInTheDocument();
      });
    });

    it('should display generated worlds in gallery', async () => {
      mockHunyuanWorldService.generateWorld.mockResolvedValue({
        id: 'test-world-123',
        modelUrl: 'https://test.com/model.glb',
        thumbnailUrl: 'https://test.com/thumb.jpg',
        metadata: {
          prompt: 'A magical fantasy castle',
          vertices: 15000,
          triangles: 10000,
          generationTime: 120000,
          modelSize: 2500000,
          quality: 'standard',
          format: 'glb',
          createdAt: new Date().toISOString()
        }
      });

      const user = userEvent.setup();
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      // Generate a world
      const promptInput = screen.getByPlaceholderText('Describe the 3D world you want to generate...');
      const generateButton = screen.getByRole('button', { name: /generate/i });

      await user.type(promptInput, 'A magical fantasy castle');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('World generation complete!')).toBeInTheDocument();
      });

      // Open gallery
      const galleryButton = screen.getByRole('button', { name: /gallery \(1\)/i });
      await user.click(galleryButton);

      // Check if world appears in gallery
      expect(screen.getByText('A magical fantasy castle...')).toBeInTheDocument();
      expect(screen.getByText('Quality: standard')).toBeInTheDocument();
      expect(screen.getByText('Vertices: 15,000')).toBeInTheDocument();
      expect(screen.getByText('Format: GLB')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable generate button with empty prompt', () => {
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      expect(generateButton).toBeDisabled();
    });

    it('should enable generate button with valid prompt', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      const promptInput = screen.getByPlaceholderText('Describe the 3D world you want to generate...');
      const generateButton = screen.getByRole('button', { name: /generate/i });

      expect(generateButton).toBeDisabled();

      await user.type(promptInput, 'A beautiful mountain landscape');
      expect(generateButton).not.toBeDisabled();
    });

    it('should disable controls during generation', async () => {
      let progressCallback: ((progress: number, status: string) => void) | undefined;

      mockHunyuanWorldService.generateWorld.mockImplementation(async (options) => {
        progressCallback = options.onProgress;
        return new Promise(() => {}); // Never resolves to simulate long generation
      });

      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      const promptInput = screen.getByPlaceholderText('Describe the 3D world you want to generate...');
      const generateButton = screen.getByRole('button', { name: /generate/i });

      fireEvent.change(promptInput, { target: { value: 'Test world' } });
      fireEvent.click(generateButton);

      // Controls should be disabled during generation
      expect(generateButton).toBeDisabled();
      expect(promptInput).toBeDisabled();

      // Quality and format selectors should also be disabled
      expect(screen.getByDisplayValue('standard')).toBeDisabled();
      expect(screen.getByDisplayValue('GLB')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display generation errors', async () => {
      mockHunyuanWorldService.generateWorld.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const user = userEvent.setup();
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      const promptInput = screen.getByPlaceholderText('Describe the 3D world you want to generate...');
      const generateButton = screen.getByRole('button', { name: /generate/i });

      await user.type(promptInput, 'Test world');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generation failed: API rate limit exceeded')).toBeInTheDocument();
      });
    });

    it('should disable generate button when service unavailable', async () => {
      mockHunyuanService.getServiceStatus.mockResolvedValue({
        available: false,
        apiStatus: 'offline',
        activeJobs: 0
      });

      mockHunyuanService.isAvailable.mockReturnValue(false);

      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      const promptInput = screen.getByPlaceholderText('Describe the 3D world you want to generate...');
      const generateButton = screen.getByRole('button', { name: /generate/i });

      await waitFor(() => {
        expect(generateButton).toBeDisabled();
      });

      await fireEvent.change(promptInput, { target: { value: 'Test world' } });
      expect(generateButton).toBeDisabled(); // Still disabled due to service unavailability
    });

    it('should show 3D viewer error when model fails to load', async () => {
      mockHunyuanWorldService.generateWorld.mockResolvedValue({
        id: 'test-world',
        modelUrl: 'https://invalid-url.com/model.glb',
        thumbnailUrl: 'https://test.com/thumb.jpg',
        metadata: {
          prompt: 'Test world',
          vertices: 10000,
          triangles: 6700,
          generationTime: 60000,
          modelSize: 1500000,
          quality: 'standard',
          format: 'glb',
          createdAt: new Date().toISOString()
        }
      });

      // Mock GLTFLoader to throw an error
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
      vi.mocked(GLTFLoader).mockImplementation(() => ({
        load: vi.fn((url, onLoad, onProgress, onError) => {
          if (onError) onError(new Error('Failed to load model'));
        })
      }));

      const user = userEvent.setup();
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      const promptInput = screen.getByPlaceholderText('Describe the 3D world you want to generate...');
      const generateButton = screen.getByRole('button', { name: /generate/i });

      await user.type(promptInput, 'Test world');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('3D Viewer Error')).toBeInTheDocument();
        expect(screen.getByText('Could not load 3D model')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Download Model/i })).toBeInTheDocument();
      });
    });
  });

  describe('World Management', () => {
    it('should allow switching between generated worlds', async () => {
      const mockWorld1 = {
        id: 'world-1',
        modelUrl: 'https://test.com/world1.glb',
        thumbnailUrl: 'https://test.com/thumb1.jpg',
        metadata: {
          prompt: 'First world',
          vertices: 10000,
          triangles: 6700,
          generationTime: 60000,
          modelSize: 1500000,
          quality: 'standard',
          format: 'glb',
          createdAt: new Date().toISOString()
        }
      };

      const mockWorld2 = {
        id: 'world-2',
        modelUrl: 'https://test.com/world2.glb',
        thumbnailUrl: 'https://test.com/thumb2.jpg',
        metadata: {
          prompt: 'Second world',
          vertices: 12000,
          triangles: 8000,
          generationTime: 70000,
          modelSize: 1800000,
          quality: 'standard',
          format: 'glb',
          createdAt: new Date().toISOString()
        }
      };

      mockHunyuanWorldService.generateWorld
        .mockResolvedValueOnce(mockWorld1)
        .mockResolvedValueOnce(mockWorld2);

      const user = userEvent.setup();
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      const promptInput = screen.getByPlaceholderText('Describe the 3D world you want to generate...');
      const generateButton = screen.getByRole('button', { name: /generate/i });

      // Generate first world
      await user.clear(promptInput);
      await user.type(promptInput, 'First world');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('World generation complete!')).toBeInTheDocument();
      });

      // Generate second world
      await user.clear(promptInput);
      await user.type(promptInput, 'Second world');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('World generation complete!')).toBeInTheDocument();
      });

      // Open gallery
      const galleryButton = screen.getByRole('button', { name: /gallery \(2\)/i });
      await user.click(galleryButton);

      // Switch between worlds
      const world2Item = screen.getByText('Second world...').closest('div');
      if (world2Item) {
        await user.click(world2Item);
      }

      // Should see the second world's prompt in the viewer
      expect(screen.getByText('Second world')).toBeInTheDocument();
    });

    it('should allow downloading generated worlds', async () => {
      const mockWorld = {
        id: 'download-test-world',
        modelUrl: 'https://test.com/model.glb',
        thumbnailUrl: 'https://test.com/thumb.jpg',
        metadata: {
          prompt: 'Download test world',
          vertices: 10000,
          triangles: 6700,
          generationTime: 60000,
          modelSize: 1500000,
          quality: 'standard',
          format: 'glb',
          createdAt: new Date().toISOString()
        }
      };

      mockHunyuanWorldService.generateWorld.mockResolvedValue(mockWorld);

      // Mock fetch for download
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(['model data'], { type: 'model/gltf-binary' }))
      });

      // Mock URL.createObjectURL and download behavior
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:download-url');
      global.URL.revokeObjectURL = vi.fn();

      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: vi.fn()
          } as any;
        }
        return document.createElement(tagName);
      });

      const user = userEvent.setup();
      renderWithTheme(<ThreeDWorldsTab scriptAnalysis={mockScriptAnalysis} />);

      // Generate a world
      const promptInput = screen.getByPlaceholderText('Describe the 3D world you want to generate...');
      const generateButton = screen.getByRole('button', { name: /generate/i });

      await user.type(promptInput, 'Download test world');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('World generation complete!')).toBeInTheDocument();
      });

      // Open gallery and download
      const galleryButton = screen.getByRole('button', { name: /gallery \(1\)/i });
      await user.click(galleryButton);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      expect(fetch).toHaveBeenCalledWith('https://test.com/model.glb');
      expect(createElementSpy).toHaveBeenCalledWith('a');

      // Cleanup
      createElementSpy.mockRestore();
    });
  });
});