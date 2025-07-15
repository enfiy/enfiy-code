/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { ProviderType } from './types.js';
import { BaseProvider } from './base-provider.js';
import { CodeBlockConverter } from '../utils/codeBlockConverter.js';
export class OllamaProvider extends BaseProvider {
    type = ProviderType.OLLAMA;
    name = 'Ollama';
    baseUrl = 'http://localhost:11434';
    model = 'llama3.2:3b';
    timeout = 120000; // Increased timeout to 2 minutes
    async performInitialization(config) {
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        this.model = config.model || 'llama3.2:3b';
        this.timeout = config.timeout || 120000; // Default to 2 minutes
        // Check if Ollama is available
        const available = await this.isAvailable();
        if (!available) {
            throw new Error('Ollama server is not available. Please make sure Ollama is running.');
        }
    }
    async isAvailable() {
        try {
            const response = await fetch(`${this.baseUrl}/api/version`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                return [];
            }
            const data = await response.json();
            return data.models?.map(model => model.name) || [];
        }
        catch {
            return [];
        }
    }
    convertContentToPrompt(contents) {
        return contents
            .map(content => {
            const text = content.parts
                ?.map(part => part.text)
                .filter(Boolean)
                .join(' ') || '';
            return content.role === 'user' ? `User: ${text}` : `Assistant: ${text}`;
        })
            .join('\n\n');
    }
    parseTextBasedToolCalls(text) {
        const toolCalls = [];
        // Convert raw code content to markdown code blocks for better detection
        const conversionResult = CodeBlockConverter.convertToMarkdown(text);
        const processedText = conversionResult.convertedText;
        console.log('=== CODE BLOCK CONVERSION ===');
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
    autoDetectFileCreation(text, toolCalls) {
        // console.log('Checking text for file creation patterns...');
        // Multiple patterns for code block detection
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
                }
                else if (match.length === 2) {
                    // Code block without language or inline code
                    content = match[1];
                    if (content.includes('.')) {
                        // This might be an inline filename, try to extract extension
                        const parts = content.split('.');
                        language = parts[parts.length - 1];
                    }
                }
                if (!content.trim())
                    continue;
                // console.log('Found code block:', { language, contentLength: content.length });
                // Get file extension from language
                const extension = this.getFileExtension(language, content);
                if (!extension) {
                    // console.log('No extension found for language:', language);
                    continue;
                }
                // Extract filename from text
                const fileName = this.extractFileName(text, extension);
                // console.log('Extracted filename:', fileName);
                // Create absolute file path
                const absolutePath = this.createAbsolutePath(fileName);
                // console.log('Absolute path:', absolutePath);
                // Create the tool call
                toolCalls.push({
                    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: 'write_file',
                    args: {
                        file_path: absolutePath,
                        content
                    }
                });
                // console.log('Created tool call for file creation');
                // Only create one file per response to avoid multiple files
                return;
            }
        }
        // If no code blocks found, try to detect file creation intent
        this.detectFileCreationIntent(text, toolCalls);
    }
    detectFileCreationIntent(text, toolCalls) {
        console.log('Detecting file creation intent...');
        // Check if response contains content that looks like file content without code blocks
        // HTML content detection
        if (text.includes('<!DOCTYPE html') || text.includes('<html')) {
            console.log('HTML content detected without code blocks');
            // Extract HTML content
            const htmlMatch = text.match(/(<!DOCTYPE html[\s\S]*?<\/html>)/i);
            if (htmlMatch) {
                const htmlContent = htmlMatch[1];
                const fileName = this.extractFileName(text, 'html');
                const absolutePath = this.createAbsolutePath(fileName);
                toolCalls.push({
                    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: 'write_file',
                    args: {
                        file_path: absolutePath,
                        content: htmlContent
                    }
                });
                console.log('Created tool call for HTML content detection');
                return;
            }
        }
        // CSS content detection
        if (text.includes('body {') || text.includes('.') && text.includes('{') && text.includes('}')) {
            console.log('CSS content detected without code blocks');
            const fileName = this.extractFileName(text, 'css');
            const absolutePath = this.createAbsolutePath(fileName);
            // Extract CSS-like content
            const cssMatch = text.match(/([^`\n]*\{[^}]*\}[^`\n]*)/);
            if (cssMatch) {
                toolCalls.push({
                    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: 'write_file',
                    args: {
                        file_path: absolutePath,
                        content: cssMatch[1]
                    }
                });
                console.log('Created tool call for CSS content detection');
                return;
            }
        }
        // JavaScript content detection
        if (text.includes('function ') || text.includes('console.log') || text.includes('const ') || text.includes('let ')) {
            console.log('JavaScript content detected without code blocks');
            const fileName = this.extractFileName(text, 'js');
            const absolutePath = this.createAbsolutePath(fileName);
            // Use the whole response as JS content if it looks like JS
            const content = this.generateBasicContent('js', fileName);
            toolCalls.push({
                id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: 'write_file',
                args: {
                    file_path: absolutePath,
                    content
                }
            });
            console.log('Created tool call for JavaScript content detection');
            return;
        }
        // Look for file creation keywords and patterns
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
                }
                else if (match[2] && match[3]) {
                    fileName = `${match[1]}/${match[2]}`;
                    extension = match[3];
                }
                if (!fileName || !extension)
                    continue;
                console.log('Found file creation intent:', { fileName, extension });
                // Create absolute file path
                const absolutePath = this.createAbsolutePath(fileName);
                // Generate basic content based on file type
                const content = this.generateBasicContent(extension, fileName);
                toolCalls.push({
                    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: 'write_file',
                    args: {
                        file_path: absolutePath,
                        content
                    }
                });
                console.log('Created tool call from intent detection');
                return;
            }
        }
        console.log('No file creation intent detected');
    }
    generateBasicContent(extension, fileName) {
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
    getFileExtension(language, content) {
        // Language to extension mapping
        const languageMap = {
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
    extractFileName(text, extension) {
        console.log('Extracting filename for extension:', extension);
        // Look for various filename patterns including directory paths
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
            /([a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+)/i,
            // File creation context
            /(?:file|create|make|write|作成|ファイル).*?([a-zA-Z0-9_/-]+)/i,
            // Quoted filenames
            /"([a-zA-Z0-9_/-]+(?:\.[a-zA-Z0-9]+)?)"/i,
            /'([a-zA-Z0-9_/-]+(?:\.[a-zA-Z0-9]+)?)'/i,
            // Just the name mentioned
            /([a-zA-Z0-9_-]+)/
        ];
        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            const match = text.match(pattern);
            console.log(`Pattern ${i + 1} result:`, match);
            if (match && match[1]) {
                const extractedName = match[1];
                // Handle directory/filename pattern
                if (match[2]) {
                    const dir = match[1];
                    const filename = match[2];
                    const fullPath = `${dir}/${filename}`;
                    const result = fullPath.includes('.') ? fullPath : `${fullPath}.${extension}`;
                    console.log('Extracted filename (with directory):', result);
                    return result;
                }
                // If it already has an extension, use it as is
                if (extractedName.includes('.')) {
                    console.log('Extracted filename (with extension):', extractedName);
                    return extractedName;
                }
                // Otherwise add the detected extension
                const result = `${extractedName}.${extension}`;
                console.log('Extracted filename (added extension):', result);
                return result;
            }
        }
        // Special handling for common Japanese patterns
        const japaneseMatch = text.match(/(?:test-debug|テストデバッグ).*?(?:ディレクトリ|directory)/i);
        if (japaneseMatch) {
            const result = `test-debug/test.${extension}`;
            console.log('Japanese pattern match:', result);
            return result;
        }
        // Fallback with timestamp to avoid conflicts
        const timestamp = Date.now().toString().slice(-6);
        const fallback = `generated_${timestamp}.${extension}`;
        console.log('Using fallback filename:', fallback);
        return fallback;
    }
    createAbsolutePath(fileName) {
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
    convertOllamaToGeminiResponse(ollamaResponse, isDone = true) {
        const responseText = ollamaResponse.response;
        const parts = [{ text: responseText }];
        console.log('=== OLLAMA RESPONSE START ===');
        console.log(responseText);
        console.log('=== OLLAMA RESPONSE END ===');
        // Parse text-based tool calls
        const functionCalls = this.parseTextBasedToolCalls(responseText);
        console.log('Function calls found:', functionCalls.length);
        const content = {
            parts,
            role: 'model',
        };
        const response = {
            candidates: [{
                    content,
                    finishReason: isDone ? 'STOP' : undefined,
                    index: 0,
                }],
            usageMetadata: {
                promptTokenCount: ollamaResponse.prompt_eval_count || 0,
                candidatesTokenCount: ollamaResponse.eval_count || 0,
                totalTokenCount: (ollamaResponse.prompt_eval_count || 0) + (ollamaResponse.eval_count || 0),
            },
            // Add required properties with sensible defaults
            text: responseText,
            data: undefined,
            functionCalls, // Now populated with parsed tool calls
            executableCode: undefined,
            codeExecutionResult: undefined,
        };
        return response;
    }
    async generateContent(params) {
        let prompt = this.convertContentToPrompt(params.contents);
        // Add system instruction if provided
        if (params.config?.systemInstruction) {
            const systemText = typeof params.config.systemInstruction === 'string'
                ? params.config.systemInstruction
                : params.config.systemInstruction.parts?.map((p) => p.text).join('\n') || '';
            // Add file creation hint for all code types
            const codeHint = '\n\n*** CRITICAL FILE CREATION INSTRUCTIONS ***\n' +
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
        const data = await response.json();
        return this.convertOllamaToGeminiResponse(data);
    }
    async generateContentStream(params) {
        let prompt = this.convertContentToPrompt(params.contents);
        // Add system instruction if provided (same as generateContent)
        if (params.config?.systemInstruction) {
            const systemText = typeof params.config.systemInstruction === 'string'
                ? params.config.systemInstruction
                : params.config.systemInstruction.parts?.map((p) => p.text).join('\n') || '';
            // Add file creation hint for all code types
            const codeHint = '\n\n*** CRITICAL FILE CREATION INSTRUCTIONS ***\n' +
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
    async *createStreamGenerator(response) {
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            yield this.convertOllamaToGeminiResponse(data, data.done);
                            if (data.done) {
                                return;
                            }
                        }
                        catch (_e) {
                            console.warn('Failed to parse Ollama response line:', line);
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    getRecommendedModels() {
        return [
            'llama3.2:3b',
            'llama3.2:8b',
            'llama3.1:70b',
            'mixtral:8x7b',
            'qwen2.5:32b',
            'gemma2:9b',
            'phi3',
            'codellama',
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
    async handleApiError(response) {
        let errorMessage = `Ollama API error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = errorData.error;
            }
        }
        catch {
            // JSON parsing failed, use default message
        }
        if (response.status === 404) {
            errorMessage = this.create404ErrorMessage(errorMessage);
        }
        else if (response.status === 503) {
            errorMessage = `Ollama server is temporarily unavailable. Please check if Ollama is running and try again.\nOriginal error: ${errorMessage}`;
        }
        throw new Error(errorMessage);
    }
    create404ErrorMessage(originalError) {
        // Check if it's a model-related 404
        if (originalError.toLowerCase().includes('model') || originalError.toLowerCase().includes('not found')) {
            return `❌ Model not found. Please ensure the model is installed and available.\n\n` +
                `To check available models: ollama list\n` +
                `To install a model: ollama pull <model-name>\n` +
                `Common models: llama3.2:8b, llama3.2:1b, codellama\n\n` +
                `Original error: ${originalError}`;
        }
        return `❌ Ollama endpoint not found. Please check if Ollama is running and accessible.\n\n` +
            `To start Ollama: ollama serve\n` +
            `Default endpoint: http://localhost:11434\n\n` +
            `Original error: ${originalError}`;
    }
}
//# sourceMappingURL=ollama-provider.js.map