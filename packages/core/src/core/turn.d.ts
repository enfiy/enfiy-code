/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  PartListUnion,
  GenerateContentResponse,
  FunctionDeclaration,
  GenerateContentResponseUsageMetadata,
} from '@google/genai';
import {
  ToolCallConfirmationDetails,
  ToolResult,
  ToolResultDisplay,
} from '../tools/tools.js';
import { EnfiyChat } from './enfiyChat.js';
export interface ServerTool {
  name: string;
  schema: FunctionDeclaration;
  execute(
    params: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ToolResult>;
  shouldConfirmExecute(
    params: Record<string, unknown>,
    abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails | false>;
}
export declare enum EnfiyEventType {
  Content = 'content',
  ToolCallRequest = 'tool_call_request',
  ToolCallResponse = 'tool_call_response',
  ToolCallConfirmation = 'tool_call_confirmation',
  UserCancelled = 'user_cancelled',
  Error = 'error',
  ChatCompressed = 'chat_compressed',
  UsageMetadata = 'usage_metadata',
  Thought = 'thought',
}
export interface StructuredError {
  message: string;
  status?: number;
}
export interface EnfiyErrorEventValue {
  error: StructuredError;
}
export interface ToolCallRequestInfo {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  isClientInitiated: boolean;
}
export interface ToolCallResponseInfo {
  callId: string;
  responseParts: PartListUnion;
  resultDisplay: ToolResultDisplay | undefined;
  error: Error | undefined;
}
export interface ServerToolCallConfirmationDetails {
  request: ToolCallRequestInfo;
  details: ToolCallConfirmationDetails;
}
export type ThoughtSummary = {
  subject: string;
  description: string;
};
export type ServerEnfiyContentEvent = {
  type: EnfiyEventType.Content;
  value: string;
};
export type ServerEnfiyThoughtEvent = {
  type: EnfiyEventType.Thought;
  value: ThoughtSummary;
};
export type ServerEnfiyToolCallRequestEvent = {
  type: EnfiyEventType.ToolCallRequest;
  value: ToolCallRequestInfo;
};
export type ServerEnfiyToolCallResponseEvent = {
  type: EnfiyEventType.ToolCallResponse;
  value: ToolCallResponseInfo;
};
export type ServerEnfiyToolCallConfirmationEvent = {
  type: EnfiyEventType.ToolCallConfirmation;
  value: ServerToolCallConfirmationDetails;
};
export type ServerEnfiyUserCancelledEvent = {
  type: EnfiyEventType.UserCancelled;
};
export type ServerEnfiyErrorEvent = {
  type: EnfiyEventType.Error;
  value: EnfiyErrorEventValue;
};
export interface ChatCompressionInfo {
  originalTokenCount: number;
  newTokenCount: number;
}
export type ServerEnfiyChatCompressedEvent = {
  type: EnfiyEventType.ChatCompressed;
  value: ChatCompressionInfo | null;
};
export type ServerEnfiyUsageMetadataEvent = {
  type: EnfiyEventType.UsageMetadata;
  value: GenerateContentResponseUsageMetadata & {
    apiTimeMs?: number;
  };
};
export type ServerEnfiyStreamEvent =
  | ServerEnfiyContentEvent
  | ServerEnfiyToolCallRequestEvent
  | ServerEnfiyToolCallResponseEvent
  | ServerEnfiyToolCallConfirmationEvent
  | ServerEnfiyUserCancelledEvent
  | ServerEnfiyErrorEvent
  | ServerEnfiyChatCompressedEvent
  | ServerEnfiyUsageMetadataEvent
  | ServerEnfiyThoughtEvent;
export declare class Turn {
  private readonly chat;
  readonly pendingToolCalls: ToolCallRequestInfo[];
  private debugResponses;
  private lastUsageMetadata;
  constructor(chat: EnfiyChat);
  run(
    req: PartListUnion,
    signal: AbortSignal,
  ): AsyncGenerator<ServerEnfiyStreamEvent>;
  private handlePendingFunctionCall;
  getDebugResponses(): GenerateContentResponse[];
  getUsageMetadata(): GenerateContentResponseUsageMetadata | null;
}
