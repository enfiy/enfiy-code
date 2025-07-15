/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import { getResponseText } from '../utils/generateContentResponseUtilities.js';
import { reportError } from '../utils/errorReporting.js';
import { getErrorMessage } from '../utils/errors.js';
import { UnauthorizedError, toFriendlyError } from '../utils/errors.js';
export let EnfiyEventType;
(function (EnfiyEventType) {
    EnfiyEventType["Content"] = "content";
    EnfiyEventType["ToolCallRequest"] = "tool_call_request";
    EnfiyEventType["ToolCallResponse"] = "tool_call_response";
    EnfiyEventType["ToolCallConfirmation"] = "tool_call_confirmation";
    EnfiyEventType["UserCancelled"] = "user_cancelled";
    EnfiyEventType["Error"] = "error";
    EnfiyEventType["ChatCompressed"] = "chat_compressed";
    EnfiyEventType["UsageMetadata"] = "usage_metadata";
    EnfiyEventType["Thought"] = "thought";
})(EnfiyEventType || (EnfiyEventType = {}));
// A turn manages the agentic loop turn within the server context.
export class Turn {
    chat;
    pendingToolCalls;
    debugResponses;
    lastUsageMetadata = null;
    constructor(chat) {
        this.chat = chat;
        this.pendingToolCalls = [];
        this.debugResponses = [];
    }
    // The run method yields simpler events suitable for server logic
    async *run(req, signal) {
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
                    const thought = {
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
                        resp.usageMetadata;
                }
            }
            if (this.lastUsageMetadata) {
                const durationMs = Date.now() - startTime;
                yield {
                    type: EnfiyEventType.UsageMetadata,
                    value: { ...this.lastUsageMetadata, apiTimeMs: durationMs },
                };
            }
        }
        catch (e) {
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
            await reportError(error, 'Error when talking to Enfiy API', contextForReport, 'Turn.run-sendMessageStream');
            const status = typeof error === 'object' &&
                error !== null &&
                'status' in error &&
                typeof error.status === 'number'
                ? error.status
                : undefined;
            const structuredError = {
                message: getErrorMessage(error),
                status,
            };
            yield { type: EnfiyEventType.Error, value: { error: structuredError } };
            return;
        }
    }
    handlePendingFunctionCall(fnCall) {
        const callId = fnCall.id ??
            `${fnCall.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const name = fnCall.name || 'undefined_tool_name';
        const args = (fnCall.args || {});
        const toolCallRequest = {
            callId,
            name,
            args,
            isClientInitiated: false,
        };
        this.pendingToolCalls.push(toolCallRequest);
        // Yield a request for the tool call, not the pending/confirming status
        return { type: EnfiyEventType.ToolCallRequest, value: toolCallRequest };
    }
    getDebugResponses() {
        return this.debugResponses;
    }
    getUsageMetadata() {
        return this.lastUsageMetadata;
    }
}
//# sourceMappingURL=turn.js.map