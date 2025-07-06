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
  const getIndicatorColor = () => {
    return '#fb923c'; // Always use orange theme color
  };

  const indicatorColor = getIndicatorColor();
  const modelDisplay = model ? ` ${model}` : '';
  const prefix = '● ';
  
  return (
    <Box flexDirection="column">
      {/* Model name header */}
      <Box flexDirection="row" marginBottom={0}>
        <Text color={indicatorColor}>{prefix}</Text>
        <Text color={indicatorColor} bold>{modelDisplay}</Text>
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
