/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility for converting raw code content to markdown code blocks
 * Works across all providers (Ollama, HuggingFace, etc.)
 */
export interface CodeBlockMatch {
  content: string;
  language: string;
  startIndex: number;
  endIndex: number;
}
export interface ConversionResult {
  originalText: string;
  convertedText: string;
  conversions: CodeBlockMatch[];
}
export declare class CodeBlockConverter {
  /**
   * Language detection patterns for different file types
   */
  private static readonly LANGUAGE_PATTERNS;
  /**
   * File extension to language mapping
   */
  private static readonly EXTENSION_TO_LANGUAGE;
  /**
   * Detect the programming language of given content
   */
  static detectLanguage(
    content: string,
    hints?: {
      fileName?: string;
      extension?: string;
    },
  ): string;
  /**
   * Extract code content from various formats
   */
  static extractCodeContent(text: string): CodeBlockMatch[];
  /**
   * Convert raw code content to markdown code blocks
   */
  static convertToMarkdown(
    text: string,
    hints?: {
      fileName?: string;
      extension?: string;
    },
  ): ConversionResult;
  /**
   * Simple method to wrap content in code blocks if not already wrapped
   */
  static wrapInCodeBlock(content: string, language?: string): string;
}
