/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseProvider } from './base-provider.js';
import { ProviderConfig, ProviderType } from './types.js';
import { Content, GenerateContentResponse, GenerateContentConfig, FinishReason } from '@google/genai';

interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MistralResponse {
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
    finish_reason: 'stop' | 'length' | 'model_length';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MistralProvider extends BaseProvider {
  readonly type = ProviderType.MISTRAL;
  readonly name = 'Mistral';

  private apiKey?: string;
  private baseUrl = 'https://api.mistral.ai/v1';

  protected async performInitialization(config: ProviderConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('Mistral API key is required');
    }

    this.apiKey = config.apiKey;
  }

  async isAvailable(): Promise<boolean> {
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

  async listModels(): Promise<string[]> {
    try {
      const response = await this.makeApiRequest('/models');
      if (!response.ok) {
        return this.getRecommendedModels();
      }

      const data = await response.json();
      return data.data
        ?.map((model: { id: string }) => model.id)
        ?.filter((id: string) => id.startsWith('mistral') || id.startsWith('codestral'))
        ?.sort() || this.getRecommendedModels();
    } catch {
      return this.getRecommendedModels();
    }
  }

  getRecommendedModels(): string[] {
    return [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
      'codestral-latest',
      'mistral-embed',
    ];
  }

  private convertToMistralMessages(contents: Content[]): MistralMessage[] {
    return contents.map(content => {
      const textParts = content.parts?.filter(part => 'text' in part) || [];
      const text = textParts.map(part => (part as { text: string }).text).join('\n');
      
      return {
        role: content.role === 'model' ? 'assistant' : content.role as 'system' | 'user' | 'assistant',
        content: text,
      };
    });
  }

  protected convertToStandardResponse(response: MistralResponse): GenerateContentResponse {
    const choice = response.choices[0];
    const content = choice?.message?.content || '';
    
    const standardResponse = {
      candidates: [{
        content: {
          role: 'model',
          parts: [{ text: content }],
        },
        finishReason: choice?.finish_reason === 'stop' ? FinishReason.STOP : FinishReason.OTHER,
        index: 0,
        safetyRatings: [],
      }],
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

    return standardResponse as unknown as GenerateContentResponse;
  }

  private async makeApiRequest(endpoint: string, options?: RequestInit): Promise<Response> {
    if (!this.apiKey) {
      throw new Error('Mistral API key not available');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options?.headers,
      },
    });

    return response;
  }

  async generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse> {
    const messages = this.convertToMistralMessages(params.contents);
    
    // Handle system instruction
    if (params.config?.systemInstruction) {
      const systemText = typeof params.config.systemInstruction === 'string' 
        ? params.config.systemInstruction 
        : (params.config.systemInstruction as { parts?: Array<{ text: string }> }).parts?.map((p) => p.text).join('\n') || '';
      
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
        throw new Error(`Mistral API Error: ${errorData.message || response.statusText}`);
      }

      const data: MistralResponse = await response.json();
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
    const messages = this.convertToMistralMessages(params.contents);
    
    // Handle system instruction
    if (params.config?.systemInstruction) {
      const systemText = typeof params.config.systemInstruction === 'string' 
        ? params.config.systemInstruction 
        : (params.config.systemInstruction as { parts?: Array<{ text: string }> }).parts?.map((p) => p.text).join('\n') || '';
      
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
      throw new Error(`Mistral API Error: ${errorData.message || response.statusText}`);
    }

    return this.createStreamGenerator(response);
  }

  private async *createStreamGenerator(response: Response): AsyncGenerator<GenerateContentResponse> {
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
                  candidates: [{
                    content: {
                      role: 'model',
                      parts: [{ text: accumulatedContent }],
                    },
                    finishReason: parsed.choices?.[0]?.finish_reason === 'stop' 
                      ? FinishReason.STOP 
                      : FinishReason.OTHER,
                    index: 0,
                    safetyRatings: [],
                  }],
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