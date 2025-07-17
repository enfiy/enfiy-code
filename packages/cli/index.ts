#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import './src/enfiy.js';
import { main } from './src/enfiy.js';

// --- Global Entry Point ---
main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Handle different types of errors gracefully
  if (errorMessage.includes('No input provided via stdin')) {
    // This is normal when running in interactive mode
    return;
  }

  if (
    errorMessage.includes('Requested entity was not found') ||
    errorMessage.includes('404') ||
    errorMessage.includes('API key') ||
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Invalid auth method selected')
  ) {
    console.error('Configuration Error:', errorMessage);
    console.error(
      'Please run the CLI and use /provider command to set up your AI provider.',
    );
    return; // Don't exit, let the interactive UI handle this
  }

  // For truly critical errors that prevent startup
  console.error('Critical Error:', errorMessage);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
