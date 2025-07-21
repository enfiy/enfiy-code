/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
// Additional test environment setup for EventTarget stability
export {};

// Prevent EventTarget memory leaks by ensuring proper cleanup
if (typeof global !== 'undefined' && typeof EventTarget !== 'undefined') {
  // Store original methods
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

  // Track event listeners for cleanup
  const eventListeners = new Map<
    EventTarget,
    Set<{
      type: string;
      listener: EventListenerOrEventListenerObject;
      options?: boolean | AddEventListenerOptions;
    }>
  >();

  // Override addEventListener to track listeners
  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (!eventListeners.has(this)) {
      eventListeners.set(this, new Set());
    }
    eventListeners.get(this)!.add({ type, listener, options });
    return originalAddEventListener.call(this, type, listener, options);
  };

  // Override removeEventListener to untrack listeners
  EventTarget.prototype.removeEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) {
    if (eventListeners.has(this)) {
      const listeners = eventListeners.get(this)!;
      for (const entry of listeners) {
        if (entry.type === type && entry.listener === listener) {
          listeners.delete(entry);
          break;
        }
      }
    }
    return originalRemoveEventListener.call(this, type, listener, options);
  };

  // Cleanup function for tests
  (
    global as unknown as { cleanupEventListeners: () => void }
  ).cleanupEventListeners = () => {
    for (const [target, listeners] of eventListeners) {
      for (const { type, listener, options } of listeners) {
        try {
          target.removeEventListener(type, listener, options);
        } catch (_e) {
          // Ignore cleanup errors
        }
      }
      listeners.clear();
    }
    eventListeners.clear();
  };
}
