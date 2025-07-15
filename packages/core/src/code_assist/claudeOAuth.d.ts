/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
interface ClaudeOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}
export interface ClaudeWebLogin {
  authUrl: string;
  loginCompletePromise: Promise<ClaudeOAuthResponse>;
}
export declare function getClaudeOAuthClient(): Promise<ClaudeOAuthResponse>;
export declare function clearClaudeCachedCredentials(): Promise<void>;
export {};
