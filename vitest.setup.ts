import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', '')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

// Mock HTMLCanvasElement's getContext for jsdom
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement
  fillStyle: string | CanvasGradient | CanvasPattern = ''
  strokeStyle: string | CanvasGradient | CanvasPattern = ''
  lineWidth: number = 1

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  drawImage() {
    /* intentional */
  }
  getImageData(_sx: number, _sy: number, sw: number, sh: number) {
    // Return mock ImageData with mock pixel data
    const data = new Uint8ClampedArray(sw * sh * 4)
    // Fill with some pattern data for testing
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.floor(Math.random() * 256)
    }
    return { data, width: sw, height: sh, colorSpace: 'srgb' as PredefinedColorSpace }
  }
  fillRect() {
    /* intentional */
  }
  clearRect() {
    /* intentional */
  }
  strokeRect() {
    /* intentional */
  }
  beginPath() {
    /* intentional */
  }
  closePath() {
    /* intentional */
  }
  moveTo() {
    /* intentional */
  }
  lineTo() {
    /* intentional */
  }
  arc() {
    /* intentional */
  }
  fill() {
    /* intentional */
  }
  stroke() {
    /* intentional */
  }
  save() {
    /* intentional */
  }
  restore() {
    /* intentional */
  }
  scale() {
    /* intentional */
  }
  rotate() {
    /* intentional */
  }
  translate() {
    /* intentional */
  }
  transform() {
    /* intentional */
  }
  setTransform() {
    /* intentional */
  }
  measureText(text: string) {
    return { width: text.length * 10 }
  }
  fillText() {
    /* intentional */
  }
  strokeText() {
    /* intentional */
  }
}

HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === '2d') {
    return new MockCanvasRenderingContext2D(this) as any
  }
  return null
} as any
