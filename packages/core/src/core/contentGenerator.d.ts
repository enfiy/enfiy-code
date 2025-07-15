/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { CountTokensResponse, GenerateContentResponse, GenerateContentParameters, CountTokensParameters, EmbedContentResponse, EmbedContentParameters } from '@google/genai';
/**
 * Interface abstracting the core functionalities for generating content and counting tokens.
 */
export interface ContentGenerator {
    generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse>;
    generateContentStream(request: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>>;
    countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;
    embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;
}
export declare enum AuthType {
    LOGIN_WITH_GOOGLE_PERSONAL = "oauth-personal",
    USE_GEMINI = "gemini-api-key",
    USE_VERTEX_AI = "vertex-ai",
    API_KEY = "api-key"
}
export type ContentGeneratorConfig = {
    model: string;
    apiKey?: string;
    vertexai?: boolean;
    authType?: AuthType | undefined;
};
export declare function createContentGeneratorConfig(model: string | undefined, authType: AuthType | undefined, config?: {
    getModel?: () => string;
}): Promise<ContentGeneratorConfig>;
export declare function createContentGenerator(config: ContentGeneratorConfig): Promise<ContentGenerator>;
