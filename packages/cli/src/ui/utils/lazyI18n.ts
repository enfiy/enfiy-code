/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Modifications Copyright 2025 The Enfiy Community Contributors
 *
 * This file has been modified from its original version by contributors
 * to the Enfiy Community project.
 */

import type { SupportedLanguage, TranslationKeys } from './i18n.js';

// Lazy load language packs
const languageLoaders = new Map<SupportedLanguage, () => Promise<TranslationKeys>>();

// Language loader registry
languageLoaders.set('en', () => import('./i18n.js').then(m => (m as any).translations.en));
languageLoaders.set('ja', () => import('./i18n.js').then(m => (m as any).translations.ja));
languageLoaders.set('ko', () => import('./i18n.js').then(m => (m as any).translations.ko));
languageLoaders.set('es', () => import('./i18n.js').then(m => (m as any).translations.es));
languageLoaders.set('fr', () => import('./i18n.js').then(m => (m as any).translations.fr));
languageLoaders.set('de', () => import('./i18n.js').then(m => (m as any).translations.de));
languageLoaders.set('ru', () => import('./i18n.js').then(m => (m as any).translations.ru));

// Language cache
const languageCache = new Map<SupportedLanguage, TranslationKeys>();

export async function getLanguagePack(language: SupportedLanguage): Promise<TranslationKeys> {
  // Check cache first
  if (languageCache.has(language)) {
    return languageCache.get(language)!;
  }

  // Load language pack lazily
  const loader = languageLoaders.get(language);
  if (!loader) {
    // Fallback to English
    const enLoader = languageLoaders.get('en')!;
    const pack = await enLoader();
    languageCache.set(language, pack);
    return pack;
  }

  const pack = await loader();
  languageCache.set(language, pack);
  return pack;
}

export function preloadLanguagePack(language: SupportedLanguage): void {
  const loader = languageLoaders.get(language);
  if (loader && !languageCache.has(language)) {
    loader().then(pack => {
      languageCache.set(language, pack);
    }).catch(() => {
      // Ignore preload errors
    });
  }
}

export function getAvailableLanguages(): SupportedLanguage[] {
  return Array.from(languageLoaders.keys());
}