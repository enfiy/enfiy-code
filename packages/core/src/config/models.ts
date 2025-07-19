/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Default local AI model (Ollama)
export const DEFAULT_LOCAL_MODEL = 'llama3.2:8b';
export const DEFAULT_LOCAL_PROVIDER = 'ollama';

// Default cloud models for each provider
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-pro';
export const DEFAULT_GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

export const DEFAULT_OPENAI_MODEL = 'gpt-4o';
export const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';
export const DEFAULT_MISTRAL_MODEL = 'mistral-large-24.11';
export const DEFAULT_HUGGINGFACE_MODEL =
  'meta-llama/Meta-Llama-3.1-8B-Instruct';

// Enfiy equivalents for backward compatibility
export const DEFAULT_ENFIY_FLASH_MODEL = DEFAULT_GEMINI_FLASH_MODEL;
export const DEFAULT_ENFIY_EMBEDDING_MODEL = DEFAULT_GEMINI_EMBEDDING_MODEL;

// Primary default (cloud first for better user experience)
export const DEFAULT_ENFIY_MODEL = DEFAULT_GEMINI_MODEL;
export const DEFAULT_ENFIY_PROVIDER = 'gemini';

// Helper function to get default model for a provider
export function getDefaultModelForProvider(provider: string): string {
  switch (provider.toLowerCase()) {
    case 'openai':
      return DEFAULT_OPENAI_MODEL;
    case 'anthropic':
      return DEFAULT_ANTHROPIC_MODEL;
    case 'gemini':
    case 'google':
      return DEFAULT_GEMINI_MODEL;
    case 'mistral':
      return DEFAULT_MISTRAL_MODEL;
    case 'huggingface':
    case 'hf':
      return DEFAULT_HUGGINGFACE_MODEL;
    case 'ollama':
      return DEFAULT_LOCAL_MODEL;
    default:
      return DEFAULT_ENFIY_MODEL;
  }
}

// Helper function to get provider from model name
export function getProviderFromModel(model: string): string {
  const modelLower = model.toLowerCase();
  
  // OpenAI models
  if (modelLower.includes('gpt') || modelLower.includes('o3') || modelLower.includes('o4')) {
    return 'openai';
  }
  
  // Anthropic models
  if (modelLower.includes('claude')) {
    return 'anthropic';
  }
  
  // Gemini models
  if (modelLower.includes('gemini')) {
    return 'gemini';
  }
  
  // Mistral models
  if (modelLower.includes('mistral') || modelLower.includes('codestral') || modelLower.includes('devstral')) {
    return 'mistral';
  }
  
  // Ollama models - identified by colon notation (e.g., llama3.2:8b, qwen2.5:7b)
  // or common local model names
  if (modelLower.includes(':') || 
      modelLower.includes('llama') || 
      modelLower.includes('qwen') || 
      modelLower.includes('deepseek') ||
      modelLower.includes('phi') ||
      modelLower.includes('vicuna') ||
      modelLower.includes('orca') ||
      modelLower.includes('neural') ||
      modelLower.includes('codellama')) {
    return 'ollama';
  }
  
  // HuggingFace models - models with slash notation
  if (model.includes('/')) {
    return 'huggingface';
  }
  
  return 'gemini'; // Default provider
}

// Check if model and provider are compatible
export function isModelProviderCompatible(model: string, provider: string): boolean {
  const expectedProvider = getProviderFromModel(model);
  return expectedProvider === provider.toLowerCase();
}

// Get compatible model for provider if current model is incompatible
export function getCompatibleModel(model: string, provider: string): string {
  if (isModelProviderCompatible(model, provider)) {
    return model;
  }
  return getDefaultModelForProvider(provider);
}
