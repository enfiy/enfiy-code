/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseTool, ToolResult } from './tools.js';
export declare const ENFIY_CONFIG_DIR = '.enfiy';
export declare const DEFAULT_CONTEXT_FILENAME = 'ENFIY.md';
export declare const MEMORY_SECTION_HEADER = '## Enfiy Added Memories';
export declare function setEnfiyMdFilename(
  newFilename: string | string[],
): void;
export declare function getCurrentEnfiyMdFilename(): string;
export declare function getAllEnfiyMdFilenames(): string[];
interface SaveMemoryParams {
  fact: string;
}
export declare class MemoryTool extends BaseTool<SaveMemoryParams, ToolResult> {
  static readonly Name: string;
  constructor();
  static performAddMemoryEntry(
    text: string,
    memoryFilePath: string,
    fsAdapter: {
      readFile: (path: string, encoding: 'utf-8') => Promise<string>;
      writeFile: (
        path: string,
        data: string,
        encoding: 'utf-8',
      ) => Promise<void>;
      mkdir: (
        path: string,
        options: {
          recursive: boolean;
        },
      ) => Promise<string | undefined>;
    },
  ): Promise<void>;
  execute(params: SaveMemoryParams, _signal: AbortSignal): Promise<ToolResult>;
}
export {};
