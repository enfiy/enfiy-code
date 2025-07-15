/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { createCodeAssistContentGenerator } from '../code_assist/codeAssist.js';
import { DEFAULT_GEMINI_MODEL } from '../config/models.js';
import { getEffectiveModel } from './modelCheck.js';
export let AuthType;
(function (AuthType) {
  AuthType['LOGIN_WITH_GOOGLE_PERSONAL'] = 'oauth-personal';
  AuthType['USE_GEMINI'] = 'gemini-api-key';
  AuthType['USE_VERTEX_AI'] = 'vertex-ai';
  AuthType['API_KEY'] = 'api-key';
})(AuthType || (AuthType = {}));
export async function createContentGeneratorConfig(model, authType, config) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCloudProject = process.env.GOOGLE_CLOUD_PROJECT;
  const googleCloudLocation = process.env.GOOGLE_CLOUD_LOCATION;
  // Use runtime model from config if available, otherwise fallback to parameter or default
  const effectiveModel = config?.getModel?.() || model || DEFAULT_GEMINI_MODEL;
  const contentGeneratorConfig = {
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
        contentGeneratorConfig.apiKey =
          geminiApiKey || process.env.GEMINI_API_KEY;
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
export async function createContentGenerator(config) {
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
function getProviderTypeFromModel(model) {
  if (model.includes('gpt') || model.includes('openai')) {
    return 'openai';
  } else if (model.includes('claude') || model.includes('anthropic')) {
    return 'anthropic';
  } else if (model.includes('gemini')) {
    return 'gemini';
  } else if (model.includes('mistral')) {
    return 'mistral';
  } else if (
    model.includes('llama') ||
    model.includes('codellama') ||
    model.includes('ollama')
  ) {
    return 'ollama';
  } else if (model.includes('huggingface') || model.includes('hf')) {
    return 'huggingface';
  } else {
    return 'gemini'; // Default fallback
  }
}
/**
 * Create ContentGenerator for non-Gemini providers using wrapper pattern
 */
async function createMultiProviderContentGenerator(config) {
  const { MultiProviderContentGeneratorWrapper } = await import(
    './multiProviderClient.js'
  );
  return new MultiProviderContentGeneratorWrapper(config);
}
//# sourceMappingURL=contentGenerator.js.map
