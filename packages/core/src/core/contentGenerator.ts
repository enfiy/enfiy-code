/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
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
import { DEFAULT_ENFIY_MODEL } from '../config/models.js';
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
  USE_GEMINI = 'gemini-api-key',
  USE_VERTEX_AI = 'vertex-ai',
  API_KEY = 'api-key',
}

export type ContentGeneratorConfig = {
  model: string;
  apiKey?: string;
  vertexai?: boolean;
  authType?: AuthType | undefined;
  selectedProvider?: string;
};

export async function createContentGeneratorConfig(
  model: string | undefined,
  authType: AuthType | undefined,
  config?: {
    getModel?: () => string;
    getSelectedProvider?: () => string | undefined;
  },
): Promise<ContentGeneratorConfig> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCloudProject = process.env.GOOGLE_CLOUD_PROJECT;
  const googleCloudLocation = process.env.GOOGLE_CLOUD_LOCATION;

  // Use runtime model from config if available, otherwise fallback to parameter or default
  const effectiveModel = config?.getModel?.() || model || DEFAULT_ENFIY_MODEL;

  const contentGeneratorConfig: ContentGeneratorConfig = {
    model: effectiveModel,
    authType,
    selectedProvider: config?.getSelectedProvider?.(),
  };

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
        contentGeneratorConfig.apiKey =
          geminiApiKey || process.env.GEMINI_API_KEY;
        break;
      case 'openai':
        contentGeneratorConfig.apiKey = process.env.OPENAI_API_KEY;
        break;
      case 'mistral':
        contentGeneratorConfig.apiKey = process.env.MISTRAL_API_KEY;
        break;
      case 'anthropic':
        contentGeneratorConfig.apiKey = process.env.ANTHROPIC_API_KEY;
        break;
      case 'openrouter':
        contentGeneratorConfig.apiKey = process.env.OPENROUTER_API_KEY;
        break;
      // Local providers - no API key needed
      case 'ollama':
        // Local providers don't need API keys
        break;
      default:
        throw new Error(
          `Unsupported provider: ${providerType}. Please select a valid provider.`,
        );
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

  // Check if a specific provider is configured in settings
  const configuredProvider = config.selectedProvider;

  // Determine provider type - prioritize configured provider over model-based detection
  let providerType: string;
  if (configuredProvider && configuredProvider !== 'gemini') {
    providerType = configuredProvider;
  } else {
    providerType = getProviderTypeFromModel(config.model);
  }

  // For non-Gemini providers, use MultiProviderClient wrapper
  if (providerType !== 'gemini' && config.authType === AuthType.API_KEY) {
    return createMultiProviderContentGenerator(config);
  }

  // For Gemini, use existing implementation

  if (
    config.authType === AuthType.USE_GEMINI ||
    config.authType === AuthType.USE_VERTEX_AI ||
    (config.authType === AuthType.API_KEY && providerType === 'gemini')
  ) {
    if (!config.apiKey) {
      throw new Error('API key is required for Gemini provider');
    }

    const googleGenAI = new GoogleGenAI({
      apiKey: config.apiKey,
      vertexai: config.vertexai,
      httpOptions,
    });

    return googleGenAI.models;
  }

  throw new Error(
    `Error creating contentGenerator: Unsupported authType: ${config.authType}, providerType: ${providerType}`,
  );
}

/**
 * Determine provider type from model name
 */
function getProviderTypeFromModel(model: string): string {
  const modelLower = model.toLowerCase();

  // OpenAI models
  if (
    modelLower.includes('gpt') ||
    modelLower.includes('openai') ||
    modelLower.startsWith('o3') ||
    modelLower.startsWith('o4')
  ) {
    return 'openai';
  }

  // Gemini models
  if (modelLower.includes('gemini')) {
    return 'gemini';
  }

  // Mistral models
  if (
    modelLower.includes('mistral') ||
    modelLower.includes('codestral') ||
    modelLower.includes('devstral')
  ) {
    return 'mistral';
  }

  // Anthropic models
  if (modelLower.includes('claude')) {
    return 'anthropic';
  }

  // Ollama models (comprehensive pattern matching)
  if (
    modelLower.includes('llama') ||
    modelLower.includes('codellama') ||
    modelLower.includes('ollama') ||
    modelLower.includes('qwen') ||
    modelLower.includes('deepseek') ||
    modelLower.includes('phi') ||
    modelLower.includes('mistral') ||
    modelLower.includes('gemma') ||
    modelLower.includes('vicuna') ||
    modelLower.includes('alpaca') ||
    modelLower.includes('orca') ||
    modelLower.includes('nous') ||
    modelLower.includes('yi') ||
    modelLower.includes('solar') ||
    modelLower.includes('dolphin') ||
    modelLower.includes('mixtral') ||
    modelLower.includes('openchat') ||
    modelLower.includes('starling') ||
    modelLower.includes('neural') ||
    modelLower.includes('tinyllama') ||
    modelLower.includes('wizard') ||
    modelLower.includes('zephyr') ||
    modelLower.includes('stable') ||
    modelLower.includes('falcon') ||
    modelLower.includes('mpt') ||
    modelLower.includes('redpajama') ||
    modelLower.includes('ggml') ||
    modelLower.includes('gguf') ||
    modelLower.includes(':') // Ollama tag format (model:tag)
  ) {
    return 'ollama';
  }


  // OpenRouter models (prefixed routing patterns)
  if (
    modelLower.includes('openrouter') ||
    modelLower.startsWith('anthropic/') ||
    modelLower.startsWith('openai/') ||
    modelLower.startsWith('google/') ||
    modelLower.startsWith('meta-llama/') ||
    modelLower.startsWith('mistralai/') ||
    modelLower.startsWith('nous-hermes') ||
    modelLower.startsWith('phind/')
  ) {
    return 'openrouter';
  }

  // Default to ollama for local-first approach
  console.log(
    `[WARNING] Unknown model type: ${model}, defaulting to Ollama (local AI)`,
  );
  return 'ollama';
}

/**
 * Create ContentGenerator for non-Gemini providers using wrapper pattern
 */
async function createMultiProviderContentGenerator(
  config: ContentGeneratorConfig,
): Promise<ContentGenerator> {
  const { MultiProviderContentGeneratorWrapper } = await import(
    './multiProviderClient.js'
  );
  return new MultiProviderContentGeneratorWrapper(config);
}
