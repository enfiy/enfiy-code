/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { useEffect, useState } from 'react';

const TERMINAL_PADDING_X = 8;

export function useTerminalSize(): { columns: number; rows: number } {
  const [size, setSize] = useState({
    columns: (process.stdout.columns || 60) - TERMINAL_PADDING_X,
    rows: process.stdout.rows || 20,
  });

  useEffect(() => {
    function updateSize() {
      setSize({
        columns: (process.stdout.columns || 60) - TERMINAL_PADDING_X,
        rows: process.stdout.rows || 20,
      });
    }

    process.stdout.on('resize', updateSize);
    return () => {
      process.stdout.off('resize', updateSize);
    };
  }, []);

  return size;
}
