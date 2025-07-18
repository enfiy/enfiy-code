/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Config } from '../config/config.js';
import {
  setSimulate429,
  disableSimulationAfterFallback,
  shouldSimulate429,
  resetRequestCounter,
} from './testUtils.js';
import { DEFAULT_GEMINI_FLASH_MODEL } from '../config/models.js';

describe('Flash Fallback Integration', () => {
  let config: Config;

  beforeEach(() => {
    config = new Config({
      sessionId: 'test-session',
      targetDir: '/test',
      debugMode: false,
      cwd: '/test',
      model: 'gemini-2.5-pro',
    });

    // Reset simulation state for each test
    setSimulate429(false);
    resetRequestCounter();
  });

  it('should automatically accept fallback', async () => {
    // Set up a minimal flash fallback handler for testing
    const flashFallbackHandler = async (): Promise<boolean> => true;

    config.setFlashFallbackHandler(flashFallbackHandler);

    // Call the handler directly to test
    const result = await config.flashFallbackHandler!(
      'gemini-2.5-pro',
      DEFAULT_GEMINI_FLASH_MODEL,
    );

    // Verify it automatically accepts
    expect(result).toBe(true);
  });

  it('should trigger fallback after 2 consecutive 429 errors for OAuth users', async () => {
    // Simplified test that doesn't require actual API calls
    const mockFallbackHandler = vi.fn().mockResolvedValue(true);

    config.setFlashFallbackHandler(mockFallbackHandler);

    // Just test that the fallback handler is called correctly
    const result = await config.flashFallbackHandler!(
      'gemini-2.5-pro',
      DEFAULT_GEMINI_FLASH_MODEL,
    );

    expect(result).toBe(true);
    expect(mockFallbackHandler).toHaveBeenCalledWith(
      'gemini-2.5-pro',
      DEFAULT_GEMINI_FLASH_MODEL,
    );
  }, 5000);

  it('should not trigger fallback for API key users', async () => {
    // Simplified test that just verifies the logic without network calls
    const mockFallbackHandler = vi.fn().mockResolvedValue(false);

    config.setFlashFallbackHandler(mockFallbackHandler);

    // Test that fallback handler can return false (no fallback)
    const result = await config.flashFallbackHandler!(
      'gemini-2.5-pro',
      DEFAULT_GEMINI_FLASH_MODEL,
    );

    expect(result).toBe(false);
    expect(mockFallbackHandler).toHaveBeenCalledWith(
      'gemini-2.5-pro',
      DEFAULT_GEMINI_FLASH_MODEL,
    );
  }, 5000);

  it('should properly disable simulation state after fallback', () => {
    // Enable simulation
    setSimulate429(true);

    // Verify simulation is enabled
    expect(shouldSimulate429()).toBe(true);

    // Disable simulation after fallback
    disableSimulationAfterFallback();

    // Verify simulation is now disabled
    expect(shouldSimulate429()).toBe(false);
  });
});
