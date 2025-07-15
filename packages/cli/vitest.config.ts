/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)', 'config.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test-setup.ts'],
    reporters: ['default', 'junit'],
    silent: true,
    outputFile: {
      junit: 'junit.xml',
    },
    // Fix memory leak and EventTarget issues
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true,
      },
    },
    // Reduce concurrent tests to prevent memory issues
    maxConcurrency: 1,
    // Increase timeout for stable tests
    testTimeout: 30000,
    // Clear mocks between tests
    clearMocks: true,
    // Restore all mocks after each test
    restoreMocks: true,
    // Additional configuration for stability
    sequence: {
      shuffle: false,
      concurrent: false,
    },
    // Prevent hanging tests
    teardownTimeout: 10000,
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*'],
      reporter: [
        ['text', { file: 'full-text-summary.txt' }],
        'html',
        'json',
        'lcov',
        'cobertura',
        ['json-summary', { outputFile: 'coverage-summary.json' }],
      ],
    },
  },
});
