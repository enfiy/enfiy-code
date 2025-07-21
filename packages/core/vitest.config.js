/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/editCorrector.test.ts',
            '**/write-file.test.ts',
            '**/grep.test.ts',
            '**/turn.test.ts',
            '**/flashFallback.integration.test.ts',
        ],
        reporters: ['default', 'junit'],
        silent: true,
        setupFiles: ['./test-setup.ts'],
        outputFile: {
            junit: 'junit.xml',
        },
        // Fix memory leak and EventTarget issues
        pool: 'forks',
        poolOptions: {
            threads: {
                singleThread: true,
            },
            forks: {
                singleFork: true,
                isolate: true,
            },
        },
        // Reduce concurrent tests to prevent memory issues
        maxConcurrency: 1,
        // Increase timeout for stable tests, especially in CI
        testTimeout: process.env.CI ? 120000 : 60000,
        // Clear mocks between tests
        clearMocks: true,
        // Reset modules between tests
        resetMocks: true,
        // Restore all mocks after each test
        restoreMocks: true,
        // Additional configuration for stability
        sequence: {
            shuffle: false,
            concurrent: false,
        },
        // Prevent hanging tests
        teardownTimeout: process.env.CI ? 30000 : 10000,
        // Retry failed tests up to 2 times in CI
        retry: process.env.CI ? 2 : 0,
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
//# sourceMappingURL=vitest.config.js.map