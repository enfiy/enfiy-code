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
import { CompressionProps } from '../../types.js';
import Spinner from 'ink-spinner';
import { Colors } from '../../colors.js';

export interface CompressionDisplayProps {
  compression: CompressionProps;
}

/*
 * Compression messages appear when the /compress command is ran, and show a loading spinner
 * while compression is in progress, followed up by some compression stats.
 */
export const CompressionMessage: React.FC<CompressionDisplayProps> = ({
  compression,
}) => {
  const text = compression.isPending
    ? 'Compressing chat history'
    : `Chat history compressed from ${compression.originalTokenCount ?? 'unknown'}` +
      ` to ${compression.newTokenCount ?? 'unknown'} tokens.`;

  return (
    <Box flexDirection="row">
      <Box marginRight={1}>
        {compression.isPending ? (
          <Spinner type="dots" />
        ) : (
          <Text color={Colors.AccentBlue}>*</Text>
        )}
      </Box>
      <Box>
        <Text
          color={compression.isPending ? Colors.AccentBlue : Colors.AccentGreen}
        >
          {text}
        </Text>
      </Box>
    </Box>
  );
};
