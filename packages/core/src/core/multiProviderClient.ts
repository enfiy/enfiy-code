/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { 
  Content, 
  GenerateContentResponse, 
  GenerateContentConfig,
  GenerateContentParameters,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse
} from '@google/genai';
import { Config } from '../config/config.js';
import { Provider, ProviderType, ProviderConfig } from '../providers/types.js';
import { ProviderFactory } from '../providers/provider-factory.js';
import { GeminiProvider } from '../providers/gemini-provider.js';
import { ContentGenerator, ContentGeneratorConfig, AuthType } from './contentGenerator.js';

/**
 * Multi-provider client that can use any supported AI provider
 */
export class MultiProviderClient {
  private provider?: Provider;
  private currentProviderType?: ProviderType;
  private contentGenerator?: ContentGenerator;

  constructor(private config: Config) {}

  /**
   * Determine provider type from model name
   */
  private getProviderTypeFromModel(model: string): ProviderType {
    const modelLower = model.toLowerCase();
    
    // OpenAI models
    if (modelLower.includes('gpt') || modelLower.includes('openai') || modelLower.startsWith('o3') || modelLower.startsWith('o4')) {
      return ProviderType.OPENAI;
    }
    
    // Anthropic models
    if (modelLower.includes('claude') || modelLower.includes('anthropic')) {
      return ProviderType.ANTHROPIC;
    }
    
    // Gemini models
    if (modelLower.includes('gemini')) {
      return ProviderType.GEMINI;
    }
    
    // Mistral models
    if (modelLower.includes('mistral') || modelLower.includes('codestral') || modelLower.includes('devstral')) {
      return ProviderType.MISTRAL;
    }
    
    // Ollama models (expanded to include qwen, deepseek)
    if (modelLower.includes('llama') || modelLower.includes('codellama') || modelLower.includes('ollama') ||
        modelLower.includes('qwen') || modelLower.includes('deepseek') || modelLower.includes(':')) {
      return ProviderType.OLLAMA;
    }
    
    // HuggingFace models (models with / or specific prefixes)
    if (modelLower.includes('huggingface') || modelLower.includes('hf') || model.includes('/') ||
        modelLower.startsWith('meta-') || modelLower.startsWith('microsoft/')) {
      return ProviderType.HUGGINGFACE;
    }
    
    // For unknown models, default to Ollama with a helpful message
    console.log(`⚠️  Unknown model type: ${model}, defaulting to Ollama (local AI)`);
    
    // Default to Ollama for local-first approach
    return ProviderType.OLLAMA;
  }



