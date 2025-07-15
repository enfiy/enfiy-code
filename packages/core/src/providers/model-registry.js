/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { ProviderType } from './types.js';
export const MODEL_REGISTRY = {
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
  [ProviderType.ANTHROPIC]: [
    {
      id: 'claude-opus-4',
      name: 'Claude Opus 4',
      provider: ProviderType.ANTHROPIC,
      category: 'cloud',
      description:
        'Most powerful Claude model, excellent for complex coding (72.5% SWE-bench)',
      contextLength: 200000,
      pricing: { input: 15, output: 75, unit: '$/1M tokens' },
      capabilities: [
        'chat',
        'code',
        'reasoning',
        'complex',
        'thinking',
        'computer-use',
      ],
    },
    {
      id: 'claude-sonnet-4',
      name: 'Claude Sonnet 4',
      provider: ProviderType.ANTHROPIC,
      category: 'cloud',
      description:
        'Advanced coding model with improved capabilities (72.7% SWE-bench)',
      contextLength: 200000,
      pricing: { input: 3, output: 15, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning', 'thinking', 'computer-use'],
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: ProviderType.ANTHROPIC,
      category: 'cloud',
      description: 'High-performance Claude model with excellent reasoning',
      contextLength: 200000,
      pricing: { input: 3, output: 15, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'reasoning', 'complex', 'analysis'],
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: ProviderType.ANTHROPIC,
      category: 'cloud',
      description: 'Fast and efficient Claude model',
      contextLength: 200000,
      pricing: { input: 0.25, output: 1.25, unit: '$/1M tokens' },
      capabilities: ['chat', 'code', 'fast'],
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
      id: 'mistral-large-24.11',
      name: 'Mistral Large 24.11',
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
};
export function getModelsForProvider(providerType) {
  return MODEL_REGISTRY[providerType] || [];
}
export function getAllModels() {
  return Object.values(MODEL_REGISTRY).flat();
}
export function getLocalModels() {
  return getAllModels().filter((model) => model.category === 'local');
}
export function getCloudModels() {
  return getAllModels().filter((model) => model.category === 'cloud');
}
export function getModelsByCapability(capability) {
  return getAllModels().filter((model) =>
    model.capabilities.includes(capability),
  );
}
export function findModel(modelId) {
  return getAllModels().find((model) => model.id === modelId);
}
//# sourceMappingURL=model-registry.js.map
