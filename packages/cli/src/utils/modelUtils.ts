/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProviderType } from '@enfiy/core';

/**
 * Determine the provider type from a model name
 */
export function getProviderFromModel(modelName: string): ProviderType | null {
  if (!modelName) return null;

  // Normalize model name for matching
  const normalizedModel = modelName.toLowerCase();

  // OpenRouter models (check for OpenRouter-specific patterns or provider prefixes first)
  if (normalizedModel.includes('openrouter') || 
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
      normalizedModel.includes('x-ai/')) {
    return ProviderType.OPENROUTER;
  }

  // Anthropic Claude models (but not OpenRouter anthropic/ prefixed models)
  if (normalizedModel.includes('claude') || normalizedModel.includes('anthropic')) {
    return ProviderType.ANTHROPIC;
  }

  // Google Gemini models
  if (normalizedModel.includes('gemini')) {
    return ProviderType.GEMINI;
  }

  // OpenAI GPT models
  if (normalizedModel.includes('gpt')) {
    return ProviderType.OPENAI;
  }

  // Mistral models
  if (normalizedModel.includes('mistral')) {
    return ProviderType.MISTRAL;
  }

  // HuggingFace models
  if (normalizedModel.includes('huggingface') || normalizedModel.includes('hf/')) {
    return ProviderType.HUGGINGFACE;
  }

  // Local models (Ollama, etc.)
  if (normalizedModel.includes('llama') || 
      normalizedModel.includes('phi') || 
      normalizedModel.includes('qwen') ||
      normalizedModel.includes('deepseek') ||
      normalizedModel.includes('ollama') ||
      normalizedModel.includes('codellama') ||
      normalizedModel.includes('mistral:') ||  // Ollama Mistral variant
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
      normalizedModel.includes('dolphin')) {
    return ProviderType.OLLAMA;
  }

  return null;
}

/**
 * Check if a model is a local model that doesn't require API keys
 */
export function isLocalModel(modelName: string): boolean {
  if (!modelName) return false;

  const provider = getProviderFromModel(modelName);
  return provider === ProviderType.OLLAMA || provider === ProviderType.VLLM;
}

/**
 * Check if a model is a cloud model that requires API keys
 */
export function isCloudModel(modelName: string): boolean {
  if (!modelName) return false;

  const provider = getProviderFromModel(modelName);
  return provider !== null && provider !== ProviderType.OLLAMA && provider !== ProviderType.VLLM;
}

/**
 * Get the display name for a provider
 */
export function getProviderDisplayName(provider: ProviderType): string {
  switch (provider) {
    case ProviderType.ANTHROPIC:
      return 'Anthropic';
    case ProviderType.OPENAI:
      return 'OpenAI';
    case ProviderType.GEMINI:
      return 'Gemini';
    case ProviderType.MISTRAL:
      return 'Mistral';
    case ProviderType.OPENROUTER:
      return 'OpenRouter';
    case ProviderType.HUGGINGFACE:
      return 'HuggingFace';
    case ProviderType.OLLAMA:
      return 'Ollama';
    case ProviderType.VLLM:
      return 'vLLM';
    default: {
      // This should never happen if all enum cases are handled
      const _exhaustiveCheck: never = provider;
      return 'Unknown';
    }
  }
}

/**
 * Get provider display name from model name
 */
export function getProviderDisplayNameFromModel(modelName: string): string {
  const provider = getProviderFromModel(modelName);
  return provider ? getProviderDisplayName(provider) : '';
}