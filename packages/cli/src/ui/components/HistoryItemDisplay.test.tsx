/**
 * @license
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from 'ink-testing-library';
import { describe, it, expect, vi } from 'vitest';
import { HistoryItemDisplay } from './HistoryItemDisplay.js';
import { HistoryItem, MessageType } from '../types.js';
import { CumulativeStats } from '../contexts/SessionContext.js';

// Mock child components
vi.mock('./messages/ToolGroupMessage.js', () => ({
  ToolGroupMessage: () => <div />,
}));

describe('<HistoryItemDisplay />', () => {
  const baseItem = {
    id: 1,
    timestamp: 12345,
    isPending: false,
    terminalWidth: 80,
  };

  it('renders UserMessage for "user" type', () => {
    const item: HistoryItem = {
      ...baseItem,
      type: MessageType.USER,
      text: 'Hello',
    };
    const { lastFrame } = render(
      <HistoryItemDisplay {...baseItem} item={item} />,
    );
    expect(lastFrame()).toContain('Hello');
  });

  it('renders StatsDisplay for "stats" type', () => {
    const stats: CumulativeStats = {
      turnCount: 1,
      promptTokenCount: 10,
      candidatesTokenCount: 20,
      totalTokenCount: 30,
      cachedContentTokenCount: 5,
      toolUsePromptTokenCount: 2,
      thoughtsTokenCount: 3,
      apiTimeMs: 123,
    };
    const item: HistoryItem = {
      ...baseItem,
      type: MessageType.STATS,
      stats,
      lastTurnStats: stats,
      duration: '1s',
    };
    const { lastFrame } = render(
      <HistoryItemDisplay {...baseItem} item={item} />,
    );
    expect(lastFrame()).toContain('Stats');
  });

  it('renders AboutBox for "about" type', () => {
    const item: HistoryItem = {
      ...baseItem,
      type: MessageType.ABOUT,
      cliVersion: '1.0.0',
      osVersion: 'test-os',
      sandboxEnv: 'test-env',
      modelVersion: 'test-model',
      selectedAuthType: 'test-auth',
      gcpProject: 'test-project',
    };
    const { lastFrame } = render(
      <HistoryItemDisplay {...baseItem} item={item} />,
    );
    expect(lastFrame()).toContain('About Enfiy Code');
  });

  it('renders SessionSummaryDisplay for "quit" type', () => {
    const stats: CumulativeStats = {
      turnCount: 1,
      promptTokenCount: 10,
      candidatesTokenCount: 20,
      totalTokenCount: 30,
      cachedContentTokenCount: 5,
      toolUsePromptTokenCount: 2,
      thoughtsTokenCount: 3,
      apiTimeMs: 123,
    };
    const item: HistoryItem = {
      ...baseItem,
      type: 'quit',
      stats,
      duration: '1s',
    };
    const { lastFrame } = render(
      <HistoryItemDisplay {...baseItem} item={item} />,
    );
    expect(lastFrame()).toContain('Enfiy Code Session Complete!');
  });
});
