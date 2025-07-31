/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { Config, ProviderType } from '@enfiy/core';
import { hasStoredCredentials } from '../utils/secureStorage.js';

export interface ModelUsage {
  used: number;
  limit: number;
  resetTime?: Date;
}

export interface ModelInfo {
  name: string;
  description: string;
  provider: string;
  capabilities: string[];
  costTier: 'free' | 'low' | 'medium' | 'high';
  contextLength: number;
  isAvailable: boolean;
  displayName?: string;
}

export interface ModelFallbackConfig {
  primary: string;
  fallbacks: Array<{
    model: string;
    condition: 'rate_limit' | 'error' | 'unavailable' | 'usage_limit';
    priority: number;
  }>;
}

export class ModelManager {
  private config: Config;
  private modelUsageCache = new Map<string, ModelUsage>();
  private fallbackConfig: ModelFallbackConfig | null = null;
  private lastSwitchTime = new Map<string, number>();
  private readonly SWITCH_COOLDOWN = 30000; // 30 seconds

  constructor(config: Config) {
    this.config = config;
    this.loadFallbackConfig();
  }

  private loadFallbackConfig(): void {
    // Default fallback configuration
    this.fallbackConfig = {
      primary: this.config.getModel(),
      fallbacks: [
        { model: 'gemini-1.5-flash', condition: 'rate_limit', priority: 1 },
        { model: 'claude-3-haiku', condition: 'rate_limit', priority: 2 },
        { model: 'gpt-3.5-turbo', condition: 'rate_limit', priority: 3 },
        { model: 'ollama:llama3.1', condition: 'unavailable', priority: 4 },
      ],
    };
  }

  /**
   * Check which providers have valid authentication
   */
  private async checkProviderAuthentication(): Promise<{
    gemini: boolean;
    openai: boolean;
    mistral: boolean;
    anthropic: boolean;
    ollama: boolean;
    openrouter: boolean;
  }> {
    // Force strict authentication check - only show providers with actual credentials
    const authStatus = {
      gemini: hasStoredCredentials(ProviderType.GEMINI),
      openai: hasStoredCredentials(ProviderType.OPENAI),
      mistral: hasStoredCredentials(ProviderType.MISTRAL),
      anthropic: hasStoredCredentials(ProviderType.ANTHROPIC),
      ollama: await this.checkOllamaAvailability(),
      openrouter: hasStoredCredentials(ProviderType.OPENROUTER),
    };

    return authStatus;
  }

