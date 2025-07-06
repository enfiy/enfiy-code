/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Modifications Copyright 2025 The Enfiy Community Contributors
 *
 * This file has been modified from its original version by contributors
 * to the Enfiy Community project.
 */

// Default local AI model (Ollama)
export const DEFAULT_LOCAL_MODEL = 'llama3.2:8b';
export const DEFAULT_LOCAL_PROVIDER = 'ollama';

// Fallback cloud models (keep Gemini names as they refer to actual Google AI models)
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-pro';
export const DEFAULT_GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

// Enfiy equivalents for backward compatibility
export const DEFAULT_ENFIY_FLASH_MODEL = DEFAULT_GEMINI_FLASH_MODEL;
export const DEFAULT_ENFIY_EMBEDDING_MODEL = DEFAULT_GEMINI_EMBEDDING_MODEL;

// Primary default (local first)
export const DEFAULT_ENFIY_MODEL = DEFAULT_LOCAL_MODEL;
export const DEFAULT_ENFIY_PROVIDER = DEFAULT_LOCAL_PROVIDER;
