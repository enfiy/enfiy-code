/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
interface HFOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}
export interface HFWebLogin {
  authUrl: string;
  loginCompletePromise: Promise<HFOAuthResponse>;
}
export declare function getHuggingFaceOAuthClient(): Promise<HFOAuthResponse>;
export declare function clearHFCachedCredentials(): Promise<void>;
export {};
