/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface FileDetectionResult {
  fileName: string;
  content: string;
  language: string;
  confidence: number;
}

export interface FileDetectionConfig {
  workingDirectory: string;
  defaultSubdirectory?: string;
  supportedExtensions?: Record<string, string[]>; // language -> extensions mapping
  fileNamePatterns?: RegExp[];
}

export class FileDetectionService {
  private config: FileDetectionConfig;
  
  constructor(config: FileDetectionConfig) {
    this.config = {
      defaultSubdirectory: 'generated',
      supportedExtensions: this.getDefaultExtensions(),
      fileNamePatterns: this.getDefaultFilePatterns(),
      ...config
    };
  }

  detectFiles(text: string): FileDetectionResult[] {
    const results: FileDetectionResult[] = [];
    
    // Priority 1: Complete documents (HTML, XML, etc.)
    const completeDoc = this.detectCompleteDocument(text);
    if (completeDoc) {
      results.push(completeDoc);
      return results; // Only return one file to prevent duplicates
    }
    
    // Priority 2: Code blocks with language
    const codeBlockWithLang = this.detectCodeBlockWithLanguage(text);
    if (codeBlockWithLang) {
      results.push(codeBlockWithLang);
      return results;
    }
    
    // Priority 3: Code blocks without language
    const codeBlockNoLang = this.detectCodeBlockWithoutLanguage(text);
    if (codeBlockNoLang) {
      results.push(codeBlockNoLang);
      return results;
    }
    
    // Priority 4: Content patterns (CSS, JS without blocks)
    const contentPattern = this.detectContentPatterns(text);
    if (contentPattern) {
      results.push(contentPattern);
      return results;
    }
    
    return results;
  }
  
  private detectCompleteDocument(text: string): FileDetectionResult | null {
    // HTML documents
    const htmlMatch = text.match(/(<!DOCTYPE html[\s\S]*?<\/html>)/i);
    if (htmlMatch) {
      return {
        fileName: this.extractFileName(text, 'html'),
        content: htmlMatch[1],
        language: 'html',
        confidence: 0.95
      };
    }
    
    // XML documents
    const xmlMatch = text.match(/(<\?xml[\s\S]*?>[\s\S]*?<\/\w+>)/i);
    if (xmlMatch) {
      return {
        fileName: this.extractFileName(text, 'xml'),
        content: xmlMatch[1],
        language: 'xml',
        confidence: 0.9
      };
    }
    
    return null;
  }
  
  private detectCodeBlockWithLanguage(text: string): FileDetectionResult | null {
    const match = text.match(/```(\w+)\n([\s\S]*?)\n```/i);
    if (match) {
      const language = match[1].toLowerCase();
      const content = match[2];
      
      if (content.trim()) {
        const extension = this.getExtensionFromLanguage(language);
        if (extension) {
          return {
            fileName: this.extractFileName(text, extension),
            content: content,
            language: language,
            confidence: 0.85
          };
        }
      }
    }
    
    return null;
  }
  
  private detectCodeBlockWithoutLanguage(text: string): FileDetectionResult | null {
    const match = text.match(/```\n([\s\S]*?)\n```/i);
    if (match) {
      const content = match[1];
      
      if (content.trim()) {
        const detectedLang = this.detectLanguageFromContent(content);
        const extension = this.getExtensionFromLanguage(detectedLang);
        
        if (extension) {
          return {
            fileName: this.extractFileName(text, extension),
            content: content,
            language: detectedLang,
            confidence: 0.7
          };
        }
      }
    }
    
    return null;
  }
  
  private detectContentPatterns(text: string): FileDetectionResult | null {
    // CSS patterns
    if (this.looksLikeCSS(text)) {
      const cssContent = this.extractCSSContent(text);
      if (cssContent) {
        return {
          fileName: this.extractFileName(text, 'css'),
          content: cssContent,
          language: 'css',
          confidence: 0.6
        };
      }
    }
    
    // JavaScript patterns
    if (this.looksLikeJavaScript(text)) {
      return {
        fileName: this.extractFileName(text, 'js'),
        content: text, // Use full text as it might be explaining JS code
        language: 'javascript',
        confidence: 0.5
      };
    }
    
    return null;
  }
  
