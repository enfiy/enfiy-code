/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { ProviderType } from './types.js';
export interface DetectedProvider {
    type: ProviderType;
    available: boolean;
    defaultModel?: string;
    reason?: string;
}
/**
 * Detect availability of local AI providers
 */
export declare function detectLocalProviders(): Promise<DetectedProvider[]>;
/**
 * Check configuration status of cloud AI providers
 */
export declare function detectCloudProviders(): DetectedProvider[];
/**
 * Select the optimal default provider
 */
export declare function getRecommendedProvider(): Promise<DetectedProvider>;
/**
 * プロバイダー状況の詳細レポートを生成
 */
export declare function generateProviderReport(): Promise<string>;
