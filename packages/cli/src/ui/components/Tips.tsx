/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { type Config } from '@enfiy/core';
import { t } from '../utils/i18n.js';

interface TipsProps {
  config: Config;
}

export const Tips: React.FC<TipsProps> = ({ config }) => {
  const _enfiyMdFileCount = config.getEnfiyMdFileCount(); // TODO: rename this method
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={Colors.AccentBlue} bold>
        {t('tipsTitle')}
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Box flexDirection="row">
          <Box width={10}>
            <Text bold color={Colors.AccentBlue}>/provider</Text>
          </Box>
          <Text color={Colors.Foreground}>- {t('tipProvider')}</Text>
        </Box>
        <Box flexDirection="row">
          <Box width={10}>
            <Text bold color={Colors.AccentBlue}>/mcp</Text>
          </Box>
          <Text color={Colors.Foreground}>- {t('tipMcp')}</Text>
        </Box>
        <Box flexDirection="row">
          <Box width={10}>
            <Text bold color={Colors.AccentBlue}>/tool</Text>
          </Box>
          <Text color={Colors.Foreground}>- {t('tipTool')}</Text>
        </Box>
        <Box flexDirection="row">
          <Box width={10}>
            <Text bold color={Colors.AccentBlue}>/help</Text>
          </Box>
          <Text color={Colors.Foreground}>- {t('tipHelp')}</Text>
        </Box>
        <Box flexDirection="row">
          <Box width={10}>
            <Text bold color={Colors.AccentBlue}>/bug</Text>
          </Box>
          <Text color={Colors.Foreground}>- {t('tipBug')}</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text color={Colors.Foreground}>{t('tipGeneral')}</Text>
        </Box>
      </Box>
    </Box>
  );
};
