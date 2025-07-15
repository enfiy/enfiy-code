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
        <Text color={Colors.Foreground}>
          <Text bold color={Colors.AccentBlue}>
            /provider
          </Text>{' '}
          - {t('tipProvider')}
        </Text>
        <Text color={Colors.Foreground}>
          <Text bold color={Colors.AccentBlue}>
            /mcp
          </Text>{' '}
          - {t('tipMcp')}
        </Text>
        <Text color={Colors.Foreground}>
          <Text bold color={Colors.AccentBlue}>
            /tool
          </Text>{' '}
          - {t('tipTool')}
        </Text>
        <Text color={Colors.Foreground}>
          <Text bold color={Colors.AccentBlue}>
            /help
          </Text>{' '}
          - {t('tipHelp')}
        </Text>
        <Text color={Colors.Foreground}>
          <Text bold color={Colors.AccentBlue}>
            /bug
          </Text>{' '}
          - {t('tipBug')}
        </Text>
        <Text color={Colors.Foreground}>{t('tipGeneral')}</Text>
      </Box>
    </Box>
  );
};
