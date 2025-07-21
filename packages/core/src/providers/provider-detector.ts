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

export interface DetectedProvider {
  type: ProviderType;
  available: boolean;
  defaultModel?: string;
  reason?: string;
}

/**
 * Detect availability of local AI providers
 */
export async function detectLocalProviders(): Promise<DetectedProvider[]> {
  const providers: DetectedProvider[] = [];

  // Detect Ollama
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      const hasModels = data.models && data.models.length > 0;
      providers.push({
        type: ProviderType.OLLAMA,
        available: hasModels,
        defaultModel: hasModels ? 'llama3.2:8b' : undefined,
        reason: hasModels ? 'Installed with models' : 'Installed but no models',
      });
    }
  } catch {
    providers.push({
      type: ProviderType.OLLAMA,
      available: false,
      reason: 'Not installed',
    });
  }

  return providers;
}

/**
 * Check configuration status of cloud AI providers
 */
export function detectCloudProviders(): DetectedProvider[] {
  const providers: DetectedProvider[] = [];

  // OpenAI
  providers.push({
    type: ProviderType.OPENAI,
    available: !!process.env.OPENAI_API_KEY,
    defaultModel: 'gpt-4o-mini',
    reason: process.env.OPENAI_API_KEY
      ? 'API key configured'
      : 'API key required',
  });

  // Gemini
  providers.push({
    type: ProviderType.GEMINI,
    available: !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY),
    defaultModel: 'gemini-2.0-flash-exp',
    reason:
      process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
        ? 'API key configured'
        : 'API key required',
  });

  // Mistral
  providers.push({
    type: ProviderType.MISTRAL,
    available: !!process.env.MISTRAL_API_KEY,
    defaultModel: 'mistral-large-2411',
    reason: process.env.MISTRAL_API_KEY
      ? 'API key configured'
      : 'API key required',
  });

  // Anthropic
  providers.push({
    type: ProviderType.ANTHROPIC,
    available: !!process.env.ANTHROPIC_API_KEY,
    defaultModel: 'claude-3-5-sonnet-20241022',
    reason: process.env.ANTHROPIC_API_KEY
      ? 'API key configured'
      : 'API key required',
  });

  // OpenRouter
  providers.push({
    type: ProviderType.OPENROUTER,
    available: !!process.env.OPENROUTER_API_KEY,
    defaultModel: 'anthropic/claude-3.5-sonnet',
    reason: process.env.OPENROUTER_API_KEY
      ? 'API key configured'
      : 'API key required',
  });

  return providers;
}

/**
 * Select the optimal default provider
 */
export async function getRecommendedProvider(): Promise<DetectedProvider> {
  // First check local providers
  const localProviders = await detectLocalProviders();
  const availableLocal = localProviders.find((p) => p.available);

  if (availableLocal) {
    return availableLocal;
  }

  // If local is not available, check cloud providers
  const cloudProviders = detectCloudProviders();
  const availableCloud = cloudProviders.find((p) => p.available);

  if (availableCloud) {
    return availableCloud;
  }

  // If neither is available, recommend Ollama as default
  return {
    type: ProviderType.OLLAMA,
    available: false,
    defaultModel: 'llama3.2:8b',
    reason: 'Recommend installing Ollama',
  };
}

/**
 * プロバイダー状況の詳細レポートを生成
 */
export async function generateProviderReport(): Promise<string> {
  const localProviders = await detectLocalProviders();
  const cloudProviders = detectCloudProviders();

  let report = '[DETECTION] AI Provider Detection Results:\n\n';

  report += '[LOCAL] Local AI:\n';
  for (const provider of localProviders) {
    const status = provider.available ? '[OK]' : '[FAIL]';
    report += `  ${status} ${provider.type.toUpperCase()}: ${provider.reason}\n`;
  }

  report += '\n[CLOUD] Cloud AI:\n';
  for (const provider of cloudProviders) {
    const status = provider.available ? '[OK]' : '[FAIL]';
    report += `  ${status} ${provider.type.toUpperCase()}: ${provider.reason}\n`;
  }

  const recommended = await getRecommendedProvider();
  report += `\n[RECOMMENDED] ${recommended.type.toUpperCase()}`;
  if (recommended.defaultModel) {
    report += ` (${recommended.defaultModel})`;
  }
  report += `\n   Reason: ${recommended.reason}`;

  return report;
}
