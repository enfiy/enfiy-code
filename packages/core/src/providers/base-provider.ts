/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Provider, ProviderConfig, ProviderType } from './types.js';
import { Content, GenerateContentResponse, GenerateContentConfig } from '@google/genai';
import { CodeBlockConverter } from '../utils/codeBlockConverter.js';

/**
 * Abstract base class for all AI providers
 * Implements common functionality and enforces provider interface
 */
export abstract class BaseProvider implements Provider {
  abstract readonly type: ProviderType;
  abstract readonly name: string;
  
  protected config?: ProviderConfig;
  protected isInitialized = false;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    await this.performInitialization(config);
    this.isInitialized = true;
  }

  /**
   * Subclasses must implement their specific initialization logic
   */
  protected abstract performInitialization(config: ProviderConfig): Promise<void>;

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
  async listModels?(): Promise<string[]>;

  /**
   * Get provider-specific model recommendations
   */
  getRecommendedModels(): string[] {
    return [];
  }

  /**
   * Validate configuration for this provider
   */
  validateConfig(config: ProviderConfig): boolean {
    if (config.type !== this.type) {
      return false;
    }

    // Check if API key is required for cloud providers
    if (this.isCloudProvider() && !config.apiKey) {
      return false;
    }

    // Check if base URL is required for local providers
    if (this.isLocalProvider() && !config.baseUrl) {
      return false;
    }

    return true;
  }

  /**
   * Check if this is a cloud provider (requires API key)
   */
  isCloudProvider(): boolean {
    const cloudProviders = [
      ProviderType.OPENAI,
      ProviderType.ANTHROPIC,
      ProviderType.GEMINI,
      ProviderType.MISTRAL,
    ];
    return cloudProviders.includes(this.type);
  }

  /**
   * Check if this is a local provider
   */
  isLocalProvider(): boolean {
    const localProviders = [
      ProviderType.OLLAMA,
      ProviderType.HUGGINGFACE,
    ];
    return localProviders.includes(this.type);
  }

  /**
   * Get default configuration for this provider
   */
  getDefaultConfig(): Partial<ProviderConfig> {
    const baseConfig = {
      type: this.type,
      temperature: 0.7,
      maxTokens: 4096,
    };

    if (this.isLocalProvider()) {
      return {
        ...baseConfig,
        baseUrl: this.getDefaultBaseUrl(),
      };
    }

    return baseConfig;
  }

  /**
   * Get default base URL for local providers
   */
  protected getDefaultBaseUrl(): string {
    const defaultUrls: Record<string, string> = {
      [ProviderType.OLLAMA]: 'http://localhost:11434',
      [ProviderType.HUGGINGFACE]: 'https://api-inference.huggingface.co/models',
    };

    return defaultUrls[this.type] || 'http://localhost:8080';
  }

  /**
   * Convert provider-specific messages to standard Content format
   */
  protected convertToStandardContent(messages: unknown[]): Content[] {
    // Default implementation - subclasses can override
    return messages as Content[];
  }

  /**
   * Convert standard response to provider format
   */
  protected convertToStandardResponse(response: unknown): GenerateContentResponse {
    // Default implementation - subclasses should override for proper type safety
    return response as GenerateContentResponse;
  }

  /**
   * Handle provider-specific errors
   */
  protected handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    if (error && typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      const message = errorObj.message || errorObj.error || errorObj.detail || 'Unknown error';
      return new Error(`${this.name} API Error: ${message}`);
    }

    return new Error(`${this.name} API Error: Unknown error occurred`);
  }

  /**
   * Check if provider requires authentication
   */
  requiresAuthentication(): boolean {
    return this.isCloudProvider();
  }

  /**
   * Get authentication instructions for this provider
   */
  getAuthInstructions(): string {
    if (!this.requiresAuthentication()) {
      return `${this.name} is a local provider and does not require an API key.`;
    }

    const instructions: Record<string, string> = {
      [ProviderType.OPENAI]: 'Get your API key from https://platform.openai.com/api-keys',
      [ProviderType.ANTHROPIC]: 'Get your API key from https://console.anthropic.com/',
      [ProviderType.GEMINI]: 'Get your API key from https://makersuite.google.com/app/apikey',
      [ProviderType.MISTRAL]: 'Get your API key from https://console.mistral.ai/',
    };

    return instructions[this.type] || `Get your API key from ${this.name}'s developer portal.`;
  }

  /**
   * Test connection to the provider
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return false;
      }

      // For local providers, check if service is available
      if (this.isLocalProvider()) {
        return await this.isAvailable();
      }

      // For cloud providers, try listing models or make a simple API call
      try {
        if (this.listModels) {
          await this.listModels();
          return true;
        }
      } catch {
        // Fallback: try a simple generation request
        try {
          await this.generateContent({
            model: this.getRecommendedModels()[0] || 'default',
            contents: [{ role: 'user', parts: [{ text: 'test' }] }],
            config: { maxOutputTokens: 1 },
          });
          return true;
        } catch {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

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
  } {
    // Default capabilities - subclasses should override
    return {
      supportsStreaming: true,
      supportsVision: false,
      supportsAudio: false,
      supportsFunctionCalling: false,
      supportsSystemPrompts: true,
      maxContextLength: 4096,
    };
  }

  /**
   * Common utility: Convert raw text to markdown code blocks
   * Can be used by any provider to improve code block detection
   */
  protected convertToMarkdownCodeBlocks(text: string, hints?: { fileName?: string; extension?: string }): string {
    const result = CodeBlockConverter.convertToMarkdown(text, hints);
    return result.convertedText;
  }

  /**
   * Common utility: Detect if text contains code content
   */
  protected hasCodeContent(text: string): boolean {
    const codeMatches = CodeBlockConverter.extractCodeContent(text);
    return codeMatches.length > 0;
  }

  /**
   * Common utility: Wrap content in appropriate code blocks
   */
  protected wrapInCodeBlock(content: string, language?: string): string {
    return CodeBlockConverter.wrapInCodeBlock(content, language);
  }
}