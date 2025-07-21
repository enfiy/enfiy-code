/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import {
  ProviderType,
  getLocalModels,
  getCloudModels,
  ModelInfo,
} from '@enfiy/core';
import { t } from '../utils/i18n.js';
import { hasStoredCredentials } from '../../utils/secureStorage.js';

export interface ProviderSelectionDialogProps {
  onSelect: (provider: ProviderType, model: string) => void;
  onCancel: () => void;
  onSetupRequired: (provider: ProviderType) => void;
  _onManageProvider?: (provider: ProviderType) => void;
  onOpenAPISettings?: () => void;
  _availableTerminalHeight?: number;
  terminalWidth: number;
  _inputWidth?: number;
  preselectedProvider?: ProviderType; // New prop to preselect a provider
}

type SelectionMode = 'category' | 'provider' | 'model' | 'api-settings';

export const ProviderSelectionDialog: React.FC<
  ProviderSelectionDialogProps
> = ({
  onSelect,
  onCancel,
  onSetupRequired,
  _onManageProvider,
  onOpenAPISettings,
  _availableTerminalHeight,
  terminalWidth,
  _inputWidth,
  preselectedProvider,
}) => {
  const [mode, setMode] = useState<SelectionMode>(() =>
    // If we have a preselected provider, go directly to model selection
    preselectedProvider ? 'model' : 'category',
  );
  const [selectedCategory, setSelectedCategory] = useState<
    'local' | 'cloud' | 'none' | null
  >(() => {
    // If we have a preselected provider, determine its category
    if (preselectedProvider) {
      const localProviders = [ProviderType.OLLAMA];
      return localProviders.includes(preselectedProvider) ? 'local' : 'cloud';
    }
    return null;
  });
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(
    preselectedProvider || null,
  );
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [availableProviders, setAvailableProviders] = useState<ProviderType[]>(
    [],
  );
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isCheckingProvider, setIsCheckingProvider] = useState(false);
  const [providerConfigurations, setProviderConfigurations] = useState<
    Record<string, boolean>
  >({});

  // Helper function to check if provider needs setup
  const checkProviderNeedsSetup = async (
    provider: ProviderType,
    isLocal: boolean,
  ): Promise<boolean> => {
    if (isLocal) {
      if (provider === ProviderType.OLLAMA) {
        // Check if Ollama is actually installed and running with models
        try {
          const response = await fetch('http://localhost:11434/api/tags', {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
          });

          if (!response.ok) {
            return true; // Needs setup - not running
          }

          const data = await response.json();
          const models = data.models || [];

          if (models.length === 0) {
            return true; // Needs setup - no models installed
          }

          return false; // All good, no setup needed
        } catch {
          return true; // Needs setup - connection failed
        }
      }
      // No other local providers currently supported
      // Other local providers need actual availability check
      return true; // Default to needs setup for unimplemented local providers
    } else {
      // For cloud providers, always show setup dialog for initial configuration
      // This will handle both API key and OAuth authentication methods
      return !hasStoredCredentials(provider);
    }
  };

  // Categories
  const categories = useMemo(
    () => [
      {
        id: 'local' as const,
        name: t('localAI'),
        description: t('localAIDescription'),
        providers: [ProviderType.OLLAMA],
      },
      {
        id: 'cloud' as const,
        name: t('cloudAI'),
        description: t('cloudAIDescription'),
        providers: [
          ProviderType.ANTHROPIC,
          ProviderType.GEMINI,
          ProviderType.MISTRAL,
          ProviderType.OPENAI,
          ProviderType.OPENROUTER,
        ],
      },
      {
        id: 'settings' as const,
        name: 'Settings',
        description: 'Manage API keys and provider configurations',
        providers: [],
      },
      {
        id: 'skip' as const,
        name: 'Skip Setup',
        description: 'Continue without configuring a provider',
        providers: [],
      },
    ],
    [],
  );

  // Check provider configurations
  useEffect(() => {
    const checkProviderConfigurations = async () => {
      if (availableProviders.length === 0) return;

      const configs: Record<string, boolean> = {};
      const isLocal = selectedCategory === 'local';

      for (const provider of availableProviders) {
        if (isLocal) {
          if (provider === ProviderType.OLLAMA) {
            try {
              const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                signal: AbortSignal.timeout(1000),
              });
              configs[provider] = response.ok;
            } catch {
              configs[provider] = false;
            }
          } else {
            // Other local providers default to not configured until implemented
            configs[provider] = false;
          }
        } else {
          // For cloud providers, check if they have stored credentials
          configs[provider] = hasStoredCredentials(provider);
        }
      }

      setProviderConfigurations(configs);
    };

    checkProviderConfigurations();
  }, [availableProviders, selectedCategory]);

  // Provider name display
  const getProviderDisplayName = (provider: ProviderType): string => {
    const _isLocal = selectedCategory === 'local';

    switch (provider) {
      case ProviderType.OLLAMA:
        return 'Ollama';
      case ProviderType.OPENAI:
        return 'OpenAI';
      case ProviderType.GEMINI:
        return 'Google Gemini';
      case ProviderType.MISTRAL:
        return 'Mistral';
      case ProviderType.ANTHROPIC:
        return 'Anthropic';
      case ProviderType.OPENROUTER:
        return 'OpenRouter';
      default:
        return String(provider);
    }
  };

  // Get status indicator
  const getStatusIndicator = (isConfigured: boolean): string =>
    isConfigured ? '•' : '◦'; // Small bullet vs small hollow circle
  // Get status legend with proper colors
  const getStatusLegend = (): Array<{ text: string; color: string }> => {
    const _isLocal = selectedCategory === 'local';
    return [
      { text: '•', color: Colors.AccentGreen },
      { text: ' Configured', color: Colors.Gray },
      { text: '   ', color: Colors.Gray },
      { text: '◦', color: Colors.Gray },
      { text: ' Setup required', color: Colors.Gray },
    ];
  };

  // Provider descriptions - context dependent
  const getProviderDescription = (provider: ProviderType): string => {
    switch (provider) {
      // Local providers
      case ProviderType.OLLAMA:
        return 'Popular local AI runtime - Easy setup, excellent models';

      // Cloud providers
      case ProviderType.OPENAI:
        return 'Industry standard, versatile';
      case ProviderType.GEMINI:
        return 'Long context, multimodal';
      case ProviderType.MISTRAL:
        return 'European AI, efficient and high-performance';
      case ProviderType.ANTHROPIC:
        return 'High-quality reasoning and coding';
      case ProviderType.OPENROUTER:
        return 'Multi-provider access, competitive pricing';
      default:
        return '';
    }
  };

  useEffect(() => {
    if (mode === 'provider' && selectedCategory) {
      const categoryData = categories.find((c) => c.id === selectedCategory);
      setAvailableProviders(categoryData?.providers || []);
      setHighlightedIndex(0);
    } else if (mode === 'model' && selectedProvider) {
      const loadModels = async () => {
        if (selectedProvider === ProviderType.OLLAMA) {
          // For Ollama, check actually installed models
          try {
            const { checkOllamaInstallation } = await import(
              '../../utils/ollamaSetup.js'
            );
            const status = await checkOllamaInstallation();

            if (status.installedModels.length > 0) {
              // Convert installed models to ModelInfo format
              const installedModelInfos: ModelInfo[] =
                status.installedModels.map((modelId) => ({
                  id: modelId,
                  name: modelId,
                  provider: ProviderType.OLLAMA,
                  category: 'local' as const,
                  description: `Installed Ollama model: ${modelId}`,
                  contextLength: 128000,
                  capabilities: ['chat', 'code'],
                }));
              setAvailableModels(installedModelInfos);
            } else {
              setAvailableModels([]);
            }
          } catch (error) {
            console.debug('Could not check Ollama models:', error);
            setAvailableModels([]);
          }
        } else {
          // For other providers, use the registry
          const models =
            selectedCategory === 'local' ? getLocalModels() : getCloudModels();
          const providerModels = models.filter(
            (m: ModelInfo) => m.provider === selectedProvider,
          );
          setAvailableModels(providerModels);
        }
        setHighlightedIndex(0);
      };

      loadModels();
    }
  }, [mode, selectedCategory, selectedProvider, categories]);

  // Get total items including back option for navigation
  const getTotalItems = () => {
    if (mode === 'category') return categories.length;
    if (mode === 'provider') return availableProviders.length + 1; // +1 for back option
    if (mode === 'model') return availableModels.length + 1; // +1 for back option
    return 0;
  };

  // Get the index of the Back option (at the end of available providers)
  const getBackOptionIndex = () => availableProviders.length;

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      onCancel();
      return;
    }

    if (key.upArrow) {
      setHighlightedIndex(Math.max(0, highlightedIndex - 1));
    }

    if (key.downArrow) {
      setHighlightedIndex(Math.min(getTotalItems() - 1, highlightedIndex + 1));
    }

    if (key.return) {
      if (mode === 'category') {
        const selected = categories[highlightedIndex];

        if (selected.id === 'settings') {
          // Open Settings
          if (onOpenAPISettings) {
            onOpenAPISettings();
          }
          return;
        }

        if (selected.id === 'skip') {
          // Skip setup - close dialog
          onCancel();
          return;
        }

        setSelectedCategory(selected.id as 'local' | 'cloud');
        setMode('provider');
      } else if (mode === 'provider') {
        // Check if back option is selected
        if (highlightedIndex === getBackOptionIndex()) {
          setMode('category');
          setSelectedCategory(null);
          return;
        }

        // Select the provider directly by index
        const selected = availableProviders[highlightedIndex];

        // For cloud providers, always show setup dialog to allow authentication method selection
        if (selectedCategory === 'cloud') {
          console.log(
            'Provider selected in cloud category, showing setup dialog:',
            selected,
          );
          onSetupRequired(selected);
          return;
        }

        // For local providers (now only Ollama), check if setup is needed
        setIsCheckingProvider(true);
        checkProviderNeedsSetup(selected, selectedCategory === 'local')
          .then((needsSetup) => {
            setIsCheckingProvider(false);
            if (needsSetup) {
              onSetupRequired(selected);
            } else {
              // Provider is ready, proceed to model selection
              setSelectedProvider(selected);
              setMode('model');
            }
          })
          .catch(() => {
            setIsCheckingProvider(false);
            // On error, assume setup is needed
            onSetupRequired(selected);
          });

        return; // Exit early since we're handling async
      } else if (mode === 'model') {
        // Check if back option is selected
        if (highlightedIndex === availableModels.length) {
          setMode('provider');
          setSelectedProvider(null);
          return;
        }

        const selected = availableModels[highlightedIndex];
        onSelect(selected.provider, selected.id);
      }
    }

    if (key.leftArrow || key.backspace) {
      if (mode === 'model') {
        setMode('provider');
        setSelectedProvider(null);
      } else if (mode === 'provider') {
        setMode('category');
        setSelectedCategory(null);
      }
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={Colors.BorderGray}
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1} justifyContent="center">
        <Text bold color={Colors.AccentBlue}>
          {t('providerSelectionTitle')}
        </Text>
      </Box>

      {mode === 'category' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.Gray}>{t('selectCategoryPrompt')}</Text>
          </Box>

          {categories.map((category, index) => (
            <Box key={category.id} paddingLeft={1}>
              <Text
                color={
                  index === highlightedIndex
                    ? Colors.AccentBlue
                    : Colors.Foreground
                }
                bold={index === highlightedIndex}
              >
                {index === highlightedIndex ? '> ' : '  '}
                {category.name.padEnd(12)}{' '}
                {/* Fixed width for consistent alignment */}
                <Text
                  color={
                    index === highlightedIndex ? Colors.Comment : Colors.Gray
                  }
                >
                  {category.description}
                </Text>
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {mode === 'provider' && selectedCategory && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color={Colors.Foreground}>
              {t('selectProviderPrompt')}
              {selectedCategory === 'cloud' && (
                <Text bold color={Colors.AccentYellow}>
                  {' '}
                  Note: API keys may be subject to charges by the provider.
                </Text>
              )}
            </Text>
          </Box>

          {isCheckingProvider && (
            <Box paddingLeft={1} marginBottom={1}>
              <Text color={Colors.AccentBlue}>
                Checking provider availability...
              </Text>
            </Box>
          )}

          {availableProviders.map((provider, index) => {
            const isConfigured = providerConfigurations[provider] || false;
            const isHighlighted = index === highlightedIndex;
            const prefix = isHighlighted ? '> ' : '  ';
            const statusIndicator = getStatusIndicator(isConfigured);
            const providerName = getProviderDisplayName(provider).padEnd(18);
            const description = getProviderDescription(provider);
            const configuredText = isConfigured ? ' (Configured)' : '';

            return (
              <Box key={provider} paddingLeft={1} flexDirection="row">
                <Text
                  color={isHighlighted ? Colors.AccentBlue : Colors.Foreground}
                >
                  {prefix}
                </Text>
                <Text color={isConfigured ? Colors.AccentGreen : Colors.Gray}>
                  {statusIndicator}
                </Text>
                <Text
                  color={isHighlighted ? Colors.AccentBlue : Colors.Foreground}
                >
                  {' '}
                  {providerName}
                </Text>
                <Text color={isHighlighted ? Colors.Comment : Colors.Gray}>
                  {description}
                  {configuredText}
                </Text>
              </Box>
            );
          })}

          {/* Back option */}
          <Box paddingLeft={1}>
            <Text
              color={
                getBackOptionIndex() === highlightedIndex
                  ? Colors.AccentBlue
                  : Colors.Gray
              }
              bold={getBackOptionIndex() === highlightedIndex}
            >
              {getBackOptionIndex() === highlightedIndex ? '> ' : '  '}←{' '}
              {t('navBack').replace('← ', '')}
            </Text>
          </Box>

          {/* Status legend and management hint */}
          <Box paddingLeft={1} marginTop={1}>
            <Box flexDirection="row">
              {getStatusLegend().map((item, index) => (
                <Text key={index} color={item.color}>
                  {item.text}
                </Text>
              ))}
            </Box>
            <Box marginTop={1}>
              <Text color={Colors.Gray}>Enter: Use provider | ← Back</Text>
            </Box>
          </Box>
        </Box>
      )}

      {mode === 'model' && selectedProvider && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.Gray}>{t('selectModelPrompt')}</Text>
          </Box>

          {availableModels.length === 0 ? (
            <Box
              paddingX={2}
              paddingY={1}
              borderStyle="single"
              borderColor={Colors.AccentRed}
            >
              <Text color={Colors.AccentRed}>
                {t('noModelsAvailable')} {selectedProvider}.
                {(() => {
                  if (selectedCategory === 'local') {
                    return ` ${t('installModels')}`;
                  }
                  return ` ${t('checkApiKey')}`;
                })()}
              </Text>
            </Box>
          ) : (
            availableModels.map((model, index) => {
              // Find the longest model name for alignment
              const maxModelNameLength = Math.max(
                ...availableModels.map((m) => m.name.length),
              );
              const paddingNeeded = maxModelNameLength - model.name.length + 2; // +2 for extra spacing
              const padding = ' '.repeat(paddingNeeded);

              const isHighlighted = index === highlightedIndex;
              const prefix = isHighlighted ? '> ' : '  ';
              const modelDescription = `${model.description} (${model.contextLength.toLocaleString()}t | ${model.capabilities.join(', ')})`;

              // Calculate available width for description (assuming reasonable terminal width)
              const prefixLength = prefix.length;
              const nameLength = model.name.length;
              const paddingLength = padding.length;
              const usedWidth = prefixLength + nameLength + paddingLength;
              const maxReasonableWidth = Math.min(terminalWidth - 10, 120); // -10 for margins and borders
              const availableWidth = maxReasonableWidth - usedWidth;

              // Truncate description if it's too long
              const truncatedDescription =
                modelDescription.length > availableWidth
                  ? modelDescription.substring(0, availableWidth - 3) + '...'
                  : modelDescription;

              return (
                <Box key={model.id} paddingLeft={1}>
                  <Text
                    color={
                      isHighlighted ? Colors.AccentBlue : Colors.Foreground
                    }
                  >
                    {prefix}
                    <Text
                      bold
                      color={
                        isHighlighted ? Colors.AccentBlue : Colors.Foreground
                      }
                    >
                      {model.name}
                    </Text>
                    <Text color={isHighlighted ? Colors.Comment : Colors.Gray}>
                      {padding}
                      {truncatedDescription}
                    </Text>
                  </Text>
                </Box>
              );
            })
          )}

          {/* Back option for models */}
          <Box paddingLeft={1}>
            <Text
              color={
                availableModels.length === highlightedIndex
                  ? Colors.AccentBlue
                  : Colors.Gray
              }
              bold={availableModels.length === highlightedIndex}
            >
              {availableModels.length === highlightedIndex ? '> ' : '  '}←{' '}
              {t('navBack').replace('← ', '')}
            </Text>
          </Box>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={Colors.Gray} dimColor>
          {mode === 'category' &&
            `${t('navMove')} | ${t('navSelect')} | ${t('navCancel')}`}
          {mode === 'provider' &&
            `${t('navMove')} | Enter: Use | ${t('navBack')} | ${t('navCancel')}`}
          {mode === 'model' &&
            `${t('navMove')} | ${t('navSelect')} | Select "${t('navBack').replace('← ', '')}" to go back | ${t('navCancel')}`}
        </Text>
      </Box>
    </Box>
  );
};
