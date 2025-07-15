/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { OpenAI } from 'openai';
import { BaseProvider } from './base-provider.js';
import { ProviderConfig, ProviderType } from './types.js';
import {
  Content,
  GenerateContentResponse,
  GenerateContentConfig,
} from '@google/genai';
export declare class OpenAIProvider extends BaseProvider {
  readonly type = ProviderType.OPENAI;
  readonly name = 'OpenAI';
  private client?;
  protected performInitialization(config: ProviderConfig): Promise<void>;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<string[]>;
  getRecommendedModels(): string[];
  private convertToOpenAIMessages;
  protected convertToStandardResponse(
    response: OpenAI.Chat.ChatCompletion,
  ): GenerateContentResponse;
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
  protected handleError(error: unknown): Error;
}
