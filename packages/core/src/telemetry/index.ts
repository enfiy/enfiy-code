/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
export enum TelemetryTarget {
  GCP = 'gcp',
  LOCAL = 'local',
}

const DEFAULT_TELEMETRY_TARGET = TelemetryTarget.LOCAL;
const DEFAULT_OTLP_ENDPOINT = 'http://localhost:4317';

export { DEFAULT_TELEMETRY_TARGET, DEFAULT_OTLP_ENDPOINT };
export {
  initializeTelemetry,
  shutdownTelemetry,
  isTelemetrySdkInitialized,
} from './sdk.js';
export {
  logCliConfiguration,
  logUserPrompt,
  logToolCall,
  logApiRequest,
  logApiError,
  logApiResponse,
} from './loggers.js';
export {
  StartSessionEvent,
  EndSessionEvent,
  UserPromptEvent,
  ToolCallEvent,
  ApiRequestEvent,
  ApiErrorEvent,
  ApiResponseEvent,
  TelemetryEvent,
} from './types.js';
export { SpanStatusCode, ValueType } from '@opentelemetry/api';
export { SemanticAttributes } from '@opentelemetry/semantic-conventions';
