import { vi } from 'vitest';

// Mock browser APIs that aren't available in the test environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
});

Object.defineProperty(document, 'cookie', {
  value: '',
  writable: true
});

// Mock the fetch API
global.fetch = vi.fn();

// Setup console mocking to reduce noise in tests
console.error = vi.fn();
console.warn = vi.fn();
console.log = vi.fn();