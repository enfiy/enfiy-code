/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Modifications Copyright 2025 The Enfiy Community Contributors
 *
 * This file has been modified from its original version by contributors
 * to the Enfiy Community project.
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
 * Enhanced with basic Japanese IME support.
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

    // IME composition state management
    let imeBuffer = '';
    let imeComposing = false;
    let lastJapaneseTime = 0;
    const IME_COMPOSITION_TIMEOUT = 200; // ms
    
    const handleKeypress = (_: unknown, key: Key) => {
      // Debug Japanese IME input
      if (process.env['TEXTBUFFER_DEBUG'] === '1') {
        console.log('[KEYPRESS] Raw key event:', {
          name: key.name,
          sequence: key.sequence,
          ctrl: key.ctrl,
          meta: key.meta,
          length: key.sequence?.length,
          charCodes: key.sequence ? Array.from(key.sequence).map(c => c.charCodeAt(0)) : [],
          imeBuffer,
          imeComposing,
        });
      }
      
      // Handle Japanese IME composition
      if (key.sequence && key.sequence.length > 0) {
        const firstCharCode = key.sequence.charCodeAt(0);
        const currentTime = Date.now();
        
        // Check if this is a Japanese/multi-byte character
        if (firstCharCode > 127 && !key.name && !key.ctrl && !key.meta) {
          if (process.env['TEXTBUFFER_DEBUG'] === '1') {
            console.log('[KEYPRESS] Japanese character detected:', {
              sequence: key.sequence,
              imeComposing,
              imeBuffer,
              timeSinceLastChar: currentTime - lastJapaneseTime,
            });
          }
          
          // If this is part of IME composition (characters coming in quick succession)
          if (!imeComposing || (currentTime - lastJapaneseTime) < IME_COMPOSITION_TIMEOUT) {
            imeComposing = true;
            imeBuffer += key.sequence;
            lastJapaneseTime = currentTime;
            
            if (process.env['TEXTBUFFER_DEBUG'] === '1') {
              console.log('[KEYPRESS] Accumulating in IME buffer:', {
                newBuffer: imeBuffer,
                addedChar: key.sequence,
              });
            }
            
            // Set a timeout to flush the buffer if no more characters come
            setTimeout(() => {
              if (imeComposing && (Date.now() - lastJapaneseTime) >= IME_COMPOSITION_TIMEOUT) {
                if (process.env['TEXTBUFFER_DEBUG'] === '1') {
                  console.log('[KEYPRESS] IME composition timeout, flushing buffer:', imeBuffer);
                }
                
                // Flush the accumulated IME buffer
                onKeypressRef.current({
                  name: '',
                  ctrl: false,
                  meta: false,
                  shift: false,
                  paste: false,
                  sequence: imeBuffer,
                });
                
                imeBuffer = '';
                imeComposing = false;
              }
            }, IME_COMPOSITION_TIMEOUT + 10);
            
            return; // Don't process this character individually
          } else {
            // Composition ended, this is a new character sequence
            if (imeBuffer) {
              // First flush the previous buffer
              onKeypressRef.current({
                name: '',
                ctrl: false,
                meta: false,
                shift: false,
                paste: false,
                sequence: imeBuffer,
              });
            }
            
            // Start new composition with this character
            imeBuffer = key.sequence;
            imeComposing = true;
            lastJapaneseTime = currentTime;
            return;
          }
        } else if (imeComposing) {
          // Non-Japanese character while IME was composing - flush the buffer first
          if (imeBuffer) {
            if (process.env['TEXTBUFFER_DEBUG'] === '1') {
              console.log('[KEYPRESS] Non-Japanese char while composing, flushing buffer:', imeBuffer);
            }
            
            onKeypressRef.current({
              name: '',
              ctrl: false,
              meta: false,
              shift: false,
              paste: false,
              sequence: imeBuffer,
            });
            
            imeBuffer = '';
            imeComposing = false;
          }
        }
      }
      
      if (key.name === 'paste-start') {
        isPaste = true;
      } else if (key.name === 'paste-end') {
        isPaste = false;
        onKeypressRef.current({
          name: '',
          ctrl: false,
          meta: false,
          shift: false,
          paste: true,
          sequence: pasteBuffer.toString(),
        });
        pasteBuffer = Buffer.alloc(0);
      } else {
        if (isPaste) {
          pasteBuffer = Buffer.concat([pasteBuffer, Buffer.from(key.sequence)]);
        } else {
          // Handle special keys
          if (key.name === 'return' && key.sequence === '\x1B\r') {
            key.meta = true;
          }
          
          // If Enter is pressed while IME is composing, flush the buffer first
          if (key.name === 'return' && imeComposing && imeBuffer) {
            if (process.env['TEXTBUFFER_DEBUG'] === '1') {
              console.log('[KEYPRESS] Enter pressed during IME composition, flushing buffer:', imeBuffer);
            }
            
            // Flush IME buffer first
            onKeypressRef.current({
              name: '',
              ctrl: false,
              meta: false,
              shift: false,
              paste: false,
              sequence: imeBuffer,
            });
            
            imeBuffer = '';
            imeComposing = false;
            
            // Then process the Enter key
            setTimeout(() => {
              onKeypressRef.current({ ...key, paste: isPaste });
            }, 10);
            return;
          }
          
          onKeypressRef.current({ ...key, paste: isPaste });
        }
      }
    };

    readline.emitKeypressEvents(stdin, rl);
    stdin.on('keypress', handleKeypress);

    return () => {
      stdin.removeListener('keypress', handleKeypress);
      rl.close();
      setRawMode(false);

      // If we are in the middle of a paste, send what we have.
      if (isPaste) {
        onKeypressRef.current({
          name: '',
          ctrl: false,
          meta: false,
          shift: false,
          paste: true,
          sequence: pasteBuffer.toString(),
        });
        pasteBuffer = Buffer.alloc(0);
      }
      
      // If we are in the middle of IME composition, send what we have.
      if (imeComposing && imeBuffer) {
        if (process.env['TEXTBUFFER_DEBUG'] === '1') {
          console.log('[KEYPRESS] Cleanup: flushing IME buffer:', imeBuffer);
        }
        onKeypressRef.current({
          name: '',
          ctrl: false,
          meta: false,
          shift: false,
          paste: false,
          sequence: imeBuffer,
        });
        imeBuffer = '';
        imeComposing = false;
      }
    };
  }, [isActive, stdin, setRawMode]);
}