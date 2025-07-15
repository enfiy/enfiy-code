/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseProvider } from './base-provider.js';
import { ProviderType } from './types.js';
import { FinishReason } from '@google/genai';
export class MistralProvider extends BaseProvider {
  type = ProviderType.MISTRAL;
  name = 'Mistral';
  apiKey;
  baseUrl = 'https://api.mistral.ai/v1';
  async performInitialization(config) {
    if (!config.apiKey) {
      throw new Error('Mistral API key is required');
    }
    this.apiKey = config.apiKey;
  }
  async isAvailable() {
    try {
      if (!this.apiKey) {
        return false;
      }
      // Test with models list endpoint
      const response = await this.makeApiRequest('/models');
      return response.ok;
    } catch {
      return false;
    }
  }
  async listModels() {
    try {
      const response = await this.makeApiRequest('/models');
      if (!response.ok) {
        return this.getRecommendedModels();
      }
      const data = await response.json();
      return (
        data.data
          ?.map((model) => model.id)
          ?.filter(
            (id) => id.startsWith('mistral') || id.startsWith('codestral'),
          )
          ?.sort() || this.getRecommendedModels()
      );
    } catch {
      return this.getRecommendedModels();
    }
  }
  getRecommendedModels() {
    return [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
      'codestral-latest',
      'mistral-embed',
    ];
  }
  convertToMistralMessages(contents) {
    return contents.map((content) => {
      const textParts = content.parts?.filter((part) => 'text' in part) || [];
      const text = textParts.map((part) => part.text).join('\n');
      return {
        role: content.role === 'model' ? 'assistant' : content.role,
        content: text,
      };
    });
  }
  convertToStandardResponse(response) {
    const choice = response.choices[0];
    const content = choice?.message?.content || '';
    const standardResponse = {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [{ text: content }],
          },
          finishReason:
            choice?.finish_reason === 'stop'
              ? FinishReason.STOP
              : FinishReason.OTHER,
          index: 0,
          safetyRatings: [],
        },
      ],
      usageMetadata: {
        promptTokenCount: response.usage.prompt_tokens,
        candidatesTokenCount: response.usage.completion_tokens,
        totalTokenCount: response.usage.total_tokens,
      },
      // Add required properties for compatibility
      text: content,
      data: null,
      functionCalls: [],
      executableCode: undefined,
      codeExecutionResult: null,
    };
    return standardResponse;
  }
  async makeApiRequest(endpoint, options) {
    if (!this.apiKey) {
      throw new Error('Mistral API key not available');
    }
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...options?.headers,
      },
    });
    return response;
  }
  async generateContent(params) {
    const messages = this.convertToMistralMessages(params.contents);
    // Handle system instruction
    if (params.config?.systemInstruction) {
      const systemText =
        typeof params.config.systemInstruction === 'string'
          ? params.config.systemInstruction
          : params.config.systemInstruction.parts
              ?.map((p) => p.text)
              .join('\n') || '';
      messages.unshift({
        role: 'system',
        content: systemText,
      });
    }
    const modelName = params.model.replace(/^models\//, '');
    const finalModel = this.getRecommendedModels().includes(modelName)
      ? modelName
      : 'mistral-large-latest';
    const requestBody = {
      model: finalModel,
      messages,
      temperature: params.config?.temperature || 0.7,
      max_tokens: params.config?.maxOutputTokens || 4096,
      top_p: params.config?.topP || 1,
      stream: false,
    };
    try {
      const response = await this.makeApiRequest('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Mistral API Error: ${errorData.message || response.statusText}`,
        );
      }
      const data = await response.json();
      return this.convertToStandardResponse(data);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async generateContentStream(params) {
    const messages = this.convertToMistralMessages(params.contents);
    // Handle system instruction
    if (params.config?.systemInstruction) {
      const systemText =
        typeof params.config.systemInstruction === 'string'
          ? params.config.systemInstruction
          : params.config.systemInstruction.parts
              ?.map((p) => p.text)
              .join('\n') || '';
      messages.unshift({
        role: 'system',
        content: systemText,
      });
    }
    const modelName = params.model.replace(/^models\//, '');
    const finalModel = this.getRecommendedModels().includes(modelName)
      ? modelName
      : 'mistral-large-latest';
    const requestBody = {
      model: finalModel,
      messages,
      temperature: params.config?.temperature || 0.7,
      max_tokens: params.config?.maxOutputTokens || 4096,
      top_p: params.config?.topP || 1,
      stream: true,
    };
    const response = await this.makeApiRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Mistral API Error: ${errorData.message || response.statusText}`,
      );
    }
    return this.createStreamGenerator(response);
  }
  async *createStreamGenerator(response) {
    if (!response.body) {
      throw new Error('No response body for streaming');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulatedContent += delta;
                const streamResponse = {
                  candidates: [
                    {
                      content: {
                        role: 'model',
                        parts: [{ text: accumulatedContent }],
                      },
                      finishReason:
                        parsed.choices?.[0]?.finish_reason === 'stop'
                          ? FinishReason.STOP
                          : FinishReason.OTHER,
                      index: 0,
                      safetyRatings: [],
                    },
                  ],
                  usageMetadata: {
                    promptTokenCount: 0,
                    candidatesTokenCount: 0,
                    totalTokenCount: 0,
                  },
                  // Add required properties
                  text: accumulatedContent,
                  data: null,
                  functionCalls: [],
                  executableCode: undefined,
                  codeExecutionResult: null,
                };
                yield streamResponse;
              }
            } catch {
              // Ignore malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  getCapabilities() {
    return {
      supportsStreaming: true,
      supportsVision: false,
      supportsAudio: false,
      supportsFunctionCalling: true,
      supportsSystemPrompts: true,
      maxContextLength: 32768, // Mistral context length
    };
  }
}
//# sourceMappingURL=mistral-provider.js.map
