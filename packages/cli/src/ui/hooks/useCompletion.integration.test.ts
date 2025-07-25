/**
 * @license
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Mocked } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompletion } from './useCompletion.js';
import * as fs from 'fs/promises';
import { FileDiscoveryService, Config } from '@enfiy/core';
import { glob } from 'glob';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('@enfiy/core', async () => {
  const actual = await vi.importActual('@enfiy/core');
  return {
    ...actual,
    FileDiscoveryService: vi.fn(),
    isNodeError: vi.fn((error) => error.code === 'ENOENT'),
    escapePath: vi.fn((path) => path),
    unescapePath: vi.fn((path) => path),
    getErrorMessage: vi.fn((error) => error.message),
  };
});
vi.mock('glob');

describe('useCompletion git-aware filtering integration', () => {
  let mockFileDiscoveryService: Mocked<FileDiscoveryService>;
  let mockConfig: Config;
  const testCwd = '/test/project';
  const slashCommands = [
    { name: 'help', description: 'Show help', action: vi.fn() },
    { name: 'clear', description: 'Clear screen', action: vi.fn() },
  ];

  beforeEach(() => {
    mockFileDiscoveryService = {
      shouldGitIgnoreFile: vi.fn(),
      filterFiles: vi.fn(),
      shouldGeminiIgnoreFile: vi.fn(),
      getGeminiIgnorePatterns: vi.fn(),
    } as unknown as typeof mockFileDiscoveryService;

    mockConfig = {
      toolRegistry: {},
      sessionId: 'test-session',
      contentGeneratorConfig: {},
      embeddingModel: 'test-model',
      fileFiltering: { enabled: true, respectGitignore: true },
      getFileFilteringRespectGitIgnore: vi.fn(() => true),
      getFileService: vi.fn().mockReturnValue(mockFileDiscoveryService),
      getEnableRecursiveFileSearch: vi.fn(() => true),
    } as unknown as Config;

    vi.mocked(FileDiscoveryService).mockImplementation(
      () => mockFileDiscoveryService,
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should filter git-ignored entries from @ completions', async () => {
    const globResults = [`${testCwd}/data`, `${testCwd}/dist`];
    vi.mocked(glob).mockResolvedValue(globResults);

    // Mock git ignore service to ignore certain files
    mockFileDiscoveryService.shouldGitIgnoreFile.mockImplementation(
      (path: string) => path.includes('dist'),
    );

    const { result } = renderHook(() =>
      useCompletion('@d', testCwd, true, slashCommands, mockConfig),
    );

    // Wait for async operations to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150)); // Account for debounce
    });

    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions).toEqual(
      expect.arrayContaining([{ label: 'data', value: 'data' }]),
    );
    expect(result.current.showSuggestions).toBe(true);
  });

  it('should filter git-ignored directories from @ completions', async () => {
    // Mock fs.readdir to return both regular and git-ignored directories
    vi.mocked(fs.readdir).mockResolvedValue([
      { name: 'src', isDirectory: () => true },
      { name: 'node_modules', isDirectory: () => true },
      { name: 'dist', isDirectory: () => true },
      { name: 'README.md', isDirectory: () => false },
      { name: '.env', isDirectory: () => false },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    // Mock git ignore service to ignore certain files
    mockFileDiscoveryService.shouldGitIgnoreFile.mockImplementation(
      (path: string) =>
        path.includes('node_modules') ||
        path.includes('dist') ||
        path.includes('.env'),
    );

    const { result } = renderHook(() =>
      useCompletion('@', testCwd, true, slashCommands, mockConfig),
    );

    // Wait for async operations to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150)); // Account for debounce
    });

    expect(result.current.suggestions).toHaveLength(2);
    expect(result.current.suggestions).toEqual(
      expect.arrayContaining([
        { label: 'src/', value: 'src/' },
        { label: 'README.md', value: 'README.md' },
      ]),
    );
    expect(result.current.showSuggestions).toBe(true);
  });

  it('should handle recursive search with git-aware filtering', async () => {
    // Mock the recursive file search scenario
    vi.mocked(fs.readdir).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (dirPath: string | Buffer | URL): Promise<any> => {
        if (dirPath === testCwd) {
          return [
            { name: 'src', isDirectory: () => true },
            { name: 'node_modules', isDirectory: () => true },
            { name: 'temp', isDirectory: () => true },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        if (String(dirPath).endsWith('/src')) {
          return [
            { name: 'index.ts', isDirectory: () => false },
            { name: 'components', isDirectory: () => true },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        if (String(dirPath).endsWith('/temp')) {
          return [
            { name: 'temp.log', isDirectory: () => false }, // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [] as any;
      },
    );

    // Mock git ignore service
    mockFileDiscoveryService.shouldGitIgnoreFile.mockImplementation(
      (path: string) => path.includes('node_modules') || path.includes('temp'),
    );

    const { result } = renderHook(() =>
      useCompletion('@t', testCwd, true, slashCommands, mockConfig),
    );

    // Wait for async operations to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Should not include anything from node_modules or dist
    const suggestionLabels = result.current.suggestions.map((s) => s.label);
    expect(suggestionLabels).not.toContain('temp/');
    expect(suggestionLabels.some((l) => l.includes('node_modules'))).toBe(
      false,
    );
  });

  it('should not perform recursive search when disabled in config', async () => {
    const globResults = [`${testCwd}/data`, `${testCwd}/dist`];
    vi.mocked(glob).mockResolvedValue(globResults);

    // Disable recursive search in the mock config
    const mockConfigNoRecursive = {
      ...mockConfig,
      getEnableRecursiveFileSearch: vi.fn(() => false),
    } as unknown as Config;

    vi.mocked(fs.readdir).mockResolvedValue([
      { name: 'data', isDirectory: () => true },
      { name: 'dist', isDirectory: () => true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    renderHook(() =>
      useCompletion(
        '@d',
        testCwd,
        true,
        slashCommands,
        mockConfigNoRecursive as Config,
      ),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // `glob` should not be called because recursive search is disabled
    expect(glob).not.toHaveBeenCalled();
    // `fs.readdir` should be called for the top-level directory instead
    expect(fs.readdir).toHaveBeenCalledWith(testCwd, { withFileTypes: true });
  });

  it('should work without config (fallback behavior)', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      { name: 'src', isDirectory: () => true },
      { name: 'node_modules', isDirectory: () => true },
      { name: 'README.md', isDirectory: () => false },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const { result } = renderHook(() =>
      useCompletion('@', testCwd, true, slashCommands, undefined),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Without config, should include all files
    expect(result.current.suggestions).toHaveLength(3);
    expect(result.current.suggestions).toEqual(
      expect.arrayContaining([
        { label: 'src/', value: 'src/' },
        { label: 'node_modules/', value: 'node_modules/' },
        { label: 'README.md', value: 'README.md' },
      ]),
    );
  });

  it('should handle git discovery service initialization failure gracefully', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      { name: 'src', isDirectory: () => true },
      { name: 'README.md', isDirectory: () => false },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useCompletion('@', testCwd, true, slashCommands, mockConfig),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Since we use centralized service, initialization errors are handled at config level
    // This test should verify graceful fallback behavior
    expect(result.current.suggestions.length).toBeGreaterThanOrEqual(0);
    // Should still show completions even if git discovery fails
    expect(result.current.suggestions.length).toBeGreaterThan(0);

    consoleSpy.mockRestore();
  });

  it('should handle directory-specific completions with git filtering', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      { name: 'component.tsx', isDirectory: () => false },
      { name: 'temp.log', isDirectory: () => false },
      { name: 'index.ts', isDirectory: () => false },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    mockFileDiscoveryService.shouldGitIgnoreFile.mockImplementation(
      (path: string) => path.includes('.log'),
    );

    const { result } = renderHook(() =>
      useCompletion('@src/comp', testCwd, true, slashCommands, mockConfig),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Should filter out .log files but include matching .tsx files
    expect(result.current.suggestions).toEqual([
      { label: 'component.tsx', value: 'component.tsx' },
    ]);
  });

  it('should use glob for top-level @ completions when available', async () => {
    const globResults = [`${testCwd}/src/index.ts`, `${testCwd}/README.md`];
    vi.mocked(glob).mockResolvedValue(globResults);

    const { result } = renderHook(() =>
      useCompletion('@s', testCwd, true, slashCommands, mockConfig),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(glob).toHaveBeenCalledWith('**/s*', {
      cwd: testCwd,
      dot: false,
      nocase: true,
    });
    expect(fs.readdir).not.toHaveBeenCalled(); // Ensure glob is used instead of readdir
    expect(result.current.suggestions).toEqual([
      { label: 'README.md', value: 'README.md' },
      { label: 'src/index.ts', value: 'src/index.ts' },
    ]);
  });

  it('should include dotfiles in glob search when input starts with a dot', async () => {
    const globResults = [
      `${testCwd}/.env`,
      `${testCwd}/.gitignore`,
      `${testCwd}/src/index.ts`,
    ];
    vi.mocked(glob).mockResolvedValue(globResults);

    const { result } = renderHook(() =>
      useCompletion('@.', testCwd, true, slashCommands, mockConfig),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(glob).toHaveBeenCalledWith('**/.*', {
      cwd: testCwd,
      dot: true,
      nocase: true,
    });
    expect(fs.readdir).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([
      { label: '.env', value: '.env' },
      { label: '.gitignore', value: '.gitignore' },
      { label: 'src/index.ts', value: 'src/index.ts' },
    ]);
  });
});
