/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { useEffect, useRef } from 'react';
import { useStdin } from 'ink';
import readline from 'readline';

export interface Key {
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  paste: boolean;
  sequence: string;
}

/**
 * A hook that listens for keypress events from stdin, providing a
 * key object that mirrors the one from Node's `readline` module,
 * adding a 'paste' flag for characters input as part of a bracketed
 * paste (when enabled).
 *
 * Simplified universal input handling for all languages and input methods.
 */
export function useKeypress(
  onKeypress: (key: Key) => void,
  { isActive }: { isActive: boolean },
) {
  const { stdin, setRawMode } = useStdin();
  const onKeypressRef = useRef(onKeypress);

  useEffect(() => {
    onKeypressRef.current = onKeypress;
  }, [onKeypress]);

  useEffect(() => {
    if (!isActive || !stdin.isTTY) {
      return;
    }

    setRawMode(true);

    const rl = readline.createInterface({ input: stdin });
    let isPaste = false;
    let pasteBuffer = Buffer.alloc(0);

    // Simple universal buffer for all input types
    let inputBuffer = '';
    const INPUT_FLUSH_TIMEOUT = 30; // ms - universal timeout for all input types
    let flushTimer: NodeJS.Timeout | null = null;

    const flushInputBuffer = () => {
      if (inputBuffer && inputBuffer.length > 0) {
        console.log('[INPUT] Flushing buffer:', {
          buffer: inputBuffer,
          length: inputBuffer.length,
          charCodes: Array.from(inputBuffer).map((c) => c.charCodeAt(0)),
        });

        onKeypressRef.current({
          name: '',
          ctrl: false,
          meta: false,
          shift: false,
          paste: false,
          sequence: inputBuffer,
        });

        inputBuffer = '';
      }
    };

    const handleKeypress = (_: unknown, key: Key) => {

      // Skip paste handling - let it go through normal processing
      if (key.name === 'paste-start') {
        isPaste = true;
        return;
      }

      if (key.name === 'paste-end') {
        isPaste = false;
        const pastedText = pasteBuffer.toString('utf8');
        onKeypressRef.current({
          name: '',
          ctrl: false,
          meta: false,
          shift: false,
          paste: true,
          sequence: pastedText,
        });
        pasteBuffer = Buffer.alloc(0);
        return;
      }

      if (isPaste) {
        pasteBuffer = Buffer.concat([
          pasteBuffer,
          Buffer.from(key.sequence, 'utf8'),
        ]);
        return;
      }

      // Handle special keys immediately (Enter, Backspace, Arrow keys, etc.)
      if (
        key.name &&
        (key.name === 'return' ||
          key.name === 'backspace' ||
          key.name === 'delete' ||
          key.name.startsWith('arrow') ||
          key.ctrl ||
          key.meta ||
          key.name === 'tab' ||
          key.name === 'escape')
      ) {
        // Flush any pending input first
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        flushInputBuffer();

        // Process special key immediately
        onKeypressRef.current({ ...key, paste: false });
        return;
      }

      // For all text input (including IME output), use simple buffering
      if (key.sequence && key.sequence.length > 0) {
        // Add to buffer
        inputBuffer += key.sequence;

        // Clear existing timer
        if (flushTimer) {
          clearTimeout(flushTimer);
        }

        // Set new timer to flush buffer
        flushTimer = setTimeout(() => {
          flushInputBuffer();
          flushTimer = null;
        }, INPUT_FLUSH_TIMEOUT);

        console.log('[INPUT] Buffering input:', {
          added: key.sequence,
          buffer: inputBuffer,
          length: inputBuffer.length,
          timeout: INPUT_FLUSH_TIMEOUT,
        });
      }
    };

    readline.emitKeypressEvents(stdin, rl);
    stdin.on('keypress', handleKeypress);

    return () => {
      stdin.removeListener('keypress', handleKeypress);
      rl.close();
      setRawMode(false);

      // Cleanup: flush any pending input
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      flushInputBuffer();

      // If we are in the middle of a paste, send what we have.
      if (isPaste) {
        onKeypressRef.current({
          name: '',
          ctrl: false,
          meta: false,
          shift: false,
          paste: true,
          sequence: pasteBuffer.toString('utf8'),
        });
        pasteBuffer = Buffer.alloc(0);
      }
    };
  }, [isActive, stdin, setRawMode]);
}