  private extractFileName(text: string, extension: string): string {
    // Try various patterns to extract filename
    const patterns = [
      // Explicit filename mentions
      new RegExp(`([a-zA-Z0-9_/-]+\\.${extension})`, 'i'),
      // Directory/file patterns
      /(?:create|make|generate).*?([a-zA-Z0-9_/-]+)/i,
      // Quoted filenames
      /"([a-zA-Z0-9_/-]+(?:\.[a-zA-Z0-9]+)?)"/i,
      /'([a-zA-Z0-9_/-]+(?:\.[a-zA-Z0-9]+)?)'/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let fileName = match[1];
        
        // Add extension if not present
        if (!fileName.includes('.')) {
          fileName += `.${extension}`;
        }
        
        return fileName;
      }
    }
    
    // Fallback to timestamp-based name
    const timestamp = Date.now().toString().slice(-6);
    return `generated_${timestamp}.${extension}`;
  }
  
  createAbsolutePath(fileName: string): string {
    // If already absolute path, return as-is
    if (fileName.startsWith('/')) {
      return fileName;
    }
    
    // If has directory structure, place in working directory
    if (fileName.includes('/')) {
      return `${this.config.workingDirectory}/${fileName}`;
    }
    
    // Simple filename - place in default subdirectory
    return `${this.config.workingDirectory}/${this.config.defaultSubdirectory}/${fileName}`;
  }
  
  private getExtensionFromLanguage(language: string): string | null {
    const extensions = this.config.supportedExtensions!;
    
    for (const [lang, exts] of Object.entries(extensions)) {
      if (lang === language || exts.includes(language)) {
        return exts[0]; // Return primary extension
      }
    }
    
    return null;
  }
  
  private detectLanguageFromContent(content: string): string {
    // HTML
    if (content.includes('<!DOCTYPE') || content.includes('<html') || content.includes('<div')) {
      return 'html';
    }
    
    // CSS
    if (content.includes('{') && content.includes('}') && (content.includes(':') || content.includes('.'))) {
      return 'css';
    }
    
    // JavaScript
    if (content.includes('function') || content.includes('console.log') || content.includes('const ') || content.includes('let ')) {
      return 'javascript';
    }
    
    // Python
    if (content.includes('def ') || content.includes('import ') || content.includes('print(')) {
      return 'python';
    }
    
    // JSON
    if (content.trim().startsWith('{') && content.trim().endsWith('}') && content.includes('"')) {
      return 'json';
    }
    
    // Default
    return 'text';
  }
  
  private looksLikeCSS(text: string): boolean {
    return text.includes('body {') || 
           (text.includes('.') && text.includes('{') && text.includes('}'));
  }
  
  private extractCSSContent(text: string): string | null {
    const match = text.match(/([^`\n]*\{[^}]*\}[^`\n]*)/);
    return match ? match[1] : null;
  }
  
  private looksLikeJavaScript(text: string): boolean {
    return text.includes('function ') || 
           text.includes('console.log') || 
           text.includes('const ') || 
           text.includes('let ');
  }
  
  private getDefaultExtensions(): Record<string, string[]> {
    return {
      'html': ['html', 'htm'],
      'css': ['css'],
      'javascript': ['js', 'mjs'],
      'typescript': ['ts'],
      'python': ['py'],
      'java': ['java'],
      'cpp': ['cpp', 'cxx', 'cc'],
      'c': ['c'],
      'csharp': ['cs'],
      'php': ['php'],
      'ruby': ['rb'],
      'go': ['go'],
      'rust': ['rs'],
      'swift': ['swift'],
      'kotlin': ['kt'],
      'json': ['json'],
      'xml': ['xml'],
      'yaml': ['yaml', 'yml'],
      'markdown': ['md'],
      'text': ['txt'],
      'shell': ['sh', 'bash'],
      'sql': ['sql'],
    };
  }
  
  private getDefaultFilePatterns(): RegExp[] {
    return [
      /([a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+)/i,
      /(?:create|make|generate|write).*?([a-zA-Z0-9_/-]+)/i,
      /"([a-zA-Z0-9_/-]+(?:\.[a-zA-Z0-9]+)?)"/i,
      /'([a-zA-Z0-9_/-]+(?:\.[a-zA-Z0-9]+)?)'/i,
    ];
  }
}