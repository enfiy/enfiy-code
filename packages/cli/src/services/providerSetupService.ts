/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProviderFactory, ProviderType, ProviderConfig } from '@enfiy/core';

export interface ProviderSetupResult {
  config: ProviderConfig;
  isFirstTime: boolean;
  availableProviders: Array<{
    type: ProviderType;
    name: string;
    available: boolean;
  }>;
}

export class ProviderSetupService {
  private static readonly PROVIDER_CONFIG_KEY = 'enfiy_provider_config';
  private static readonly SETUP_COMPLETE_KEY = 'enfiy_setup_complete';

  static async detectAndSetupProvider(
    forceSetup: boolean = false,
  ): Promise<ProviderSetupResult> {
    const isFirstTime = !this.isSetupComplete() || forceSetup;

    // Detect available providers
    const availableProviders = await ProviderFactory.detectAvailableProviders();

    let config: ProviderConfig;

    if (isFirstTime) {
      // First time setup - prefer local providers
      const preferredProvider = await ProviderFactory.getPreferredProvider();
      config = this.createDefaultConfigForProvider(preferredProvider);

      // Save the selection
      this.saveProviderConfig(config);
      this.markSetupComplete();
    } else {
      // Load existing configuration
      config =
        this.loadProviderConfig() ||
        this.createDefaultConfigForProvider(ProviderType.OLLAMA);
    }

    return {
      config,
      isFirstTime,
      availableProviders,
    };
  }

  static createDefaultConfigForProvider(type: ProviderType): ProviderConfig {
    switch (type) {
      case ProviderType.OLLAMA:
        return {
          type: ProviderType.OLLAMA,
          baseUrl: 'http://localhost:11434',
          model: 'llama3.2:3b',
          temperature: 0.7,
          maxTokens: 4096,
        };
      case ProviderType.GEMINI:
        return {
          type: ProviderType.GEMINI,
          model: 'gemini-2.0-flash-exp',
          temperature: 0.7,
          maxTokens: 8192,
        };
      case ProviderType.HUGGINGFACE:
        return {
          type: ProviderType.HUGGINGFACE,
          model: 'anthropic/claude-3-5-sonnet-20241022',
          temperature: 0.7,
          maxTokens: 4096,
        };
      case ProviderType.OPENROUTER:
        return {
          type: ProviderType.OPENROUTER,
          model: 'anthropic/claude-3.5-sonnet',
          temperature: 0.7,
          maxTokens: 4096,
        };
      default:
        return ProviderFactory.getDefaultProviderConfig();
    }
  }

  static saveProviderConfig(config: ProviderConfig): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.PROVIDER_CONFIG_KEY, JSON.stringify(config));
    }
  }

  static loadProviderConfig(): ProviderConfig | null {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.PROVIDER_CONFIG_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as ProviderConfig;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  static markSetupComplete(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.SETUP_COMPLETE_KEY, 'true');
    }
  }

  static isSetupComplete(): boolean {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.SETUP_COMPLETE_KEY) === 'true';
    }
    return false;
  }

  static resetSetup(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.PROVIDER_CONFIG_KEY);
      localStorage.removeItem(this.SETUP_COMPLETE_KEY);
    }
  }

  static async validateProviderConfig(
    config: ProviderConfig,
  ): Promise<boolean> {
    try {
      const provider = ProviderFactory.createProvider(config.type);
      await provider.initialize(config);
      return await provider.isAvailable();
    } catch {
      return false;
    }
  }

  static getProviderDisplayInfo(type: ProviderType): {
    name: string;
    description: string;
    icon: string;
  } {
    switch (type) {
      case ProviderType.OLLAMA:
        return {
          name: 'Ollama',
          description: 'Local AI models - Private, fast, works offline',
          icon: '🏠',
        };
      case ProviderType.GEMINI:
        return {
          name: 'Google Gemini',
          description: 'Cloud AI - Powerful, latest models',
          icon: '☁️',
        };
      case ProviderType.OPENAI:
        return {
          name: 'OpenAI',
          description: 'Cloud AI - GPT models',
          icon: '🤖',
        };
      case ProviderType.ANTHROPIC:
        return {
          name: 'Anthropic Claude',
          description: 'Cloud AI - Claude models',
          icon: '🧠',
        };
      default:
        return {
          name: 'Custom',
          description: 'Custom AI provider',
          icon: '⚙️',
        };
    }
  }
}
