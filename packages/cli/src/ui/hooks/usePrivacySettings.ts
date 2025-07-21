/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { useState, useEffect, useCallback } from 'react';
import { Config } from '@enfiy/core';

export interface PrivacyState {
  isLoading: boolean;
  error?: string;
  isFreeTier?: boolean;
  dataCollectionOptIn?: boolean;
}

export const usePrivacySettings = (_config: Config) => {
  const [privacyState, setPrivacyState] = useState<PrivacyState>({
    isLoading: false,
    isFreeTier: false,
    dataCollectionOptIn: true,
  });

  const [_tempDataCollectionOptIn, _setTempDataCollectionOptIn] = useState<
    boolean | undefined
  >(undefined);

  const loadPrivacySettings = useCallback(async () => {
    // OAuth not supported - return default values
    setPrivacyState({
      isLoading: false,
      isFreeTier: false,
      dataCollectionOptIn: true,
    });
  }, []);

  const updateDataCollectionOptIn = useCallback(async (_optIn: boolean) => {
    // OAuth not supported - no-op
  }, []);

  useEffect(() => {
    loadPrivacySettings();
  }, [loadPrivacySettings]);

  return {
    privacyState,
    tempDataCollectionOptIn: _tempDataCollectionOptIn,
    loadPrivacySettings,
    updateDataCollectionOptIn,
  };
};
