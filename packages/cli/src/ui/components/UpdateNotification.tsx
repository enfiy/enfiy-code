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

import { Box, Text } from 'ink';
import { Colors } from '../colors.js';

interface UpdateNotificationProps {
  message: string;
}

export const UpdateNotification = ({ message }: UpdateNotificationProps) => (
  <Box
    borderStyle="round"
    borderColor={Colors.AccentYellow}
    paddingX={1}
    marginY={1}
  >
    <Text color={Colors.AccentYellow}>{message}</Text>
  </Box>
);
