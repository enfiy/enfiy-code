/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { AuthType } from '@enfiy/core';
import { loadEnvironment } from './config.js';

export const validateAuthMethod = (authMethod: string): string | null => {
  loadEnvironment();

  // For Enfiy Code, support various authentication types
  if (
    authMethod === AuthType.API_KEY ||
    authMethod === AuthType.USE_GEMINI ||
    authMethod === AuthType.USE_VERTEX_AI ||
    authMethod === 'api-key' ||
    authMethod === 'local'
  ) {
    // For Enfiy, we don't require environment variables since we use secure storage
    // Just validate that it's a supported auth method
    return null;
  }

  return 'Invalid auth method selected.';
};
