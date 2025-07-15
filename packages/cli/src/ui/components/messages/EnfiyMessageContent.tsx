/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box } from 'ink';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';

interface EnfiyMessageContentProps {
  text: string;
  isPending: boolean;
  availableTerminalHeight?: number;
  terminalWidth: number;
}

/*
 * Enfiy message content is a semi-hacked component. The intention is to represent a partial
 * of EnfiyMessage and is only used when a response gets too long. In that instance messages
 * are split into multiple EnfiyMessageContent's to enable the root <Static> component in
 * App.tsx to be as performant as humanly possible.
 */
export const EnfiyMessageContent: React.FC<EnfiyMessageContentProps> = ({
  text,
  isPending,
  availableTerminalHeight,
  terminalWidth,
}) => (
  // Keep consistent indentation with EnfiyMessage (2 spaces for content)
  <Box flexDirection="column" paddingLeft={2}>
    <MarkdownDisplay
      text={text}
      isPending={isPending}
      availableTerminalHeight={availableTerminalHeight}
      terminalWidth={terminalWidth}
    />
  </Box>
);
