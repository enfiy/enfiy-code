/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { Config, ConfigParameters, ContentGeneratorConfig } from '@enfiy/core';

const _TEST_CONTENT_GENERATOR_CONFIG: ContentGeneratorConfig = {
  apiKey: 'test-key',
  model: 'test-model',
};

// Mock file discovery service and tool registry
vi.mock('@enfiy/core', async () => {
  const actual = await vi.importActual('@enfiy/core');
  return {
    ...actual,
    FileDiscoveryService: vi.fn().mockImplementation(() => ({
      initialize: vi.fn(),
    })),
    createToolRegistry: vi.fn().mockResolvedValue({}),
  };
});

describe('Configuration Integration Tests', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(tmpdir(), 'enfiy-cli-test-'));
    originalEnv = { ...process.env };
    process.env.GEMINI_API_KEY = 'test-api-key';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('File Filtering Configuration', () => {
    it('should load default file filtering settings', async () => {
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
        // fileFilteringRespectGitIgnore: undefined, // Should default to true
      };

      const config = new Config(configParams);

      expect(config.getFileFilteringRespectGitIgnore()).toBe(true);
    });

    it('should load custom file filtering settings from configuration', async () => {
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
        fileFiltering: {
          respectGitIgnore: false,
        },
      };

      const config = new Config(configParams);

      expect(config.getFileFilteringRespectGitIgnore()).toBe(false);
    });

    it('should merge user and workspace file filtering settings', async () => {
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
        // fileFilteringRespectGitIgnore: true,
      };

      const config = new Config(configParams);

      expect(config.getFileFilteringRespectGitIgnore()).toBe(true);
    });
  });

  describe('Configuration Integration', () => {
    it('should handle partial configuration objects gracefully', async () => {
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
        fileFiltering: {
          respectGitIgnore: false,
        },
      };

      const config = new Config(configParams);

      // Specified settings should be applied
      expect(config.getFileFilteringRespectGitIgnore()).toBe(false);
    });

    it('should handle empty configuration objects gracefully', async () => {
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
        // fileFilteringRespectGitIgnore: undefined,
      };

      const config = new Config(configParams);

      // All settings should use defaults
      expect(config.getFileFilteringRespectGitIgnore()).toBe(true);
    });

    it('should handle missing configuration sections gracefully', async () => {
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
        // Missing fileFiltering configuration
      };

      const config = new Config(configParams);

      // All git-aware settings should use defaults
      expect(config.getFileFilteringRespectGitIgnore()).toBe(true);
    });
  });

  describe('Real-world Configuration Scenarios', () => {
    it('should handle a security-focused configuration', async () => {
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
        // fileFilteringRespectGitIgnore: true,
      };

      const config = new Config(configParams);

      expect(config.getFileFilteringRespectGitIgnore()).toBe(true);
    });

    it('should handle a CI/CD environment configuration', async () => {
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
        fileFiltering: {
          respectGitIgnore: false,
        }, // CI might need to see all files
      };

      const config = new Config(configParams);

      expect(config.getFileFilteringRespectGitIgnore()).toBe(false);
    });
  });

  describe('Checkpointing Configuration', () => {
    it('should enable checkpointing when the setting is true', async () => {
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
        checkpointing: true,
      };

      const config = new Config(configParams);

      expect(config.getCheckpointingEnabled()).toBe(true);
    });
  });

  describe('Extension Context Files', () => {
    it('should have an empty array for extension context files by default', () => {
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
      };
      const config = new Config(configParams);
      expect(config.getExtensionContextFilePaths()).toEqual([]);
    });

    it('should correctly store and return extension context file paths', () => {
      const contextFiles = ['/path/to/file1.txt', '/path/to/file2.js'];
      const configParams: ConfigParameters = {
        sessionId: 'test-session',
        model: 'test-model',
        cwd: '/tmp',
        embeddingModel: 'test-embedding-model',
        sandbox: undefined,
        targetDir: tempDir,
        debugMode: false,
        extensionContextFilePaths: contextFiles,
      };
      const config = new Config(configParams);
      expect(config.getExtensionContextFilePaths()).toEqual(contextFiles);
    });
  });
});
