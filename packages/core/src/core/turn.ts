/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  PartListUnion,
  GenerateContentResponse,
  FunctionCall,
  FunctionDeclaration,
  GenerateContentResponseUsageMetadata,
} from '@google/genai';
import {
  ToolCallConfirmationDetails,
  ToolResult,
  ToolResultDisplay,
} from '../tools/tools.js';
import { getResponseText } from '../utils/generateContentResponseUtilities.js';
import { reportError } from '../utils/errorReporting.js';
import { getErrorMessage } from '../utils/errors.js';
import { EnfiyChat } from './enfiyChat.js';
import { UnauthorizedError, toFriendlyError } from '../utils/errors.js';

// Define a structure for tools passed to the server
export interface ServerTool {
  name: string;
  schema: FunctionDeclaration;
  // The execute method signature might differ slightly or be wrapped
  execute(
    params: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ToolResult>;
  shouldConfirmExecute(
    params: Record<string, unknown>,
    abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails | false>;
}

export enum EnfiyEventType {
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
  value: GenerateContentResponseUsageMetadata & { apiTimeMs?: number };
};

// The original union type, now composed of the individual types
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

// A turn manages the agentic loop turn within the server context.
export class Turn {
  readonly pendingToolCalls: ToolCallRequestInfo[];
  private debugResponses: GenerateContentResponse[];
  private lastUsageMetadata: GenerateContentResponseUsageMetadata | null = null;

  constructor(private readonly chat: EnfiyChat) {
    this.pendingToolCalls = [];
    this.debugResponses = [];
  }
  // The run method yields simpler events suitable for server logic
  async *run(
    req: PartListUnion,
    signal: AbortSignal,
  ): AsyncGenerator<ServerEnfiyStreamEvent> {
    const startTime = Date.now();
    try {
      const responseStream = await this.chat.sendMessageStream({
        message: req,
        config: {
          abortSignal: signal,
        },
      });

      for await (const resp of responseStream) {
        if (signal?.aborted) {
          yield { type: EnfiyEventType.UserCancelled };
          // Do not add resp to debugResponses if aborted before processing
          return;
        }
        this.debugResponses.push(resp);

        const thoughtPart = resp.candidates?.[0]?.content?.parts?.[0];
        if (thoughtPart?.thought) {
          // Thought always has a bold "subject" part enclosed in double asterisks
          // (e.g., **Subject**). The rest of the string is considered the description.
          const rawText = thoughtPart.text ?? '';
          const subjectStringMatches = rawText.match(/\*\*(.*?)\*\*/s);
          const subject = subjectStringMatches
            ? subjectStringMatches[1].trim()
            : '';
          const description = rawText.replace(/\*\*(.*?)\*\*/s, '').trim();
          const thought: ThoughtSummary = {
            subject,
            description,
          };

          yield {
            type: EnfiyEventType.Thought,
            value: thought,
          };
          continue;
        }

        const text = getResponseText(resp);
        if (text) {
          yield { type: EnfiyEventType.Content, value: text };
        }

        // Handle function calls (requesting tool execution)
        const functionCalls = resp.functionCalls ?? [];
        for (const fnCall of functionCalls) {
          const event = this.handlePendingFunctionCall(fnCall);
          if (event) {
            yield event;
          }
        }

        if (resp.usageMetadata) {
          this.lastUsageMetadata =
            resp.usageMetadata as GenerateContentResponseUsageMetadata;
        }
      }

      if (this.lastUsageMetadata) {
        const durationMs = Date.now() - startTime;
        yield {
          type: EnfiyEventType.UsageMetadata,
          value: { ...this.lastUsageMetadata, apiTimeMs: durationMs },
        };
      }
    } catch (e) {
      const error = toFriendlyError(e);
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      if (signal.aborted) {
        yield { type: EnfiyEventType.UserCancelled };
        // Regular cancellation error, fail gracefully.
        return;
      }

      const contextForReport = [...this.chat.getHistory(/*curated*/ true), req];
      await reportError(
        error,
        'Error when talking to Enfiy API',
        contextForReport,
        'Turn.run-sendMessageStream',
      );
      const status =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof (error as { status: unknown }).status === 'number'
          ? (error as { status: number }).status
          : undefined;
      const structuredError: StructuredError = {
        message: getErrorMessage(error),
        status,
      };
      yield { type: EnfiyEventType.Error, value: { error: structuredError } };
      return;
    }
  }

  private handlePendingFunctionCall(
    fnCall: FunctionCall,
  ): ServerEnfiyStreamEvent | null {
    const callId =
      fnCall.id ??
      `${fnCall.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const name = fnCall.name || 'undefined_tool_name';
    const args = (fnCall.args || {}) as Record<string, unknown>;

    const toolCallRequest: ToolCallRequestInfo = {
      callId,
      name,
      args,
      isClientInitiated: false,
    };

    this.pendingToolCalls.push(toolCallRequest);

    // Yield a request for the tool call, not the pending/confirming status
    return { type: EnfiyEventType.ToolCallRequest, value: toolCallRequest };
  }

  getDebugResponses(): GenerateContentResponse[] {
    return this.debugResponses;
  }

  getUsageMetadata(): GenerateContentResponseUsageMetadata | null {
    return this.lastUsageMetadata;
  }
}
