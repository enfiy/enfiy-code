/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseProvider } from './base-provider.js';
import { ProviderConfig, ProviderType } from './types.js';
import {
  Content,
  GenerateContentResponse,
  GenerateContentConfig,
} from '@google/genai';
interface AnthropicResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  id: string;
  model: string;
  role: 'assistant';
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string;
  type: 'message';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
export declare class AnthropicProvider extends BaseProvider {
  readonly type = ProviderType.ANTHROPIC;
  readonly name = 'Anthropic';
  private apiKey?;
  private baseUrl;
  protected performInitialization(config: ProviderConfig): Promise<void>;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<string[]>;
  getRecommendedModels(): string[];
  private convertToAnthropicMessages;
  protected convertToStandardResponse(
    response: AnthropicResponse,
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
