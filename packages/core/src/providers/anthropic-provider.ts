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
  FinishReason,
} from '@google/genai';

// Note: Using fetch for Anthropic API as they don't have an official Node.js SDK yet
// This can be replaced with @anthropic-ai/sdk when it becomes stable

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

export class AnthropicProvider extends BaseProvider {
  readonly type = ProviderType.ANTHROPIC;
  readonly name = 'Anthropic';

  private apiKey?: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  protected async performInitialization(config: ProviderConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    // Log a masked version of the API key for debugging
    console.log(
      `[Anthropic Provider] Initializing with API key: ${config.apiKey.substring(0, 5)}...${config.apiKey.substring(config.apiKey.length - 5)}`,
    );

    this.apiKey = config.apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      // Test with a simple API call
      const response = await this.makeApiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    // Anthropic doesn't provide a models endpoint yet
    return this.getRecommendedModels();
  }

  getRecommendedModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }

  private convertToAnthropicMessages(contents: Content[]): {
    messages: AnthropicMessage[];
    system?: string;
  } {
    const messages: AnthropicMessage[] = [];
    let system: string | undefined;

    for (const content of contents) {
      if (content.role === 'system') {
        const textParts = content.parts?.filter((part) => 'text' in part) || [];
        system = textParts
          .map((part) => (part as { text: string }).text)
          .join('\n');
      } else {
        const textParts = content.parts?.filter((part) => 'text' in part) || [];
        const text = textParts
          .map((part) => (part as { text: string }).text)
          .join('\n');

        messages.push({
          role: content.role === 'model' ? 'assistant' : 'user',
          content: text,
        });
      }
    }

    return { messages, system };
  }

  protected convertToStandardResponse(
    response: AnthropicResponse,
  ): GenerateContentResponse {
    const content = response.content[0]?.text || '';

    // Create a mutable response object first
    const standardResponse = {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [{ text: content }],
          },
          finishReason:
            response.stop_reason === 'end_turn'
              ? FinishReason.STOP
              : FinishReason.OTHER,
          index: 0,
          safetyRatings: [],
        },
      ],
      usageMetadata: {
        promptTokenCount: response.usage.input_tokens,
        candidatesTokenCount: response.usage.output_tokens,
        totalTokenCount:
          response.usage.input_tokens + response.usage.output_tokens,
      },
      // Add required properties for compatibility
      text: content,
      data: null,
      functionCalls: [],
      executableCode: undefined,
      codeExecutionResult: null,
    };

    return standardResponse as unknown as GenerateContentResponse;
  }

  private async makeApiRequest(
    endpoint: string,
    options: RequestInit,
  ): Promise<Response> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not available');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        ...options.headers,
      },
    });

    return response;
  }

  async generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse> {
    const { messages, system } = this.convertToAnthropicMessages(
      params.contents,
    );

    // Handle system instruction
    let finalSystem = system;
    if (params.config?.systemInstruction) {
      const systemText =
        typeof params.config.systemInstruction === 'string'
          ? params.config.systemInstruction
          : (
              params.config.systemInstruction as {
                parts?: Array<{ text: string }>;
              }
            ).parts
              ?.map((p) => p.text)
              .join('\n') || '';

      finalSystem = finalSystem
        ? `${finalSystem}\n\n${systemText}`
        : systemText;
    }

    const modelName = params.model.replace(/^models\//, '');
    const finalModel = this.getRecommendedModels().includes(modelName)
      ? modelName
      : 'claude-3-5-sonnet-20241022';

    const requestBody = {
      model: finalModel,
      max_tokens: params.config?.maxOutputTokens || 4096,
      temperature: params.config?.temperature || 0.7,
      top_p: params.config?.topP || 1,
      messages,
      ...(finalSystem && { system: finalSystem }),
    };

    try {
      const response = await this.makeApiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Anthropic API Error: ${errorData.error?.message || response.statusText}`,
        );
      }

      const data: AnthropicResponse = await response.json();
      return this.convertToStandardResponse(data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateContentStream(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<AsyncGenerator<GenerateContentResponse>> {
    const { messages, system } = this.convertToAnthropicMessages(
      params.contents,
    );

    // Handle system instruction
    let finalSystem = system;
    if (params.config?.systemInstruction) {
      const systemText =
        typeof params.config.systemInstruction === 'string'
          ? params.config.systemInstruction
          : (
              params.config.systemInstruction as {
                parts?: Array<{ text: string }>;
              }
            ).parts
              ?.map((p) => p.text)
              .join('\n') || '';

      finalSystem = finalSystem
        ? `${finalSystem}\n\n${systemText}`
        : systemText;
    }

    const modelName = params.model.replace(/^models\//, '');
    const finalModel = this.getRecommendedModels().includes(modelName)
      ? modelName
      : 'claude-3-5-sonnet-20241022';

    const requestBody = {
      model: finalModel,
      max_tokens: params.config?.maxOutputTokens || 4096,
      temperature: params.config?.temperature || 0.7,
      top_p: params.config?.topP || 1,
      messages,
      stream: true,
      ...(finalSystem && { system: finalSystem }),
    };

    const response = await this.makeApiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Anthropic API Error: ${errorData.error?.message || response.statusText}`,
      );
    }

    return this.createStreamGenerator(response);
  }

  private async *createStreamGenerator(
    response: Response,
  ): AsyncGenerator<GenerateContentResponse> {
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
              if (parsed.type === 'content_block_delta') {
                const delta = parsed.delta?.text;
                if (delta) {
                  accumulatedContent += delta;

                  const streamResponse = {
                    candidates: [
                      {
                        content: {
                          role: 'model',
                          parts: [{ text: accumulatedContent }],
                        },
                        finishReason: FinishReason.OTHER,
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

                  yield streamResponse as unknown as GenerateContentResponse;
                }
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
      supportsVision: true, // Claude 3 models support vision
      supportsAudio: false,
      supportsFunctionCalling: true,
      supportsSystemPrompts: true,
      maxContextLength: 200000, // Claude 3 context length
    };
  }
}
