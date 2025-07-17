/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProviderType } from '../providers/types.js';
import { ProviderFactory } from '../providers/provider-factory.js';
import { GeminiProvider } from '../providers/gemini-provider.js';
import { AuthType } from './contentGenerator.js';
/**
 * Multi-provider client that can use any supported AI provider
 */
export class MultiProviderClient {
  config;
  provider;
  currentProviderType;
  contentGenerator;
  constructor(config) {
    this.config = config;
  }
  /**
   * Determine provider type from model name
   */
  getProviderTypeFromModel(model) {
    if (model.includes('gpt') || model.includes('openai')) {
      return ProviderType.OPENAI;
    } else if (model.includes('claude') || model.includes('anthropic')) {
      return ProviderType.ANTHROPIC;
    } else if (model.includes('gemini')) {
      return ProviderType.GEMINI;
    } else if (model.includes('mistral')) {
      return ProviderType.MISTRAL;
    } else if (
      model.includes('llama') ||
      model.includes('codellama') ||
      model.includes('ollama')
    ) {
      return ProviderType.OLLAMA;
    } else if (model.includes('huggingface') || model.includes('hf')) {
      return ProviderType.HUGGINGFACE;
    } else {
      // Default to Gemini for unknown models
      console.log(`WARNING: Unknown model type: ${model}, defaulting to Gemini`);
      return ProviderType.GEMINI;
    }
  }
  /**
   * Get API key for the provider
   */
  getApiKeyForProvider(providerType) {
    let apiKey;
    switch (providerType) {
      case ProviderType.OPENAI:
        apiKey = process.env.OPENAI_API_KEY;
        break;
      case ProviderType.ANTHROPIC:
        apiKey = process.env.ANTHROPIC_API_KEY;
        break;
      case ProviderType.GEMINI:
        apiKey = process.env.GEMINI_API_KEY;
        break;
      case ProviderType.MISTRAL:
        apiKey = process.env.MISTRAL_API_KEY;
        break;
      case ProviderType.HUGGINGFACE:
        apiKey = process.env.HUGGINGFACE_API_KEY;
        break;
      case ProviderType.OLLAMA:
        return undefined; // Local provider, no API key needed
      default:
        return undefined;
    }
    return apiKey;
  }
  /**
   * Initialize the appropriate provider for the given model
   */
  async initialize(model) {
    const providerType = this.getProviderTypeFromModel(model);
    // If we already have the right provider, don't reinitialize
    if (this.provider && this.currentProviderType === providerType) {
      return;
    }
    try {
      // Create provider config
      const apiKey = this.getApiKeyForProvider(providerType);
      if (providerType !== ProviderType.OLLAMA && !apiKey) {
        throw new Error(
          `API key not found for ${providerType}. Please set the corresponding environment variable.`,
        );
      }
      const providerConfig = {
        type: providerType,
        model,
        apiKey,
        baseUrl:
          providerType === ProviderType.OLLAMA
            ? 'http://localhost:11434'
            : undefined,
        temperature: 0.7,
        maxTokens: 4096,
      };
      // Create and initialize provider
      this.provider = ProviderFactory.createProvider(providerType);
      // Special handling for Gemini provider (needs ContentGenerator)
      if (
        providerType === ProviderType.GEMINI &&
        this.provider instanceof GeminiProvider
      ) {
        // For Gemini, we still need to use the existing ContentGenerator system
        // This is a compatibility layer until full migration is complete
        const { createContentGenerator } = await import(
          './contentGenerator.js'
        );
        const contentConfig = {
          authType: AuthType.API_KEY,
          apiKey,
          model,
        };
        this.contentGenerator = await createContentGenerator(contentConfig);
        this.provider.setContentGenerator(this.contentGenerator);
      }
      await this.provider.initialize(providerConfig);
      this.currentProviderType = providerType;
    } catch (error) {
      console.error(`ERROR: Failed to initialize ${providerType} provider:`, error);
      // Better error message for missing API keys
      if (
        error instanceof Error &&
        error.message.includes('API key not found')
      ) {
        const envVarName = this.getEnvVarNameForProvider(providerType);
        throw new Error(
          `Missing API key for ${providerType}. Please set ${envVarName} environment variable or use /provider command to configure.`,
        );
      }
      // Don't fallback for API key issues, throw the error
      throw error;
    }
  }
  /**
   * Fallback to Gemini provider
   */
  async initializeGeminiFallback() {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error(
        'No API keys available. Please set at least GEMINI_API_KEY.',
      );
    }
    const geminiConfig = {
      type: ProviderType.GEMINI,
      model: 'gemini-1.5-flash',
      apiKey: geminiApiKey,
      temperature: 0.7,
      maxTokens: 4096,
    };
    this.provider = ProviderFactory.createProvider(ProviderType.GEMINI);
    if (this.provider instanceof GeminiProvider) {
      const { createContentGenerator } = await import('./contentGenerator.js');
      const contentConfig = {
        authType: AuthType.API_KEY,
        apiKey: geminiApiKey,
        model: 'gemini-1.5-flash',
      };
      this.contentGenerator = await createContentGenerator(contentConfig);
      this.provider.setContentGenerator(this.contentGenerator);
    }
    await this.provider.initialize(geminiConfig);
    this.currentProviderType = ProviderType.GEMINI;
  }
  /**
   * Generate content using the current provider
   */
  async generateContent(params) {
    if (!this.provider) {
      await this.initialize(params.model);
    }
    if (!this.provider) {
      throw new Error('No provider available');
    }
    return await this.provider.generateContent(params);
  }
  /**
   * Generate streaming content using the current provider
   */
  async generateContentStream(params) {
    if (!this.provider) {
      await this.initialize(params.model);
    }
    if (!this.provider) {
      throw new Error('No provider available');
    }
    return await this.provider.generateContentStream(params);
  }
  /**
   * Check if provider is available
   */
  async isAvailable() {
    if (!this.provider) {
      return false;
    }
    return await this.provider.isAvailable();
  }
  /**
   * Get current provider type
   */
  getCurrentProviderType() {
    return this.currentProviderType;
  }
  /**
   * Get current provider
   */
  getCurrentProvider() {
    return this.provider;
  }
  /**
   * Get environment variable name for provider
   */
  getEnvVarNameForProvider(providerType) {
    switch (providerType) {
      case ProviderType.OPENAI:
        return 'OPENAI_API_KEY';
      case ProviderType.ANTHROPIC:
        return 'ANTHROPIC_API_KEY';
      case ProviderType.GEMINI:
        return 'GEMINI_API_KEY';
      case ProviderType.MISTRAL:
        return 'MISTRAL_API_KEY';
      case ProviderType.HUGGINGFACE:
        return 'HUGGINGFACE_API_KEY';
      case ProviderType.OLLAMA:
        return 'OLLAMA_BASE_URL';
      default:
        return 'API_KEY';
    }
  }
  /**
   * List available models for current provider
   */
  async listModels() {
    if (!this.provider || !this.provider.listModels) {
      return [];
    }
    try {
      return await this.provider.listModels();
    } catch (error) {
      console.warn('Failed to list models:', error);
      return [];
    }
  }
}
/**
 * Wrapper to make MultiProviderClient compatible with ContentGenerator interface
 */
