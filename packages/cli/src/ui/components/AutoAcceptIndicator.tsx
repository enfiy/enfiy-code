/**
 * @license
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { ApprovalMode } from '@enfiy/core';

interface AutoAcceptIndicatorProps {
  approvalMode: ApprovalMode;
}

export const AutoAcceptIndicator: React.FC<AutoAcceptIndicatorProps> = ({
  approvalMode,
}) => {
  let textColor = '';
  let textContent = '';
  let subText = '';

  switch (approvalMode) {
    case ApprovalMode.AUTO_EDIT:
      textColor = Colors.AccentGreen;
      textContent = 'accepting edits';
      subText = ' (shift + tab to toggle)';
      break;
    case ApprovalMode.AUTO:
      textColor = Colors.AccentYellow;
      textContent = 'AUTO mode';
      subText = ' (ctrl + y to toggle)';
      break;
    case ApprovalMode.DEFAULT:
    default:
      break;
  }

  return (
    <Box>
      <Text color={textColor}>
        {textContent}
        {subText && <Text color={Colors.Gray}>{subText}</Text>}
      </Text>
    </Box>
  );
};
