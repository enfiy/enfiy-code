#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Run tests in isolation from real user settings files
 */

/* eslint-env node */
/* eslint no-undef: 0 */
/* eslint no-console: 0 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const settingsPath = path.join(os.homedir(), '.enfiy', 'settings.json');
const backupPath = settingsPath + '.test-backup';

let settingsBackedUp = false;

function backupSettings() {
  if (fs.existsSync(settingsPath)) {
    fs.renameSync(settingsPath, backupPath);
    settingsBackedUp = true;
    console.log('Backed up user settings for test isolation');
  }
}

function restoreSettings() {
  if (settingsBackedUp && fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, settingsPath);
    console.log('Restored user settings');
  }
}

// Set up cleanup on exit
process.on('exit', restoreSettings);
process.on('SIGINT', () => {
  restoreSettings();
  process.exit(0);
});
process.on('SIGTERM', () => {
  restoreSettings();
  process.exit(0);
});

try {
  backupSettings();

  // Run the tests with all arguments passed through
  const args = process.argv.slice(2);
  const command = ['vitest', 'run', ...args].join(' ');

  execSync(command, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
} catch (error) {
  console.error('Test execution failed:', error.message);
  process.exit(1);
} finally {
  restoreSettings();
}
