/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const bundleDir = join(root, 'bundle');

// Create the bundle directory if it doesn't exist
if (!existsSync(bundleDir)) {
  mkdirSync(bundleDir);
}

// Copy specific shell files to the root of the bundle directory
const possibleShellMdPaths = [
  join(root, 'packages/core/src/tools/shell.md'),
  join(root, 'packages/core/dist/src/tools/shell.md'),
  join(root, 'docs/api/tools/shell-tool.md'),
];

for (const shellMdPath of possibleShellMdPaths) {
  if (existsSync(shellMdPath)) {
    copyFileSync(shellMdPath, join(bundleDir, 'shell.md'));
    break;
  }
}

const shellJsonPath = join(root, 'packages/core/src/tools/shell.json');
if (existsSync(shellJsonPath)) {
  copyFileSync(shellJsonPath, join(bundleDir, 'shell.json'));
}

// Find and copy all .sb files from packages to the root of the bundle directory
const sbFiles = glob.sync('packages/**/*.sb', { cwd: root });
for (const file of sbFiles) {
  copyFileSync(join(root, file), join(bundleDir, basename(file)));
}

console.log('Assets copied to bundle/');
