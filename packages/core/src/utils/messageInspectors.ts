/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { Content } from '@google/genai';

export function isFunctionResponse(content: Content): boolean {
  return (
    content.role === 'user' &&
    !!content.parts &&
    content.parts.every((part) => !!part.functionResponse)
  );
}
