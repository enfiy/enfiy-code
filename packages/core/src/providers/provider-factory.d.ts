/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { Provider, ProviderType, ProviderConfig } from './types.js';
export declare class ProviderFactory {
  static createProvider(type: ProviderType): Provider;
  static detectAvailableProviders(): Promise<
    Array<{
      type: ProviderType;
      name: string;
      available: boolean;
    }>
  >;
  static getDefaultProviderConfig(): ProviderConfig;
  static getPreferredProvider(): Promise<ProviderType>;
  /**
   * Get all supported provider types
   */
  static getAllProviderTypes(): ProviderType[];
  /**
   * Get implemented provider types
   */
  static getImplementedProviderTypes(): ProviderType[];
  /**
   * Get local provider types
   */
  static getLocalProviderTypes(): ProviderType[];
  /**
   * Get cloud provider types
   */
  static getCloudProviderTypes(): ProviderType[];
  /**
   * Check if provider type is implemented
   */
  static isProviderImplemented(type: ProviderType): boolean;
  /**
   * Get provider information including capabilities
   */
  static getProviderInfo(type: ProviderType): Promise<{
    type: ProviderType;
    name: string;
    implemented: boolean;
    isLocal: boolean;
    capabilities?: {
      supportsStreaming: boolean;
      supportsVision: boolean;
      supportsAudio: boolean;
      supportsFunctionCalling: boolean;
      supportsSystemPrompts: boolean;
      maxContextLength: number;
    };
    authInstructions?: string;
    recommendedModels?: string[];
  }>;
}
