/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export let ProviderType;
(function (ProviderType) {
  // Local AI Providers
  ProviderType['OLLAMA'] = 'ollama';
  ProviderType['HUGGINGFACE'] = 'huggingface';
  ProviderType['VLLM'] = 'vllm';
  // Cloud AI Providers
  ProviderType['OPENAI'] = 'openai';
  ProviderType['ANTHROPIC'] = 'anthropic';
  ProviderType['GEMINI'] = 'gemini';
  ProviderType['MISTRAL'] = 'mistral';
})(ProviderType || (ProviderType = {}));
//# sourceMappingURL=types.js.map
