/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import {
  shortenPath,
  tildeifyPath,
  tokenLimit,
} from '@enfiy/core';
import { ConsoleSummaryDisplay } from './ConsoleSummaryDisplay.js';
import process from 'node:process';
import { MemoryUsageDisplay } from './MemoryUsageDisplay.js';
import { getApiKey } from '../../utils/secureStorage.js';
import { getProviderFromModel, isLocalModel, getProviderDisplayNameFromModel } from '../../utils/modelUtils.js';

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

  // Check if current model's provider has valid credentials
  const isModelAvailable = (modelName: string): boolean => {
    if (!modelName) return false;

    // Local models are always available
    if (isLocalModel(modelName)) {
      return true;
    }

    const provider = getProviderFromModel(modelName);
    if (!provider) return true; // Unknown models are assumed available

    const apiKey = getApiKey(provider);
    return !!apiKey; // Return true if API key exists
  };

  // Get authentication type for current model
  const getAuthType = (modelName: string): string => {
    if (!modelName) return '';

    const provider = getProviderFromModel(modelName);
    if (!provider) return '';

    const apiKey = getApiKey(provider);
    if (!apiKey) return ' (No API Key)';

    // Check for subscription authentication
    if (apiKey.includes('CLAUDE_PRO_OAUTH')) return ' (Pro)';
    if (apiKey.includes('CLAUDE_MAX_OAUTH')) return ' (Max)';
    if (apiKey.includes('CLAUDE_PRO_SUBSCRIPTION')) return ' (Pro)';
    if (apiKey.includes('CLAUDE_MAX_SUBSCRIPTION')) return ' (Max)';
    if (apiKey === 'OAUTH_AUTHENTICATED') return ' (OAuth)';

    // Regular API key
    return ' (API)';
  };

  // Model display logic with authentication type
  const authType = getAuthType(model);
  const modelAvailable = isModelAvailable(model);
  
  const modelDisplay = !model ? (
    <Text color={Colors.Gray}>Select AI provider and model</Text>
  ) : !modelAvailable ? (
    <Text color={Colors.Gray}>Select AI provider and model</Text>
  ) : (() => {
    const providerName = getProviderDisplayNameFromModel(model);
    const isLocal = isLocalModel(model);
    const category = isLocal ? 'Local' : 'Cloud';
    const displayName = providerName ? `${providerName} ` : '';
    
    return (
      <Text color={Colors.AccentBlue}>
        [{category}] {displayName}{model}
        {authType}
      </Text>
    );
  })();

  return (
    <Box flexDirection="column" width="100%">
      {/* First line: Directory info and Model status */}
      <Box justifyContent="space-between" width="100%">
        {/* Left: Project info - hidden when slash command is active */}
        {!isSlashCommand ? (
          <Box alignItems="center">
            <Text color={Colors.LightBlue}>
              {shortenPath(tildeifyPath(targetDir), 40)}
              {branchName && <Text color={Colors.Gray}> ({branchName}*)</Text>}
            </Text>
            {debugMode && (
              <Text color={Colors.AccentRed}> {debugMessage || '--debug'}</Text>
            )}

            {/* Additional info on same line */}
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
        ) : (
          <Box flexGrow={1} />
        )}

        {/* Right: Model status */}
        <Box alignItems="center">
          {modelDisplay}
          <Text color={Colors.Gray}>
            {' '}
            ({((1 - percentage) * 100).toFixed(0)}% context left)
          </Text>
        </Box>
      </Box>

      {/* Second line: Environment info (right-aligned) - hidden when slash command is active */}
      {!isSlashCommand && (
        <Box justifyContent="flex-end" width="100%">
          <Box alignItems="center">
            {process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec' ? (
              <Text color="green">
                {process.env.SANDBOX.replace(/^gemini-(?:cli-)?/, '')}
              </Text>
            ) : process.env.SANDBOX === 'sandbox-exec' ? (
              <Text color={Colors.AccentYellow}>
                MacOS Seatbelt{' '}
                <Text color={Colors.Gray}>
                  ({process.env.SEATBELT_PROFILE})
                </Text>
              </Text>
            ) : (
              <Text color={Colors.AccentYellow}>
                Private work room <Text color={Colors.Gray}>(recommended)</Text>
              </Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
