/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
interface SecureConfig {
    providers: {
        [key: string]: {
            apiKey?: string;
            endpoint?: string;
            authMethod?: string;
            encrypted: boolean;
        };
    };
    version: string;
}
/**
 * Load secure configuration
 */
export declare function loadSecureConfig(): SecureConfig;
/**
 * Save secure configuration
 */
export declare function saveSecureConfig(config: SecureConfig): void;
/**
 * Store API key securely
 */
export declare function storeApiKey(provider: string, apiKey: string, endpoint?: string, authMethod?: string): void;
/**
 * Retrieve API key
 */
export declare function getApiKey(provider: string): string | undefined;
/**
 * Remove API key
 */
export declare function removeApiKey(provider: string): void;
/**
 * Check if provider has stored credentials
 */
export declare function hasStoredCredentials(provider: string): boolean;
/**
 * List configured providers
 */
export declare function getConfiguredProviders(): string[];
/**
 * Load API keys from secure storage into environment variables
 */
export declare function loadApiKeysIntoEnvironment(): void;
/**
 * Validate API key format
 */
export declare function validateApiKey(provider: string, apiKey: string): boolean;
export {};
