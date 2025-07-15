/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { ProviderType } from './types.js';
/**
 * Detect availability of local AI providers
 */
export async function detectLocalProviders() {
  const providers = [];
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
  // Detect vLLM (default port: 8000)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch('http://localhost:8000/v1/models', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      providers.push({
        type: ProviderType.VLLM,
        available: true,
        defaultModel: 'local-model',
        reason: 'Running',
      });
    }
  } catch {
    providers.push({
      type: ProviderType.VLLM,
      available: false,
      reason: 'Not running',
    });
  }
  return providers;
}
/**
 * Check configuration status of cloud AI providers
 */
export function detectCloudProviders() {
  const providers = [];
  // OpenAI
  providers.push({
    type: ProviderType.OPENAI,
    available: !!process.env.OPENAI_API_KEY,
    defaultModel: 'gpt-4o-mini',
    reason: process.env.OPENAI_API_KEY
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
  return providers;
}
/**
 * Select the optimal default provider
 */
export async function getRecommendedProvider() {
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
export async function generateProviderReport() {
  const localProviders = await detectLocalProviders();
  const cloudProviders = detectCloudProviders();
  let report = '🔍 AI プロバイダー検出結果:\n\n';
  report += '🏠 ローカルAI:\n';
  for (const provider of localProviders) {
    const status = provider.available ? '✅' : '❌';
    report += `  ${status} ${provider.type.toUpperCase()}: ${provider.reason}\n`;
  }
  report += '\n☁️ クラウドAI:\n';
  for (const provider of cloudProviders) {
    const status = provider.available ? '✅' : '❌';
    report += `  ${status} ${provider.type.toUpperCase()}: ${provider.reason}\n`;
  }
  const recommended = await getRecommendedProvider();
  report += `\n🎯 推奨: ${recommended.type.toUpperCase()}`;
  if (recommended.defaultModel) {
    report += ` (${recommended.defaultModel})`;
  }
  report += `\n   理由: ${recommended.reason}`;
  return report;
}
//# sourceMappingURL=provider-detector.js.map