  /**
   * Check if Ollama is running locally
   */
  private async checkOllamaAvailability(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available OpenRouter models dynamically
   */
  private async getOpenRouterModels(): Promise<ModelInfo[]> {
    try {
      // For now, return a comprehensive list of OpenRouter models
      // In the future, this could be fetched dynamically from the OpenRouter API
      const modelIds = [
        // Claude models
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3-opus',
        'anthropic/claude-3-sonnet',
        'anthropic/claude-3-haiku',

        // Free models
        'qwen/qwen-2.5-coder-32b-instruct',
        'kimi/k2-65b',
        'deepseek/deepseek-coder-33b-instruct',
        'codellama/codellama-70b-instruct',

        // GPT models
        'openai/gpt-4-turbo',
        'openai/gpt-3.5-turbo',

        // Llama models
        'meta-llama/llama-3.2-90b-instruct',
        'meta-llama/llama-2-70b-chat',

        // Other popular models
        'mistralai/mistral-large',
        'google/gemini-pro',
      ];

      return modelIds.map((modelId: string) => {
        // Determine cost tier based on model name
        let costTier: 'free' | 'low' | 'medium' | 'high' = 'medium';
        if (
          modelId.includes('free') ||
          modelId.includes('qwen') ||
          modelId.includes('kimi')
        ) {
          costTier = 'free';
        } else if (
          modelId.includes('3.5') ||
          modelId.includes('flash') ||
          modelId.includes('haiku')
        ) {
          costTier = 'low';
        } else if (
          modelId.includes('opus') ||
          modelId.includes('gpt-4') ||
          modelId.includes('70b')
        ) {
          costTier = 'high';
        }

        // Extract display name from model ID
        const displayName = modelId.split('/').pop() || modelId;

        // Determine capabilities based on model name
        const capabilities: string[] = ['code', 'reasoning'];
        if (modelId.includes('vision') || modelId.includes('multimodal')) {
          capabilities.push('vision');
        }
        if (modelId.includes('coder') || modelId.includes('code')) {
          capabilities.push('advanced-code');
        }

        // Estimate context length
        let contextLength = 128000; // Default
        if (modelId.includes('16k')) contextLength = 16000;
        else if (modelId.includes('32k')) contextLength = 32000;
        else if (modelId.includes('100k')) contextLength = 100000;
        else if (modelId.includes('200k')) contextLength = 200000;
        else if (modelId.includes('256k')) contextLength = 256000;

        return {
          name: modelId,
          description: `${displayName} via OpenRouter`,
          provider: 'openrouter',
          capabilities,
          costTier,
          contextLength,
          isAvailable: true,
          displayName,
        };
      });
    } catch (error) {
      console.warn('Failed to fetch OpenRouter models:', error);
      // Return fallback models if API fails
      return [
        {
          name: 'anthropic/claude-3.5-sonnet',
          description: 'Claude 3.5 Sonnet via OpenRouter',
          provider: 'openrouter',
          capabilities: ['code', 'reasoning', 'analysis'],
          costTier: 'medium',
          contextLength: 200000,
          isAvailable: true,
          displayName: 'claude-3.5-sonnet',
        },
        {
          name: 'qwen/qwen-2.5-coder-32b-instruct',
          description: 'Qwen 2.5 Coder via OpenRouter (Free)',
          provider: 'openrouter',
          capabilities: ['code', 'reasoning', 'advanced-code'],
          costTier: 'free',
          contextLength: 32000,
          isAvailable: true,
          displayName: 'qwen-2.5-coder-32b',
        },
        {
          name: 'kimi/k2-65b',
          description: 'Kimi K2 via OpenRouter (Free, 256k context)',
          provider: 'openrouter',
          capabilities: ['code', 'reasoning'],
          costTier: 'free',
          contextLength: 256000,
          isAvailable: true,
          displayName: 'kimi-k2-65b',
        },
      ];
    }
  }

  /**
   * Get available Ollama models
   */
  private async getOllamaModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) return [];

      const data = await response.json();
      const models = data.models || [];

