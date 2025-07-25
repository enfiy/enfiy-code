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
import { writeFileSync } from 'fs';
import { join } from 'path';

if (!process.cwd().includes('packages')) {
  console.error('must be invoked from a package directory');
  process.exit(1);
}

// build typescript files with optimization flags
const tscCommand =
  process.env.NODE_ENV === 'production' ? 'tsc --build --force' : 'tsc --build';

// Add timeout and better error handling for CI environments
try {
  execSync(tscCommand, {
    stdio: process.env.DEBUG ? 'inherit' : 'pipe',
    timeout: process.env.CI ? 600000 : 300000, // 10 minutes in CI, 5 minutes locally
  });
} catch (error) {
  console.error('TypeScript build failed:', error.message);
  process.exit(1);
}

// copy .{md,json} files
execSync('node ../../scripts/copy_files.js', { stdio: 'inherit' });

// touch dist/.last_build
writeFileSync(join(process.cwd(), 'dist', '.last_build'), '');
process.exit(0);
