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
export declare class HuggingFaceProvider extends BaseProvider {
  readonly type = ProviderType.HUGGINGFACE;
  readonly name = 'HuggingFace';
  private apiKey?;
  private baseUrl;
  private isLocalMode;
  protected performInitialization(config: ProviderConfig): Promise<void>;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<string[]>;
  getRecommendedModels(): string[];
  private convertToHuggingFaceFormat;
  private parseTextBasedToolCalls;
  private autoDetectFileCreation;
  private detectFileCreationIntent;
  private generateBasicContent;
  private getFileExtension;
  private extractFileName;
  private createAbsolutePath;
  protected convertToStandardResponse(
    response: unknown,
    originalText?: string,
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
  private simulateStreaming;
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