      return models.map(
        (model: {
          name: string;
          size?: number;
          modified_at?: string;
          [key: string]: unknown;
        }) => {
          // Create a more user-friendly description based on model name
          const getModelDescription = (modelName: string): string => {
            const name = modelName.toLowerCase();

            // Model families and their descriptions
            if (name.includes('deepseek-r1'))
              return 'DeepSeek R1 - Advanced reasoning model';
            if (name.includes('qwen3')) return 'Qwen 3 - Latest Alibaba model';
            if (name.includes('qwen2.5-coder'))
              return 'Qwen 2.5 Coder - Specialized for code';
            if (name.includes('qwen2.5'))
              return 'Qwen 2.5 - Fast and efficient';
            if (name.includes('qwen')) return 'Qwen - Chinese/English AI model';
            if (name.includes('llama3.3'))
              return 'Llama 3.3 - Latest Meta model';
            if (name.includes('llama3.2'))
              return 'Llama 3.2 - Efficient Meta model';
            if (name.includes('llama3.1'))
              return 'Llama 3.1 - Advanced Meta model';
            if (name.includes('llama'))
              return 'Meta Llama - General purpose AI';
            if (name.includes('phi4'))
              return 'Phi 4 - Microsoft reasoning model';
            if (name.includes('phi3')) return 'Phi 3 - Microsoft small model';
            if (name.includes('phi')) return 'Microsoft Phi - Efficient AI';
            if (name.includes('gemma3'))
              return 'Gemma 3 - Google efficient model';
            if (name.includes('gemma2'))
              return 'Gemma 2 - Google lightweight AI';
            if (name.includes('gemma')) return 'Google Gemma - Efficient AI';
            if (name.includes('mistral')) return 'Mistral - European AI model';
            if (name.includes('mixtral')) return 'Mixtral - MoE architecture';
            if (name.includes('codellama'))
              return 'Code Llama - Coding specialist';
            if (name.includes('starcoder2'))
              return 'StarCoder 2 - Code generation';
            if (name.includes('deepseek-coder'))
              return 'DeepSeek Coder - Advanced coding';
            if (name.includes('llava'))
              return 'LLaVA - Vision + language model';
            if (name.includes('smollm2')) return 'SmolLM2 - Tiny but capable';
            if (name.includes('dolphin')) return 'Dolphin - Uncensored model';
            if (name.includes('neural-chat'))
              return 'Neural Chat - Intel optimized';
            if (name.includes('vicuna')) return 'Vicuna - Fine-tuned LLaMA';
            if (name.includes('orca')) return 'Orca - Microsoft research model';
            if (name.includes('falcon')) return 'Falcon - TII model';
            return 'Local AI model';
          };

          // Determine capabilities based on model name
          const getCapabilities = (modelName: string): string[] => {
            const name = modelName.toLowerCase();
            const capabilities = ['code', 'reasoning'];

            if (
              name.includes('coder') ||
              name.includes('codellama') ||
              name.includes('starcoder')
            ) {
              capabilities.push('advanced-code');
            }
            if (name.includes('vision') || name.includes('llava')) {
              capabilities.push('vision');
            }
            if (
              name.includes('r1') ||
              name.includes('o3') ||
              name.includes('phi4')
            ) {
              capabilities.push('advanced-reasoning');
            }

            return capabilities;
          };

          // Estimate context length based on model name and size
          const getContextLength = (modelName: string): number => {
            const name = modelName.toLowerCase();

            // Specific model context lengths
            if (name.includes('qwen2.5') && name.includes('128k'))
              return 128000;
            if (name.includes('llama3.3') && name.includes('70b'))
              return 128000;
            if (name.includes('llama3.1') && name.includes('128k'))
              return 128000;
            if (name.includes('mixtral')) return 32768;
            if (name.includes('gemma3')) return 16384;
            if (name.includes('phi4')) return 16384;
            if (name.includes('deepseek-r1')) return 64000;

            // Default based on model size
            if (name.includes('70b') || name.includes('65b')) return 8192;
            if (name.includes('32b') || name.includes('34b')) return 32768;
            if (name.includes('13b') || name.includes('14b')) return 8192;
            if (name.includes('7b') || name.includes('8b')) return 8192;
            if (name.includes('3b')) return 4096;
            if (name.includes('1b') || name.includes('2b')) return 2048;

            return 8192; // Default
          };

          // Format size for display
          const formatSize = (bytes?: number): string => {
            if (!bytes) return '';
            const gb = bytes / (1024 * 1024 * 1024);
            return ` (${gb.toFixed(1)}GB)`;
          };

          return {
            name: model.name,
            description:
              getModelDescription(model.name) + formatSize(model.size),
            provider: 'ollama',
            capabilities: getCapabilities(model.name),
            costTier: 'free' as const,
            contextLength: getContextLength(model.name),
            isAvailable: true,
            displayName: model.name,
          };
        },
      );
    } catch {
      return [];
    }
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    const client = this.config.getEnfiyClient();
    if (!client) return [];

    const availableModels: ModelInfo[] = [];

    // Check authentication status for each provider
    const authStatus = await this.checkProviderAuthentication();

    // Add models from authenticated providers
    if (authStatus.gemini) {
      availableModels.push(
        {
          name: 'gemini-2.5-pro',
          description: 'Google Gemini 2.5 Pro - Latest high performance model',
          provider: 'gemini',
          capabilities: ['code', 'reasoning', 'vision', 'thinking'],
          costTier: 'high',
          contextLength: 2000000,
          isAvailable: true,
        },
        {
          name: 'gemini-2.5-flash',
          description: 'Google Gemini 2.5 Flash - Fast and efficient',
          provider: 'gemini',
          capabilities: ['code', 'reasoning', 'vision'],
          costTier: 'low',
          contextLength: 1000000,
          isAvailable: true,
        },
        {
          name: 'gemini-1.5-pro',
          description: 'Google Gemini 1.5 Pro - Stable high performance',
          provider: 'gemini',
          capabilities: ['code', 'reasoning', 'vision'],
          costTier: 'high',
          contextLength: 2000000,
          isAvailable: true,
        },
        {
          name: 'gemini-1.5-flash',
          description: 'Google Gemini 1.5 Flash - Fast processing',
          provider: 'gemini',
          capabilities: ['code', 'reasoning'],
          costTier: 'low',
          contextLength: 1000000,
          isAvailable: true,
        },
      );
    }

    if (authStatus.openai) {
      availableModels.push(
        {
          name: 'gpt-4o',
          description: 'OpenAI GPT-4o - Multimodal flagship model',
          provider: 'openai',
          capabilities: ['code', 'reasoning', 'vision', 'audio'],
          costTier: 'high',
          contextLength: 128000,
          isAvailable: true,
        },
        {
          name: 'gpt-4o-mini',
          description: 'OpenAI GPT-4o Mini - Fast and cost-effective',
          provider: 'openai',
          capabilities: ['code', 'reasoning', 'vision'],
          costTier: 'low',
          contextLength: 128000,
          isAvailable: true,
        },
        {
          name: 'o3-mini',
          description: 'OpenAI o3-mini - Advanced reasoning model',
          provider: 'openai',
          capabilities: ['reasoning', 'analysis', 'problem-solving'],
          costTier: 'medium',
          contextLength: 128000,
          isAvailable: true,
        },
      );
    }

    if (authStatus.mistral) {
      availableModels.push(
        {
          name: 'mistral-large-24.11',
          description: 'Mistral Large - Latest high performance model',
          provider: 'mistral',
          capabilities: ['code', 'reasoning', 'multilingual'],
          costTier: 'high',
          contextLength: 128000,
          isAvailable: true,
        },
        {
          name: 'mistral-small-24.09',
          description: 'Mistral Small - Fast and efficient',
          provider: 'mistral',
          capabilities: ['code', 'reasoning'],
          costTier: 'low',
          contextLength: 32000,
          isAvailable: true,
        },
        {
          name: 'codestral-22.07',
          description: 'Mistral Codestral - Code generation specialist',
          provider: 'mistral',
          capabilities: ['code', 'programming'],
          costTier: 'medium',
          contextLength: 32000,
          isAvailable: true,
        },
      );
    }

    if (authStatus.anthropic) {
      availableModels.push(
        {
          name: 'claude-3-5-sonnet-20241022',
          description: 'Claude 3.5 Sonnet - Latest Anthropic model',
          provider: 'anthropic',
          capabilities: ['code', 'reasoning', 'analysis'],
          costTier: 'high',
          contextLength: 200000,
          isAvailable: true,
        },
        {
          name: 'claude-3-haiku-20240307',
          description: 'Claude 3 Haiku - Fast and efficient',
          provider: 'anthropic',
          capabilities: ['code', 'reasoning'],
          costTier: 'low',
          contextLength: 200000,
          isAvailable: true,
        },
      );
    }

    if (authStatus.ollama) {
      // Get locally available Ollama models
      const ollamaModels = await this.getOllamaModels();
      availableModels.push(...ollamaModels);
    }

    if (authStatus.openrouter) {
      // Get models from OpenRouter dynamically
      const openrouterModels = await this.getOpenRouterModels();
      availableModels.push(...openrouterModels);
    }

    return availableModels;
  }

  async getModelUsage(modelName: string): Promise<ModelUsage> {
    // Check cache first
    if (this.modelUsageCache.has(modelName)) {
      return this.modelUsageCache.get(modelName)!;
    }

    // Mock implementation - in real scenario, this would query API providers
    const usage: ModelUsage = {
      used: Math.floor(Math.random() * 1000),
      limit: 1000,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    };

    this.modelUsageCache.set(modelName, usage);
    return usage;
  }

  async shouldSwitchModel(
    modelName: string,
    error?: unknown,
  ): Promise<string | null> {
    if (!this.fallbackConfig) return null;

    const lastSwitch = this.lastSwitchTime.get(modelName) || 0;
    const now = Date.now();

    // Respect cooldown period
    if (now - lastSwitch < this.SWITCH_COOLDOWN) {
      return null;
    }

    // Check usage limits
    const usage = await this.getModelUsage(modelName);
    const usagePercent = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;

    // Determine switch condition
    let condition:
      | 'rate_limit'
      | 'error'
      | 'unavailable'
      | 'usage_limit'
      | null = null;

    if (error) {
      const errorObj = error as { status?: number; message?: string }; // Type assertion for error object
      if (errorObj.status === 429 || errorObj.message?.includes('rate limit')) {
        condition = 'rate_limit';
      } else if (errorObj.status && errorObj.status >= 500) {
        condition = 'unavailable';
      } else {
        condition = 'error';
      }
    } else if (usagePercent >= 95) {
      condition = 'usage_limit';
    }

    if (!condition) return null;

    // Find best fallback model
    const fallbacks = this.fallbackConfig.fallbacks
      .filter((f) => f.condition === condition)
      .sort((a, b) => a.priority - b.priority);

    for (const fallback of fallbacks) {
      const fallbackUsage = await this.getModelUsage(fallback.model);
      const fallbackPercent =
        fallbackUsage.limit > 0
          ? (fallbackUsage.used / fallbackUsage.limit) * 100
          : 0;

      // Check if fallback model is available and not at limit
      if (fallbackPercent < 90) {
        this.lastSwitchTime.set(modelName, now);
        return fallback.model;
      }
    }

    return null;
  }

  async switchToModel(modelName: string): Promise<boolean> {
    try {
      const client = this.config.getEnfiyClient();
      if (!client) return false;

      // Check if model is available
      const models = await this.getAvailableModels();
      const targetModel = models.find((m) => m.name === modelName);

      if (!targetModel || !targetModel.isAvailable) {
        return false;
      }

      // Switch model
      this.config.setModel(modelName);

      // Clear usage cache for the new model
      this.modelUsageCache.delete(modelName);

      return true;
    } catch (error) {
      console.error('Failed to switch model:', error);
      return false;
    }
  }

  setFallbackOrder(
    primary: string,
    fallbacks: Array<{ model: string; condition: string; priority: number }>,
  ): void {
    this.fallbackConfig = {
      primary,
      fallbacks: fallbacks.map((f) => ({
        ...f,
        condition: f.condition as
          | 'rate_limit'
          | 'error'
          | 'unavailable'
          | 'usage_limit',
      })),
    };
  }

  getFallbackOrder(): ModelFallbackConfig | null {
    return this.fallbackConfig;
  }

  async handleModelError(
    modelName: string,
    error: unknown,
  ): Promise<string | null> {
    const fallbackModel = await this.shouldSwitchModel(modelName, error);

    if (fallbackModel) {
      const switched = await this.switchToModel(fallbackModel);
      if (switched) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log(
          `Auto-switched from ${modelName} to ${fallbackModel} due to: ${errorMessage}`,
        );
        return fallbackModel;
      }
    }

    return null;
  }

  clearUsageCache(): void {
    this.modelUsageCache.clear();
  }

  getModelStats(): { [modelName: string]: ModelUsage } {
    return Object.fromEntries(this.modelUsageCache.entries());
  }
}
