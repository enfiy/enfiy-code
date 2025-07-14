/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import React, { Suspense, lazy } from 'react';
import { Text } from 'ink';
import { ProviderSelectionDialogProps } from './ProviderSelectionDialog.js';
import { ProviderSetupDialogProps } from './ProviderSetupDialog.js';
import { CloudAISetupDialogProps } from './CloudAISetupDialog.js';
import { APISettingsDialogProps } from './APISettingsDialog.js';
import { ThemeDialogProps } from './ThemeDialog.js';
import { EditorDialogProps } from './EditorSettingsDialog.js';
import { AuthDialogProps } from './AuthDialog.js';
import { Help as HelpProps } from './Help.js';
import { AboutBoxProps } from './AboutBox.js';

// Lazy load heavy components
const LazyProviderSelectionDialog = lazy(() => import('./ProviderSelectionDialog.js').then(m => ({ default: m.ProviderSelectionDialog })));
const LazyProviderSetupDialog = lazy(() => import('./ProviderSetupDialog.js').then(m => ({ default: m.ProviderSetupDialog })));
const LazyCloudAISetupDialog = lazy(() => import('./CloudAISetupDialog.js').then(m => ({ default: m.CloudAISetupDialog })));
const LazyAPISettingsDialog = lazy(() => import('./APISettingsDialog.js').then(m => ({ default: m.APISettingsDialog })));
const LazyThemeDialog = lazy(() => import('./ThemeDialog.js').then(m => ({ default: m.ThemeDialog })));
const LazyEditorSettingsDialog = lazy(() => import('./EditorSettingsDialog.js').then(m => ({ default: m.EditorSettingsDialog })));
const LazyAuthDialog = lazy(() => import('./AuthDialog.js').then(m => ({ default: m.AuthDialog })));
const LazyHelp = lazy(() => import('./Help.js').then(m => ({ default: m.Help })));
const LazyAboutBox = lazy(() => import('./AboutBox.js').then(m => ({ default: m.AboutBox })));

// Loading component
const LoadingSpinner = () => (
  <Text color="gray">Loading...</Text>
);

// Higher-order component for lazy loading with suspense
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ComponentType = LoadingSpinner
): React.ComponentType<P> {
  const FallbackComponent = fallback;
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={<FallbackComponent />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pre-wrapped lazy components with type assertions to avoid naming conflicts
export const ProviderSelectionDialog = withLazyLoading<ProviderSelectionDialogProps>(LazyProviderSelectionDialog);
export const ProviderSetupDialog = withLazyLoading<ProviderSetupDialogProps>(LazyProviderSetupDialog);
export const CloudAISetupDialog = withLazyLoading<CloudAISetupDialogProps>(LazyCloudAISetupDialog);
export const APISettingsDialog = withLazyLoading<APISettingsDialogProps>(LazyAPISettingsDialog);
export const ThemeDialog = withLazyLoading<ThemeDialogProps>(LazyThemeDialog);
export const EditorSettingsDialog = withLazyLoading<EditorDialogProps>(LazyEditorSettingsDialog);
export const AuthDialog = withLazyLoading<AuthDialogProps>(LazyAuthDialog);
export const Help = withLazyLoading<HelpProps>(LazyHelp);
export const AboutBox = withLazyLoading<AboutBoxProps>(LazyAboutBox);