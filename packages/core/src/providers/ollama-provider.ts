/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import {
  Content,
  GenerateContentResponse,
  GenerateContentConfig,
  Part,
  FinishReason,
} from '@google/genai';
import { ProviderType, ProviderConfig } from './types.js';
import { BaseProvider } from './base-provider.js';
import { CodeBlockConverter } from '../utils/codeBlockConverter.js';
import {
  FileDetectionService,
  FileDetectionConfig,
} from '../utils/file-detection.js';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

interface ToolCall {
  id: string;
  name: 'write_file';
  args: {
    file_path: string;
    content: string;
  };
}

export class OllamaProvider extends BaseProvider {
  readonly type = ProviderType.OLLAMA;
  readonly name = 'Ollama';

  private baseUrl: string = 'http://localhost:11434';
  private model: string = 'llama3.2:3b';
  private timeout: number = 120000; // Increased timeout to 2 minutes
  private fileDetectionService: FileDetectionService | null = null;

  protected async performInitialization(config: ProviderConfig): Promise<void> {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama3.2:3b';
    this.timeout = config.timeout || 120000; // Default to 2 minutes

    // Initialize file detection service
    this.initializeFileDetectionService();

    // Check if Ollama is available
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(
        'Ollama server is not available. Please make sure Ollama is running.',
      );
    }
  }

  private initializeFileDetectionService(): void {
    // Use current working directory as default
    // In production, this will be injected through proper dependency injection
    const workingDirectory = process.cwd();

    const fileDetectionConfig: FileDetectionConfig = {
      workingDirectory,
      defaultSubdirectory: 'generated',
    };

    this.fileDetectionService = new FileDetectionService(fileDetectionConfig);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as { models: OllamaModel[] };
      return data.models?.map((model) => model.name) || [];
    } catch {
      return [];
    }
  }

  private convertContentToPrompt(contents: Content[]): string {
    return contents
      .map((content) => {
        const text =
          content.parts
            ?.map((part) => part.text)
            .filter(Boolean)
            .join(' ') || '';
        return content.role === 'user' ? `User: ${text}` : `Assistant: ${text}`;
      })
      .join('\n\n');
  }

  private parseTextBasedToolCalls(text: string): ToolCall[] {
    if (!this.fileDetectionService) {
      return [];
    }

    // Try direct detection first
    let detectionResults = this.fileDetectionService.detectFiles(text);

    // If no results, try with processed text
    if (detectionResults.length === 0) {
      const conversionResult = CodeBlockConverter.convertToMarkdown(text);
      const processedText = conversionResult.convertedText;
      detectionResults = this.fileDetectionService.detectFiles(processedText);
    }

    // Convert detection results to tool calls
    return detectionResults.map((result) => ({
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'write_file',
      args: {
        file_path: this.fileDetectionService!.createAbsolutePath(
          result.fileName,
        ),
        content: result.content,
      },
    }));
  }

  private convertOllamaToGeminiResponse(
    ollamaResponse: OllamaResponse,
    isDone: boolean = true,
    functionCalls: ToolCall[] = [],
  ): GenerateContentResponse {
    const responseText = ollamaResponse.response;
    const parts: Part[] = [{ text: responseText }];

    const content = {
      parts,
      role: 'model' as const,
    };

    const response: GenerateContentResponse = {
      candidates: [
        {
          content,
          finishReason: isDone ? ('STOP' as FinishReason) : undefined,
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: ollamaResponse.prompt_eval_count || 0,
        candidatesTokenCount: ollamaResponse.eval_count || 0,
        totalTokenCount:
          (ollamaResponse.prompt_eval_count || 0) +
          (ollamaResponse.eval_count || 0),
      },
      // Add required properties with sensible defaults
      text: responseText,
      data: undefined,
      functionCalls,
      executableCode: undefined,
      codeExecutionResult: undefined,
    };

    return response;
  }

  async generateContent(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<GenerateContentResponse> {
    let prompt = this.convertContentToPrompt(params.contents);

    // Add system instruction if provided
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

      // Add file creation hint for all code types
      const codeHint =
        '\n\n*** CRITICAL FILE CREATION INSTRUCTIONS ***\n' +
        'When the user asks to create any file, you MUST:\n' +
        '1. Respond with the exact file content wrapped in code blocks\n' +
        '2. Use the correct language identifier: ```html, ```css, ```js, ```py, etc.\n' +
        '3. Include the complete file content, not just explanations\n' +
        '4. For HTML files, always include <!DOCTYPE html> and complete structure\n' +
        '\nExample for HTML:\n```html\n<!DOCTYPE html>\n<html>...</html>\n```\n' +
        'Example for CSS:\n```css\nbody { ... }\n```\n' +
        'Example for JavaScript:\n```js\nconsole.log("...");\n```\n' +
        '\nDo NOT just explain what to create - actually CREATE the file content!';
      prompt = `System: ${systemText}${codeHint}\n\n${prompt}`;
    }

    const requestBody = {
      model: params.model || this.model,
      prompt,
      stream: false,
      options: {
        temperature: params.config?.temperature || 0.7,
        top_p: params.config?.topP || 0.9,
        top_k: params.config?.topK || 40,
        num_predict: params.config?.maxOutputTokens || 800, // Reasonable limit to ensure completion
      },
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      await this.handleApiError(response);
    }

    const data = (await response.json()) as OllamaResponse;

    // For non-streaming responses, parse tool calls from the complete response
    const toolCalls = this.parseTextBasedToolCalls(data.response);
    if (toolCalls.length > 0) {
      console.log(
        '🎯 [Ollama] Non-streaming tool calls processed:',
        toolCalls.length,
      );
    }

    const geminiResponse = this.convertOllamaToGeminiResponse(
      data,
      true,
      toolCalls,
    );
    return geminiResponse;
  }

  async generateContentStream(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<AsyncGenerator<GenerateContentResponse>> {
    let prompt = this.convertContentToPrompt(params.contents);

    // Add system instruction if provided (same as generateContent)
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

      // Add file creation hint for all code types
      const codeHint =
        '\n\n*** CRITICAL FILE CREATION INSTRUCTIONS ***\n' +
        'When the user asks to create any file, you MUST:\n' +
        '1. Respond with the exact file content wrapped in code blocks\n' +
        '2. Use the correct language identifier: ```html, ```css, ```js, ```py, etc.\n' +
        '3. Include the complete file content, not just explanations\n' +
        '4. For HTML files, always include <!DOCTYPE html> and complete structure\n' +
        '\nExample for HTML:\n```html\n<!DOCTYPE html>\n<html>...</html>\n```\n' +
        'Example for CSS:\n```css\nbody { ... }\n```\n' +
        'Example for JavaScript:\n```js\nconsole.log("...");\n```\n' +
        '\nDo NOT just explain what to create - actually CREATE the file content!';
      prompt = `System: ${systemText}${codeHint}\n\n${prompt}`;
    }

    const requestBody = {
      model: params.model || this.model,
      prompt,
      stream: true,
      options: {
        temperature: params.config?.temperature || 0.7,
        top_p: params.config?.topP || 0.9,
        top_k: params.config?.topK || 40,
        num_predict: params.config?.maxOutputTokens || 800, // Reasonable limit to ensure completion
      },
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      await this.handleApiError(response);
    }

    return this.createStreamGenerator(response);
  }

  private async *createStreamGenerator(
    response: Response,
  ): AsyncGenerator<GenerateContentResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedResponseText = ''; // Accumulate the full response text for tool calls only

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line) as OllamaResponse;

              // Accumulate the response text for tool parsing
              accumulatedResponseText += data.response;

              if (data.done) {
                // For final response, only process tool calls without repeating content
                // Use empty response text to avoid duplication, but provide accumulated text for tool parsing
                const finalData = { ...data, response: '' };

                // Add tool calls from accumulated text if any
                const toolCalls = this.parseTextBasedToolCalls(
                  accumulatedResponseText,
                );
                if (toolCalls.length > 0) {
                  console.log(
                    '🎯 [Ollama] Final tool calls processed:',
                    toolCalls.length,
                  );
                }

                const finalResponse = this.convertOllamaToGeminiResponse(
                  finalData,
                  true,
                  toolCalls,
                );
                yield finalResponse;
                return;
              } else {
                // For streaming chunks, yield individual chunks as-is
                yield this.convertOllamaToGeminiResponse(data, false);
              }
            } catch (_e) {
              console.warn('Failed to parse Ollama response line:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  getRecommendedModels(): string[] {
    return [
      // 2025 Latest Recommendations
      'deepseek-r1:7b', // Latest reasoning model
      'qwen3:8b', // Latest Qwen model
      'llama3.3:70b', // Latest Meta model
      'phi4:14b', // Latest Microsoft reasoning
      'gemma3:12b', // Latest Google model

      // Coding Specialists
      'qwen2.5-coder:32b', // Specialized coding
      'qwen2.5-coder:7b', // Balanced coding
      'starcoder2:7b', // Latest code generation
      'codellama:13b', // Proven coding model
      'deepseek-coder-v2:16b', // Advanced coding

      // General Purpose (by size)
      'qwen2.5:0.5b', // Ultra-fast
      'llama3.2:1b', // Lightweight
      'qwen2.5:3b', // Small but capable
      'llama3.2:8b', // Balanced
      'qwen2.5:14b', // Mid-range
      'qwen2.5:32b', // Large
      'llama3.1:70b', // Very large
      'mixtral:8x7b', // Mixture of experts

      // Vision Models
      'llava:7b', // Vision+language
      'llava:13b', // Larger vision

      // Efficiency
      'smollm2:1.7b', // Microsoft efficient
      'gemma3:4b', // Google efficient
      'mistral:7b', // Mistral AI
    ];
  }

  getCapabilities() {
    return {
      supportsStreaming: true,
      supportsVision: false,
      supportsAudio: false,
      supportsFunctionCalling: true, // Enable text-based tool execution for Ollama
      supportsSystemPrompts: true,
      maxContextLength: 8192, // Varies by model
    };
  }

  private async handleApiError(response: Response): Promise<never> {
    let errorMessage = `Ollama API error: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // JSON parsing failed, use default message
    }

    if (response.status === 404) {
      errorMessage = this.create404ErrorMessage(errorMessage);
    } else if (response.status === 503) {
      errorMessage = `Ollama server is temporarily unavailable. Please check if Ollama is running and try again.\nOriginal error: ${errorMessage}`;
    }

    throw new Error(errorMessage);
  }

  private create404ErrorMessage(originalError: string): string {
    // Check if it's a model-related 404
    if (
      originalError.toLowerCase().includes('model') ||
      originalError.toLowerCase().includes('not found')
    ) {
      const suggestions = this.getSuggestedModels(originalError);
      return (
        `❌ Model not found. Please ensure the model is installed and available.\n\n` +
        `To check available models: ollama list\n` +
        `To install a model: ollama pull <model-name>\n` +
        `\n💡 Recommended models for coding:\n` +
        `  • qwen2.5-coder:32b (Specialized coding model)\n` +
        `  • llama3.2:8b (General purpose)\n` +
        `  • deepseek-coder-v2:16b (Code generation)\n` +
        `  • qwen2.5:7b (Fast and efficient)\n\n` +
        (suggestions.length > 0
          ? `Did you mean: ${suggestions.join(', ')}?\n\n`
          : '') +
        `Original error: ${originalError}`
      );
    }

    return (
      `❌ Ollama endpoint not found. Please check if Ollama is running and accessible.\n\n` +
      `To start Ollama: ollama serve\n` +
      `Default endpoint: http://localhost:11434\n\n` +
      `Original error: ${originalError}`
    );
  }

  private getSuggestedModels(errorMessage: string): string[] {
    const modelName = this.extractModelNameFromError(errorMessage);
    if (!modelName) return [];

    const suggestions: string[] = [];
    const recommended = this.getRecommendedModels();

    // Find similar model names
    for (const model of recommended) {
      if (
        model.includes(modelName.split(':')[0]) ||
        model.includes(modelName.split('-')[0]) ||
        this.calculateSimilarity(modelName.toLowerCase(), model.toLowerCase()) >
          0.5
      ) {
        suggestions.push(model);
      }
    }

    return suggestions.slice(0, 3);
  }

  private extractModelNameFromError(errorMessage: string): string | null {
    // Try to extract model name from error message
    const patterns = [
      /model[\s'"]([^\s'"]+)/i,
      /([a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+)/,
      /not found[\s:]([^\s]+)/i,
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
