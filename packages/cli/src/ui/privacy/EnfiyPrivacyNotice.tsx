/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Newline, Text, useInput } from 'ink';
import { Colors } from '../colors.js';

interface EnfiyPrivacyNoticeProps {
  onExit: () => void;
}

export const EnfiyPrivacyNotice = ({ onExit }: EnfiyPrivacyNoticeProps) => {
  useInput((_input, key) => {
    if (key.escape) {
      onExit();
    }
  });

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={Colors.AccentBlue}>
        Private Work Room - API Key Authentication
      </Text>
      <Newline />
      <Text>
        🔒 <Text color={Colors.AccentGreen}>Your data stays private</Text> when
        using API key authentication. All processing happens in your private
        work room environment.
      </Text>
      <Newline />
      <Text>
        ✓ <Text color={Colors.AccentBlue}>Local processing</Text> - Your code
        and conversations are processed locally
      </Text>
      <Text>
        ✓ <Text color={Colors.AccentGreen}>No data sharing</Text> - We
        don&apos;t store or share your data
      </Text>
      <Text>
        ✓ <Text color={Colors.AccentYellow}>Full control</Text> - You control
        where your API requests go
      </Text>
      <Newline />
      <Text>
        When using cloud AI providers with API keys, your data is sent directly
        to the provider according to their terms of service. Enfiy Code acts as
        a secure client.
      </Text>
      <Newline />
      <Text color={Colors.Gray}>
        For more information about privacy and security, visit:
      </Text>
      <Text color={Colors.AccentBlue}>
        https://github.com/enfiy/enfiy-code/blob/main/docs/privacy-security.md
      </Text>
      <Newline />
      <Text color={Colors.Gray}>Press Esc to exit.</Text>
    </Box>
  );
};
