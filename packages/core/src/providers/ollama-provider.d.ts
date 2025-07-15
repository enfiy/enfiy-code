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
import { ProviderType, ProviderConfig } from './types.js';
import { BaseProvider } from './base-provider.js';
export declare class OllamaProvider extends BaseProvider {
  readonly type = ProviderType.OLLAMA;
  readonly name = 'Ollama';
  private baseUrl;
  private model;
  private timeout;
  protected performInitialization(config: ProviderConfig): Promise<void>;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<string[]>;
  private convertContentToPrompt;
  private parseTextBasedToolCalls;
  private autoDetectFileCreation;
  private detectFileCreationIntent;
  private generateBasicContent;
  private getFileExtension;
  private extractFileName;
  private createAbsolutePath;
  private convertOllamaToGeminiResponse;
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
  getRecommendedModels(): string[];
  getCapabilities(): {
    supportsStreaming: boolean;
    supportsVision: boolean;
    supportsAudio: boolean;
    supportsFunctionCalling: boolean;
    supportsSystemPrompts: boolean;
    maxContextLength: number;
  };
  private handleApiError;
  private create404ErrorMessage;
}
