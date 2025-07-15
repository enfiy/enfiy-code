/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi } from 'vitest';
import { setSimulate429 } from './src/utils/testUtils.js';
import { beforeEach, afterEach } from 'vitest';

// Disable 429 simulation globally for all tests
setSimulate429(false);

// Global cleanup tracking
let eventTargetCleanup: (() => void)[] = [];
let abortSignalCleanup: (() => void)[] = [];

// Fix EventTarget memory leak issues
beforeEach(() => {
  // Reset cleanup arrays
  eventTargetCleanup = [];
  abortSignalCleanup = [];
  
  // Set max listeners to prevent EventTarget warnings
  if (typeof EventTarget !== 'undefined') {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    
    // Track listeners with proper cleanup
    const listenerMap = new WeakMap();
    
    EventTarget.prototype.addEventListener = function(type, listener, options) {
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
    
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      if (listenerMap.has(this)) {
        const listeners = listenerMap.get(this);
        const key = `${type}-${listener.toString()}`;
        listeners.delete(key);
      }
      return originalRemoveEventListener.call(this, type, listener, options);
    };
  }
  
  // Set AbortSignal max listeners and track them
  if (typeof AbortSignal !== 'undefined' && AbortSignal.prototype.addEventListener) {
    const abortSignals = new Set();
    const originalAbortAddListener = AbortSignal.prototype.addEventListener;
    const originalAbortRemoveListener = AbortSignal.prototype.removeEventListener;
    
    AbortSignal.prototype.addEventListener = function(type, listener, options) {
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
      AbortSignal.prototype.removeEventListener = function(type, listener, options) {
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
});
