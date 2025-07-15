/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
export interface GitIgnoreFilter {
    isIgnored(filePath: string): boolean;
    getPatterns(): string[];
}
export declare class GitIgnoreParser implements GitIgnoreFilter {
    private projectRoot;
    private ig;
    private patterns;
    constructor(projectRoot: string);
    loadGitRepoPatternsAsync(): Promise<void>;
    loadGitRepoPatterns(): void;
    loadPatternsAsync(patternsFileName: string): Promise<void>;
    loadPatterns(patternsFileName: string): void;
    private addPatterns;
    isIgnored(filePath: string): boolean;
    getPatterns(): string[];
}
