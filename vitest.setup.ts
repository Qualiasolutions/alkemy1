import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', '');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

// Mock HTMLCanvasElement's getContext for jsdom
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string | CanvasGradient | CanvasPattern = '';
  strokeStyle: string | CanvasGradient | CanvasPattern = '';
  lineWidth: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  drawImage() {}
  getImageData(sx: number, sy: number, sw: number, sh: number) {
    // Return mock ImageData with mock pixel data
    const data = new Uint8ClampedArray(sw * sh * 4);
    // Fill with some pattern data for testing
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.floor(Math.random() * 256);
    }
    return { data, width: sw, height: sh, colorSpace: 'srgb' as PredefinedColorSpace };
  }
  fillRect() {}
  clearRect() {}
  strokeRect() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  fill() {}
  stroke() {}
  save() {}
  restore() {}
  scale() {}
  rotate() {}
  translate() {}
  transform() {}
  setTransform() {}
  measureText(text: string) {
    return { width: text.length * 10 };
  }
  fillText() {}
  strokeText() {}
}

HTMLCanvasElement.prototype.getContext = function(contextId: string) {
  if (contextId === '2d') {
    return new MockCanvasRenderingContext2D(this) as any;
  }
  return null;
} as any;
