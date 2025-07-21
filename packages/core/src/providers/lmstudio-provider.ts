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

interface LMStudioMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LMStudioResponse {
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
    finish_reason: 'stop' | 'length' | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface LMStudioStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason: 'stop' | 'length' | null;
  }>;
}

export class LMStudioProvider extends BaseProvider {
  readonly type = ProviderType.LMSTUDIO;
  readonly name = 'LM Studio';

  private baseUrl = 'http://localhost:1234/v1';

  protected async performInitialization(config: ProviderConfig): Promise<void> {
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const models = data.data || [];

      return models.map((model: { id: string }) => model.id);
    } catch {
      return [];
    }
  }

  getRecommendedModels(): string[] {
    return [
      'local-model', // LM Studio uses loaded model
      'loaded-model',
    ];
  }

  private convertToLMStudioMessages(contents: Content[]): LMStudioMessage[] {
    const messages: LMStudioMessage[] = [];

    for (const content of contents) {
      const textParts = content.parts?.filter((part) => 'text' in part) || [];
      const text = textParts
        .map((part) => (part as { text: string }).text)
        .join('\n');

      if (content.role === 'system') {
        messages.push({
          role: 'system',
          content: text,
        });
      } else {
        messages.push({
          role: content.role === 'model' ? 'assistant' : 'user',
          content: text,
        });
      }
    }

    return messages;
  }

  protected convertToStandardResponse(
    response: LMStudioResponse,
  ): GenerateContentResponse {
    const content = response.choices[0]?.message?.content || '';

    const standardResponse = {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [{ text: content }],
          },
          finishReason:
            response.choices[0]?.finish_reason === 'stop'
              ? FinishReason.STOP
              : FinishReason.OTHER,
          index: 0,
          safetyRatings: [],
        },
      ],
      usageMetadata: {
        promptTokenCount: response.usage?.prompt_tokens || 0,
        candidatesTokenCount: response.usage?.completion_tokens || 0,
        totalTokenCount: response.usage?.total_tokens || 0,
      },
      text: content,
      data: undefined,
      functionCalls: [],
      executableCode: undefined,
      codeExecutionResult: undefined,
    };

    return standardResponse as unknown as GenerateContentResponse;
  }

  async generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse> {
    const messages = this.convertToLMStudioMessages(params.contents);

    // Handle system instruction from config
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

      if (systemText && !messages.some((m) => m.role === 'system')) {
        messages.unshift({
          role: 'system',
          content: systemText,
        });
      }
    }

    const requestBody = {
      messages,
      max_tokens: params.config?.maxOutputTokens || 4096,
      temperature: params.config?.temperature ?? 0.7,
      stream: false,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`LM Studio API Error: ${response.status} ${errorData}`);
      }

      const data: LMStudioResponse = await response.json();
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
    const messages = this.convertToLMStudioMessages(params.contents);

    // Handle system instruction from config
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

      if (systemText && !messages.some((m) => m.role === 'system')) {
        messages.unshift({
          role: 'system',
          content: systemText,
        });
      }
    }

    const requestBody = {
      messages,
      max_tokens: params.config?.maxOutputTokens || 4096,
      temperature: params.config?.temperature ?? 0.7,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`LM Studio API Error: ${response.status} ${errorData}`);
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
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed: LMStudioStreamChunk = JSON.parse(data);
              const delta = parsed.choices[0]?.delta?.content;

              if (delta) {
                const streamResponse = {
                  candidates: [
                    {
                      content: {
                        role: 'model',
                        parts: [{ text: delta }],
                      },
                      finishReason:
                        parsed.choices[0]?.finish_reason === 'stop'
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
                  text: delta,
                  data: undefined,
                  functionCalls: [],
                  executableCode: undefined,
                  codeExecutionResult: undefined,
                };

                yield streamResponse as unknown as GenerateContentResponse;
              }
            } catch (e) {
              console.error('Error parsing LM Studio stream chunk:', e);
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
      supportsFunctionCalling: false,
      supportsSystemPrompts: true,
      maxContextLength: 131072, // Varies by loaded model
    };
  }

  getAuthInstructions(): string {
    return `To use LM Studio:
1. Download LM Studio from https://lmstudio.ai/
2. Install and run LM Studio
3. Download and load a model in LM Studio
4. Start the local server (usually on port 1234)
5. No API key required - runs completely locally

LM Studio supports GGUF models from HuggingFace and provides a simple UI for model management.`;
  }

  protected handleError(error: unknown): Error {
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return new Error(
          'LM Studio connection failed. Please ensure LM Studio is running and the server is started.',
        );
      }

      return new Error(`LM Studio Error: ${error.message}`);
    }

    return new Error(`LM Studio Error: ${String(error)}`);
  }
}