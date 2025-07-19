/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Text, Box } from 'ink';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
// import { Colors } from '../../colors.js';

interface EnfiyMessageProps {
  text: string;
  isPending: boolean;
  availableTerminalHeight?: number;
  terminalWidth: number;
  model?: string;
}

export const EnfiyMessage: React.FC<EnfiyMessageProps> = ({
  text,
  isPending,
  availableTerminalHeight,
  terminalWidth,
  model,
}) => {
  // Function to determine color based on content type and model
  const getIndicatorColor = () => '#fb923c'; // Always use orange theme color
  const indicatorColor = getIndicatorColor();
  return (
    <Box flexDirection="column">
      {/* Model name header */}
      {model && (
        <Box flexDirection="row" marginBottom={0}>
          <Text color={indicatorColor}>●</Text>
          <Text color={indicatorColor} bold>
            {' '}{model}
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
