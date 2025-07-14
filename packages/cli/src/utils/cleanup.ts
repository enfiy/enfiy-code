/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import { getProjectTempDir } from '@enfiy/core';

export async function cleanupCheckpoints() {
  const tempDir = getProjectTempDir(process.cwd());
  const checkpointsDir = join(tempDir, 'checkpoints');
  try {
    await fs.rm(checkpointsDir, { recursive: true, force: true });
  } catch {
    // Ignore errors if the directory doesn't exist or fails to delete.
  }
}
