/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ColorsTheme } from './theme.js';

// Lazy load theme implementations
const themes = new Map<string, () => Promise<ColorsTheme>>();

// Theme loader registry
themes.set('default', () => import('./default.js').then(m => (m as any).default));
themes.set('default-light', () => import('./default-light.js').then(m => (m as any).default));
themes.set('github-dark', () => import('./github-dark.js').then(m => (m as any).default));
themes.set('github-light', () => import('./github-light.js').then(m => (m as any).default));
themes.set('atom-one-dark', () => import('./atom-one-dark.js').then(m => (m as any).default));
themes.set('xcode', () => import('./xcode.js').then(m => (m as any).default));
themes.set('googlecode', () => import('./googlecode.js').then(m => (m as any).default));
themes.set('ayu', () => import('./ayu.js').then(m => (m as any).default));
themes.set('ayu-light', () => import('./ayu-light.js').then(m => (m as any).default));
themes.set('dracula', () => import('./dracula.js').then(m => (m as any).default));
themes.set('orange', () => import('./orange.js').then(m => (m as any).default));
themes.set('ansi', () => import('./ansi.js').then(m => (m as any).default));
themes.set('ansi-light', () => import('./ansi-light.js').then(m => (m as any).default));
themes.set('no-color', () => import('./no-color.js').then(m => (m as any).default));

// Theme cache
const themeCache = new Map<string, ColorsTheme>();

export async function getTheme(name: string): Promise<ColorsTheme> {
  // Check cache first
  if (themeCache.has(name)) {
    return themeCache.get(name)!;
  }

  // Load theme lazily
  const loader = themes.get(name);
  if (!loader) {
    // Fallback to default theme
    const defaultLoader = themes.get('default')!;
    const theme = await defaultLoader();
    themeCache.set(name, theme);
    return theme;
  }

  const theme = await loader();
  themeCache.set(name, theme);
  return theme;
}

export function getAvailableThemes(): string[] {
  return Array.from(themes.keys());
}

export function preloadTheme(name: string): void {
  const loader = themes.get(name);
  if (loader && !themeCache.has(name)) {
    loader().then(theme => {
      themeCache.set(name, theme);
    }).catch(() => {
      // Ignore preload errors
    });
  }
}