#!/usr/bin/env node

import { execSync } from 'child_process';

try {
  execSync('prettier --write .', {
    stdio: ['inherit', 'pipe', 'pipe'],
    encoding: 'utf8'
  });
} catch (error) {
  // Only show actual errors, not warnings or info
  if (error.status !== 0) {
    console.error('Formatting failed:', error.message);
    process.exit(error.status);
  }
}