/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ColorsTheme } from './theme.js';

// Lazy load theme implementations
const themes = new Map<string, () => Promise<ColorsTheme>>();

// Theme loader registry - extract colors from Theme objects
themes.set('default', () => import('./default.js').then(m => m.DefaultDark.colors));
themes.set('default-light', () => import('./default-light.js').then(m => m.DefaultLight.colors));
themes.set('github-dark', () => import('./github-dark.js').then(m => m.GitHubDark.colors));
themes.set('github-light', () => import('./github-light.js').then(m => m.GitHubLight.colors));
themes.set('atom-one-dark', () => import('./atom-one-dark.js').then(m => m.AtomOneDark.colors));
themes.set('xcode', () => import('./xcode.js').then(m => m.XCode.colors));
themes.set('googlecode', () => import('./googlecode.js').then(m => m.GoogleCode.colors));
themes.set('ayu', () => import('./ayu.js').then(m => m.AyuDark.colors));
themes.set('ayu-light', () => import('./ayu-light.js').then(m => m.AyuLight.colors));
themes.set('dracula', () => import('./dracula.js').then(m => m.Dracula.colors));
themes.set('orange', () => import('./orange.js').then(m => m.DefaultOrange.colors));
themes.set('ansi', () => import('./ansi.js').then(m => m.ANSI.colors));
themes.set('ansi-light', () => import('./ansi-light.js').then(m => m.ANSILight.colors));
themes.set('no-color', () => import('./no-color.js').then(m => m.NoColorTheme.colors));

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