/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Represents a tool call with its ID, name, and arguments.
 */
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}
