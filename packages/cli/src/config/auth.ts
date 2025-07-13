/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '@enfiy/core';
import { loadEnvironment } from './config.js';

export const validateAuthMethod = (authMethod: string): string | null => {
  loadEnvironment();
  
  // For Enfiy Code, all auth types map to API_KEY authentication
  if (authMethod === AuthType.API_KEY || 
      authMethod === AuthType.LOGIN_WITH_GOOGLE_PERSONAL ||
      authMethod === AuthType.USE_GEMINI ||
      authMethod === AuthType.USE_VERTEX_AI ||
      authMethod === 'api-key') {
    
    // For Enfiy, we don't require environment variables since we use secure storage
    // Just validate that it's a supported auth method
    return null;
  }

  return 'Invalid auth method selected.';
};
