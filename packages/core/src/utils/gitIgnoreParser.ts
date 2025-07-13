/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import * as fsSync from 'fs';
import ignore from 'ignore';
import { isGitRepository } from './gitUtils.js';

export interface GitIgnoreFilter {
  isIgnored(filePath: string): boolean;
  getPatterns(): string[];
}

export class GitIgnoreParser implements GitIgnoreFilter {
  private projectRoot: string;
  private ig = ignore();
  private patterns: string[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
  }

  async loadGitRepoPatternsAsync(): Promise<void> {
    if (!isGitRepository(this.projectRoot)) return;

    // Always ignore .git directory regardless of .gitignore content
    this.addPatterns(['.git']);

    const patternFiles = ['.gitignore', path.join('.git', 'info', 'exclude')];
    await Promise.all(patternFiles.map(pf => this.loadPatternsAsync(pf)));
  }

  loadGitRepoPatterns(): void {
    if (!isGitRepository(this.projectRoot)) return;

    // Always ignore .git directory regardless of .gitignore content
    this.addPatterns(['.git']);

    const patternFiles = ['.gitignore', path.join('.git', 'info', 'exclude')];
    for (const pf of patternFiles) {
      this.loadPatterns(pf);
    }
  }

  async loadPatternsAsync(patternsFileName: string): Promise<void> {
    const patternsFilePath = path.join(this.projectRoot, patternsFileName);
    let content: string;
    try {
      content = await fs.readFile(patternsFilePath, 'utf-8');
    } catch (_error) {
      // ignore file not found
      return;
    }
    const patterns = (content ?? '')
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p !== '' && !p.startsWith('#'));
    this.addPatterns(patterns);
  }

  loadPatterns(patternsFileName: string): void {
    const patternsFilePath = path.join(this.projectRoot, patternsFileName);
    let content: string;
    try {
      content = fsSync.readFileSync(patternsFilePath, 'utf-8');
    } catch (_error) {
      // ignore file not found
      return;
    }
    const patterns = (content ?? '')
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p !== '' && !p.startsWith('#'));
    this.addPatterns(patterns);
  }

  private addPatterns(patterns: string[]) {
    this.ig.add(patterns);
    this.patterns.push(...patterns);
  }

  isIgnored(filePath: string): boolean {
    const relativePath = path.isAbsolute(filePath)
      ? path.relative(this.projectRoot, filePath)
      : filePath;

    if (relativePath === '' || relativePath.startsWith('..')) {
      return false;
    }

    let normalizedPath = relativePath.replace(/\\/g, '/');
    if (normalizedPath.startsWith('./')) {
      normalizedPath = normalizedPath.substring(2);
    }

    return this.ig.ignores(normalizedPath);
  }

  getPatterns(): string[] {
    return this.patterns;
  }
}
