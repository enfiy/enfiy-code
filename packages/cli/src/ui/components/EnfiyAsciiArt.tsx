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