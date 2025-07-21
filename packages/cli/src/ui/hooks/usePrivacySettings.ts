/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Config } from '@enfiy/core';

export interface PrivacyState {
  isLoading: boolean;
  error?: string;
  isFreeTier?: boolean;
  dataCollectionOptIn?: boolean;
}

export const usePrivacySettings = (config: Config) => {
  const [privacyState, setPrivacyState] = useState<PrivacyState>({
    isLoading: false,
    isFreeTier: false,
    dataCollectionOptIn: true,
  });

  const [tempDataCollectionOptIn, setTempDataCollectionOptIn] = useState<
    boolean | undefined
  >(undefined);

  const loadPrivacySettings = useCallback(async () => {
    // OAuth not supported - return default values
    setPrivacyState({
      isLoading: false,
      isFreeTier: false,
      dataCollectionOptIn: true,
    });
  }, [config]);

  const updateDataCollectionOptIn = useCallback(
    async (optIn: boolean) => {
      // OAuth not supported - no-op
      return;
    },
    [config, privacyState.isFreeTier],
  );

  useEffect(() => {
    loadPrivacySettings();
  }, [loadPrivacySettings]);

  return {
    privacyState,
    tempDataCollectionOptIn,
    loadPrivacySettings,
    updateDataCollectionOptIn,
  };
};