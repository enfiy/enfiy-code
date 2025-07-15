/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { ProviderType } from './types.js';
export interface ModelInfo {
    id: string;
    name: string;
    provider: ProviderType;
    category: 'local' | 'cloud';
    description: string;
    contextLength: number;
    pricing?: {
        input: number;
        output: number;
        unit: string;
    };
    capabilities: string[];
}
export declare const MODEL_REGISTRY: Record<string, ModelInfo[]>;
export declare function getModelsForProvider(providerType: ProviderType): ModelInfo[];
export declare function getAllModels(): ModelInfo[];
export declare function getLocalModels(): ModelInfo[];
export declare function getCloudModels(): ModelInfo[];
export declare function getModelsByCapability(capability: string): ModelInfo[];
export declare function findModel(modelId: string): ModelInfo | undefined;
