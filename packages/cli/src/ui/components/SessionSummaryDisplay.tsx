/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Modifications Copyright 2025 The Enfiy Community Contributors
 *
 * This file has been modified from its original version by contributors
 * to the Enfiy Community project.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { formatDuration } from '../utils/formatters.js';
import { CumulativeStats } from '../contexts/SessionContext.js';
import { Colors } from '../colors.js';
import { FormattedStats } from './Stats.js';

// --- Prop and Data Structures ---

interface SessionSummaryDisplayProps {
  stats: CumulativeStats;
  duration: string;
}

// --- Main Component ---

// Standard stat row component
const StatRow: React.FC<{
  label: string;
  value: string | number;
  isTotal?: boolean;
}> = ({ label, value, isTotal = false }) => (
  <Box justifyContent="space-between">
    <Text bold={isTotal}>
      {label}
    </Text>
    <Text bold={isTotal}>
      {value}
    </Text>
  </Box>
);

export const SessionSummaryDisplay: React.FC<SessionSummaryDisplayProps> = ({
  stats,
  duration,
}) => {
  const cumulativeFormatted: FormattedStats = {
    inputTokens: stats.promptTokenCount,
    outputTokens: stats.candidatesTokenCount,
    toolUseTokens: stats.toolUsePromptTokenCount,
    thoughtsTokens: stats.thoughtsTokenCount,
    cachedTokens: stats.cachedContentTokenCount,
    totalTokens: stats.totalTokenCount,
  };

  const cachedDisplay =
    stats.totalTokenCount > 0
      ? `${stats.cachedContentTokenCount.toLocaleString()} (${((stats.cachedContentTokenCount / stats.totalTokenCount) * 100).toFixed(1)}%)`
      : stats.cachedContentTokenCount.toLocaleString();

  return (
    <Box
      borderStyle="round"
      borderColor={Colors.BorderGray}
      flexDirection="column"
      paddingY={1}
      paddingX={2}
      alignSelf="flex-start"
      width={66}
    >
      {/* Header */}
      <Box marginBottom={2} justifyContent="center">
        <Text bold>
          Enfiy Code Session Complete!
        </Text>
      </Box>

      {/* Stats Section */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>
          Session Statistics ({stats.turnCount} Turns)
        </Text>
        
        <StatRow
          label="Input Tokens"
          value={cumulativeFormatted.inputTokens.toLocaleString()}
        />
        <StatRow
          label="Output Tokens"
          value={cumulativeFormatted.outputTokens.toLocaleString()}
        />
        {cumulativeFormatted.toolUseTokens > 0 && (
          <StatRow
            label="Tool Use Tokens"
            value={cumulativeFormatted.toolUseTokens.toLocaleString()}
          />
        )}
        <StatRow
          label="Thoughts Tokens"
          value={cumulativeFormatted.thoughtsTokens.toLocaleString()}
        />
        {cumulativeFormatted.cachedTokens > 0 && (
          <StatRow
            label="Cached Tokens"
            value={cachedDisplay}
          />
        )}
        
        {/* Divider */}
        <Box>
          <Text>
            ────────────────────────────────────────────────────────────
          </Text>
        </Box>
        
        <StatRow
          label="Total Tokens"
          value={cumulativeFormatted.totalTokens.toLocaleString()}
          isTotal={true}
        />
      </Box>

      {/* Duration Section */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>
          Performance Metrics
        </Text>
        <StatRow
          label="API Duration"
          value={formatDuration(stats.apiTimeMs)}
        />
        <StatRow
          label="Total Duration"
          value={duration}
        />
      </Box>

      {/* Footer */}
      <Box marginTop={1} justifyContent="center">
        <Text color={Colors.AccentBlue} italic>
          Thank you for using Enfiy Code! 🧡
        </Text>
      </Box>
    </Box>
  );
};
