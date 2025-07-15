/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Content,
  GenerateContentResponse,
  GenerateContentConfig,
} from '@google/genai';

export enum ProviderType {
  // Local AI Providers
  OLLAMA = 'ollama',
  HUGGINGFACE = 'huggingface',
  VLLM = 'vllm',

  // Cloud AI Providers
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  MISTRAL = 'mistral',
  OPENROUTER = 'openrouter',
}

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface Provider {
  type: ProviderType;
  name: string;

  initialize(config: ProviderConfig): Promise<void>;

  generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse>;

  generateContentStream(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<AsyncGenerator<GenerateContentResponse>>;

  isAvailable(): Promise<boolean>;

  listModels?(): Promise<string[]>;

  isLocalProvider(): boolean;
  getCapabilities(): {
    supportsStreaming: boolean;
    supportsVision: boolean;
    supportsAudio: boolean;
    supportsFunctionCalling: boolean;
    supportsSystemPrompts: boolean;
    maxContextLength: number;
  };
  getAuthInstructions(): string;
  getRecommendedModels(): string[];
}

export interface LocalProviderConfig extends ProviderConfig {
  baseUrl: string;
  isDefault?: boolean;
}

export interface CloudProviderConfig extends ProviderConfig {
  apiKey: string;
}
