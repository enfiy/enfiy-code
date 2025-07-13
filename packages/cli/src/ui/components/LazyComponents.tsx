/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { Text } from 'ink';

// Lazy load heavy components with proper type casting
const LazyProviderSelectionDialog = lazy(() => import('./ProviderSelectionDialog.js').then(m => ({ default: m.ProviderSelectionDialog as any })));
const LazyProviderSetupDialog = lazy(() => import('./ProviderSetupDialog.js').then(m => ({ default: m.ProviderSetupDialog as any })));
const LazyCloudAISetupDialog = lazy(() => import('./CloudAISetupDialog.js').then(m => ({ default: m.CloudAISetupDialog as any })));
const LazyAPISettingsDialog = lazy(() => import('./APISettingsDialog.js').then(m => ({ default: m.APISettingsDialog as any })));
const LazyThemeDialog = lazy(() => import('./ThemeDialog.js').then(m => ({ default: m.ThemeDialog as any })));
const LazyEditorSettingsDialog = lazy(() => import('./EditorSettingsDialog.js').then(m => ({ default: m.EditorSettingsDialog as any })));
const LazyAuthDialog = lazy(() => import('./AuthDialog.js').then(m => ({ default: m.AuthDialog as any })));
const LazyHelp = lazy(() => import('./Help.js').then(m => ({ default: m.Help as any })));
const LazyAboutBox = lazy(() => import('./AboutBox.js').then(m => ({ default: m.AboutBox as any })));

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

// Pre-wrapped lazy components with explicit typing
export const ProviderSelectionDialog: React.ComponentType<any> = withLazyLoading(LazyProviderSelectionDialog);
export const ProviderSetupDialog: React.ComponentType<any> = withLazyLoading(LazyProviderSetupDialog);
export const CloudAISetupDialog: React.ComponentType<any> = withLazyLoading(LazyCloudAISetupDialog);
export const APISettingsDialog: React.ComponentType<any> = withLazyLoading(LazyAPISettingsDialog);
export const ThemeDialog: React.ComponentType<any> = withLazyLoading(LazyThemeDialog);
export const EditorSettingsDialog: React.ComponentType<any> = withLazyLoading(LazyEditorSettingsDialog);
export const AuthDialog: React.ComponentType<any> = withLazyLoading(LazyAuthDialog);
export const Help: React.ComponentType<any> = withLazyLoading(LazyHelp);
export const AboutBox: React.ComponentType<any> = withLazyLoading(LazyAboutBox);