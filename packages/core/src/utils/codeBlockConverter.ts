/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Utility for converting raw code content to markdown code blocks
 * Works across all providers (Ollama, HuggingFace, etc.)
 */

export interface CodeBlockMatch {
  content: string;
  language: string;
  startIndex: number;
  endIndex: number;
}

export interface ConversionResult {
  originalText: string;
  convertedText: string;
  conversions: CodeBlockMatch[];
}

export class CodeBlockConverter {
  /**
   * Language detection patterns for different file types
   */
  private static readonly LANGUAGE_PATTERNS = {
    html: [
      /<!DOCTYPE\s+html/i,
      /<html[\s>]/i,
      /<head[\s>]/i,
      /<body[\s>]/i,
      /<\/html>/i
    ],
    css: [
      /\s*[\w\-\.#]+\s*\{[^}]*\}/,
      /@media\s+/i,
      /@import\s+/i,
      /:\s*[\w\-#]+\s*;/
    ],
    javascript: [
      /function\s+\w+\s*\(/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /console\.log\s*\(/,
      /=>\s*{/,
      /require\s*\(/,
      /import\s+.*from/
    ],
    typescript: [
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /:\s*(string|number|boolean|object)/,
      /export\s+(interface|type|class)/
    ],
    python: [
      /def\s+\w+\s*\(/,
      /class\s+\w+/,
      /import\s+\w+/,
      /from\s+\w+\s+import/,
      /print\s*\(/,
      /if\s+__name__\s*==\s*['"']__main__['"']/
    ],
    java: [
      /public\s+class\s+\w+/,
      /public\s+static\s+void\s+main/,
      /System\.out\.print/,
      /@Override/,
      /package\s+[\w\.]+/
    ],
    cpp: [
      /#include\s*<.*>/,
      /std::/,
      /cout\s*<</, 
      /cin\s*>>/,
      /int\s+main\s*\(/
    ],
    c: [
      /#include\s*<.*>/,
      /printf\s*\(/,
      /scanf\s*\(/,
      /int\s+main\s*\(/,
      /void\s+\w+\s*\(/
    ],
    php: [
      /<\?php/,
      /echo\s+/,
      /\$\w+/,
      /function\s+\w+\s*\(/
    ],
    ruby: [
      /def\s+\w+/,
      /class\s+\w+/,
      /puts\s+/,
      /require\s+['"']/,
      /end$/m
    ],
    go: [
      /package\s+\w+/,
      /func\s+\w+/,
      /import\s+['"']/,
      /fmt\.Print/
    ],
    rust: [
      /fn\s+\w+/,
      /let\s+mut\s+/,
      /use\s+std::/,
      /println!\s*\(/
    ],
    swift: [
      /func\s+\w+/,
      /var\s+\w+/,
      /let\s+\w+/,
      /print\s*\(/,
      /import\s+\w+/
    ],
    kotlin: [
      /fun\s+\w+/,
      /val\s+\w+/,
      /var\s+\w+/,
      /println\s*\(/
    ],
    json: [
      /^\s*\{[\s\S]*\}\s*$/,
      /['"']\w+['"']\s*:\s*['"']/
    ],
    xml: [
      /<\?xml/,
      /<\/\w+>/,
      /<\w+[\s>]/
    ],
    yaml: [
      /^\s*\w+\s*:\s*/m,
      /^\s*-\s+/m
    ],
    sql: [
      /SELECT\s+.*FROM/i,
      /INSERT\s+INTO/i,
      /UPDATE\s+.*SET/i,
      /DELETE\s+FROM/i,
      /CREATE\s+TABLE/i
    ],
    sh: [
      /#!/,
      /echo\s+/,
      /\$\w+/,
      /if\s+\[/,
      /for\s+\w+\s+in/
    ],
    dockerfile: [
      /FROM\s+\w+/i,
      /RUN\s+/i,
      /COPY\s+/i,
      /WORKDIR\s+/i
    ]
  };

  /**
   * File extension to language mapping
   */
  private static readonly EXTENSION_TO_LANGUAGE: Record<string, string> = {
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'c': 'c',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sql': 'sql',
    'sh': 'sh',
    'bash': 'sh',
    'dockerfile': 'dockerfile'
  };

  /**
   * Detect the programming language of given content
   */
  static detectLanguage(content: string, hints?: { fileName?: string; extension?: string }): string {
    // If extension hint is provided, use it first
    if (hints?.extension) {
      const language = this.EXTENSION_TO_LANGUAGE[hints.extension.toLowerCase()];
      if (language) return language;
    }

    // If filename hint is provided, extract extension
    if (hints?.fileName) {
      const extension = hints.fileName.split('.').pop()?.toLowerCase();
      if (extension) {
        const language = this.EXTENSION_TO_LANGUAGE[extension];
        if (language) return language;
      }
    }

    // Pattern-based detection
    for (const [language, patterns] of Object.entries(this.LANGUAGE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return language;
        }
      }
    }

    return 'text'; // Default fallback
  }

  /**
   * Extract code content from various formats
   */
  static extractCodeContent(text: string): CodeBlockMatch[] {
    const matches: CodeBlockMatch[] = [];

    // HTML extraction
    const htmlMatch = text.match(/(<!DOCTYPE html[\s\S]*?<\/html>)/i);
    if (htmlMatch) {
      matches.push({
        content: htmlMatch[1],
        language: 'html',
        startIndex: htmlMatch.index || 0,
        endIndex: (htmlMatch.index || 0) + htmlMatch[1].length
      });
    }

    // CSS extraction (look for style blocks or CSS rules)
    const cssMatches = text.matchAll(/([^`\n]*\{[^}]*\}[^`\n]*)/g);
    for (const match of cssMatches) {
      if (match[1] && this.detectLanguage(match[1]) === 'css') {
        matches.push({
          content: match[1],
          language: 'css',
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + match[1].length
        });
      }
    }

    // JavaScript/TypeScript extraction
    const jsPattern = /((?:function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=)[\s\S]*?)(?=\n\s*$|\n\s*[A-Z]|\n\s*\/\/|\n\s*\*|$)/gm;
    const jsMatches = text.matchAll(jsPattern);
    for (const match of jsMatches) {
      if (match[1]) {
        const language = this.detectLanguage(match[1]);
        if (language === 'javascript' || language === 'typescript') {
          matches.push({
            content: match[1],
            language,
            startIndex: match.index || 0,
            endIndex: (match.index || 0) + match[1].length
          });
        }
      }
    }

    // Python extraction
    const pythonPattern = /((?:def\s+\w+|class\s+\w+|import\s+\w+)[\s\S]*?)(?=\n\s*$|\n\s*[A-Z]|\n\s*#|$)/gm;
    const pythonMatches = text.matchAll(pythonPattern);
    for (const match of pythonMatches) {
      if (match[1] && this.detectLanguage(match[1]) === 'python') {
        matches.push({
          content: match[1],
          language: 'python',
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + match[1].length
        });
      }
    }

    return matches;
  }

  /**
   * Convert raw code content to markdown code blocks
   */
  static convertToMarkdown(text: string, hints?: { fileName?: string; extension?: string }): ConversionResult {
    const originalText = text;
    let convertedText = text;
    const conversions: CodeBlockMatch[] = [];

    // Skip if already contains code blocks
    if (text.includes('```')) {
      return {
        originalText,
        convertedText,
        conversions
      };
    }

    // Extract code content
    const codeMatches = this.extractCodeContent(text);

    // Convert each match to markdown code block
    let offset = 0;
    for (const match of codeMatches) {
      const language = hints?.extension ? 
        this.detectLanguage(match.content, hints) : 
        match.language;

      const markdownBlock = `\`\`\`${language}\n${match.content}\n\`\`\``;
      
      const adjustedStart = match.startIndex + offset;
      const adjustedEnd = match.endIndex + offset;
      
      convertedText = 
        convertedText.slice(0, adjustedStart) + 
        markdownBlock + 
        convertedText.slice(adjustedEnd);

      const lengthDiff = markdownBlock.length - (match.endIndex - match.startIndex);
      offset += lengthDiff;

      conversions.push({
        content: match.content,
        language,
        startIndex: match.startIndex,
        endIndex: match.endIndex
      });
    }

    return {
      originalText,
      convertedText,
      conversions
    };
  }

  /**
   * Simple method to wrap content in code blocks if not already wrapped
   */
  static wrapInCodeBlock(content: string, language?: string): string {
    if (content.includes('```')) {
      return content; // Already has code blocks
    }

    const detectedLanguage = language || this.detectLanguage(content);
    return `\`\`\`${detectedLanguage}\n${content}\n\`\`\``;
  }
}