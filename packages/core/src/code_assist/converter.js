/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { GenerateContentResponse } from '@google/genai';
export function toCountTokenRequest(req) {
  // Ensure model name is in correct format for the API
  let modelName = req.model;
  const originalModel = modelName;
  // If model doesn't start with models/, add it
  if (!modelName.startsWith('models/')) {
    modelName = 'models/' + modelName;
  }
  // Map specific model names that might need correction
  if (modelName === 'models/gemini-1.5-flash') {
    modelName = 'models/gemini-1.5-flash-latest';
  } else if (modelName === 'models/gemini-1.5-pro') {
    modelName = 'models/gemini-1.5-pro-latest';
  } else if (modelName === 'models/gemini-2.0-flash-exp') {
    modelName = 'models/gemini-2.0-flash-exp';
  }
  console.log('[CONVERTER] CountTokens model conversion:', {
    original: originalModel,
    final: modelName,
  });
  return {
    request: {
      model: modelName,
      contents: toContents(req.contents),
    },
  };
}
export function fromCountTokenResponse(res) {
  return {
    totalTokens: res.totalTokens,
  };
}
export function toGenerateContentRequest(req, project) {
  return {
    model: req.model,
    project,
    request: toVertexGenerateContentRequest(req),
  };
}
export function fromGenerateContentResponse(res) {
  const inres = res.response;
  const out = new GenerateContentResponse();
  out.candidates = inres.candidates;
  out.automaticFunctionCallingHistory = inres.automaticFunctionCallingHistory;
  out.promptFeedback = inres.promptFeedback;
  out.usageMetadata = inres.usageMetadata;
  return out;
}
function toVertexGenerateContentRequest(req) {
  return {
    contents: toContents(req.contents),
    systemInstruction: maybeToContent(req.config?.systemInstruction),
    cachedContent: req.config?.cachedContent,
    tools: req.config?.tools,
    toolConfig: req.config?.toolConfig,
    labels: req.config?.labels,
    safetySettings: req.config?.safetySettings,
    generationConfig: toVertexGenerationConfig(req.config),
  };
}
function toContents(contents) {
  if (Array.isArray(contents)) {
    // it's a Content[] or a PartsUnion[]
    return contents.map(toContent);
  }
  // it's a Content or a PartsUnion
  return [toContent(contents)];
}
function maybeToContent(content) {
  if (!content) {
    return undefined;
  }
  return toContent(content);
}
function toContent(content) {
  if (Array.isArray(content)) {
    // it's a PartsUnion[]
    return {
      role: 'user',
      parts: toParts(content),
    };
  }
  if (typeof content === 'string') {
    // it's a string
    return {
      role: 'user',
      parts: [{ text: content }],
    };
  }
  if ('parts' in content) {
    // it's a Content
    return content;
  }
  // it's a Part
  return {
    role: 'user',
    parts: [content],
  };
}
function toParts(parts) {
  return parts.map(toPart);
}
function toPart(part) {
  if (typeof part === 'string') {
    // it's a string
    return { text: part };
  }
  return part;
}
function toVertexGenerationConfig(config) {
  if (!config) {
    return undefined;
  }
  return {
    temperature: config.temperature,
    topP: config.topP,
    topK: config.topK,
    candidateCount: config.candidateCount,
    maxOutputTokens: config.maxOutputTokens,
    stopSequences: config.stopSequences,
    responseLogprobs: config.responseLogprobs,
    logprobs: config.logprobs,
    presencePenalty: config.presencePenalty,
    frequencyPenalty: config.frequencyPenalty,
    seed: config.seed,
    responseMimeType: config.responseMimeType,
    responseSchema: config.responseSchema,
    routingConfig: config.routingConfig,
    modelSelectionConfig: config.modelSelectionConfig,
    responseModalities: config.responseModalities,
    mediaResolution: config.mediaResolution,
    speechConfig: config.speechConfig,
    audioTimestamp: config.audioTimestamp,
    thinkingConfig: config.thinkingConfig,
  };
}
//# sourceMappingURL=converter.js.map