  /**
   * Get API key for the provider
   */
  private getApiKeyForProvider(providerType: ProviderType): string | undefined {
    let apiKey: string | undefined;
    
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
  async initialize(model: string): Promise<void> {
    const providerType = this.getProviderTypeFromModel(model);
    
    // If we already have the right provider, don't reinitialize
    if (this.provider && this.currentProviderType === providerType) {
      return;
    }


    try {
      // Create provider config
      const apiKey = this.getApiKeyForProvider(providerType);
      
      if (providerType !== ProviderType.OLLAMA && !apiKey) {
        throw new Error(`API key not found for ${providerType}. Please set the corresponding environment variable.`);
      }

      const providerConfig: ProviderConfig = {
        type: providerType,
        model,
        apiKey,
        baseUrl: providerType === ProviderType.OLLAMA ? 'http://localhost:11434' : undefined,
        temperature: 0.7,
        maxTokens: 4096,
      };

      // Create and initialize provider
      this.provider = ProviderFactory.createProvider(providerType);
      
      // Special handling for Gemini provider (needs ContentGenerator)
      if (providerType === ProviderType.GEMINI && this.provider instanceof GeminiProvider) {
        // For Gemini, we still need to use the existing ContentGenerator system
        // This is a compatibility layer until full migration is complete
        const { createContentGenerator } = await import('./contentGenerator.js');
        const contentConfig = {
          authType: AuthType.API_KEY,
          apiKey: apiKey!,
          model,
        };
        this.contentGenerator = await createContentGenerator(contentConfig);
        this.provider.setContentGenerator(this.contentGenerator);
      }

      await this.provider.initialize(providerConfig);
      this.currentProviderType = providerType;
      
    } catch (error) {
      console.error(`❌ Failed to initialize ${providerType} provider:`, error);
      
      // Better error message for missing API keys
      if (error instanceof Error && error.message.includes('API key not found')) {
        const envVarName = this.getEnvVarNameForProvider(providerType);
        throw new Error(
          `Missing API key for ${providerType}. Please set ${envVarName} environment variable or use /provider command to configure.`
        );
      }
      
      // Don't fallback for API key issues, throw the error
      throw error;
    }
  }

  /**
   * Fallback to Gemini provider
   */
  private async initializeGeminiFallback(): Promise<void> {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('No API keys available. Please set at least GEMINI_API_KEY.');
    }

    const geminiConfig: ProviderConfig = {
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
  async generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse> {
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
  async generateContentStream(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<AsyncGenerator<GenerateContentResponse>> {
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
  async isAvailable(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }

    return await this.provider.isAvailable();
  }

  /**
   * Get current provider type
   */
  getCurrentProviderType(): ProviderType | undefined {
    return this.currentProviderType;
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): Provider | undefined {
    return this.provider;
  }

  /**
   * Get environment variable name for provider
   */
  private getEnvVarNameForProvider(providerType: ProviderType): string {
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
  async listModels(): Promise<string[]> {
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
export class MultiProviderContentGeneratorWrapper implements ContentGenerator {
  private client: MultiProviderClient;
  private config: ContentGeneratorConfig;

  constructor(config: ContentGeneratorConfig) {
    this.config = config;
    this.client = new MultiProviderClient({} as Config); // We don't need full Config for this wrapper
  }

  async generateContent(
    request: GenerateContentParameters,
  ): Promise<GenerateContentResponse> {
    await this.client.initialize(this.config.model);
    
    // Convert contents to proper Content[] format
    const contents: Content[] = Array.isArray(request.contents) 
      ? request.contents.map(this.ensureContentFormat)
      : [this.ensureContentFormat(request.contents)];
    
    return await this.client.generateContent({
      model: this.config.model,
      contents,
      config: request.config,
    });
  }

  async generateContentStream(
    request: GenerateContentParameters,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    await this.client.initialize(this.config.model);
    
    // Convert contents to proper Content[] format
    const contents: Content[] = Array.isArray(request.contents) 
      ? request.contents.map(this.ensureContentFormat)
      : [this.ensureContentFormat(request.contents)];
    
    return await this.client.generateContentStream({
      model: this.config.model,
      contents,
      config: request.config,
    });
  }

  private ensureContentFormat(content: unknown): Content {
    // If it's already a proper Content object, return as-is
    if (content && typeof content === 'object' && 'role' in content && 'parts' in content) {
      return content as Content;
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
        parts: [content as { text: string }],
      };
    }
    
    // Fallback
    return {
      role: 'user',
      parts: [{ text: String(content) }],
    };
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    // For non-Gemini providers, provide approximate token counts
    const contents: Content[] = Array.isArray(request.contents) 
      ? request.contents.map(this.ensureContentFormat)
      : [this.ensureContentFormat(request.contents)];
    
    const text = contents
      .map((content: Content) => 
        content.parts
          ?.map((part: unknown) => typeof part === 'string' ? part : (part as { text?: string }).text || '')
          .join(' ') || ''
      )
      .join(' ');
    
    // Rough approximation: 1 token = 4 characters for most models
    const approximateTokens = Math.ceil(text.length / 4);
    
    return {
      totalTokens: approximateTokens,
    };
  }

  async embedContent(_request: EmbedContentParameters): Promise<EmbedContentResponse> {
    // Most providers don't support embeddings through their chat APIs
    // Return empty embeddings for compatibility
    return {
      embeddings: [{
        values: [],
      }],
    };
  }
}