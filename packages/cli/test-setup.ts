/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { vi } from 'vitest';
import 'jsdom-global/register';
import type { ReactNode } from 'react';

// Suppress EventTarget cleanup errors during vitest teardown
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = args.join(' ');
  if (
    message.includes('removeEventListener') ||
    message.includes('EventTarget') ||
    message.includes('not a valid instance')
  ) {
    // Suppress EventTarget cleanup errors
    return;
  }
  originalConsoleError(...args);
};

// Handle unhandled rejections that might occur during cleanup
process.on('unhandledRejection', (reason) => {
  const message = String(reason);
  if (
    message.includes('removeEventListener') ||
    message.includes('EventTarget') ||
    message.includes('not a valid instance')
  ) {
    // Suppress EventTarget cleanup errors
    return;
  }
  // Log other unhandled rejections
  console.error('Unhandled Rejection:', reason);
});

// Fix EventTarget memory leak issues
import { beforeEach, afterEach } from 'vitest';

// Mock yoga-layout to prevent WASM initialization errors
vi.mock('yoga-layout', () => {
  const mockNode = {
    setWidth: vi.fn(),
    setHeight: vi.fn(),
    setFlexDirection: vi.fn(),
    setJustifyContent: vi.fn(),
    setAlignItems: vi.fn(),
    setAlignContent: vi.fn(),
    setFlexWrap: vi.fn(),
    setFlexGrow: vi.fn(),
    setFlexShrink: vi.fn(),
    setFlexBasis: vi.fn(),
    setMargin: vi.fn(),
    setPadding: vi.fn(),
    setPosition: vi.fn(),
    setPositionType: vi.fn(),
    calculateLayout: vi.fn(),
    getComputedWidth: vi.fn(() => 0),
    getComputedHeight: vi.fn(() => 0),
    getComputedLayout: vi.fn(() => ({ left: 0, top: 0, width: 0, height: 0 })),
    insertChild: vi.fn(),
    removeChild: vi.fn(),
    getChildCount: vi.fn(() => 0),
    getChild: vi.fn(),
    free: vi.fn(),
  };

  const Yoga = {
    Node: {
      create: vi.fn(() => mockNode),
    },
    loadYoga: vi.fn(() => Promise.resolve(Yoga)),
  };

  return {
    default: Yoga,
    loadYoga: vi.fn(() => Promise.resolve(Yoga)),
    Node: {
      create: vi.fn(() => mockNode),
    },
  };
});

// Mock ink to prevent yoga-layout usage
vi.mock('ink', async (importOriginal) => {
  const actualInk = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actualInk,
    measureElement: vi.fn(() => ({ width: 100, height: 50 })),
    useStdout: vi.fn(() => ({ stdout: { write: vi.fn() } })),
    useStdin: vi.fn(() => ({ stdin: { on: vi.fn() }, setRawMode: vi.fn() })),
    useInput: vi.fn(),
    Box: ({ children }: { children?: ReactNode }) => children,
    Text: ({ children }: { children?: ReactNode }) => children,
    Static: ({ children }: { children?: ReactNode }) => children,
  };
});

vi.mock('zustand');

// Global cleanup tracking
let eventTargetCleanup: (() => void)[] = [];
let abortSignalCleanup: (() => void)[] = [];

// Increase EventTarget max listeners to prevent warnings
beforeEach(() => {
  // Reset cleanup arrays
  eventTargetCleanup = [];
  abortSignalCleanup = [];

  // Set max listeners to prevent EventTarget warnings
  if (typeof EventTarget !== 'undefined') {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener =
      EventTarget.prototype.removeEventListener;

    // Track listeners with proper cleanup
    const listenerMap = new WeakMap();

    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      if (!listenerMap.has(this)) {
        listenerMap.set(this, new Map());
      }
      const listeners = listenerMap.get(this);
      const key = `${type}-${listener.toString()}`;
      listeners.set(key, { type, listener, options });

      // Add cleanup function
      const cleanup = () => {
        try {
          this.removeEventListener(type, listener, options);
        } catch {
          // Ignore cleanup errors
        }
      };
      eventTargetCleanup.push(cleanup);

      return originalAddEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      if (listenerMap.has(this)) {
        const listeners = listenerMap.get(this);
        const key = `${type}-${listener.toString()}`;
        listeners.delete(key);
      }
      return originalRemoveEventListener.call(this, type, listener, options);
    };
  }

  // Set AbortSignal max listeners and track them
  if (
    typeof AbortSignal !== 'undefined' &&
    AbortSignal.prototype.addEventListener
  ) {
    const abortSignals = new Set();
    const originalAbortAddListener = AbortSignal.prototype.addEventListener;
    const originalAbortRemoveListener =
      AbortSignal.prototype.removeEventListener;

    AbortSignal.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      abortSignals.add(this);

      // Add cleanup for abort signals
      const cleanup = () => {
        try {
          if (this.removeEventListener) {
            this.removeEventListener(type, listener, options);
          }
        } catch {
          // Ignore cleanup errors
        }
      };
      abortSignalCleanup.push(cleanup);

      return originalAbortAddListener.call(this, type, listener, options);
    };

    if (originalAbortRemoveListener) {
      AbortSignal.prototype.removeEventListener = function (
        type,
        listener,
        options,
      ) {
        return originalAbortRemoveListener.call(this, type, listener, options);
      };
    }
  }

  // Mock fetch to prevent network calls during tests
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    status: 200,
    headers: new Map(),
  });
});

afterEach(() => {
  // Clear arrays without trying to run cleanup functions
  // that might reference invalid objects
  eventTargetCleanup = [];
  abortSignalCleanup = [];

  // Clear any remaining timers
  vi.clearAllTimers();

  // Clean up any remaining mocks
  vi.clearAllMocks();

  // Reset fetch mock
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    global.fetch.mockClear();
  }

  // Force garbage collection if available
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  }

  // Suppress any remaining EventTarget cleanup errors
  if (typeof process !== 'undefined' && process.removeAllListeners) {
    try {
      process.removeAllListeners();
    } catch {
      // Ignore cleanup errors
    }
  }
});
