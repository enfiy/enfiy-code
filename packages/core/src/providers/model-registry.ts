/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { ProviderType } from './types.js';

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  category: 'local' | 'cloud';
  description: string;
  contextLength: number;
  pricing?: {
    input: number;
    output: number;
    unit: string;
  };
  capabilities: string[];
}

export const MODEL_REGISTRY: Record<string, ModelInfo[]> = {
  [ProviderType.OLLAMA]: [
    {
      id: 'llama3.2:3b',
      name: 'Llama 3.2 3B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Fast and efficient 3B parameter model',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'fast'],
    },
    {
      id: 'llama3.2:8b',
      name: 'Llama 3.2 8B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Balanced 8B parameter model',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'llama3.1:70b',
      name: 'Llama 3.1 70B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Large, powerful 70B parameter model',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning', 'complex'],
    },
    {
      id: 'qwen2.5-coder:32b',
      name: 'Qwen 2.5 Coder 32B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Specialized coding model',
      contextLength: 128000,
      capabilities: ['code', 'reasoning', 'debugging'],
    },
    {
      id: 'qwen2.5:7b',
      name: 'Qwen 2.5 7B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Efficient 7B parameter model with strong capabilities',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning', 'fast'],
    },
    {
      id: 'qwen2.5:14b',
      name: 'Qwen 2.5 14B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Balanced 14B parameter model',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'qwen2.5:32b',
      name: 'Qwen 2.5 32B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Large Qwen model with advanced capabilities',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning', 'complex'],
    },
    {
      id: 'qwen3:latest',
      name: 'Qwen 3 Latest',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Latest Qwen 3 model (experimental)',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning', 'experimental'],
    },
    {
      id: 'deepseek-coder-v2:16b',
      name: 'DeepSeek Coder V2 16B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Advanced code generation model',
      contextLength: 128000,
      capabilities: ['code', 'debugging', 'refactoring'],
    },
    {
      id: 'mistral:7b',
      name: 'Mistral 7B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Efficient 7B parameter model',
      contextLength: 32768,
      capabilities: ['chat', 'code', 'fast'],
    },
    // === 2025 Latest Models ===
    // DeepSeek-R1 Series (Reasoning Models)
    {
      id: 'deepseek-r1:1.5b',
      name: 'DeepSeek-R1 1.5B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description:
        'Latest reasoning model, excellent for complex problem solving',
      contextLength: 128000,
      capabilities: ['reasoning', 'math', 'analysis', 'fast'],
    },
    {
      id: 'deepseek-r1:7b',
      name: 'DeepSeek-R1 7B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description:
        'Advanced reasoning model with strong analytical capabilities',
      contextLength: 128000,
      capabilities: ['reasoning', 'math', 'analysis', 'code'],
    },
    {
      id: 'deepseek-r1:8b',
      name: 'DeepSeek-R1 8B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Balanced reasoning model for complex tasks',
      contextLength: 128000,
      capabilities: ['reasoning', 'math', 'analysis', 'code'],
    },
    {
      id: 'deepseek-r1:14b',
      name: 'DeepSeek-R1 14B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Large reasoning model with enhanced problem-solving',
      contextLength: 128000,
      capabilities: ['reasoning', 'math', 'analysis', 'code', 'complex'],
    },
    {
      id: 'deepseek-r1:32b',
      name: 'DeepSeek-R1 32B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Very large reasoning model for the most complex tasks',
      contextLength: 128000,
      capabilities: ['reasoning', 'math', 'analysis', 'code', 'complex'],
    },
    {
      id: 'deepseek-r1:70b',
      name: 'DeepSeek-R1 70B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Flagship reasoning model with exceptional capabilities',
      contextLength: 128000,
      capabilities: [
        'reasoning',
        'math',
        'analysis',
        'code',
        'complex',
        'research',
      ],
    },
    // Llama 3.3 Series (Latest Meta)
    {
      id: 'llama3.3:70b',
      name: 'Llama 3.3 70B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description:
        'Latest Meta model with improved performance and capabilities',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning', 'complex'],
    },
    // Qwen3 Series (Latest Alibaba)
    {
      id: 'qwen3:0.6b',
      name: 'Qwen3 0.6B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Ultra-fast small model for basic tasks',
      contextLength: 128000,
      capabilities: ['chat', 'fast', 'lightweight'],
    },
    {
      id: 'qwen3:1.7b',
      name: 'Qwen3 1.7B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Compact model with good performance',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'fast'],
    },
    {
      id: 'qwen3:4b',
      name: 'Qwen3 4B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Balanced small model for general use',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'qwen3:8b',
      name: 'Qwen3 8B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'High-performance 8B model with strong capabilities',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'qwen3:14b',
      name: 'Qwen3 14B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Large Qwen3 model for complex tasks',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning', 'complex'],
    },
    {
      id: 'qwen3:32b',
      name: 'Qwen3 32B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Very large Qwen3 model with advanced capabilities',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning', 'complex'],
    },
    // Gemma 3 Series (Latest Google)
    {
      id: 'gemma3:1b',
      name: 'Gemma 3 1B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Ultra-efficient small model from Google',
      contextLength: 8192,
      capabilities: ['chat', 'fast', 'lightweight'],
    },
    {
      id: 'gemma3:4b',
      name: 'Gemma 3 4B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Compact Google model with good performance',
      contextLength: 8192,
      capabilities: ['chat', 'code', 'fast'],
    },
    {
      id: 'gemma3:12b',
      name: 'Gemma 3 12B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Large Gemma model with enhanced capabilities',
      contextLength: 8192,
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'gemma3:27b',
      name: 'Gemma 3 27B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Flagship Gemma model for complex tasks',
      contextLength: 8192,
      capabilities: ['chat', 'code', 'reasoning', 'complex'],
    },
    // Phi-4 (Microsoft Reasoning)
    {
      id: 'phi4:14b',
      name: 'Phi-4 14B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description:
        "Microsoft's latest reasoning model with strong math capabilities",
      contextLength: 16384,
      capabilities: ['reasoning', 'math', 'analysis', 'code'],
    },
    // Additional Qwen2.5 variants
    {
      id: 'qwen2.5:0.5b',
      name: 'Qwen 2.5 0.5B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Ultra-lightweight model for basic tasks',
      contextLength: 128000,
      capabilities: ['chat', 'fast', 'lightweight'],
    },
    {
      id: 'qwen2.5:1.5b',
      name: 'Qwen 2.5 1.5B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Small but capable model for general use',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'fast'],
    },
    {
      id: 'qwen2.5:3b',
      name: 'Qwen 2.5 3B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Compact model with good balance of speed and capability',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'fast'],
    },
    {
      id: 'qwen2.5:72b',
      name: 'Qwen 2.5 72B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Largest Qwen 2.5 model for complex tasks',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning', 'complex'],
    },
    // Additional Qwen2.5-Coder variants
    {
      id: 'qwen2.5-coder:0.5b',
      name: 'Qwen 2.5 Coder 0.5B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Ultra-fast coding model for basic tasks',
      contextLength: 128000,
      capabilities: ['code', 'fast', 'lightweight'],
    },
    {
      id: 'qwen2.5-coder:1.5b',
      name: 'Qwen 2.5 Coder 1.5B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Small coding model with good performance',
      contextLength: 128000,
      capabilities: ['code', 'debugging', 'fast'],
    },
    {
      id: 'qwen2.5-coder:3b',
      name: 'Qwen 2.5 Coder 3B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Compact coding model for general development',
      contextLength: 128000,
      capabilities: ['code', 'debugging', 'fast'],
    },
    {
      id: 'qwen2.5-coder:7b',
      name: 'Qwen 2.5 Coder 7B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Balanced coding model for most development tasks',
      contextLength: 128000,
      capabilities: ['code', 'debugging', 'reasoning'],
    },
    {
      id: 'qwen2.5-coder:14b',
      name: 'Qwen 2.5 Coder 14B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Large coding model for complex development',
      contextLength: 128000,
      capabilities: ['code', 'debugging', 'reasoning', 'complex'],
    },
    // Llama 3.1 additional variants
    {
      id: 'llama3.1:8b',
      name: 'Llama 3.1 8B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Efficient Llama 3.1 model for general use',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'llama3.1:405b',
      name: 'Llama 3.1 405B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Massive Llama model for the most demanding tasks',
      contextLength: 128000,
      capabilities: ['chat', 'code', 'reasoning', 'complex', 'research'],
    },
    // Llama 3.2 additional variants
    {
      id: 'llama3.2:1b',
      name: 'Llama 3.2 1B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Ultra-efficient Llama model for edge computing',
      contextLength: 128000,
      capabilities: ['chat', 'fast', 'lightweight'],
    },
    // Code Llama variants
    {
      id: 'codellama:7b',
      name: 'Code Llama 7B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Specialized coding model based on Llama',
      contextLength: 16384,
      capabilities: ['code', 'debugging', 'generation'],
    },
    {
      id: 'codellama:13b',
      name: 'Code Llama 13B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Larger coding model with enhanced capabilities',
      contextLength: 16384,
      capabilities: ['code', 'debugging', 'generation', 'reasoning'],
    },
    {
      id: 'codellama:34b',
      name: 'Code Llama 34B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Large coding model for complex development tasks',
      contextLength: 16384,
      capabilities: ['code', 'debugging', 'generation', 'reasoning', 'complex'],
    },
    // StarCoder2 variants
    {
      id: 'starcoder2:3b',
      name: 'StarCoder2 3B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Latest code generation model from BigCode',
      contextLength: 16384,
      capabilities: ['code', 'generation', 'fast'],
    },
    {
      id: 'starcoder2:7b',
      name: 'StarCoder2 7B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Balanced StarCoder model for code generation',
      contextLength: 16384,
      capabilities: ['code', 'generation', 'debugging'],
    },
    {
      id: 'starcoder2:15b',
      name: 'StarCoder2 15B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Large StarCoder model for advanced code tasks',
      contextLength: 16384,
      capabilities: ['code', 'generation', 'debugging', 'complex'],
    },
    // Mixtral variants
    {
      id: 'mixtral:8x7b',
      name: 'Mixtral 8x7B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Mixture of experts model with 47B total parameters',
      contextLength: 32768,
      capabilities: ['chat', 'code', 'reasoning', 'complex'],
    },
    {
      id: 'mixtral:8x22b',
      name: 'Mixtral 8x22B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description:
        'Large mixture of experts model with exceptional capabilities',
      contextLength: 64000,
      capabilities: ['chat', 'code', 'reasoning', 'complex', 'research'],
    },
    // Vision Models
    {
      id: 'llava:7b',
      name: 'LLaVA 7B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Large Language and Vision Assistant for multimodal tasks',
      contextLength: 4096,
      capabilities: ['chat', 'vision', 'multimodal', 'analysis'],
    },
    {
      id: 'llava:13b',
      name: 'LLaVA 13B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Larger vision-language model with enhanced capabilities',
      contextLength: 4096,
      capabilities: ['chat', 'vision', 'multimodal', 'analysis', 'reasoning'],
    },
    {
      id: 'llava:34b',
      name: 'LLaVA 34B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Large vision-language model for complex visual tasks',
      contextLength: 4096,
      capabilities: [
        'chat',
        'vision',
        'multimodal',
        'analysis',
        'reasoning',
        'complex',
      ],
    },
    // SmolLM2 (Microsoft)
    {
      id: 'smollm2:135m',
      name: 'SmolLM2 135M',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Ultra-lightweight model for constrained environments',
      contextLength: 8192,
      capabilities: ['chat', 'fast', 'lightweight', 'edge'],
    },
    {
      id: 'smollm2:360m',
      name: 'SmolLM2 360M',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Small efficient model for basic tasks',
      contextLength: 8192,
      capabilities: ['chat', 'fast', 'lightweight'],
    },
    {
      id: 'smollm2:1.7b',
      name: 'SmolLM2 1.7B',
      provider: ProviderType.OLLAMA,
      category: 'local',
      description: 'Larger SmolLM model with better capabilities',
      contextLength: 8192,
      capabilities: ['chat', 'code', 'fast'],
    },
  ],

  [ProviderType.OPENAI]: [
    {
      id: 'o3',
      name: 'o3',
      provider: ProviderType.OPENAI,
      category: 'cloud',
      description:
        'Most intelligent model for complex reasoning and scientific tasks',
      contextLength: 1000000,
      pricing: { input: 20, output: 80, unit: '$/1M tokens' },
      capabilities: ['reasoning', 'complex', 'math', 'science', 'thinking'],
    },
    {
      id: 'o4-mini',
      name: 'o4 Mini',
      provider: ProviderType.OPENAI,
      category: 'cloud',
      description: 'Cost-efficient reasoning model with extended capabilities',
      contextLength: 200000,
      pricing: { input: 2, output: 8, unit: '$/1M tokens' },
      capabilities: ['reasoning', 'math', 'fast', 'cost-effective'],
    },
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      provider: ProviderType.OPENAI,
      category: 'cloud',
      description:
        'Latest GPT-4 with 1M token context and improved performance',
      contextLength: 1000000,
      pricing: { input: 2.5, output: 10, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'vision', 'reasoning', 'long-context'],
    },
    {
      id: 'gpt-4.1-nano',
      name: 'GPT-4.1 Nano',
      provider: ProviderType.OPENAI,
      category: 'cloud',
      description: 'Fastest and most cost-effective GPT-4.1 variant',
      contextLength: 1000000,
      pricing: { input: 0.1, output: 0.4, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'fast', 'cost-effective', 'long-context'],
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: ProviderType.OPENAI,
      category: 'cloud',
      description: 'Advanced multimodal model with vision capabilities',
      contextLength: 128000,
      pricing: { input: 2.5, output: 10, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'vision', 'reasoning', 'multimodal'],
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: ProviderType.OPENAI,
      category: 'cloud',
      description: 'Faster, more cost-effective GPT-4o model',
      contextLength: 128000,
      pricing: { input: 0.15, output: 0.6, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'fast', 'reasoning'],
    },
  ],

  [ProviderType.GEMINI]: [
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: ProviderType.GEMINI,
      category: 'cloud',
      description: 'State-of-the-art thinking model for complex reasoning',
      contextLength: 1000000,
      pricing: { input: 2.5, output: 10, unit: '$/1M tokens' },
      capabilities: [
        'chat',
        'code',
        'vision',
        'reasoning',
        'thinking',
        'long-context',
      ],
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: ProviderType.GEMINI,
      category: 'cloud',
      description: 'Fast and powerful next-gen model with improved performance',
      contextLength: 1000000,
      pricing: { input: 0.1, output: 0.4, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'vision', 'fast', 'multimodal'],
    },
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash Experimental',
      provider: ProviderType.GEMINI,
      category: 'cloud',
      description:
        'Latest experimental Gemini model (Limited non-English language support)',
      contextLength: 1000000,
      pricing: { input: 0.075, output: 0.3, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'vision', 'multimodal', 'fast'],
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: ProviderType.GEMINI,
      category: 'cloud',
      description: 'Advanced Gemini model with long context',
      contextLength: 2000000,
      pricing: { input: 1.25, output: 5, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'vision', 'reasoning', 'long-context'],
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: ProviderType.GEMINI,
      category: 'cloud',
      description:
        'Fast and efficient Gemini model (Recommended, full language support)',
      contextLength: 1000000,
      pricing: { input: 0.075, output: 0.3, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'fast', 'vision'],
    },
  ],

  // Removed unsupported GROQ provider

  [ProviderType.MISTRAL]: [
    {
      id: 'mistral-large-2411',
      name: 'Mistral Large 2411',
      provider: ProviderType.MISTRAL,
      category: 'cloud',
      description: '123B parameter model for complex reasoning and analysis',
      contextLength: 128000,
      pricing: { input: 2, output: 6, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning', 'complex', 'analysis'],
    },
    {
      id: 'codestral-25.01',
      name: 'Codestral 25.01',
      provider: ProviderType.MISTRAL,
      category: 'cloud',
      description: 'Latest coding model supporting 80+ programming languages',
      contextLength: 128000,
      pricing: { input: 0.25, output: 0.75, unit: '$/1M tokens' },
      capabilities: ['code', 'debugging', 'refactoring', 'generation'],
    },
    {
      id: 'mistral-medium-2505',
      name: 'Mistral Medium 3',
      provider: ProviderType.MISTRAL,
      category: 'cloud',
      description: 'Mid-tier model with balanced performance and cost',
      contextLength: 128000,
      pricing: { input: 1, output: 3, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'mistral-small-2503',
      name: 'Mistral Small 3.1',
      provider: ProviderType.MISTRAL,
      category: 'cloud',
      description: 'Efficient small model with improved tokenizer',
      contextLength: 128000,
      pricing: { input: 0.2, output: 0.6, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'fast', 'cost-effective'],
    },
    {
      id: 'devstral-small-2505',
      name: 'Devstral Small',
      provider: ProviderType.MISTRAL,
      category: 'cloud',
      description: 'Developer-focused model for software engineering tasks',
      contextLength: 128000,
      pricing: { input: 0.15, output: 0.45, unit: '$/1M tokens' },
      capabilities: ['code', 'debugging', 'development', 'fast'],
    },
  ],

  [ProviderType.ANTHROPIC]: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: ProviderType.ANTHROPIC,
      category: 'cloud',
      description: 'High-performance model with excellent coding and reasoning',
      contextLength: 200000,
      pricing: { input: 3, output: 15, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning', 'analysis', 'long-context'],
    },
    {
      id: 'claude-3-5-sonnet-20240620',
      name: 'Claude 3.5 Sonnet (Previous)',
      provider: ProviderType.ANTHROPIC,
      category: 'cloud',
      description: 'Previous version of Claude 3.5 Sonnet',
      contextLength: 200000,
      pricing: { input: 3, output: 15, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning', 'analysis', 'long-context'],
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: ProviderType.ANTHROPIC,
      category: 'cloud',
      description: 'Most powerful Claude model for complex tasks',
      contextLength: 200000,
      pricing: { input: 15, output: 75, unit: '$/1M tokens' },
      capabilities: [
        'chat',
        'code',
        'reasoning',
        'analysis',
        'complex',
        'long-context',
      ],
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: ProviderType.ANTHROPIC,
      category: 'cloud',
      description: 'Fast and cost-effective model',
      contextLength: 200000,
      pricing: { input: 0.8, output: 4, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'fast', 'cost-effective'],
    },
  ],

  [ProviderType.OPENROUTER]: [
    // Claude models via OpenRouter
    {
      id: 'anthropic/claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'High-performance Claude model via OpenRouter',
      contextLength: 200000,
      pricing: { input: 3, output: 15, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning', 'complex', 'analysis'],
    },
    {
      id: 'anthropic/claude-3-opus',
      name: 'Claude 3 Opus',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Most powerful Claude 3 model via OpenRouter',
      contextLength: 200000,
      pricing: { input: 15, output: 75, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning', 'complex', 'analysis'],
    },
    {
      id: 'anthropic/claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Balanced Claude 3 model via OpenRouter',
      contextLength: 200000,
      pricing: { input: 3, output: 15, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'anthropic/claude-3-haiku',
      name: 'Claude 3 Haiku',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Fast and efficient Claude model via OpenRouter',
      contextLength: 200000,
      pricing: { input: 0.25, output: 1.25, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'fast'],
    },
    // GPT models via OpenRouter
    {
      id: 'openai/gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Latest GPT-4 Turbo model via OpenRouter',
      contextLength: 128000,
      pricing: { input: 10, output: 30, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'vision', 'reasoning', 'complex'],
    },
    {
      id: 'openai/gpt-4',
      name: 'GPT-4',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Original GPT-4 model via OpenRouter',
      contextLength: 8192,
      pricing: { input: 30, output: 60, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning', 'complex'],
    },
    {
      id: 'openai/gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Fast and cost-effective GPT model via OpenRouter',
      contextLength: 16384,
      pricing: { input: 0.5, output: 1.5, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'fast', 'cost-effective'],
    },
    // Gemini models via OpenRouter
    {
      id: 'google/gemini-pro',
      name: 'Gemini Pro',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Google Gemini Pro model via OpenRouter',
      contextLength: 128000,
      pricing: { input: 0.125, output: 0.375, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'google/gemini-pro-vision',
      name: 'Gemini Pro Vision',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Multimodal Gemini model via OpenRouter',
      contextLength: 128000,
      pricing: { input: 0.125, output: 0.375, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'vision', 'multimodal'],
    },
    // Mistral models via OpenRouter
    {
      id: 'mistralai/mistral-large',
      name: 'Mistral Large',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Largest Mistral model via OpenRouter',
      contextLength: 32000,
      pricing: { input: 2, output: 6, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning', 'complex'],
    },
    {
      id: 'mistralai/mixtral-8x7b-instruct',
      name: 'Mixtral 8x7B Instruct',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Mixture of experts model via OpenRouter',
      contextLength: 32768,
      pricing: { input: 0.24, output: 0.24, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'mistralai/mistral-7b-instruct',
      name: 'Mistral 7B Instruct',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Efficient Mistral model via OpenRouter',
      contextLength: 32768,
      pricing: { input: 0.06, output: 0.06, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'fast', 'cost-effective'],
    },
    // Meta models via OpenRouter
    {
      id: 'meta-llama/llama-2-70b-chat',
      name: 'Llama 2 70B Chat',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Large Llama 2 model via OpenRouter',
      contextLength: 4096,
      pricing: { input: 0.7, output: 0.9, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning'],
    },
    {
      id: 'meta-llama/codellama-34b-instruct',
      name: 'Code Llama 34B Instruct',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Specialized coding model via OpenRouter',
      contextLength: 16384,
      pricing: { input: 0.4, output: 0.4, unit: '$/1M tokens' },
      capabilities: ['code', 'debugging', 'generation', 'refactoring'],
    },
    // Other specialized models
    {
      id: 'nous-hermes-2-mixtral-8x7b-dpo',
      name: 'Nous Hermes 2 Mixtral 8x7B DPO',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Fine-tuned Mixtral model via OpenRouter',
      contextLength: 32768,
      pricing: { input: 0.27, output: 0.27, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning', 'instruction-following'],
    },
    {
      id: 'phind/phind-codellama-34b',
      name: 'Phind CodeLlama 34B',
      provider: ProviderType.OPENROUTER,
      category: 'cloud',
      description: 'Phind-optimized coding model via OpenRouter',
      contextLength: 16384,
      pricing: { input: 0.4, output: 0.4, unit: '$/1M tokens' },
      capabilities: ['code', 'debugging', 'generation', 'search'],
    },
  ],
};

export function getModelsForProvider(providerType: ProviderType): ModelInfo[] {
  return MODEL_REGISTRY[providerType] || [];
}

export function getAllModels(): ModelInfo[] {
  return Object.values(MODEL_REGISTRY).flat();
}

export function getLocalModels(): ModelInfo[] {
  return getAllModels().filter((model) => model.category === 'local');
}

export function getCloudModels(): ModelInfo[] {
  return getAllModels().filter((model) => model.category === 'cloud');
}

export function getModelsByCapability(capability: string): ModelInfo[] {
  return getAllModels().filter((model) =>
    model.capabilities.includes(capability),
  );
}

export function findModel(modelId: string): ModelInfo | undefined {
  return getAllModels().find((model) => model.id === modelId);
}

export function findModelByPartialMatch(partialId: string): ModelInfo[] {
  const searchTerm = partialId.toLowerCase();
  return getAllModels().filter(
    (model) =>
      model.id.toLowerCase().includes(searchTerm) ||
      model.name.toLowerCase().includes(searchTerm),
  );
}

export function getRecommendedModelsForTask(
  task: 'code' | 'chat' | 'reasoning' | 'fast',
): ModelInfo[] {
  return getAllModels()
    .filter((model) => model.capabilities.includes(task))
    .sort((a, b) => {
      // Prioritize by category (local first), then by context length
      if (a.category !== b.category) {
        return a.category === 'local' ? -1 : 1;
      }
      return b.contextLength - a.contextLength;
    })
    .slice(0, 5);
}

export function validateModelCompatibility(
  modelId: string,
  providerType: ProviderType,
): boolean {
  const model = findModel(modelId);
  if (model) {
    return model.provider === providerType;
  }

  // For Ollama, allow any model that follows naming patterns
  if (providerType === ProviderType.OLLAMA) {
    return isValidOllamaModelPattern(modelId);
  }

  return false;
}

export function isValidOllamaModelPattern(modelId: string): boolean {
  // Common Ollama model patterns
  const patterns = [
    /^[a-zA-Z0-9_-]+:[a-zA-Z0-9._-]+$/, // family:version (e.g., llama3.2:8b)
    /^[a-zA-Z0-9_-]+:[a-zA-Z0-9._-]+-[a-zA-Z0-9._-]+$/, // family:version-variant (e.g., llama3.2:8b-instruct)
    /^[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]+:[a-zA-Z0-9._-]+$/, // family-variant:version (e.g., qwen2.5-coder:32b)
    /^[a-zA-Z0-9_-]+$/, // simple name (e.g., codellama)
  ];

  return patterns.some((pattern) => pattern.test(modelId));
}

export function getProviderModels(
  providerType: ProviderType,
  includeExperimental: boolean = false,
): ModelInfo[] {
  const models = getModelsForProvider(providerType);
  if (!includeExperimental) {
    return models.filter(
      (model) => !model.capabilities.includes('experimental'),
    );
  }
  return models;
}

export function inferModelCapabilities(modelId: string): string[] {
  const capabilities: string[] = ['chat']; // Base capability
  const modelLower = modelId.toLowerCase();

  // Reasoning models
  if (
    modelLower.includes('r1') ||
    modelLower.includes('phi4') ||
    modelLower.includes('o3')
  ) {
    capabilities.push('reasoning', 'math', 'analysis');
  }

  // Coding models
  if (
    modelLower.includes('coder') ||
    modelLower.includes('code') ||
    modelLower.includes('star')
  ) {
    capabilities.push('code', 'debugging', 'generation');
  }

  // Vision models
  if (
    modelLower.includes('llava') ||
    modelLower.includes('vl') ||
    modelLower.includes('vision')
  ) {
    capabilities.push('vision', 'multimodal', 'analysis');
  }

  // Size-based capabilities
  const sizeMatch = modelId.match(/(\d+\.?\d*)([bm])/i);
  if (sizeMatch) {
    const size = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toLowerCase();

    if (unit === 'm' || (unit === 'b' && size < 1)) {
      capabilities.push('fast', 'lightweight', 'edge');
    } else if (unit === 'b') {
      if (size < 3) {
        capabilities.push('fast', 'lightweight');
      } else if (size < 10) {
        capabilities.push('fast');
      } else if (size > 30) {
        capabilities.push('complex');
        if (size > 70) {
          capabilities.push('research');
        }
      }
    }
  }

  return capabilities;
}

export function createDynamicModelInfo(
  modelId: string,
  providerType: ProviderType,
): ModelInfo {
  const capabilities = inferModelCapabilities(modelId);

  // Infer context length based on model family
  let contextLength = 4096; // Default
  const modelLower = modelId.toLowerCase();

  if (modelLower.includes('qwen') || modelLower.includes('llama3')) {
    contextLength = 128000;
  } else if (modelLower.includes('mixtral')) {
    contextLength = modelId.includes('8x22b') ? 64000 : 32768;
  } else if (modelLower.includes('gemma')) {
    contextLength = 8192;
  } else if (modelLower.includes('phi')) {
    contextLength = 16384;
  }

  return {
    id: modelId,
    name:
      modelId.charAt(0).toUpperCase() + modelId.slice(1).replace(/[:-]/g, ' '),
    provider: providerType,
    category: providerType === ProviderType.OLLAMA ? 'local' : 'cloud',
    description: `Dynamically detected ${modelId} model`,
    contextLength,
    capabilities,
  };
}
