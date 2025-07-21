/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { OpenAI } from 'openai';
import { BaseProvider } from './base-provider.js';
import { ProviderConfig, ProviderType } from './types.js';
import {
  Content,
  GenerateContentResponse,
  GenerateContentConfig,
  FinishReason,
} from '@google/genai';

export class OpenAIProvider extends BaseProvider {
  readonly type = ProviderType.OPENAI;
  readonly name = 'OpenAI';

  private client?: OpenAI;

  protected async performInitialization(config: ProviderConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    // Log a masked version of the API key for debugging
    console.log(
      `[OpenAI Provider] Initializing with API key: ${config.apiKey.substring(0, 3)}***`,
    );

    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.headers?.['OpenAI-Organization'],
      project: config.headers?.['OpenAI-Project'],
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Test with a simple models list call
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.client.models.list();
      return response.data
        .filter((model) => model.id.startsWith('gpt-'))
        .map((model) => model.id)
        .sort();
    } catch (_error) {
      console.warn('Failed to fetch OpenAI models, using defaults');
      return this.getRecommendedModels();
    }
  }

  getRecommendedModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
  }

  private convertToOpenAIMessages(
    contents: Content[],
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    return contents.map((content) => {
      const textParts = content.parts?.filter((part) => 'text' in part) || [];
      const text = textParts
        .map((part) => (part as { text: string }).text)
        .join('\n');

      return {
        role:
          content.role === 'model'
            ? 'assistant'
            : (content.role as 'system' | 'user' | 'assistant'),
        content: text,
      };
    });
  }

  protected convertToStandardResponse(
    response: OpenAI.Chat.ChatCompletion,
  ): GenerateContentResponse {
    const choice = response.choices[0];
    const content = choice?.message?.content || '';

    // Create a response that matches the expected interface structure
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
        promptTokenCount: response.usage?.prompt_tokens || 0,
        candidatesTokenCount: response.usage?.completion_tokens || 0,
        totalTokenCount: response.usage?.total_tokens || 0,
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

  async generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const messages = this.convertToOpenAIMessages(params.contents);

    // Handle system instruction
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

      messages.unshift({
        role: 'system',
        content: systemText,
      });
    }

    // Normalize model name
    const modelName = params.model.replace(/^models\//, '');
    const finalModel = modelName.startsWith('gpt-') ? modelName : 'gpt-4o';

    try {
      const response = await this.client.chat.completions.create({
        model: finalModel,
        messages,
        temperature: params.config?.temperature || 0.7,
        max_tokens: params.config?.maxOutputTokens || 4096,
        top_p: params.config?.topP || 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      return this.convertToStandardResponse(response);
    } catch (error) {
      console.error('[OpenAI Provider] API request failed:', error);
      throw this.handleError(error);
    }
  }

  async generateContentStream(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<AsyncGenerator<GenerateContentResponse>> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const messages = this.convertToOpenAIMessages(params.contents);

    // Handle system instruction
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

      messages.unshift({
        role: 'system',
        content: systemText,
      });
    }

    const modelName = params.model.replace(/^models\//, '');
    const finalModel = modelName.startsWith('gpt-') ? modelName : 'gpt-4o';

    const stream = await this.client.chat.completions.create({
      model: finalModel,
      messages,
      temperature: params.config?.temperature || 0.7,
      max_tokens: params.config?.maxOutputTokens || 4096,
      top_p: params.config?.topP || 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true,
    });

    return this.createStreamGenerator(stream);
  }

  private async *createStreamGenerator(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  ): AsyncGenerator<GenerateContentResponse> {
    let _accumulatedContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        _accumulatedContent += delta;

        // Create streaming response with only the new delta content
        // This prevents character-by-character repetition in the UI
        const streamResponse = {
          candidates: [
            {
              content: {
                role: 'model',
                parts: [{ text: delta }], // Only yield the new delta, not accumulated content
              },
              finishReason:
                chunk.choices[0]?.finish_reason === 'stop'
                  ? FinishReason.STOP
                  : FinishReason.OTHER,
              index: 0,
              safetyRatings: [],
            },
          ],
          usageMetadata: {
            promptTokenCount: 0, // Not available in streaming
            candidatesTokenCount: 0,
            totalTokenCount: 0,
          },
          // Add required properties for compatibility
          text: delta, // Only the new delta content
          data: null,
          functionCalls: [],
          executableCode: undefined,
          codeExecutionResult: null,
        };

        yield streamResponse as unknown as GenerateContentResponse;
      }
    }
  }

  getCapabilities() {
    return {
      supportsStreaming: true,
      supportsVision: true, // GPT-4 models support vision
      supportsAudio: false,
      supportsFunctionCalling: true,
      supportsSystemPrompts: true,
      maxContextLength: 128000, // GPT-4 Turbo context length
    };
  }

  protected handleError(error: unknown): Error {
    // Safely check for error properties
    const errorObj =
      error && typeof error === 'object' && error !== null
        ? (error as Record<string, unknown>)
        : {};

    console.error('[OpenAI Provider] Raw error:', {
      error,
      message: 'message' in errorObj ? errorObj.message : undefined,
      code: 'code' in errorObj ? errorObj.code : undefined,
      status: 'status' in errorObj ? errorObj.status : undefined,
      response: 'response' in errorObj ? errorObj.response : undefined,
      stack:
        'stack' in errorObj && typeof errorObj.stack === 'string'
          ? errorObj.stack.split('\n').slice(0, 3)
          : undefined,
    });

    if (
      error &&
      typeof error === 'object' &&
      error !== null &&
      'response' in error
    ) {
      const errorWithResponse = error as {
        response?: { data?: { error?: { message?: string; code?: string } } };
      };
      if (errorWithResponse.response?.data?.error) {
        const apiError = errorWithResponse.response.data.error;
        return new Error(
          `OpenAI API Error: ${apiError.message || apiError.code || 'Unknown error'}`,
        );
      }
    }

    // Handle OpenAI SDK specific errors
    const code = 'code' in errorObj ? errorObj.code : undefined;
    const status = 'status' in errorObj ? errorObj.status : undefined;
    const message = 'message' in errorObj ? errorObj.message : undefined;

    if (code === 'ENOTFOUND' || code === 'ECONNREFUSED') {
      return new Error(
        `OpenAI Connection Error: Cannot reach OpenAI API. Check your internet connection.`,
      );
    }

    if (code === 'INVALID_API_KEY' || status === 401) {
      return new Error(
        `OpenAI API Error: Invalid API key. Please check your OPENAI_API_KEY.`,
      );
    }

    if (status === 404) {
      return new Error(
        `OpenAI API Error: Model not found. The model may not be available with your API key.`,
      );
    }

    if (status === 429) {
      return new Error(
        `OpenAI API Error: Rate limit exceeded. Please try again later.`,
      );
    }

    if (typeof message === 'string' && message.includes('fetch')) {
      return new Error(`OpenAI Connection Error: ${message}`);
    }

    return super.handleError(error);
  }
}