export class MultiProviderContentGeneratorWrapper {
  client;
  config;
  constructor(config) {
    this.config = config;
    this.client = new MultiProviderClient({}); // We don't need full Config for this wrapper
  }
  async generateContent(request) {
    await this.client.initialize(this.config.model);
    // Convert contents to proper Content[] format
    const contents = Array.isArray(request.contents)
      ? request.contents.map(this.ensureContentFormat)
      : [this.ensureContentFormat(request.contents)];
    return await this.client.generateContent({
      model: this.config.model,
      contents,
      config: request.config,
    });
  }
  async generateContentStream(request) {
    await this.client.initialize(this.config.model);
    // Convert contents to proper Content[] format
    const contents = Array.isArray(request.contents)
      ? request.contents.map(this.ensureContentFormat)
      : [this.ensureContentFormat(request.contents)];
    return await this.client.generateContentStream({
      model: this.config.model,
      contents,
      config: request.config,
    });
  }
  ensureContentFormat(content) {
    // If it's already a proper Content object, return as-is
    if (
      content &&
      typeof content === 'object' &&
      'role' in content &&
      'parts' in content
    ) {
      return content;
    }
    // If it's a string, wrap it in Content format
    if (typeof content === 'string') {
      return {
        role: 'user',
        parts: [{ text: content }],
      };
    }
    // If it's a part object, wrap it
    if (content && typeof content === 'object' && 'text' in content) {
      return {
        role: 'user',
        parts: [content],
      };
    }
    // Fallback
    return {
      role: 'user',
      parts: [{ text: String(content) }],
    };
  }
  async countTokens(request) {
    // For non-Gemini providers, provide approximate token counts
    const contents = Array.isArray(request.contents)
      ? request.contents.map(this.ensureContentFormat)
      : [this.ensureContentFormat(request.contents)];
    const text = contents
      .map(
        (content) =>
          content.parts
            ?.map((part) => (typeof part === 'string' ? part : part.text || ''))
            .join(' ') || '',
      )
      .join(' ');
    // Rough approximation: 1 token = 4 characters for most models
    const approximateTokens = Math.ceil(text.length / 4);
    return {
      totalTokens: approximateTokens,
    };
  }
  async embedContent(_request) {
    // Most providers don't support embeddings through their chat APIs
    // Return empty embeddings for compatibility
    return {
      embeddings: [
        {
          values: [],
        },
      ],
    };
  }
}
//# sourceMappingURL=multiProviderClient.js.map
