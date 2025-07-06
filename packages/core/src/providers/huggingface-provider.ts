/**
 * @license
 * Copyright 2025 arterect and h.esaki
 * SPDX-License-Identifier: MIT
 */

import { BaseProvider } from './base-provider.js';
import { ProviderConfig, ProviderType } from './types.js';
import { Content, GenerateContentResponse, GenerateContentConfig, FinishReason } from '@google/genai';
import { CodeBlockConverter } from '../utils/codeBlockConverter.js';

interface HuggingFaceMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface HuggingFaceResponse {
  choices: Array<{
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'eos_token';
    index: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class HuggingFaceProvider extends BaseProvider {
  readonly type = ProviderType.HUGGINGFACE;
  readonly name = 'HuggingFace';

  private apiKey?: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';
  private isLocalMode = false;

  protected async performInitialization(config: ProviderConfig): Promise<void> {
    // Check if it's local mode (custom baseUrl pointing to local server)
    if (config.baseUrl && (config.baseUrl.includes('localhost') || config.baseUrl.includes('127.0.0.1'))) {
      this.isLocalMode = true;
      this.baseUrl = config.baseUrl;
      // API key not required for local mode
      this.apiKey = config.apiKey;
    } else {
      // Cloud mode - API key required
      if (!config.apiKey) {
        throw new Error('HuggingFace API key is required for cloud mode');
      }
      this.apiKey = config.apiKey;
      
      // Allow custom base URL for HuggingFace Inference Endpoints
      if (config.baseUrl) {
        this.baseUrl = config.baseUrl;
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (this.isLocalMode) {
        // For local mode, try to connect to the local server
        const response = await fetch(`${this.baseUrl.replace('/models', '')}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      } else {
        // Cloud mode - check API key and service
        if (!this.apiKey) {
          return false;
        }
        
        // Test with a simple request to a default model
        const response = await this.makeApiRequest('/microsoft/DialoGPT-medium', {
          method: 'POST',
          body: JSON.stringify({
            inputs: 'test',
            parameters: { max_new_tokens: 1 },
          }),
        });
        
        return response.ok || response.status === 503; // 503 means model is loading
      }
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    // HuggingFace has thousands of models, return recommended ones
    return this.getRecommendedModels();
  }

  getRecommendedModels(): string[] {
    return [
      // Chat models
      'microsoft/DialoGPT-medium',
      'microsoft/DialoGPT-large',
      'facebook/blenderbot-400M-distill',
      'HuggingFaceH4/zephyr-7b-beta',
      'mistralai/Mistral-7B-Instruct-v0.1',
      'meta-llama/Llama-2-7b-chat-hf',
      'codellama/CodeLlama-7b-Instruct-hf',
      
      // Text generation models
      'gpt2',
      'gpt2-medium',
      'gpt2-large',
      'EleutherAI/gpt-neo-2.7B',
      'EleutherAI/gpt-j-6B',
    ];
  }

  private convertToHuggingFaceFormat(contents: Content[]): {
    inputs: string;
    messages?: HuggingFaceMessage[];
  } {
    // For chat models, use messages format
    const messages: HuggingFaceMessage[] = contents.map(content => {
      const textParts = content.parts?.filter(part => 'text' in part) || [];
      const text = textParts.map(part => (part as { text: string }).text).join('\n');
      
      return {
        role: content.role === 'model' ? 'assistant' : content.role as 'system' | 'user' | 'assistant',
        content: text,
      };
    });

    // For simpler models, concatenate as single input
    const inputs = contents.map(content => {
      const textParts = content.parts?.filter(part => 'text' in part) || [];
      const text = textParts.map(part => (part as { text: string }).text).join('\n');
      return `${content.role}: ${text}`;
    }).join('\n') + '\nassistant:';

    return { inputs, messages };
  }

  private parseTextBasedToolCalls(text: string): any[] {
    const toolCalls: any[] = [];
    
    // Convert raw code content to markdown code blocks for better detection
    const conversionResult = CodeBlockConverter.convertToMarkdown(text);
    const processedText = conversionResult.convertedText;
    
    console.log('=== HuggingFace CODE BLOCK CONVERSION ===');
    console.log('Conversions made:', conversionResult.conversions.length);
    if (conversionResult.conversions.length > 0) {
      console.log('Converted text preview:', processedText.substring(0, 200) + '...');
    }
    
    // Use processed text for file creation detection
    this.autoDetectFileCreation(processedText, toolCalls);
    
    // If no code blocks were found in processed text, try original detection
    if (toolCalls.length === 0) {
      this.autoDetectFileCreation(text, toolCalls);
    }
    
    return toolCalls;
  }

  private autoDetectFileCreation(text: string, toolCalls: any[]): void {
    console.log('HuggingFace: Checking text for file creation patterns...');
    
    // Multiple patterns for code block detection (same as Ollama)
    const codeBlockPatterns = [
      // Standard code blocks with language
      /```(\w+)\n([\s\S]*?)\n```/gi,
      // Code blocks without language
      /```\n([\s\S]*?)\n```/gi,
      // Inline code with file extensions
      /`([^`]*\.(html|css|js|py|java|cpp|c|php|rb|go|rs|swift|kt|json|xml|yaml|yml|md|txt|sh|sql))`/gi
    ];
    
    // Try each pattern
    for (const pattern of codeBlockPatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(text)) !== null) {
        let language = '';
        let content = '';
        
        if (match.length === 3) {
          // Standard code block with language
          language = match[1]?.toLowerCase() || '';
          content = match[2];
        } else if (match.length === 2) {
          // Code block without language or inline code
          content = match[1];
          if (content.includes('.')) {
            // This might be an inline filename, try to extract extension
            const parts = content.split('.');
            language = parts[parts.length - 1];
          }
        }
        
        if (!content.trim()) continue;
        
        console.log('HuggingFace: Found code block:', { language, contentLength: content.length });
        
        // Get file extension from language
        const extension = this.getFileExtension(language, content);
        if (!extension) {
          console.log('HuggingFace: No extension found for language:', language);
          continue;
        }
        
        // Extract filename from text
        const fileName = this.extractFileName(text, extension);
        console.log('HuggingFace: Extracted filename:', fileName);
        
        // Create absolute file path
        const absolutePath = this.createAbsolutePath(fileName);
        console.log('HuggingFace: Absolute path:', absolutePath);
        
        // Create the tool call
        toolCalls.push({
          id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: 'write_file',
          args: {
            file_path: absolutePath,
            content: content
          }
        });
        
        console.log('HuggingFace: Created tool call for file creation');
        // Only create one file per response to avoid multiple files
        return;
      }
    }
    
    // If no code blocks found, try to detect file creation intent
    this.detectFileCreationIntent(text, toolCalls);
  }

  private detectFileCreationIntent(text: string, toolCalls: any[]): void {
    console.log('HuggingFace: Detecting file creation intent...');
    
    // Look for file creation keywords and patterns (same as Ollama)
    const fileCreationPatterns = [
      /(?:作成|create|make|write|generate).*?(\w+\.(html|css|js|py|java|cpp|c|php|rb|go|rs|swift|kt|json|xml|yaml|yml|md|txt|sh|sql))/gi,
      /(\w+\.(html|css|js|py|java|cpp|c|php|rb|go|rs|swift|kt|json|xml|yaml|yml|md|txt|sh|sql)).*?(?:作成|create|make|write|generate)/gi,
      /(test-debug|src|components|utils|lib)\/(\w+\.(html|css|js|py|java|cpp|c|php|rb|go|rs|swift|kt|json|xml|yaml|yml|md|txt|sh|sql))/gi
    ];
    
    for (const pattern of fileCreationPatterns) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        let fileName = '';
        let extension = '';
        
        if (match[1] && match[2]) {
          fileName = match[1];
          extension = match[2];
        } else if (match[2] && match[3]) {
          fileName = `${match[1]}/${match[2]}`;
          extension = match[3];
        }
        
        if (!fileName || !extension) continue;
        
        console.log('HuggingFace: Found file creation intent:', { fileName, extension });
        
        // Create absolute file path
        const absolutePath = this.createAbsolutePath(fileName);
        
        // Generate basic content based on file type
        const content = this.generateBasicContent(extension, fileName);
        
        toolCalls.push({
          id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: 'write_file',
          args: {
            file_path: absolutePath,
            content: content
          }
        });
        
        console.log('HuggingFace: Created tool call from intent detection');
        return;
      }
    }
    
    console.log('HuggingFace: No file creation intent detected');
  }

  private generateBasicContent(extension: string, fileName: string): string {
    const baseName = fileName.split('/').pop()?.split('.')[0] || 'untitled';
    
    switch (extension) {
      case 'html':
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${baseName}</title>
</head>
<body>
    <h1>${baseName}</h1>
    <p>このファイルは自動生成されました。</p>
</body>
</html>`;
      case 'css':
        return `/* ${baseName} styles */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}`;
      case 'js':
        return `// ${baseName}
console.log('${baseName} loaded');`;
      case 'py':
        return `# ${baseName}
print("${baseName}")`;
      case 'json':
        return `{
  "name": "${baseName}",
  "version": "1.0.0"
}`;
      case 'md':
        return `# ${baseName}

このファイルは自動生成されました。`;
      default:
        return `// ${baseName}
// このファイルは自動生成されました。`;
    }
  }

  private getFileExtension(language: string, content: string): string | null {
    // Language to extension mapping
    const languageMap: Record<string, string> = {
      'html': 'html',
      'css': 'css',
      'javascript': 'js',
      'js': 'js',
      'typescript': 'ts',
      'ts': 'ts',
      'python': 'py',
      'py': 'py',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'cs',
      'php': 'php',
      'ruby': 'rb',
      'go': 'go',
      'rust': 'rs',
      'swift': 'swift',
      'kotlin': 'kt',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yml',
      'markdown': 'md',
      'md': 'md',
      'txt': 'txt',
      'sh': 'sh',
      'bash': 'sh',
      'sql': 'sql',
      'dockerfile': 'dockerfile',
      'makefile': 'makefile'
    };

    // First try language mapping
    if (language && languageMap[language]) {
      return languageMap[language];
    }

    // Try to detect from content patterns
    if (content.includes('<!DOCTYPE html') || content.includes('<html')) {
      return 'html';
    }
    if (content.includes('def ') || content.includes('import ') || content.includes('from ')) {
      return 'py';
    }
    if (content.includes('function ') || content.includes('const ') || content.includes('let ')) {
      return 'js';
    }
    if (content.includes('{') && content.includes('}') && (content.includes('"') || content.includes("'"))) {
      return 'json';
    }

    // Default to txt for any unrecognized code block
    return 'txt';
  }

  private extractFileName(text: string, extension: string): string {
    console.log('HuggingFace: Extracting filename for extension:', extension);
    
    // Look for various filename patterns including directory paths (same as Ollama)
    const patterns = [
      // Japanese context patterns
      new RegExp(`([a-zA-Z0-9_/-]+\\.${extension})(?:を|ファイル|作成|という)`, 'i'),
      new RegExp(`(?:作成|つく|make|create).*?([a-zA-Z0-9_/-]+\\.${extension})`, 'i'),
      
      // Directory-specific patterns
      new RegExp(`(test-debug|src|components|utils|lib|public|assets)/([a-zA-Z0-9_-]+\\.${extension})`, 'i'),
      new RegExp(`(test-debug|src|components|utils|lib|public|assets)/([a-zA-Z0-9_-]+)(?!\\.)`, 'i'),
      
      // General file patterns
      new RegExp(`([a-zA-Z0-9_/-]+\\.${extension})`, 'i'),
      new RegExp(`([a-zA-Z0-9_/-]+)/([a-zA-Z0-9_-]+)`, 'i'),
      new RegExp(`([a-zA-Z0-9_-]+\\.${extension})`, 'i'),
      
      // Any file with any extension
      /([a-zA-Z0-9_\/-]+\.[a-zA-Z0-9]+)/i,
      
      // File creation context
      /(?:file|create|make|write|作成|ファイル).*?([a-zA-Z0-9_\/-]+)/i,
      
      // Quoted filenames
      /"([a-zA-Z0-9_\/-]+(?:\.[a-zA-Z0-9]+)?)"/i,
      /'([a-zA-Z0-9_\/-]+(?:\.[a-zA-Z0-9]+)?)'/i,
      
      // Just the name mentioned
      /([a-zA-Z0-9_-]+)/
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = text.match(pattern);
      
      console.log(`HuggingFace: Pattern ${i + 1} result:`, match);
      
      if (match && match[1]) {
        const extractedName = match[1];
        
        // Handle directory/filename pattern
        if (match[2]) {
          const dir = match[1];
          const filename = match[2];
          const fullPath = `${dir}/${filename}`;
          const result = fullPath.includes('.') ? fullPath : `${fullPath}.${extension}`;
          console.log('HuggingFace: Extracted filename (with directory):', result);
          return result;
        }
        
        // If it already has an extension, use it as is
        if (extractedName.includes('.')) {
          console.log('HuggingFace: Extracted filename (with extension):', extractedName);
          return extractedName;
        }
        
        // Otherwise add the detected extension
        const result = `${extractedName}.${extension}`;
        console.log('HuggingFace: Extracted filename (added extension):', result);
        return result;
      }
    }

    // Special handling for common Japanese patterns
    const japaneseMatch = text.match(/(?:test-debug|テストデバッグ).*?(?:ディレクトリ|directory)/i);
    if (japaneseMatch) {
      const result = `test-debug/test.${extension}`;
      console.log('HuggingFace: Japanese pattern match:', result);
      return result;
    }

    // Fallback with timestamp to avoid conflicts
    const timestamp = Date.now().toString().slice(-6);
    const fallback = `generated_${timestamp}.${extension}`;
    console.log('HuggingFace: Using fallback filename:', fallback);
    return fallback;
  }

  private createAbsolutePath(fileName: string): string {
    const workingDir = '/home/h.esaki/work/enfiy-ecosystem/enfiy-code';
    
    // If fileName already starts with a known directory structure, use it directly
    if (fileName.startsWith('/') || fileName.startsWith('./') || fileName.startsWith('../')) {
      return fileName.startsWith('/') ? fileName : `${workingDir}/${fileName}`;
    }
    
    // If fileName contains directory structure, place it in the working directory
    if (fileName.includes('/')) {
      return `${workingDir}/${fileName}`;
    }
    
    // For simple filenames, place them in the codetest directory
    return `${workingDir}/codetest/${fileName}`;
  }

  protected convertToStandardResponse(response: unknown, originalText?: string): GenerateContentResponse {
    let content = '';
    
    if (Array.isArray(response)) {
      // Text generation response format
      const arrayResponse = response as Array<{ generated_text?: string }>;
      content = arrayResponse[0]?.generated_text || '';
      // Remove the original input from the response
      if (originalText && content.startsWith(originalText)) {
        content = content.slice(originalText.length).trim();
      }
    } else if (response && typeof response === 'object' && 'choices' in response) {
      // Chat completion format
      const chatResponse = response as HuggingFaceResponse;
      content = chatResponse.choices[0]?.message?.content || '';
    } else if (response && typeof response === 'object' && 'generated_text' in response) {
      // Single generation format
      const singleResponse = response as { generated_text: string };
      content = singleResponse.generated_text;
      if (originalText && content.startsWith(originalText)) {
        content = content.slice(originalText.length).trim();
      }
    }

    // Parse text-based tool calls from the response
    const functionCalls = this.parseTextBasedToolCalls(content);

    const standardResponse = {
      candidates: [{
        content: {
          role: 'model',
          parts: [{ text: content }],
        },
        finishReason: FinishReason.STOP,
        index: 0,
        safetyRatings: [],
      }],
      usageMetadata: {
        promptTokenCount: (response && typeof response === 'object' && 'usage' in response) ? (response as HuggingFaceResponse).usage?.prompt_tokens || 0 : 0,
        candidatesTokenCount: (response && typeof response === 'object' && 'usage' in response) ? (response as HuggingFaceResponse).usage?.completion_tokens || 0 : 0,
        totalTokenCount: (response && typeof response === 'object' && 'usage' in response) ? (response as HuggingFaceResponse).usage?.total_tokens || 0 : 0,
      },
      // Add required properties for compatibility
      text: content,
      data: undefined,
      functionCalls, // Now populated with parsed tool calls
      executableCode: undefined,
      codeExecutionResult: undefined,
    };

    return standardResponse as unknown as GenerateContentResponse;
  }

  private async makeApiRequest(endpoint: string, options?: RequestInit): Promise<Response> {
    if (!this.isLocalMode && !this.apiKey) {
      throw new Error('HuggingFace API key not available');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Safely add headers if they exist
    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    // Only add Authorization header for cloud mode
    if (!this.isLocalMode && this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
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
    const { inputs, messages } = this.convertToHuggingFaceFormat(params.contents);
    
    // Handle system instruction
    let finalInputs = inputs;
    if (params.config?.systemInstruction) {
      const systemText = typeof params.config.systemInstruction === 'string' 
        ? params.config.systemInstruction 
        : (params.config.systemInstruction as { parts?: Array<{ text: string }> }).parts?.map((p) => p.text).join('\n') || '';
      
      finalInputs = `system: ${systemText}\n${inputs}`;
    }

    const modelName = params.model.replace(/^models\//, '');
    const finalModel = this.getRecommendedModels().includes(modelName) 
      ? modelName 
      : 'microsoft/DialoGPT-medium';

    // Determine if model supports chat format
    const supportsChatFormat = ['zephyr', 'Mistral', 'Llama', 'CodeLlama'].some(
      name => finalModel.includes(name)
    );

    const requestBody = supportsChatFormat && messages ? {
      inputs: { messages },
      parameters: {
        max_new_tokens: params.config?.maxOutputTokens || 1024,
        temperature: params.config?.temperature || 0.7,
        top_p: params.config?.topP || 1,
        do_sample: true,
        return_full_text: false,
      },
    } : {
      inputs: finalInputs,
      parameters: {
        max_new_tokens: params.config?.maxOutputTokens || 1024,
        temperature: params.config?.temperature || 0.7,
        top_p: params.config?.topP || 1,
        do_sample: true,
        return_full_text: false,
      },
    };

    try {
      const response = await this.makeApiRequest(`/${finalModel}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HuggingFace API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return this.convertToStandardResponse(data, finalInputs);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateContentStream(params: {
    model: string;
    contents: Content[];
    config?: GenerateContentConfig;
  }): Promise<AsyncGenerator<GenerateContentResponse>> {
    // HuggingFace Inference API doesn't support streaming by default
    // We'll simulate streaming by generating content and yielding it progressively
    const response = await this.generateContent(params);
    
    return this.simulateStreaming(response);
  }

  private async *simulateStreaming(response: GenerateContentResponse): AsyncGenerator<GenerateContentResponse> {
    const fullText = response.text || '';
    const words = fullText.split(' ');
    let accumulatedText = '';

    for (let i = 0; i < words.length; i++) {
      accumulatedText += (i > 0 ? ' ' : '') + words[i];
      
      const streamResponse = {
        ...response,
        text: accumulatedText,
        candidates: [{
          ...response.candidates![0],
          content: {
            ...response.candidates![0].content,
            parts: [{ text: accumulatedText }],
          },
        }],
        data: undefined,
        functionCalls: [],
        executableCode: undefined,
        codeExecutionResult: undefined,
      };

      yield streamResponse;
      
      // Small delay to simulate real streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  getCapabilities() {
    return {
      supportsStreaming: false, // Simulated streaming only
      supportsVision: false,
      supportsAudio: false,
      supportsFunctionCalling: true, // Enable text-based tool execution for HuggingFace
      supportsSystemPrompts: true,
      maxContextLength: 2048, // Varies by model
    };
  }

  protected handleError(error: unknown): Error {
    if (error && typeof error === 'object' && error !== null && 'response' in error) {
      const errorObj = error as { response?: { data?: { error?: string } } };
      if (errorObj.response?.data?.error) {
        return new Error(`HuggingFace API Error: ${errorObj.response.data.error}`);
      }
    }
    
    return super.handleError(error);
  }
}