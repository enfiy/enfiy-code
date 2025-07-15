/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseProvider } from './base-provider.js';
import { ProviderConfig, ProviderType } from './types.js';
import {
  Content,
  GenerateContentResponse,
  GenerateContentConfig,
} from '@google/genai';
interface MistralResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'model_length';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
export declare class MistralProvider extends BaseProvider {
  readonly type = ProviderType.MISTRAL;
  readonly name = 'Mistral';
  private apiKey?;
  private baseUrl;
  protected performInitialization(config: ProviderConfig): Promise<void>;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<string[]>;
  getRecommendedModels(): string[];
  private convertToMistralMessages;
  protected convertToStandardResponse(
    response: MistralResponse,
  ): GenerateContentResponse;
  private makeApiRequest;
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
  private createStreamGenerator;
  getCapabilities(): {
    supportsStreaming: boolean;
    supportsVision: boolean;
    supportsAudio: boolean;
    supportsFunctionCalling: boolean;
    supportsSystemPrompts: boolean;
    maxContextLength: number;
  };
}
export {};
