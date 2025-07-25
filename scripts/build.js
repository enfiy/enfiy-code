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

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// npm install if node_modules was removed (e.g. via npm run clean or scripts/clean.js)
if (!existsSync(join(root, 'node_modules'))) {
  execSync('npm install', { stdio: 'inherit', cwd: root });
}

// build all workspaces/packages
execSync('npm run generate', { stdio: 'inherit', cwd: root });
execSync('npm run build:packages', { stdio: 'inherit', cwd: root });

// also build container image if sandboxing is enabled
// skip (-s) npm install + build since we did that above
// Skip sandbox commands on Windows as they can cause hangs
if (process.platform !== 'win32') {
  try {
    execSync('node scripts/sandbox_command.js -q', {
      stdio: 'inherit',
      cwd: root,
    });
    if (
      process.env.BUILD_SANDBOX === '1' ||
      process.env.BUILD_SANDBOX === 'true'
    ) {
      execSync('node scripts/build_sandbox.js -s', {
        stdio: 'inherit',
        cwd: root,
      });
    }
  } catch {
    // ignore
  }
}
