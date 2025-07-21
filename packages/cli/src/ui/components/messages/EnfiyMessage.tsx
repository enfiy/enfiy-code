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
import { Text, Box } from 'ink';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { getProviderFromModel, Config } from '@enfiy/core';
// import { Colors } from '../../colors.js';

interface EnfiyMessageProps {
  text: string;
  isPending: boolean;
  availableTerminalHeight?: number;
  terminalWidth: number;
  model?: string;
  config?: Config;
}

export const EnfiyMessage: React.FC<EnfiyMessageProps> = ({
  text,
  isPending,
  availableTerminalHeight,
  terminalWidth,
  model,
  config: _config,
}) => {
  // Function to determine color based on content type and model
  const getIndicatorColor = () => '#fb923c'; // Always use orange theme color
  const indicatorColor = getIndicatorColor();

  // Get provider information for display
  const getModelDisplayText = (modelName: string): string => {
    const provider = getProviderFromModel(modelName);

    if (provider) {
      // Special cases for better display names
      const displayNames: Record<string, string> = {
        openai: 'OpenAI',
        anthropic: 'Anthropic',
        gemini: 'Gemini',
        mistral: 'Mistral',
        ollama: 'Ollama',
        huggingface: 'HuggingFace',
        openrouter: 'OpenRouter',
      };

      // Capitalize provider name for display as fallback
      const fallbackDisplayName =
        provider.charAt(0).toUpperCase() + provider.slice(1);
      const displayName = displayNames[provider] || fallbackDisplayName;
      return `${displayName}: ${modelName}`;
    }
    return modelName;
  };

  return (
    <Box flexDirection="column">
      {/* Model name header */}
      {model && (
        <Box flexDirection="row" marginBottom={0}>
          <Text color={indicatorColor}>●</Text>
          <Text color={indicatorColor} bold>
            {' '}
            {getModelDisplayText(model)}
          </Text>
        </Box>
      )}

      {/* Message content with indentation */}
      <Box flexDirection="column" paddingLeft={2}>
        <MarkdownDisplay
          text={text}
          isPending={isPending}
          availableTerminalHeight={availableTerminalHeight}
          terminalWidth={terminalWidth}
        />
      </Box>
    </Box>
  );
};
