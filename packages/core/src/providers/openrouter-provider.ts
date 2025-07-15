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

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  object: 'chat.completion';
  created: number;
  choices: Array<{
    finish_reason: 'stop' | 'length' | 'function_call';
    index: number;
    message: {
      content: string;
      role: 'assistant';
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenRouterStreamChunk {
  id: string;
  model: string;
  object: 'chat.completion.chunk';
  created: number;
  choices: Array<{
    delta: {
      content?: string;
      role?: 'assistant';
    };
    finish_reason: 'stop' | 'length' | null;
    index: number;
  }>;
}

export class OpenRouterProvider extends BaseProvider {
  readonly type = ProviderType.OPENROUTER;
  readonly name = 'OpenRouter';

  private apiKey?: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  protected async performInitialization(config: ProviderConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    this.apiKey = config.apiKey;
    
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      // Test with a simple request to models endpoint
      const response = await this.makeApiRequest('/models', {
        method: 'GET',
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.makeApiRequest('/models', {
        method: 'GET',
      });

      if (!response.ok) {
        return this.getRecommendedModels();
      }

      const data = await response.json();
      const models = data.data || [];
      
      // Filter and map model IDs
      return models
        .map((model: { id: string }) => model.id)
        .filter((id: string) => 
          id.includes('claude') || 
          id.includes('gpt') || 
          id.includes('gemini') ||
          id.includes('mistral')
        );
    } catch {
      return this.getRecommendedModels();
    }
  }

  getRecommendedModels(): string[] {
    return [
      // Claude models
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'anthropic/claude-2.1',
      'anthropic/claude-2',
      'anthropic/claude-instant-1',
      
      // GPT models
      'openai/gpt-4-turbo',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      'openai/gpt-3.5-turbo-16k',
      
      // Gemini models
      'google/gemini-pro',
      'google/gemini-pro-vision',
      
      // Mistral models
      'mistralai/mistral-7b-instruct',
      'mistralai/mixtral-8x7b-instruct',
      'mistralai/mistral-medium',
      'mistralai/mistral-large',
      
      // Other popular models
      'meta-llama/llama-2-70b-chat',
      'meta-llama/llama-2-13b-chat',
      'meta-llama/codellama-34b-instruct',
      'nous-hermes-2-mixtral-8x7b-dpo',
      'phind/phind-codellama-34b',
    ];
  }

  private convertToOpenRouterMessages(contents: Content[]): {
    messages: OpenRouterMessage[];
    system?: string;
  } {
    const messages: OpenRouterMessage[] = [];
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

    // Add system message if present
    if (system) {
      messages.unshift({
        role: 'system',
        content: system,
      });
    }

    return { messages, system };
  }

  protected convertToStandardResponse(
    response: OpenRouterResponse,
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
      // Add required properties for compatibility
      text: content,
      data: undefined,
      functionCalls: [],
      executableCode: undefined,
      codeExecutionResult: undefined,
    };

    return standardResponse as unknown as GenerateContentResponse;
  }

  private async makeApiRequest(
    endpoint: string,
    options: RequestInit,
  ): Promise<Response> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not available');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'https://github.com/enfiy/enfiy-code',
      'X-Title': 'Enfiy Code',
    };

    // Safely add additional headers if they exist
    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    return response;
  }

  async generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse> {
    const { messages, system } = this.convertToOpenRouterMessages(
      params.contents,
    );

    // Handle system instruction from config
    if (params.config?.systemInstruction && !system) {
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

      if (systemText) {
        messages.unshift({
          role: 'system',
          content: systemText,
        });
      }
    }

    const modelName = params.model.replace(/^models\//, '');
    
    const requestBody = {
      model: modelName,
      messages,
      max_tokens: params.config?.maxOutputTokens || 4096,
      temperature: params.config?.temperature || 0.7,
      top_p: params.config?.topP || 1,
      stream: false,
    };

    try {
      const response = await this.makeApiRequest('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `OpenRouter API Error: ${response.status} ${errorData}`,
        );
      }

      const data: OpenRouterResponse = await response.json();
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
    const { messages, system } = this.convertToOpenRouterMessages(
      params.contents,
    );

    // Handle system instruction from config
    if (params.config?.systemInstruction && !system) {
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

      if (systemText) {
        messages.unshift({
          role: 'system',
          content: systemText,
        });
      }
    }

    const modelName = params.model.replace(/^models\//, '');
    
    const requestBody = {
      model: modelName,
      messages,
      max_tokens: params.config?.maxOutputTokens || 4096,
      temperature: params.config?.temperature || 0.7,
      top_p: params.config?.topP || 1,
      stream: true,
    };

    const response = await this.makeApiRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `OpenRouter API Error: ${response.status} ${errorData}`,
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
              const parsed: OpenRouterStreamChunk = JSON.parse(data);
              const delta = parsed.choices[0]?.delta?.content;
              
              if (delta) {
                accumulatedContent += delta;

                const streamResponse = {
                  candidates: [
                    {
                      content: {
                        role: 'model',
                        parts: [{ text: accumulatedContent }],
                      },
                      finishReason: parsed.choices[0]?.finish_reason === 'stop' 
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
                  data: undefined,
                  functionCalls: [],
                  executableCode: undefined,
                  codeExecutionResult: undefined,
                };

                yield streamResponse as unknown as GenerateContentResponse;
              }
            } catch (e) {
              // Ignore malformed JSON
              console.error('Error parsing OpenRouter stream chunk:', e);
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
      supportsVision: true, // Many models support vision
      supportsAudio: false,
      supportsFunctionCalling: true,
      supportsSystemPrompts: true,
      maxContextLength: 200000, // Varies by model
    };
  }

  getAuthInstructions(): string {
    return `To use OpenRouter:
1. Visit https://openrouter.ai/
2. Sign up for an account
3. Go to https://openrouter.ai/keys
4. Create a new API key
5. Copy the API key and use it with this provider

OpenRouter provides access to multiple AI models including Claude, GPT-4, Gemini, and more.`;
  }

  protected handleError(error: unknown): Error {
    if (
      error &&
      typeof error === 'object' &&
      error !== null &&
      'response' in error
    ) {
      const errorObj = error as { response?: { status?: number; data?: { error?: string } } };
      
      if (errorObj.response?.status === 401) {
        return new Error(
          'OpenRouter API Error: Invalid API key. Please check your OpenRouter API key and try again.',
        );
      }
      
      if (errorObj.response?.data?.error) {
        return new Error(
          `OpenRouter API Error: ${errorObj.response.data.error}`,
        );
      }
    }

    if (error instanceof Error) {
      if (error.message.includes('invalid x-api-key')) {
        return new Error(
          'OpenRouter API Error: Invalid API key. Please check your OpenRouter API key format (should start with "sk-or-").',
        );
      }
      
      return new Error(`OpenRouter API Error: ${error.message}`);
    }

    return new Error(`OpenRouter API Error: ${String(error)}`);
  }
}