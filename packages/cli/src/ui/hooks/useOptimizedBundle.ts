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

import { useEffect, useCallback } from 'react';
import { getTheme, preloadTheme } from '../themes/lazyThemes.js';
import { getLanguagePack, preloadLanguagePack } from '../utils/lazyI18n.js';
import type { SupportedLanguage } from '../utils/i18n.js';

// Bundle optimization hook
export function useOptimizedBundle() {
  // Preload commonly used themes
  useEffect(() => {
    const commonThemes = ['default', 'github-dark', 'github-light'];
    commonThemes.forEach(theme => {
      preloadTheme(theme);
    });
  }, []);

  // Preload user's preferred language
  useEffect(() => {
    const userLang = (process.env.LANG || 'en').split('_')[0] as SupportedLanguage;
    preloadLanguagePack(userLang);
    
    // Also preload English as fallback
    if (userLang !== 'en') {
      preloadLanguagePack('en');
    }
  }, []);

  // Lazy theme loader
  const loadTheme = useCallback(async (themeName: string) => {
    try {
      return await getTheme(themeName);
    } catch (error) {
      console.warn(`Failed to load theme ${themeName}, falling back to default`);
      return await getTheme('default');
    }
  }, []);

  // Lazy language pack loader
  const loadLanguage = useCallback(async (language: SupportedLanguage) => {
    try {
      return await getLanguagePack(language);
    } catch (error) {
      console.warn(`Failed to load language ${language}, falling back to English`);
      return await getLanguagePack('en');
    }
  }, []);

  return {
    loadTheme,
    loadLanguage,
  };
}

// Memory management utilities
export function useMemoryOptimization() {
  const cleanup = useCallback(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }, []);

  const optimizeMemory = useCallback(() => {
    // Clear unused resources
    cleanup();
    
    // Suggest memory optimization
    if (process.memoryUsage().heapUsed > 100 * 1024 * 1024) { // 100MB threshold
      console.warn('Memory usage high, consider restarting the application');
    }
  }, [cleanup]);

  return {
    cleanup,
    optimizeMemory,
  };
}