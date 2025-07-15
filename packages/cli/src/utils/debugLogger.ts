/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DebugLogEntry {
  timestamp: string;
  category: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
}

class DebugLogger {
  private logs: DebugLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 entries

  log(
    category: string,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: unknown,
  ) {
    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      category,
      level,
      message,
      data,
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console for immediate debugging
    const consoleMessage = `[${entry.timestamp}] [${category.toUpperCase()}] ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMessage, data);
        break;
      case 'warn':
        console.warn(consoleMessage, data);
        break;
      case 'debug':
        console.debug(consoleMessage, data);
        break;
      default:
        console.log(consoleMessage, data);
    }
  }

  info(category: string, message: string, data?: unknown) {
    this.log(category, 'info', message, data);
  }

  warn(category: string, message: string, data?: unknown) {
    this.log(category, 'warn', message, data);
  }

  error(category: string, message: string, data?: unknown) {
    this.log(category, 'error', message, data);
  }

  debug(category: string, message: string, data?: unknown) {
    this.log(category, 'debug', message, data);
  }

  getLogs(category?: string, level?: string): DebugLogEntry[] {
    let filteredLogs = this.logs;

    if (category) {
      filteredLogs = filteredLogs.filter((log) => log.category === category);
    }

    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    return filteredLogs;
  }

  getRecentLogs(count: number = 50): DebugLogEntry[] {
    return this.logs.slice(-count);
  }

  clear() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global debug logger instance
export const debugLogger = new DebugLogger();
