/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProviderType } from './types.js';
export class GeminiProvider {
  type = ProviderType.GEMINI;
  name = 'Google Gemini';
  contentGenerator;
  model = 'gemini-1.5-flash';
  async initialize(config) {
    this.model = config.model || 'gemini-1.5-flash';
    // ContentGenerator initialization will be handled by the existing system
  }
  setContentGenerator(contentGenerator) {
    this.contentGenerator = contentGenerator;
  }
  async isAvailable() {
    try {
      return this.contentGenerator !== undefined;
    } catch {
      return false;
    }
  }
  async generateContent(params) {
    if (!this.contentGenerator) {
      throw new Error('Gemini provider not initialized');
    }
    return this.contentGenerator.generateContent({
      model: params.model || this.model,
      contents: params.contents,
      config: params.config,
    });
  }
  async generateContentStream(params) {
    if (!this.contentGenerator) {
      throw new Error('Gemini provider not initialized');
    }
    return this.contentGenerator.generateContentStream({
      model: params.model || this.model,
      contents: params.contents,
      config: params.config,
    });
  }
  async listModels() {
    // Return common Gemini models
    return [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
    ];
  }
  isLocalProvider() {
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
  getAuthInstructions() {
    return 'Get your API key from https://makersuite.google.com/app/apikey';
  }
  getRecommendedModels() {
    return [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
    ];
  }
}
//# sourceMappingURL=gemini-provider.js.map
