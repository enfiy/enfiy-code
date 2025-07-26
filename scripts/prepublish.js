/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import fs from 'fs';
import path from 'path';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
// For CLI package, check root README.md and LICENSE
const isCliPackage = process.cwd().includes('packages/cli');
const readmePath = isCliPackage ? 
  path.resolve(process.cwd(), '../../README.md') : 
  path.resolve(process.cwd(), 'README.md');
const licensePath = isCliPackage ? 
  path.resolve(process.cwd(), '../../LICENSE') : 
  path.resolve(process.cwd(), 'LICENSE');

const errors = [];

// 1. Check for package.json and the 'repository' field
// Required for publishing through wombat-dressing-room
if (!fs.existsSync(packageJsonPath)) {
  errors.push(`Error: package.json not found in ${process.cwd()}`);
} else {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.repository !== 'enfiy/enfiy-code') {
    errors.push(
      `Error: The "repository" field in ${packageJsonPath} must be "enfiy/enfiy-code".`,
    );
  }
}

// 2. Check for README.md
if (!fs.existsSync(readmePath)) {
  errors.push(`Error: README.md not found in ${process.cwd()}`);
}

// 3. Check for LICENSE
if (!fs.existsSync(licensePath)) {
  errors.push(`Error: LICENSE file not found in ${process.cwd()}`);
}

if (errors.length > 0) {
  console.error('Pre-publish checks failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Pre-publish checks passed.');
