/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { Box } from 'ink';
import { type Config, AuthType } from '@enfiy/core';
import { EnfiyPrivacyNotice } from './EnfiyPrivacyNotice.js';
import { CloudPaidPrivacyNotice as _CloudPaidPrivacyNotice } from './CloudPaidPrivacyNotice.js';
import { CloudFreePrivacyNotice } from './CloudFreePrivacyNotice.js';

interface PrivacyNoticeProps {
  onExit: () => void;
  config: Config;
}

const PrivacyNoticeText = ({
  config,
  onExit,
}: {
  config: Config;
  onExit: () => void;
}) => {
  const authType = config.getContentGeneratorConfig()?.authType;

  switch (authType) {
    case AuthType.API_KEY:
      return <EnfiyPrivacyNotice onExit={onExit} />;
    default:
      return <CloudFreePrivacyNotice config={config} onExit={onExit} />;
  }
};

export const PrivacyNotice = ({ onExit, config }: PrivacyNoticeProps) => (
  <Box borderStyle="round" padding={1} flexDirection="column">
    <PrivacyNoticeText config={config} onExit={onExit} />
  </Box>
);
