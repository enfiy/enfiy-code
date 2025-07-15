/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { shortenPath, tildeifyPath, tokenLimit, ProviderType } from '@enfiy/core';
import { ConsoleSummaryDisplay } from './ConsoleSummaryDisplay.js';
import process from 'node:process';
import { MemoryUsageDisplay } from './MemoryUsageDisplay.js';
import { getApiKey } from '../../utils/secureStorage.js';

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

  // Get authentication type for current model
  const getAuthType = (modelName: string): string => {
    if (!modelName) return '';
    
    let provider: ProviderType | null = null;
    if (modelName.includes('claude') || modelName.includes('anthropic')) {
      provider = ProviderType.ANTHROPIC;
    } else if (modelName.includes('gemini')) {
      provider = ProviderType.GEMINI;
    } else if (modelName.includes('gpt')) {
      provider = ProviderType.OPENAI;
    }
    
    if (!provider) return '';
    
    const apiKey = getApiKey(provider);
    if (!apiKey) return '';
    
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
  const modelDisplay = !model ? (
    <Text color={Colors.Gray}>AI not selected</Text>
  ) : model.includes('llama') || model.includes('phi') || model.includes('qwen') || model.includes('deepseek') ? (
    <Text color={Colors.AccentBlue}>[Local] {model}</Text>
  ) : model.includes('gemini') || model.includes('gpt') || model.includes('claude') || model.includes('anthropic') || model.includes('mistral') ? (
    <Text color={Colors.AccentBlue}>[Cloud] {model}{authType}</Text>
  ) : (
    <Text color={Colors.AccentBlue}>{model}{authType}</Text>
  );

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
              <Text color={Colors.AccentRed}>
                {' '}{debugMessage || '--debug'}
              </Text>
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
            {' '}({((1 - percentage) * 100).toFixed(0)}% context left)
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
                <Text color={Colors.Gray}>({process.env.SEATBELT_PROFILE})</Text>
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
