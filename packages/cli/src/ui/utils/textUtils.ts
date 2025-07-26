/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
/**
 * Calculates the maximum width of a multi-line ASCII art string.
 * @param asciiArt The ASCII art string.
 * @returns The length of the longest line in the ASCII art.
 */
export const getAsciiArtWidth = (asciiArt: string): number => {
  if (!asciiArt) {
    return 0;
  }
  const lines = asciiArt.split('\n');
  return Math.max(...lines.map((line) => line.length));
};

/**
 * Checks if a Buffer is likely binary by testing for the presence of a NULL byte.
 * The presence of a NULL byte is a strong indicator that the data is not plain text.
 * @param data The Buffer to check.
 * @param sampleSize The number of bytes from the start of the buffer to test.
 * @returns True if a NULL byte is found, false otherwise.
 */
export function isBinary(
  data: Buffer | null | undefined,
  sampleSize = 512,
): boolean {
  if (!data) {
    return false;
  }

  const sample = data.length > sampleSize ? data.subarray(0, sampleSize) : data;

  for (let i = 0; i < sample.length; i++) {
    // The presence of a NULL byte (0x00) is one of the most reliable
    // indicators of a binary file. Text files should not contain them.
    if (sample[i] === 0) {
      return true;
    }
  }

  // If no NULL bytes were found in the sample, we assume it's text.
  return false;
}

/*
 * -------------------------------------------------------------------------
 *  Unicode‑aware helpers (work at the code‑point level rather than UTF‑16
 *  code units so that surrogate‑pair emoji count as one "column".)
 * ---------------------------------------------------------------------- */

export function toCodePoints(str: string): string[] {
  // [...str] or Array.from both iterate by UTF‑32 code point, handling
  // surrogate pairs correctly.
  return Array.from(str);
}

export function cpLen(str: string): number {
  return toCodePoints(str).length;
}

export function cpSlice(str: string, start: number, end?: number): string {
  // Slice by code‑point indices and re‑join.
  const arr = toCodePoints(str).slice(start, end);
  return arr.join('');
}

/**
 * Platform-aware string width calculation
 * Windows terminals sometimes have different width calculation behavior
 */
export function platformStringWidth(str: string): number {
  // On Windows, use a more conservative approach
  if (process.platform === 'win32') {
    // Strip ANSI codes first
    const cleaned = stripAnsi(str);

    // Fallback to character count for Windows terminals
    // This helps with VSCode terminal compatibility
    const width = stringWidth(cleaned);

    // If stringWidth gives unexpected results, fallback to character count
    if (
      width !== cleaned.length &&
      !/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(
        cleaned,
      )
    ) {
      return cleaned.length;
    }

    return width;
  }

  // Use standard stringWidth for other platforms
  return stringWidth(str);
}
