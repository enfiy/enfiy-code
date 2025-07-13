/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Content, GenerateContentResponse, GenerateContentConfig } from '@google/genai';
import { Provider, ProviderType, ProviderConfig } from './types.js';
import { ContentGenerator } from '../core/contentGenerator.js';

export class GeminiProvider implements Provider {
  readonly type = ProviderType.GEMINI;
  readonly name = 'Google Gemini';
  
  private contentGenerator!: ContentGenerator;
  private model: string = 'gemini-1.5-flash';

  async initialize(config: ProviderConfig): Promise<void> {
    this.model = config.model || 'gemini-1.5-flash';
    // ContentGenerator initialization will be handled by the existing system
  }

  setContentGenerator(contentGenerator: ContentGenerator): void {
    this.contentGenerator = contentGenerator;
  }

  async isAvailable(): Promise<boolean> {
    try {
      return this.contentGenerator !== undefined;
    } catch {
      return false;
    }
  }

  async generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse> {
    if (!this.contentGenerator) {
      throw new Error('Gemini provider not initialized');
    }

    return this.contentGenerator.generateContent({
      model: params.model || this.model,
      contents: params.contents,
      config: params.config,
    });
  }

  async generateContentStream(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<AsyncGenerator<GenerateContentResponse>> {
    if (!this.contentGenerator) {
      throw new Error('Gemini provider not initialized');
    }

    return this.contentGenerator.generateContentStream({
      model: params.model || this.model,
      contents: params.contents,
      config: params.config,
    });
  }

  async listModels(): Promise<string[]> {
    // Return common Gemini models
    return [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
    ];
  }

  isLocalProvider(): boolean {
    return false;
  }

  getCapabilities() {
    return {
      supportsStreaming: true,
      supportsVision: true,
      supportsAudio: true,
      supportsFunctionCalling: true,
      supportsSystemPrompts: true,
      maxContextLength: 2097152, // Gemini 1.5 Pro context length
    };
  }

  getAuthInstructions(): string {
    return 'Get your API key from https://makersuite.google.com/app/apikey';
  }

  getRecommendedModels(): string[] {
    return [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
    ];
  }
}