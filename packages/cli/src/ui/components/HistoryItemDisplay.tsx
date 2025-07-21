/**
 * @license
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { HistoryItem } from '../types.js';
import { UserMessage } from './messages/UserMessage.js';
import { UserShellMessage } from './messages/UserShellMessage.js';
import { EnfiyMessage } from './messages/EnfiyMessage.js';
import { InfoMessage } from './messages/InfoMessage.js';
import { ErrorMessage } from './messages/ErrorMessage.js';
import { ToolGroupMessage } from './messages/ToolGroupMessage.js';
import { EnfiyMessageContent } from './messages/EnfiyMessageContent.js';
import { CompressionMessage } from './messages/CompressionMessage.js';
import { Box } from 'ink';
import { AboutBox } from './AboutBox.js';
import { StatsDisplay } from './StatsDisplay.js';
import { SessionSummaryDisplay } from './SessionSummaryDisplay.js';
import { Config } from '@enfiy/core';

interface HistoryItemDisplayProps {
  item: HistoryItem;
  availableTerminalHeight?: number;
  terminalWidth: number;
  isPending: boolean;
  config?: Config;
  isFocused?: boolean;
}

export const HistoryItemDisplay: React.FC<HistoryItemDisplayProps> = ({
  item,
  availableTerminalHeight,
  terminalWidth,
  isPending,
  config,
  isFocused = true,
}) => (
  <Box flexDirection="column" key={item.id}>
    {/* Render standard message types */}
    {item.type === 'user' && <UserMessage text={item.text} />}
    {item.type === 'user_shell' && <UserShellMessage text={item.text} />}
    {item.type === 'enfiy' && (
      <EnfiyMessage
        text={item.text}
        isPending={isPending}
        availableTerminalHeight={availableTerminalHeight}
        terminalWidth={terminalWidth}
        model={item.model}
        config={config}
      />
    )}
    {item.type === 'enfiy_content' && (
      <EnfiyMessageContent
        text={item.text}
        isPending={isPending}
        availableTerminalHeight={availableTerminalHeight}
        terminalWidth={terminalWidth}
      />
    )}
    {item.type === 'info' && <InfoMessage text={item.text} />}
    {item.type === 'error' && <ErrorMessage text={item.text} />}
    {item.type === 'about' && (
      <AboutBox
        cliVersion={item.cliVersion}
        osVersion={item.osVersion}
        sandboxEnv={item.sandboxEnv}
        modelVersion={item.modelVersion}
        selectedAuthType={item.selectedAuthType}
        gcpProject={item.gcpProject}
      />
    )}
    {item.type === 'stats' && (
      <StatsDisplay
        stats={item.stats}
        lastTurnStats={item.lastTurnStats}
        duration={item.duration}
      />
    )}
    {item.type === 'quit' && (
      <SessionSummaryDisplay stats={item.stats} duration={item.duration} />
    )}
    {item.type === 'tool_group' && (
      <ToolGroupMessage
        toolCalls={item.tools}
        groupId={item.id}
        availableTerminalHeight={availableTerminalHeight}
        terminalWidth={terminalWidth}
        config={config}
        isFocused={isFocused}
      />
    )}
    {item.type === 'compression' && (
      <CompressionMessage compression={item.compression} />
    )}
  </Box>
);
