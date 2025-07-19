/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type SupportedLanguage = 'en';

export interface TranslationKeys {
  // App messages
  welcomeTitle: string;
  welcomeMessage: string;
  keyFeatures: string;
  featureFileOps: string;
  featureCodeSearch: string;
  featureShellCommands: string;
  featureSuggestions: string;
  helpMessage: string;

  // Provider selection
  providerSelectionTitle: string;
  selectCategoryPrompt: string;
  selectProviderPrompt: string;
  selectModelPrompt: string;
  localAI: string;
  cloudAI: string;
  localAIDescription: string;
  cloudAIDescription: string;

  // Tips and navigation
  tipsTitle: string;
  tipProvider: string;
  tipGeneral: string;
  tipSpecific: string;
  tipMemory: string;
  tipHelp: string;
  tipMcp: string;
  tipTool: string;
  tipBug: string;

  // Navigation
  navMove: string;
  navSelect: string;
  navBack: string;
  navCancel: string;

  // Status messages
  setupComplete: string;
  readyMessage: string;
  providerDetected: string;
  noModelsAvailable: string;
  installModels: string;
  checkApiKey: string;
}

export const translations: Record<SupportedLanguage, TranslationKeys> = {
  en: {
    welcomeTitle: '**Welcome to Enfiy Code!**',
    welcomeMessage:
      "I am Enfiy's development assistant, designed to support AI-driven software development.",
    keyFeatures: '**Key Features:**',
    featureFileOps: 'Read, edit, and create files',
    featureCodeSearch: 'Search and analyze code',
    featureShellCommands: 'Execute shell commands',
    featureSuggestions: 'Provide development suggestions and code review',
    helpMessage: "Feel free to ask if there's anything I can help you with!",

    providerSelectionTitle: 'AI Provider & Model Selection',
    selectCategoryPrompt: 'Select the desired AI category:',
    selectProviderPrompt: 'Select an AI provider:',
    selectModelPrompt: 'Select a model:',
    localAI: 'Local AI',
    cloudAI: 'Cloud AI',
    localAIDescription:
      'Run AI models on your machine (private, fast, no API fees)',
    cloudAIDescription:
      'Use cloud-based AI services (most powerful, API fees apply)',

    tipsTitle: 'Enfiy Code - Your Universal AI Coding Agent',
    tipProvider: 'Select AI provider and model',
    tipGeneral:
      'Code with confidence, create without limits, command with ease',
    tipSpecific: 'Be specific for better results',
    tipMemory: 'Customize interactions with ENFIY.md file',
    tipHelp: 'Show available commands',
    tipMcp: 'Connect to MCP servers for enhanced capabilities',
    tipTool: 'Access specialized tools and integrations',
    tipBug: 'Report bugs or issues',

    navMove: 'Move',
    navSelect: 'Enter Select',
    navBack: 'Back',
    navCancel: 'Esc Cancel',

    setupComplete: 'In use:',
    readyMessage: 'Ready! Enter questions or commands. /help for help',
    providerDetected: 'Recommended AI:',
    noModelsAvailable: 'No models available for',
    installModels: 'Install models: ollama pull <model>',
    checkApiKey: 'Please check your API key.',
  },
};

// Current language state
let currentLanguage: SupportedLanguage | null = null;

// Language detection function
export function detectLanguage(): SupportedLanguage {
  if (currentLanguage) {
    return currentLanguage;
  }

  // Default to English
  currentLanguage = 'en';
  return currentLanguage;
}

// Get current language
export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage || detectLanguage();
}

// Set current language
export function setCurrentLanguage(lang: SupportedLanguage): void {
  currentLanguage = lang;
}

// Translation function
export function t(key: keyof TranslationKeys): string {
  const lang = getCurrentLanguage();
  const langTranslations = translations[lang];

  if (!langTranslations) {
    // Fallback to English if language not found
    return translations.en[key] || key;
  }

  return langTranslations[key] || key;
}

// Export default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
