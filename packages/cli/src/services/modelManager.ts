/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { Config } from '@enfiy/core';

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
    ollama: boolean;
    openrouter: boolean;
  }> {
    return {
      gemini: !!process.env.GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      mistral: !!process.env.MISTRAL_API_KEY,
      ollama: await this.checkOllamaAvailability(),
      openrouter: !!process.env.OPENROUTER_API_KEY,
    };
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
   * Get available Ollama models
   */
  private async getOllamaModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) return [];

      const data = await response.json();
      const models = data.models || [];

      return models.map((model: { name: string; [key: string]: unknown }) => ({
        name: model.name,
        description: `Local Ollama model - ${model.name}`,
        provider: 'ollama',
        capabilities: ['code', 'reasoning'],
        costTier: 'free' as const,
        contextLength: 32000,
        isAvailable: true,
      }));
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
          name: 'gpt-4',
          description: 'OpenAI GPT-4 - Reliable high performance',
          provider: 'openai',
          capabilities: ['code', 'reasoning'],
          costTier: 'high',
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

    if (authStatus.ollama) {
      // Get locally available Ollama models
      const ollamaModels = await this.getOllamaModels();
      availableModels.push(...ollamaModels);
    }

    if (authStatus.openrouter) {
      availableModels.push(
        {
          name: 'anthropic/claude-3.5-sonnet',
          description: 'Claude 3.5 Sonnet via OpenRouter',
          provider: 'openrouter',
          capabilities: ['code', 'reasoning', 'analysis'],
          costTier: 'medium',
          contextLength: 200000,
          isAvailable: true,
        },
        {
          name: 'meta-llama/llama-3.2-90b-instruct',
          description: 'Llama 3.2 90B via OpenRouter',
          provider: 'openrouter',
          capabilities: ['code', 'reasoning'],
          costTier: 'high',
          contextLength: 128000,
          isAvailable: true,
        },
      );
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
