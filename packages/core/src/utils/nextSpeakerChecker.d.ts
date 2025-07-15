/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { EnfiyClient } from '../core/client.js';
import { EnfiyChat } from '../core/enfiyChat.js';
export interface NextSpeakerResponse {
  reasoning: string;
  next_speaker: 'user' | 'model';
}
export declare function checkNextSpeaker(
  chat: EnfiyChat,
  enfiyClient: EnfiyClient,
  abortSignal: AbortSignal,
): Promise<NextSpeakerResponse | null>;
