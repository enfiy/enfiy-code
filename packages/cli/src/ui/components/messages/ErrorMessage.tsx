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
import { Colors } from '../../colors.js';

interface ErrorMessageProps {
  text: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ text }) => {
  const prefix = 'x ';
  const prefixWidth = prefix.length;

  return (
    <Box flexDirection="row" marginBottom={1}>
      <Box width={prefixWidth}>
        <Text color={Colors.AccentRed}>{prefix}</Text>
      </Box>
      <Box flexGrow={1}>
        <Text wrap="wrap" color={Colors.AccentRed}>
          {text}
        </Text>
      </Box>
    </Box>
  );
};
