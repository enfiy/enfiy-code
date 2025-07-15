/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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

  async getAvailableModels(): Promise<ModelInfo[]> {
    const client = this.config.getEnfiyClient();
    if (!client) return [];

    // Mock implementation - in real scenario, this would query providers
    return [
      {
        name: 'gemini-1.5-pro',
        description: 'Google Gemini Pro - High performance model',
        provider: 'google',
        capabilities: ['code', 'reasoning', 'vision'],
        costTier: 'high',
        contextLength: 2000000,
        isAvailable: true,
      },
      {
        name: 'gemini-1.5-flash',
        description: 'Google Gemini Flash - Fast and efficient',
        provider: 'google',
        capabilities: ['code', 'reasoning'],
        costTier: 'low',
        contextLength: 1000000,
        isAvailable: true,
      },
      {
        name: 'claude-3.5-sonnet',
        description: 'Anthropic Claude Sonnet - Balanced performance',
        provider: 'anthropic',
        capabilities: ['code', 'reasoning', 'analysis'],
        costTier: 'medium',
        contextLength: 200000,
        isAvailable: true,
      },
      {
        name: 'gpt-4',
        description: 'OpenAI GPT-4 - Versatile model',
        provider: 'openai',
        capabilities: ['code', 'reasoning', 'vision'],
        costTier: 'high',
        contextLength: 128000,
        isAvailable: true,
      },
      {
        name: 'mistral-large-24.02',
        description: 'Mistral Large - Powerful and efficient',
        provider: 'mistral',
        capabilities: ['code', 'reasoning', 'multilingual'],
        costTier: 'high',
        contextLength: 32000,
        isAvailable: true,
      },
      {
        name: 'mistral-small-24.02',
        description: 'Mistral Small - Fast and cost-effective',
        provider: 'mistral',
        capabilities: ['code', 'reasoning'],
        costTier: 'low',
        contextLength: 32000,
        isAvailable: true,
      },
    ];
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
          `🔄 Auto-switched from ${modelName} to ${fallbackModel} due to: ${errorMessage}`,
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
