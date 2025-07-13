/**
 * @license
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Box, Text } from 'ink';

// 🔥 InkネイティブなフェニックスカラーASCII art
export const EnfiyAsciiArt: React.FC = () => (
    <Box flexDirection="column" alignItems="flex-start">
      <Text>
        <Text color="redBright">███████╗</Text>
        <Text color="yellow">███╗   ██╗</Text>
        <Text color="red">███████╗</Text>
        <Text color="yellowBright">██╗</Text>
        <Text color="magenta">██╗   ██╗</Text>
      </Text>
      <Text>
        <Text color="yellow">██╔════╝</Text>
        <Text color="red">████╗  ██║</Text>
        <Text color="yellowBright">██╔════╝</Text>
        <Text color="magenta">██║</Text>
        <Text color="redBright">╚██╗ ██╔╝</Text>
      </Text>
      <Text>
        <Text color="red">█████╗  </Text>
        <Text color="yellowBright">██╔██╗ ██║</Text>
        <Text color="magenta">█████╗  </Text>
        <Text color="redBright">██║</Text>
        <Text color="yellow"> ╚████╔╝ </Text>
      </Text>
      <Text>
        <Text color="yellowBright">██╔══╝  </Text>
        <Text color="magenta">██║╚██╗██║</Text>
        <Text color="redBright">██╔══╝  </Text>
        <Text color="yellow">██║</Text>
        <Text color="red">  ╚██╔╝  </Text>
      </Text>
      <Text>
        <Text color="magenta">███████╗</Text>
        <Text color="redBright">██║ ╚████║</Text>
        <Text color="yellow">███████╗</Text>
        <Text color="red">██║</Text>
        <Text color="yellowBright">   ██║   </Text>
      </Text>
      <Text>
        <Text color="redBright">╚══════╝</Text>
        <Text color="yellow">╚═╝  ╚═══╝</Text>
        <Text color="red">╚══════╝</Text>
        <Text color="yellowBright">╚═╝</Text>
        <Text color="magenta">   ╚═╝   </Text>
        <Text color="red" bold>     CLI</Text>
      </Text>
    </Box>
  );