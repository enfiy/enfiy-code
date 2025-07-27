/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base-provider.js';
import { ProviderConfig, ProviderType } from './types.js';
import {
  Content,
  GenerateContentResponse,
  GenerateContentConfig,
  FinishReason,
} from '@google/genai';

export class AnthropicProvider extends BaseProvider {
  readonly type = ProviderType.ANTHROPIC;
  readonly name = 'Anthropic';

  private client?: Anthropic;

  protected async performInitialization(config: ProviderConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    // Log a masked version of the API key for debugging
    const keyLength = config.apiKey.length;
    console.log(
      `[Anthropic Provider] Initializing with API key: ${config.apiKey.substring(0, 8)}***${config.apiKey.substring(keyLength - 4)} (length: ${keyLength})`,
    );

    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Test with a simple message request
      await this.client.messages.create({
        model: 'claude-3.5-haiku-20241022',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    // Anthropic doesn't provide a list models API, so return recommended models
    return this.getRecommendedModels();
  }

  getRecommendedModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-sonnet-20240229',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
      'claude-3-5-haiku-20241022',
      'claude-2.1',
      'claude-2.0',
    ];
  }

  private convertToAnthropicMessages(
    contents: Content[],
  ): Anthropic.MessageParam[] {
    // Extract system message if present
    const _systemMessages = contents.filter((c) => c.role === 'system');
    const nonSystemMessages = contents.filter((c) => c.role !== 'system');

    return nonSystemMessages.map((content) => {
      const textParts = content.parts?.filter((part) => 'text' in part) || [];
      const text = textParts
        .map((part) => (part as { text: string }).text)
        .join('\n');

      return {
        role: content.role === 'model' ? 'assistant' : 'user',
        content: text,
      };
    });
  }

  private getSystemPrompt(contents: Content[]): string | undefined {
    const systemMessage = contents.find((c) => c.role === 'system');
    if (systemMessage) {
      const textParts =
        systemMessage.parts?.filter((part) => 'text' in part) || [];
      return textParts
        .map((part) => (part as { text: string }).text)
        .join('\n');
    }
    return undefined;
  }

  protected convertToStandardResponse(
    response: Anthropic.Message,
  ): GenerateContentResponse {
    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n');

    const finishReason = this.mapStopReason(response.stop_reason);

    return {
      text,
      candidates: [
        {
          content: {
            parts: [{ text }],
            role: 'model',
          },
          finishReason,
          index: 0,
        },
      ],
      data: undefined,
      functionCalls: [],
      executableCode: undefined,
      codeExecutionResult: undefined,
    };
  }

  private mapStopReason(stopReason: string | null): FinishReason {
    switch (stopReason) {
      case 'end_turn':
        return FinishReason.STOP;
      case 'max_tokens':
        return FinishReason.MAX_TOKENS;
      case 'stop_sequence':
        return FinishReason.STOP;
      default:
        return FinishReason.OTHER;
    }
  }

  async generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized');
    }

    const messages = this.convertToAnthropicMessages(params.contents);
    const systemPrompt = this.getSystemPrompt(params.contents);

    let response;
    try {
      response = await this.client.messages.create({
        model: params.model,
        messages,
        system: systemPrompt,
        max_tokens: params.config?.maxOutputTokens || 4096,
        temperature: params.config?.temperature,
        top_p: params.config?.topP,
      });
    } catch (error) {
      // Handle Anthropic-specific errors
      if (error instanceof Anthropic.APIError) {
        console.error('[Anthropic] API Error:', {
          status: error.status,
          message: error.message,
          type: (error.error as any)?.type,
        });
        
        // Re-throw with more context
        const errorData = error.error as { type?: string };
        if (errorData?.type === 'overloaded_error') {
          throw new Error('Anthropic API is currently overloaded. Please try again in a few moments.');
        }
        
        throw error;
      }
      throw error;
    }

    return this.convertToStandardResponse(response);
  }

  async generateContentStream(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<AsyncGenerator<GenerateContentResponse>> {
    return this.createContentStream(params);
  }

  private async *createContentStream(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): AsyncGenerator<GenerateContentResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized');
    }

    const messages = this.convertToAnthropicMessages(params.contents);
    const systemPrompt = this.getSystemPrompt(params.contents);

    let stream;
    try {
      stream = await this.client.messages.create({
        model: params.model,
        messages,
        system: systemPrompt,
        max_tokens: params.config?.maxOutputTokens || 4096,
        temperature: params.config?.temperature,
        top_p: params.config?.topP,
        stream: true,
      });
    } catch (error) {
      // Handle Anthropic-specific errors
      if (error instanceof Anthropic.APIError) {
        console.error('[Anthropic] API Error:', {
          status: error.status,
          message: error.message,
          type: (error.error as any)?.type,
        });
        
        // Re-throw with more context
        const errorData = error.error as { type?: string };
        if (errorData?.type === 'overloaded_error') {
          throw new Error('Anthropic API is currently overloaded. Please try again in a few moments.');
        }
        
        throw error;
      }
      throw error;
    }

    let _accumulatedText = '';

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        _accumulatedText += chunk.delta.text;
        yield {
          text: chunk.delta.text,
          candidates: [
            {
              content: {
                parts: [{ text: chunk.delta.text }],
                role: 'model',
              },
              finishReason: FinishReason.OTHER,
              index: 0,
            },
          ],
          data: undefined,
          functionCalls: [],
          executableCode: undefined,
          codeExecutionResult: undefined,
        };
      } else if (chunk.type === 'message_stop') {
        yield {
          text: '',
          candidates: [
            {
              content: {
                parts: [{ text: '' }],
                role: 'model',
              },
              finishReason: FinishReason.STOP,
              index: 0,
            },
          ],
          data: undefined,
          functionCalls: [],
          executableCode: undefined,
          codeExecutionResult: undefined,
        };
      }
    }
  }

  isLocalProvider(): boolean {
    return false;
  }

  getCapabilities() {
    return {
      supportsStreaming: true,
      supportsVision: true,
      supportsAudio: false,
      supportsFunctionCalling: true,
      supportsSystemPrompts: true,
      maxContextLength: 200000,
    };
  }

  getAuthInstructions(): string {
    return `To use Anthropic:

1. Sign up at https://console.anthropic.com
2. Go to API Keys section
3. Create a new API key
4. Copy the key and paste it here

Note: Anthropic API requires payment setup before use.`;
  }
}
