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
import { Colors } from '../colors.js';
import { shortenPath, tildeifyPath, tokenLimit } from '@enfiy/core';
import { ConsoleSummaryDisplay } from './ConsoleSummaryDisplay.js';
import process from 'node:process';
import { MemoryUsageDisplay } from './MemoryUsageDisplay.js';

interface FooterProps {
  model: string;
  targetDir: string;
  branchName?: string;
  debugMode: boolean;
  debugMessage: string;
  corgiMode: boolean;
  errorCount: number;
  showErrorDetails: boolean;
  showMemoryUsage?: boolean;
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  isSlashCommand?: boolean; // New prop for slash command detection
}

export const Footer: React.FC<FooterProps> = ({
  model,
  targetDir,
  branchName,
  debugMode,
  debugMessage,
  corgiMode,
  errorCount,
  showErrorDetails,
  showMemoryUsage,
  totalTokenCount,
  isSlashCommand = false,
}) => {
  const limit = tokenLimit(model);
  const percentage = totalTokenCount / limit;

  // Model display logic
  const modelDisplay = !model ? (
    <Text color={Colors.Gray}>AI not selected</Text>
  ) : model.includes('llama') || model.includes('mistral') || model.includes('phi') || model.includes('qwen') ? (
    <Text color={Colors.AccentBlue}>[Local] {model}</Text>
  ) : model.includes('gemini') || model.includes('gpt') || model.includes('claude') || model.includes('anthropic') ? (
    <Text color={Colors.AccentBlue}>[Cloud] {model}</Text>
  ) : (
    <Text color={Colors.AccentBlue}>{model}</Text>
  );

  return (
    <Box flexDirection="column" width="100%">
      {/* Model Status at top right */}
      <Box justifyContent="space-between" width="100%" marginBottom={1}>
        <Box flexGrow={1} />
        <Box alignItems="center">
          {modelDisplay}
          <Text color={Colors.Gray}>
            {' '}({((1 - percentage) * 100).toFixed(0)}% context left)
          </Text>
        </Box>
      </Box>

      {/* Details section - hidden when slash command is active */}
      {!isSlashCommand && (
        <Box justifyContent="space-between" width="100%" marginBottom={1}>
          {/* Left: Project info */}
          <Box alignItems="center">
            <Text color={Colors.LightBlue}>
              {shortenPath(tildeifyPath(targetDir), 40)}
              {branchName && <Text color={Colors.Gray}> ({branchName}*)</Text>}
            </Text>
            {debugMode && (
              <Text color={Colors.AccentRed}>
                {' '}{debugMessage || '--debug'}
              </Text>
            )}
          </Box>

          {/* Right: Sandbox and additional info */}
          <Box alignItems="center">
            {/* Sandbox info */}
            {process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec' ? (
              <Text color="green">
                {process.env.SANDBOX.replace(/^gemini-(?:cli-)?/, '')}
              </Text>
            ) : process.env.SANDBOX === 'sandbox-exec' ? (
              <Text color={Colors.AccentYellow}>
                MacOS Seatbelt{' '}
                <Text color={Colors.Gray}>({process.env.SEATBELT_PROFILE})</Text>
              </Text>
            ) : (
              <Text color={Colors.AccentYellow}>
                isolated environment <Text color={Colors.Gray}>(recommended)</Text>
              </Text>
            )}

            {/* Corgi mode */}
            {corgiMode && (
              <>
                <Text color={Colors.Gray}> | </Text>
                <Text color={Colors.AccentRed}>▼</Text>
                <Text color={Colors.Foreground}>(´</Text>
                <Text color={Colors.AccentRed}>ᴥ</Text>
                <Text color={Colors.Foreground}>`)</Text>
                <Text color={Colors.AccentRed}>▼</Text>
              </>
            )}

            {/* Error display */}
            {!showErrorDetails && errorCount > 0 && (
              <>
                <Text color={Colors.Gray}> | </Text>
                <ConsoleSummaryDisplay errorCount={errorCount} />
              </>
            )}

            {/* Memory usage */}
            {showMemoryUsage && (
              <>
                <Text color={Colors.Gray}> | </Text>
                <MemoryUsageDisplay />
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
