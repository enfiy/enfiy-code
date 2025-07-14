/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import {
  readPackageUp,
  type PackageJson as BasePackageJson,
} from 'read-package-up';
import { fileURLToPath } from 'url';
import path from 'path';

export type PackageJson = BasePackageJson & {
  config?: {
    sandboxImageUri?: string;
  };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let packageJson: PackageJson | undefined;

export async function getPackageJson(): Promise<PackageJson | undefined> {
  if (packageJson) {
    return packageJson;
  }

  const result = await readPackageUp({ cwd: __dirname });
  if (!result) {
    // TODO: Maybe bubble this up as an error.
    return;
  }

  packageJson = result.packageJson;
  return packageJson;
}
