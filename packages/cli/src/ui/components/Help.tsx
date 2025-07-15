/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { SlashCommand } from '../hooks/slashCommandProcessor.js';

export interface Help {
  commands: SlashCommand[];
}

export const Help: React.FC<Help> = ({ commands }) => (
  <Box
    flexDirection="column"
    marginBottom={1}
    borderColor={Colors.BorderGray}
    borderStyle="round"
    padding={1}
  >
    {/* Basics */}
    <Text bold color={Colors.Foreground}>
      Basics:
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentBlue}>
        Add context
      </Text>
      : Use{' '}
      <Text bold color={Colors.AccentBlue}>
        @
      </Text>{' '}
      to specify files for context (e.g.,{' '}
      <Text bold color={Colors.AccentBlue}>
        @src/myFile.ts
      </Text>
      ) to target specific files or folders.
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentBlue}>
        Shell mode
      </Text>
      : Execute shell commands via{' '}
      <Text bold color={Colors.AccentBlue}>
        !
      </Text>{' '}
      (e.g.,{' '}
      <Text bold color={Colors.AccentBlue}>
        !npm run start
      </Text>
      ) or use natural language (e.g.{' '}
      <Text bold color={Colors.AccentBlue}>
        start server
      </Text>
      ).
    </Text>

    <Box height={1} />

    {/* Commands */}
    <Text bold color={Colors.Foreground}>
      Commands:
    </Text>
    {commands
      .filter((command) => command.description)
      .map((command: SlashCommand) => (
        <Text key={command.name} color={Colors.Foreground}>
          <Text bold color={Colors.AccentBlue}>
            {' '}
            /{command.name}
          </Text>
          {command.description && ' - ' + command.description}
        </Text>
      ))}
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentBlue}>
        {' '}
        !{' '}
      </Text>
      - shell command
    </Text>

    <Box height={1} />

    {/* Shortcuts */}
    <Text bold color={Colors.Foreground}>
      Keyboard Shortcuts:
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentBlue}>
        Enter
      </Text>{' '}
      - Send message
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentBlue}>
        Shift+Enter
      </Text>{' '}
      - New line
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentBlue}>
        Up/Down
      </Text>{' '}
      - Cycle through your prompt history
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentBlue}>
        Alt+Left/Right
      </Text>{' '}
      - Jump through words in the input
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentBlue}>
        Esc
      </Text>{' '}
      - Cancel operation
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentBlue}>
        Ctrl+C
      </Text>{' '}
      - Quit application
    </Text>
  </Box>
);
