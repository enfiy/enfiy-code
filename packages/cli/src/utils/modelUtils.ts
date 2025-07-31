/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { ProviderType } from '@enfiy/core';

/**
 * Convert provider string to ProviderType enum
 */
function getProviderTypeFromString(
  providerString: string,
): ProviderType | null {
  const normalized = providerString.toLowerCase();

  switch (normalized) {
    case 'openrouter':
      return ProviderType.OPENROUTER;
    case 'openai':
      return ProviderType.OPENAI;
    case 'gemini':
    case 'google':
      return ProviderType.GEMINI;
    case 'mistral':
    case 'mistralai':
      return ProviderType.MISTRAL;
    case 'anthropic':
      return ProviderType.ANTHROPIC;
    case 'ollama':
      return ProviderType.OLLAMA;
    default:
      return null;
  }
}

/**
 * Determine the provider type from a model name, optionally with provider context
 */
export function getProviderFromModel(
  modelName: string,
  providerContext?: string,
): ProviderType | null {
  if (!modelName) return null;

  // If provider context is provided, use it first
  if (providerContext) {
    const contextProvider = getProviderTypeFromString(providerContext);
    if (contextProvider) {
      return contextProvider;
    }
  }

  // Normalize model name for matching
  const normalizedModel = modelName.toLowerCase();

  // OpenRouter models (check for OpenRouter-specific patterns or provider prefixes first)
  if (
    normalizedModel.includes('openrouter') ||
    normalizedModel.includes('anthropic/') ||
    normalizedModel.includes('openai/') ||
    normalizedModel.includes('google/') ||
    normalizedModel.includes('mistralai/') ||
    normalizedModel.includes('meta-llama/') ||
    normalizedModel.includes('cognitivecomputations/') ||
    normalizedModel.includes('huggingfaceh4/') ||
    normalizedModel.includes('nousresearch/') ||
    normalizedModel.includes('teknium/') ||
    normalizedModel.includes('gryphe/') ||
    normalizedModel.includes('undi95/') ||
    normalizedModel.includes('alpindale/') ||
    normalizedModel.includes('neversleep/') ||
    normalizedModel.includes('sao10k/') ||
    normalizedModel.includes('lizpreciatior/') ||
    normalizedModel.includes('qwen/') ||
    normalizedModel.includes('nvidia/') ||
    normalizedModel.includes('liquid/') ||
    normalizedModel.includes('deepseek/') ||
    normalizedModel.includes('x-ai/')
  ) {
    return ProviderType.OPENROUTER;
  }

  // Google Gemini models (only for non-prefixed models to avoid conflicts with OpenRouter)
  if (normalizedModel.includes('gemini') && !normalizedModel.includes('/')) {
    return ProviderType.GEMINI;
  }

  // OpenAI GPT models
  if (normalizedModel.includes('gpt')) {
    return ProviderType.OPENAI;
  }

  // Local models (Ollama, etc.) - Check first to catch Ollama variants
  if (
    normalizedModel.includes('llama') ||
    normalizedModel.includes('phi') ||
    normalizedModel.includes('qwen') ||
    normalizedModel.includes('deepseek') ||
    normalizedModel.includes('ollama') ||
    normalizedModel.includes('codellama') ||
    normalizedModel.includes('mistral:') || // Ollama Mistral variant
    normalizedModel.includes(':latest') || // Any model with :latest tag is likely Ollama
    normalizedModel.includes('vicuna') ||
    normalizedModel.includes('alpaca') ||
    normalizedModel.includes('orca') ||
    normalizedModel.includes('wizardcoder') ||
    normalizedModel.includes('starcoder') ||
    normalizedModel.includes('falcon') ||
    normalizedModel.includes('mpt') ||
    normalizedModel.includes('dolly') ||
    normalizedModel.includes('stablelm') ||
    normalizedModel.includes('yi:') ||
    normalizedModel.includes('solar:') ||
    normalizedModel.includes('neural-chat') ||
    normalizedModel.includes('zephyr') ||
    normalizedModel.includes('openchat') ||
    normalizedModel.includes('starling') ||
    normalizedModel.includes('samantha') ||
    normalizedModel.includes('tinyllama') ||
    normalizedModel.includes('gemma') ||
    normalizedModel.includes('nous-hermes') ||
    normalizedModel.includes('dolphin')
  ) {
    return ProviderType.OLLAMA;
  }

  // Mistral models (cloud) - Check after Ollama to avoid conflicts
  if (normalizedModel.includes('mistral') && !normalizedModel.includes(':')) {
    return ProviderType.MISTRAL;
  }

  // Anthropic models
  if (normalizedModel.includes('claude')) {
    return ProviderType.ANTHROPIC;
  }

  return null;
}

/**
 * Check if a model is a local model that doesn't require API keys
 */
export function isLocalModel(modelName: string): boolean {
  if (!modelName) return false;

  const provider = getProviderFromModel(modelName);
  return provider === ProviderType.OLLAMA;
}

/**
 * Check if a model is a cloud model that requires API keys
 */
export function isCloudModel(modelName: string): boolean {
  if (!modelName) return false;

  const provider = getProviderFromModel(modelName);
  return provider !== null && provider !== ProviderType.OLLAMA && true;
}

/**
 * Get the display name for a provider
 */
export function getProviderDisplayName(provider: ProviderType): string {
  switch (provider) {
    case ProviderType.OPENAI:
      return 'OpenAI';
    case ProviderType.GEMINI:
      return 'Gemini';
    case ProviderType.MISTRAL:
      return 'Mistral';
    case ProviderType.ANTHROPIC:
      return 'Anthropic';
    case ProviderType.OPENROUTER:
      return 'OpenRouter';
    case ProviderType.OLLAMA:
      return 'Ollama';
    default: {
      // This should never happen if all enum cases are handled
      const _exhaustiveCheck: never = provider;
      return 'Unknown';
    }
  }
}

/**
 * Get provider display name from model name with optional provider context
 */
export function getProviderDisplayNameFromModel(
  modelName: string,
  providerContext?: string,
): string {
  const provider = getProviderFromModel(modelName, providerContext);
  return provider ? getProviderDisplayName(provider) : '';
}
