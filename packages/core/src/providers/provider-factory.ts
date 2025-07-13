/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Provider, ProviderType, ProviderConfig } from './types.js';
import { GeminiProvider } from './gemini-provider.js';
import { OllamaProvider } from './ollama-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { AnthropicProvider } from './anthropic-provider.js';
import { MistralProvider } from './mistral-provider.js';
import { HuggingFaceProvider } from './huggingface-provider.js';

export class ProviderFactory {
  static createProvider(type: ProviderType): Provider {
    switch (type) {
      // Local Providers
      case ProviderType.OLLAMA:
        return new OllamaProvider();
      case ProviderType.HUGGINGFACE:
        return new HuggingFaceProvider();
      
      // Cloud Providers
      case ProviderType.GEMINI:
        return new GeminiProvider();
      case ProviderType.OPENAI:
        return new OpenAIProvider();
      case ProviderType.ANTHROPIC:
        return new AnthropicProvider();
      case ProviderType.MISTRAL:
        return new MistralProvider();
      
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  static async detectAvailableProviders(): Promise<Array<{ type: ProviderType; name: string; available: boolean }>> {
    const providers = [
      // Local Providers
      { type: ProviderType.OLLAMA, name: 'Ollama (Local)' },
      { type: ProviderType.HUGGINGFACE, name: 'HuggingFace (Local)' },
      
      // Cloud Providers
      { type: ProviderType.GEMINI, name: 'Google Gemini' },
      { type: ProviderType.OPENAI, name: 'OpenAI' },
      { type: ProviderType.ANTHROPIC, name: 'Anthropic Claude' },
      { type: ProviderType.MISTRAL, name: 'Mistral AI' },
    ];

    const results = await Promise.all(
      providers.map(async (providerInfo) => {
        try {
          const provider = ProviderFactory.createProvider(providerInfo.type);
          
          // For local providers, check if they're actually running
          if (provider.isLocalProvider()) {
            const available = await provider.isAvailable();
            return { ...providerInfo, available };
          }
          
          // For cloud providers, assume they're available (auth will be checked later)
          return { ...providerInfo, available: true };
        } catch {
          return { ...providerInfo, available: false };
        }
      })
    );

    return results;
  }

  static getDefaultProviderConfig(): ProviderConfig {
    return {
      type: ProviderType.OLLAMA,
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2:3b',
      temperature: 0.7,
      maxTokens: 4096,
    };
  }

  static async getPreferredProvider(): Promise<ProviderType> {
    const available = await ProviderFactory.detectAvailableProviders();
    
    // Prefer local providers first
    const ollamaProvider = available.find(p => p.type === ProviderType.OLLAMA);
    if (ollamaProvider?.available) {
      return ProviderType.OLLAMA;
    }
    
    // Fall back to Gemini if available
    const geminiProvider = available.find(p => p.type === ProviderType.GEMINI);
    if (geminiProvider?.available) {
      return ProviderType.GEMINI;
    }
    
    // Default to OpenAI
    return ProviderType.OPENAI;
  }

  /**
   * Get all supported provider types
   */
  static getAllProviderTypes(): ProviderType[] {
    return Object.values(ProviderType);
  }

  /**
   * Get implemented provider types
   */
  static getImplementedProviderTypes(): ProviderType[] {
    return [
      ProviderType.OLLAMA,
      ProviderType.HUGGINGFACE,
      ProviderType.GEMINI,
      ProviderType.OPENAI,
      ProviderType.ANTHROPIC,
      ProviderType.MISTRAL,
    ];
  }

  /**
   * Get local provider types
   */
  static getLocalProviderTypes(): ProviderType[] {
    return [
      ProviderType.OLLAMA,
      ProviderType.HUGGINGFACE,
    ];
  }

  /**
   * Get cloud provider types
   */
  static getCloudProviderTypes(): ProviderType[] {
    return [
      ProviderType.OPENAI,
      ProviderType.ANTHROPIC,
      ProviderType.GEMINI,
      ProviderType.MISTRAL,
    ];
  }

  /**
   * Check if provider type is implemented
   */
  static isProviderImplemented(type: ProviderType): boolean {
    return this.getImplementedProviderTypes().includes(type);
  }

  /**
   * Get provider information including capabilities
   */
  static async getProviderInfo(type: ProviderType): Promise<{
    type: ProviderType;
    name: string;
    implemented: boolean;
    isLocal: boolean;
    capabilities?: {
      supportsStreaming: boolean;
      supportsVision: boolean;
      supportsAudio: boolean;
      supportsFunctionCalling: boolean;
      supportsSystemPrompts: boolean;
      maxContextLength: number;
    };
    authInstructions?: string;
    recommendedModels?: string[];
  }> {
    const implemented = this.isProviderImplemented(type);
    const isLocal = this.getLocalProviderTypes().includes(type);
    
    if (!implemented) {
      return {
        type,
        name: type.toString(),
        implemented: false,
        isLocal,
      };
    }

    try {
      const provider = this.createProvider(type);
      return {
        type,
        name: provider.name,
        implemented: true,
        isLocal,
        capabilities: provider.getCapabilities(),
        authInstructions: provider.getAuthInstructions(),
        recommendedModels: provider.getRecommendedModels(),
      };
    } catch {
      return {
        type,
        name: type.toString(),
        implemented: false,
        isLocal,
      };
    }
  }
}