/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as readline from 'readline';
import {
  fromCountTokenResponse,
  fromGenerateContentResponse,
  toCountTokenRequest,
  toGenerateContentRequest,
} from './converter.js';
// TODO: Use production endpoint once it supports our methods.
export const CODE_ASSIST_ENDPOINT =
  process.env.CODE_ASSIST_ENDPOINT ?? 'https://cloudcode-pa.googleapis.com';
export const CODE_ASSIST_API_VERSION = 'v1internal';
export class CodeAssistServer {
  auth;
  projectId;
  httpOptions;
  constructor(auth, projectId, httpOptions = {}) {
    this.auth = auth;
    this.projectId = projectId;
    this.httpOptions = httpOptions;
  }
  async generateContentStream(req) {
    const resps = await this.streamEndpoint(
      'streamGenerateContent',
      toGenerateContentRequest(req, this.projectId),
      req.config?.abortSignal,
    );
    return (async function* () {
      for await (const resp of resps) {
        yield fromGenerateContentResponse(resp);
      }
    })();
  }
  async generateContent(req) {
    const resp = await this.callEndpoint(
      'generateContent',
      toGenerateContentRequest(req, this.projectId),
      req.config?.abortSignal,
    );
    return fromGenerateContentResponse(resp);
  }
  async onboardUser(req) {
    return await this.callEndpoint('onboardUser', req);
  }
  async loadCodeAssist(req) {
    return await this.callEndpoint('loadCodeAssist', req);
  }
  async getCodeAssistGlobalUserSetting() {
    return await this.getEndpoint('getCodeAssistGlobalUserSetting');
  }
  async setCodeAssistGlobalUserSetting(req) {
    return await this.callEndpoint('setCodeAssistGlobalUserSetting', req);
  }
  async countTokens(req) {
    const resp = await this.callEndpoint(
      'countTokens',
      toCountTokenRequest(req),
    );
    return fromCountTokenResponse(resp);
  }
  async embedContent(_req) {
    throw Error();
  }
  async callEndpoint(method, req, signal) {
    const res = await this.auth.request({
      url: `${CODE_ASSIST_ENDPOINT}/${CODE_ASSIST_API_VERSION}:${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.httpOptions.headers,
      },
      responseType: 'json',
      body: JSON.stringify(req),
      signal,
    });
    return res.data;
  }
  async getEndpoint(method, signal) {
    const res = await this.auth.request({
      url: `${CODE_ASSIST_ENDPOINT}/${CODE_ASSIST_API_VERSION}:${method}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.httpOptions.headers,
      },
      responseType: 'json',
      signal,
    });
    return res.data;
  }
  async streamEndpoint(method, req, signal) {
    const res = await this.auth.request({
      url: `${CODE_ASSIST_ENDPOINT}/${CODE_ASSIST_API_VERSION}:${method}`,
      method: 'POST',
      params: {
        alt: 'sse',
      },
      headers: {
        'Content-Type': 'application/json',
        ...this.httpOptions.headers,
      },
      responseType: 'stream',
      body: JSON.stringify(req),
      signal,
    });
    return (async function* () {
      const rl = readline.createInterface({
        input: res.data,
        crlfDelay: Infinity, // Recognizes '\r\n' and '\n' as line breaks
      });
      let bufferedLines = [];
      for await (const line of rl) {
        // blank lines are used to separate JSON objects in the stream
        if (line === '') {
          if (bufferedLines.length === 0) {
            continue; // no data to yield
          }
          yield JSON.parse(bufferedLines.join('\n'));
          bufferedLines = []; // Reset the buffer after yielding
        } else if (line.startsWith('data: ')) {
          bufferedLines.push(line.slice(6).trim());
        } else {
          throw new Error(`Unexpected line format in response: ${line}`);
        }
      }
    })();
  }
}
//# sourceMappingURL=server.js.map
