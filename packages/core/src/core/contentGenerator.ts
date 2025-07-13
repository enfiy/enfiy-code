/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  CountTokensResponse,
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
  GoogleGenAI,
} from '@google/genai';
import { createCodeAssistContentGenerator } from '../code_assist/codeAssist.js';
import { DEFAULT_GEMINI_MODEL } from '../config/models.js';
import { getEffectiveModel } from './modelCheck.js';

/**
 * Interface abstracting the core functionalities for generating content and counting tokens.
 */
export interface ContentGenerator {
  generateContent(
    request: GenerateContentParameters,
  ): Promise<GenerateContentResponse>;

  generateContentStream(
    request: GenerateContentParameters,
  ): Promise<AsyncGenerator<GenerateContentResponse>>;

  countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;

  embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;
}

export enum AuthType {
  LOGIN_WITH_GOOGLE_PERSONAL = 'oauth-personal',
  USE_GEMINI = 'gemini-api-key',
  USE_VERTEX_AI = 'vertex-ai',
  API_KEY = 'api-key',
}

export type ContentGeneratorConfig = {
  model: string;
  apiKey?: string;
  vertexai?: boolean;
  authType?: AuthType | undefined;
};

export async function createContentGeneratorConfig(
  model: string | undefined,
  authType: AuthType | undefined,
  config?: { getModel?: () => string },
): Promise<ContentGeneratorConfig> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCloudProject = process.env.GOOGLE_CLOUD_PROJECT;
  const googleCloudLocation = process.env.GOOGLE_CLOUD_LOCATION;

  // Use runtime model from config if available, otherwise fallback to parameter or default
  const effectiveModel = config?.getModel?.() || model || DEFAULT_GEMINI_MODEL;

  const contentGeneratorConfig: ContentGeneratorConfig = {
    model: effectiveModel,
    authType,
  };

  // if we are using google auth nothing else to validate for now
  if (authType === AuthType.LOGIN_WITH_GOOGLE_PERSONAL) {
    return contentGeneratorConfig;
  }

  if (authType === AuthType.USE_GEMINI && geminiApiKey) {
    contentGeneratorConfig.apiKey = geminiApiKey;
    contentGeneratorConfig.model = await getEffectiveModel(
      contentGeneratorConfig.apiKey,
      contentGeneratorConfig.model,
    );

    return contentGeneratorConfig;
  }

  if (
    authType === AuthType.USE_VERTEX_AI &&
    !!googleApiKey &&
    googleCloudProject &&
    googleCloudLocation
  ) {
    contentGeneratorConfig.apiKey = googleApiKey;
    contentGeneratorConfig.vertexai = true;
    contentGeneratorConfig.model = await getEffectiveModel(
      contentGeneratorConfig.apiKey,
      contentGeneratorConfig.model,
    );

    return contentGeneratorConfig;
  }

  if (authType === AuthType.API_KEY) {
    // Determine which API key to use based on the model
    const providerType = getProviderTypeFromModel(effectiveModel);
    
    switch (providerType) {
      case 'gemini':
        contentGeneratorConfig.apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
        break;
      case 'openai':
        contentGeneratorConfig.apiKey = process.env.OPENAI_API_KEY;
        break;
      case 'anthropic':
        contentGeneratorConfig.apiKey = process.env.ANTHROPIC_API_KEY;
        break;
      case 'mistral':
        contentGeneratorConfig.apiKey = process.env.MISTRAL_API_KEY;
        break;
      case 'huggingface':
        contentGeneratorConfig.apiKey = process.env.HUGGINGFACE_API_KEY;
        break;
      default:
        contentGeneratorConfig.apiKey = geminiApiKey;
    }
    
    return contentGeneratorConfig;
  }

  return contentGeneratorConfig;
}

export async function createContentGenerator(
  config: ContentGeneratorConfig,
): Promise<ContentGenerator> {
  const version = process.env.CLI_VERSION || process.version;
  const httpOptions = {
    headers: {
      'User-Agent': `EnfiyCLI/${version} (${process.platform}; ${process.arch})`,
    },
  };

  // Determine provider type from model
  const providerType = getProviderTypeFromModel(config.model);
  
  
  // For non-Gemini providers, use MultiProviderClient wrapper
  if (providerType !== 'gemini' && config.authType === AuthType.API_KEY) {
    return createMultiProviderContentGenerator(config);
  }

  // For Gemini, use existing implementation
  if (config.authType === AuthType.LOGIN_WITH_GOOGLE_PERSONAL) {
    return createCodeAssistContentGenerator(httpOptions, config.authType);
  }

  if (
    config.authType === AuthType.USE_GEMINI ||
    config.authType === AuthType.USE_VERTEX_AI ||
    (config.authType === AuthType.API_KEY && providerType === 'gemini')
  ) {
    const googleGenAI = new GoogleGenAI({
      apiKey: config.apiKey === '' ? undefined : config.apiKey,
      vertexai: config.vertexai,
      httpOptions,
    });

    return googleGenAI.models;
  }

  throw new Error(
    `Error creating contentGenerator: Unsupported authType: ${config.authType}`,
  );
}

/**
 * Determine provider type from model name
 */
function getProviderTypeFromModel(model: string): string {
  const modelLower = model.toLowerCase();
  
  // OpenAI models
  if (modelLower.includes('gpt') || modelLower.includes('openai') || modelLower.startsWith('o3') || modelLower.startsWith('o4')) {
    return 'openai';
  }
  
  // Anthropic models
  if (modelLower.includes('claude') || modelLower.includes('anthropic')) {
    return 'anthropic';
  }
  
  // Gemini models
  if (modelLower.includes('gemini')) {
    return 'gemini';
  }
  
  // Mistral models
  if (modelLower.includes('mistral') || modelLower.includes('codestral') || modelLower.includes('devstral')) {
    return 'mistral';
  }
  
  // Ollama models (expanded to include qwen, deepseek)
  if (modelLower.includes('llama') || modelLower.includes('codellama') || modelLower.includes('ollama') ||
      modelLower.includes('qwen') || modelLower.includes('deepseek') || modelLower.includes(':')) {
    return 'ollama';
  }
  
  // HuggingFace models (models with / or specific prefixes)
  if (modelLower.includes('huggingface') || modelLower.includes('hf') || model.includes('/') ||
      modelLower.startsWith('meta-') || modelLower.startsWith('microsoft/')) {
    return 'huggingface';
  }
  
  // Default to ollama for local-first approach
  console.log(`⚠️  Unknown model type: ${model}, defaulting to Ollama (local AI)`);
  return 'ollama';
}

/**
 * Create ContentGenerator for non-Gemini providers using wrapper pattern
 */
async function createMultiProviderContentGenerator(
  config: ContentGeneratorConfig,
): Promise<ContentGenerator> {
  const { MultiProviderContentGeneratorWrapper } = await import('./multiProviderClient.js');
  return new MultiProviderContentGeneratorWrapper(config);
}
