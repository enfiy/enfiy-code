/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { OAuth2Client } from 'google-auth-library';
/**
 * An Authentication URL for updating the credentials of a Oauth2Client
 * as well as a promise that will resolve when the credentials have
 * been refreshed (or which throws error when refreshing credentials failed).
 */
export interface OauthWebLogin {
    authUrl: string;
    loginCompletePromise: Promise<void>;
}
export declare function getOauthClient(): Promise<OAuth2Client>;
export declare function getAvailablePort(): Promise<number>;
export declare function clearCachedCredentialFile(): Promise<void>;
