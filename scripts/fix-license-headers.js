#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

// License header for untouched Google code
const GOOGLE_LICENSE_HEADER = `/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */`;

// License header for files modified from Google's original code
const GOOGLE_AND_HAYATE_ESAKI_HEADER = `/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */`;

// License header for completely new files
const HAYATE_ESAKI_HEADER = `/**
 * @license
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */`;

// --- FILE CLASSIFICATION ---
// Please review and modify these lists as needed.

// CATEGORY 1: Completely new files created by Hayate Esaki.
// These will receive the "Hayate Esaki" copyright.
// This list should contain files that are *not* present in the original Google Gemini CLI repository.
const NEW_FILES = [
  // Custom eslint rules (highly likely to be new)
  'eslint-rules/no-relative-cross-package-imports.js',
  // Integration tests (test content is likely new, even if framework is similar)
  'integration-tests/file-system.test.js',
  'integration-tests/google_web_search.test.js',
  'integration-tests/list_directory.test.js',
  'integration-tests/read_many_files.test.js',
  'integration-tests/replace.test.js',
  'integration-tests/run_shell_command.test.js',
  'integration-tests/run-tests.js',
  'integration-tests/save_memory.test.js',
  'integration-tests/simple-mcp-server.test.js',
  'integration-tests/test-helper.js',
  'integration-tests/write_file.test.js',
  // Project-specific CLI commands/components (e.g., containing "enfiy" or specific setup)
  'packages/cli/src/commands/setupLocalAI.ts',
  'packages/cli/src/enfiy.test.tsx',
  'packages/cli/src/enfiy.tsx',
  'packages/cli/src/ui/components/EnfiyAsciiArt.tsx',
  'packages/cli/src/ui/components/EnfiyRespondingSpinner.tsx',
  'packages/cli/src/ui/privacy/EnfiyPrivacyNotice.tsx',
  // Project-specific scripts
  'scripts/bundle-analyzer.js',
  'scripts/check-build-status.js',
  'scripts/fix-license-headers.js', // This script itself
  'scripts/prepare-cli-packagejson.js',
  'scripts/prepare-core-package.js',
  'scripts/telemetry_gcp.js',
  'scripts/telemetry_utils.js',
];

// CATEGORY 2: Untouched original files from the Google project.
// These will receive the "Google LLC" copyright.
// This list is empty by default for safety. Please add any files that have not been modified at all.
const UNTOUCHED_FILES = [
  // Example: 'packages/core/src/utils/retry.ts',
];

// CATEGORY 3: All other source files will be treated as "Modified Google code".
// They will receive a dual "Google LLC" and "Hayate Esaki" copyright.

// --- SCRIPT LOGIC ---

const LICENSE_PATTERNS_TO_REMOVE = [
  /^\/\*\*\s*\* @license[\s\S]*?\*\/\s*\n/m,
  /\/\*\s*\* Modifications Copyright 2025 The Enfiy Community Contributors[\s\S]*?\*\//g,
  /\/\*\s*Modifications Copyright 2025 The Enfiy Community Contributors[\s\S]*?\*\//g,
];

function findSourceFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        ![
          'node_modules',
          'dist',
          'coverage',
          '.git',
          'build',
          'bundle',
        ].includes(entry.name)
      ) {
        files.push(...findSourceFiles(fullPath));
      }
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|sh)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function getLicenseInfo(filePath) {
  const relativePath = path
    .relative(process.cwd(), filePath)
    .replace(/\\/g, '/');

  if (NEW_FILES.includes(relativePath)) {
    return { header: HAYATE_ESAKI_HEADER, type: 'Hayate Esaki' };
  }

  if (UNTOUCHED_FILES.includes(relativePath)) {
    return { header: GOOGLE_LICENSE_HEADER, type: 'Google LLC' };
  }

  return {
    header: GOOGLE_AND_HAYATE_ESAKI_HEADER,
    type: 'Google + Hayate Esaki',
  };
}

function fixLicenseHeader(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let shebang = '';

  if (content.startsWith('#!')) {
    const lines = content.split('\n');
    shebang = lines.shift() + '\n';
    content = lines.join('\n');
  }

  for (const pattern of LICENSE_PATTERNS_TO_REMOVE) {
    content = content.replace(pattern, '');
  }

  content = content.trimStart();

  const { header, type } = getLicenseInfo(filePath);
  const finalContent = shebang + header + '\n' + content;

  fs.writeFileSync(filePath, finalContent);
  console.log(
    `Fixed: ${path.relative(process.cwd(), filePath)} (${type} license)`,
  );
}

function main() {
  console.log('Fixing license headers with 3-category classification...');
  const projectRoot = process.cwd();
  const sourceFiles = findSourceFiles(projectRoot);
  let fixedCount = 0;
  let errorCount = 0;

  for (const file of sourceFiles) {
    try {
      fixLicenseHeader(file);
      fixedCount++;
    } catch (error) {
      console.error(`Error fixing ${file}:`, error.message);
      errorCount++;
    }
  }

  console.log(
    `\nLicense header fix complete. Fixed ${fixedCount} files. Encountered ${errorCount} errors.`,
  );
}

main();
