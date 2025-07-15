/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  Content,
  GenerateContentResponse,
  GenerateContentConfig,
} from '@google/genai';
import { Provider, ProviderType, ProviderConfig } from './types.js';
import { ContentGenerator } from '../core/contentGenerator.js';
export declare class GeminiProvider implements Provider {
  readonly type = ProviderType.GEMINI;
  readonly name = 'Google Gemini';
  private contentGenerator;
  private model;
  initialize(config: ProviderConfig): Promise<void>;
  setContentGenerator(contentGenerator: ContentGenerator): void;
  isAvailable(): Promise<boolean>;
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
  listModels(): Promise<string[]>;
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
