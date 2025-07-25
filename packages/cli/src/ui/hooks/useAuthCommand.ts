/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { useState, useCallback } from 'react';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import {
  // AuthType,
  Config,
  // getErrorMessage,
} from '@enfiy/core';

// async function performAuthFlow(authMethod: AuthType, config: Config) {
//   await config.refreshAuth(authMethod);
// //   console.log(`Authenticated via "${authMethod}".`);
// }

export const useAuthCommand = (
  settings: LoadedSettings,
  setAuthError: (error: string | null) => void,
  _config: Config,
) => {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const openAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(true);
  }, []);

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Disable automatic authentication - let users choose their provider first
  // useEffect(() => {
  //   const authFlow = async () => {
  //     if (isAuthDialogOpen || !settings.merged.selectedAuthType) {
  //       return;
  //     }

  //     try {
  //       setIsAuthenticating(true);
  //       await performAuthFlow(
  //         settings.merged.selectedAuthType as AuthType,
  //         config,
  //       );
  //     } catch (e) {
  //       setAuthError(`Failed to login. Message: ${getErrorMessage(e)}`);
  //       openAuthDialog();
  //     } finally {
  //       setIsAuthenticating(false);
  //     }
  //   };

  //   void authFlow();
  // }, [isAuthDialogOpen, settings, config, setAuthError, openAuthDialog]);

  const handleAuthSelect = useCallback(
    async (authMethod: string | undefined, scope: SettingScope) => {
      if (authMethod) {
        // OAuth cache clearing not needed
        settings.setValue(scope, 'selectedAuthType', authMethod);
      }
      setIsAuthDialogOpen(false);
      setAuthError(null);
    },
    [settings, setAuthError],
  );

  const handleAuthHighlight = useCallback((_authMethod: string | undefined) => {
    // For now, we don't do anything on highlight.
  }, []);

  const cancelAuthentication = useCallback(() => {
    setIsAuthenticating(false);
  }, []);

  return {
    isAuthDialogOpen,
    openAuthDialog,
    handleAuthSelect,
    handleAuthHighlight,
    isAuthenticating,
    cancelAuthentication,
  };
};
