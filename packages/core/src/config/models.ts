/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
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
export const DEFAULT_HUGGINGFACE_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';

// Enfiy equivalents for backward compatibility
export const DEFAULT_ENFIY_FLASH_MODEL = DEFAULT_GEMINI_FLASH_MODEL;
export const DEFAULT_ENFIY_EMBEDDING_MODEL = DEFAULT_GEMINI_EMBEDDING_MODEL;

// Primary default (local first)
export const DEFAULT_ENFIY_MODEL = DEFAULT_LOCAL_MODEL;
export const DEFAULT_ENFIY_PROVIDER = DEFAULT_LOCAL_PROVIDER;

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
