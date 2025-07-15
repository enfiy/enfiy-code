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
  const modelDisplay = model ? ` ${model}` : '';
  const prefix = '● ';

  return (
    <Box flexDirection="column">
      {/* Model name header */}
      <Box flexDirection="row" marginBottom={0}>
        <Text color={indicatorColor}>{prefix}</Text>
        <Text color={indicatorColor} bold>
          {modelDisplay}
        </Text>
      </Box>

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
