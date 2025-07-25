/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */

import { vi } from 'vitest';
import * as actualFsPromises from 'node:fs/promises';

const readFileMock = vi.fn();

// Export a control object so tests can access and manipulate the mock
export const mockControl = {
  mockReadFile: readFileMock,
};

// Export all other functions from the actual fs/promises module
export const {
  access,
  appendFile,
  chmod,
  chown,
  copyFile,
  cp,
  lchmod,
  lchown,
  link,
  lstat,
  mkdir,
  open,
  opendir,
  readdir,
  readlink,
  realpath,
  rename,
  rmdir,
  rm,
  stat,
  symlink,
  truncate,
  unlink,
  utimes,
  watch,
  writeFile,
} = actualFsPromises;

// Override readFile with our mock
export const readFile = readFileMock;
