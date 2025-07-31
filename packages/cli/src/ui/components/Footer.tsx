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
import {
  shortenPath,
  tildeifyPath,
  tokenLimit,
  ApprovalMode,
} from '@enfiy/core';
import { ConsoleSummaryDisplay } from './ConsoleSummaryDisplay.js';
import process from 'node:process';
import { MemoryUsageDisplay } from './MemoryUsageDisplay.js';
import { getApiKey } from '../../utils/secureStorage.js';
import {
  getProviderFromModel,
  isLocalModel,
  getProviderDisplayNameFromModel,
} from '../../utils/modelUtils.js';
import { ProviderType } from '@enfiy/core';

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
  selectedProvider?: string; // Provider context for accurate provider determination
  approvalMode?: ApprovalMode; // Auto-approval mode detection
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
  selectedProvider,
  approvalMode: _approvalMode,
}) => {
  const limit = tokenLimit(model);
  const percentage = totalTokenCount / limit;

  // Check if current model's provider has valid credentials
  const isModelAvailable = (modelName: string): boolean => {
    if (!modelName) return false;

    const provider = getProviderFromModel(modelName, selectedProvider);

    // For Ollama, check if it's actually running and model exists
    if (provider === ProviderType.OLLAMA) {
      // Since we can't do async checks here, we'll rely on the model being set
      // If a model is set for Ollama, we assume it's available
      // The actual availability check happens during provider setup
      return true;
    }

    // Local models (non-Ollama) are always available
    if (isLocalModel(modelName)) {
      return true;
    }

    if (!provider) return true; // Unknown models are assumed available

    const apiKey = getApiKey(provider);
    return !!apiKey; // Return true if API key exists
  };

  // Get authentication type for current model
  const getAuthType = (modelName: string): string => {
    if (!modelName) return '';

    const provider = getProviderFromModel(modelName, selectedProvider);
    if (!provider) return '';

    const apiKey = getApiKey(provider);
    if (!apiKey) return ' (No API Key)';

    // Check for local providers
    if (isLocalModel(modelName)) return ' (Local)';

    // Check for subscription authentication (Claude Pro/Max)
    if (apiKey.includes('CLAUDE_PRO_OAUTH')) return ' (Pro OAuth)';
    if (apiKey.includes('CLAUDE_MAX_OAUTH')) return ' (Max OAuth)';
    if (apiKey.includes('CLAUDE_PRO_SUBSCRIPTION')) return ' (Pro Sub)';
    if (apiKey.includes('CLAUDE_MAX_SUBSCRIPTION')) return ' (Max Sub)';

    // OAuth authentication is no longer supported
    // if (apiKey === 'OAUTH_AUTHENTICATED' || apiKey.includes('OAUTH')) return ' (OAuth)';

    // Check for subscription plans (non-Claude)
    if (apiKey.includes('SUBSCRIPTION') || apiKey.includes('SUB_'))
      return ' (Subscription)';
    if (apiKey.includes('PRO_') || apiKey.includes('PREMIUM_')) return ' (Pro)';
    if (apiKey.includes('ENTERPRISE_')) return ' (Enterprise)';

    // Regular API key authentication
    return ' (API Key)';
  };

  // Model display logic with authentication type
  const authType = getAuthType(model);
  const modelAvailable = isModelAvailable(model);

  const modelDisplay = !model ? (
    <Text color={Colors.Gray}>Select AI provider and model</Text>
  ) : !modelAvailable ? (
    <Text color={Colors.Gray}>Select AI provider and model</Text>
  ) : (
    (() => {
      const providerName = getProviderDisplayNameFromModel(
        model,
        selectedProvider,
      );
      const isLocal = isLocalModel(model);
      const category = isLocal ? 'Local' : 'Cloud';
      const displayName = providerName ? `${providerName} ` : '';

      // Clean up model name display for OpenRouter models
      const cleanModelName = (() => {
        if (providerName === 'OpenRouter' && model.includes('/')) {
          return model.split('/')[1]; // Remove provider prefix for OpenRouter models
        }
        return model;
      })();

      return (
        <Text color={Colors.AccentBlue}>
          [{category}] {displayName}
          {cleanModelName}
          {authType}
        </Text>
      );
    })()
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
              <>
                {(() => {
                  const provider = getProviderFromModel(
                    model,
                    selectedProvider,
                  );
                  const apiKey = provider ? getApiKey(provider) : null;

                  if (isLocalModel(model)) {
                    return (
                      <Text color="green">
                        Connection: Local AI{' '}
                        <Text color={Colors.Gray}>(private, secure)</Text>
                      </Text>
                    );
                  }

                  if (!apiKey) {
                    return (
                      <Text color={Colors.AccentRed}>
                        Connection: Not configured{' '}
                        <Text color={Colors.Gray}>(no authentication)</Text>
                      </Text>
                    );
                  }

                  // OAuth authentication is no longer supported
                  // if (apiKey === 'OAUTH_AUTHENTICATED' || apiKey.includes('OAUTH')) {
                  //   return (
                  //     <Text color="green">
                  //       Connection: OAuth <Text color={Colors.Gray}>(secure, token-based)</Text>
                  //     </Text>
                  //   );
                  // }

                  // Subscription authentication (secure, paid)
                  if (
                    apiKey.includes('SUBSCRIPTION') ||
                    apiKey.includes('PRO_') ||
                    apiKey.includes('CLAUDE_PRO')
                  ) {
                    return (
                      <Text color="green">
                        Connection: Subscription{' '}
                        <Text color={Colors.Gray}>(secure, paid plan)</Text>
                      </Text>
                    );
                  }

                  // API Key authentication (standard)
                  return (
                    <Text color={Colors.AccentYellow}>
                      Connection: API Key{' '}
                      <Text color={Colors.Gray}>(external service)</Text>
                    </Text>
                  );
                })()}
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
