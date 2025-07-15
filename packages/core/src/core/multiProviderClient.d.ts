/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { Content, GenerateContentResponse, GenerateContentConfig, GenerateContentParameters, CountTokensParameters, CountTokensResponse, EmbedContentParameters, EmbedContentResponse } from '@google/genai';
import { Config } from '../config/config.js';
import { Provider, ProviderType } from '../providers/types.js';
import { ContentGenerator, ContentGeneratorConfig } from './contentGenerator.js';
/**
 * Multi-provider client that can use any supported AI provider
 */
export declare class MultiProviderClient {
    private config;
    private provider?;
    private currentProviderType?;
    private contentGenerator?;
    constructor(config: Config);
    /**
     * Determine provider type from model name
     */
    private getProviderTypeFromModel;
    /**
     * Get API key for the provider
     */
    private getApiKeyForProvider;
    /**
     * Initialize the appropriate provider for the given model
     */
    initialize(model: string): Promise<void>;
    /**
     * Fallback to Gemini provider
     */
    private initializeGeminiFallback;
    /**
     * Generate content using the current provider
     */
    generateContent(params: {
        model: string;
        contents: Content[];
        config?: GenerateContentConfig;
    }): Promise<GenerateContentResponse>;
    /**
     * Generate streaming content using the current provider
     */
    generateContentStream(params: {
        model: string;
        contents: Content[];
        config?: GenerateContentConfig;
    }): Promise<AsyncGenerator<GenerateContentResponse>>;
    /**
     * Check if provider is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get current provider type
     */
    getCurrentProviderType(): ProviderType | undefined;
    /**
     * Get current provider
     */
    getCurrentProvider(): Provider | undefined;
    /**
     * Get environment variable name for provider
     */
    private getEnvVarNameForProvider;
    /**
     * List available models for current provider
     */
    listModels(): Promise<string[]>;
}
/**
 * Wrapper to make MultiProviderClient compatible with ContentGenerator interface
 */
export declare class MultiProviderContentGeneratorWrapper implements ContentGenerator {
    private client;
    private config;
    constructor(config: ContentGeneratorConfig);
    generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse>;
    generateContentStream(request: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>>;
    private ensureContentFormat;
    countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;
    embedContent(_request: EmbedContentParameters): Promise<EmbedContentResponse>;
}
