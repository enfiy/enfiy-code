/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { OAuth2Client } from 'google-auth-library';
export declare class ProjectIdRequiredError extends Error {
    constructor();
}
/**
 *
 * @param projectId the user's project id, if any
 * @returns the user's actual project id
 */
export declare function setupUser(authClient: OAuth2Client): Promise<string>;
