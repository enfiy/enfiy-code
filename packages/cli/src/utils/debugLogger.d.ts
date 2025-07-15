/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
export interface DebugLogEntry {
  timestamp: string;
  category: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
}
declare class DebugLogger {
  private logs;
  private maxLogs;
  log(
    category: string,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: unknown,
  ): void;
  info(category: string, message: string, data?: unknown): void;
  warn(category: string, message: string, data?: unknown): void;
  error(category: string, message: string, data?: unknown): void;
  debug(category: string, message: string, data?: unknown): void;
  getLogs(category?: string, level?: string): DebugLogEntry[];
  getRecentLogs(count?: number): DebugLogEntry[];
  clear(): void;
  exportLogs(): string;
}
export declare const debugLogger: DebugLogger;
export {};
