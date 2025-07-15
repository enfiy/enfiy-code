/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Provider, ProviderConfig, ProviderType } from './types.js';
import {
  Content,
  GenerateContentResponse,
  GenerateContentConfig,
} from '@google/genai';
/**
 * Abstract base class for all AI providers
 * Implements common functionality and enforces provider interface
 */
export declare abstract class BaseProvider implements Provider {
  abstract readonly type: ProviderType;
  abstract readonly name: string;
  protected config?: ProviderConfig;
  protected isInitialized: boolean;
  initialize(config: ProviderConfig): Promise<void>;
  /**
   * Subclasses must implement their specific initialization logic
   */
  protected abstract performInitialization(
    config: ProviderConfig,
  ): Promise<void>;
  /**
   * Check if provider is available (e.g., service is running, API is accessible)
   */
  abstract isAvailable(): Promise<boolean>;
  /**
   * Generate content using the provider's API
   */
  abstract generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse>;
  /**
   * Generate streaming content
   */
  abstract generateContentStream(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<AsyncGenerator<GenerateContentResponse>>;
  /**
   * List available models for this provider
   */
  listModels?(): Promise<string[]>;
  /**
   * Get provider-specific model recommendations
   */
  getRecommendedModels(): string[];
  /**
   * Validate configuration for this provider
   */
  validateConfig(config: ProviderConfig): boolean;
  /**
   * Check if this is a cloud provider (requires API key)
   */
  isCloudProvider(): boolean;
  /**
   * Check if this is a local provider
   */
  isLocalProvider(): boolean;
  /**
   * Get default configuration for this provider
   */
  getDefaultConfig(): Partial<ProviderConfig>;
  /**
   * Get default base URL for local providers
   */
  protected getDefaultBaseUrl(): string;
  /**
   * Convert provider-specific messages to standard Content format
   */
  protected convertToStandardContent(messages: unknown[]): Content[];
  /**
   * Convert standard response to provider format
   */
  protected convertToStandardResponse(
    response: unknown,
  ): GenerateContentResponse;
  /**
   * Handle provider-specific errors
   */
  protected handleError(error: unknown): Error;
  /**
   * Check if provider requires authentication
   */
  requiresAuthentication(): boolean;
  /**
   * Get authentication instructions for this provider
   */
  getAuthInstructions(): string;
  /**
   * Test connection to the provider
   */
  testConnection(): Promise<boolean>;
  /**
   * Get provider capabilities
   */
  getCapabilities(): {
    supportsStreaming: boolean;
    supportsVision: boolean;
    supportsAudio: boolean;
    supportsFunctionCalling: boolean;
    supportsSystemPrompts: boolean;
    maxContextLength: number;
  };
  /**
   * Common utility: Convert raw text to markdown code blocks
   * Can be used by any provider to improve code block detection
   */
  protected convertToMarkdownCodeBlocks(
    text: string,
    hints?: {
      fileName?: string;
      extension?: string;
    },
  ): string;
  /**
   * Common utility: Detect if text contains code content
   */
  protected hasCodeContent(text: string): boolean;
  /**
   * Common utility: Wrap content in appropriate code blocks
   */
  protected wrapInCodeBlock(content: string, language?: string): string;
}
