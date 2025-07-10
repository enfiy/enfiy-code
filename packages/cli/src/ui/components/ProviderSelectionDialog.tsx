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

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { ProviderType, getLocalModels, getCloudModels, ModelInfo } from '@enfiy/core';
import { t } from '../utils/i18n.js';
import { hasStoredCredentials } from '../../utils/secureStorage.js';

interface ProviderSelectionDialogProps {
  onSelect: (provider: ProviderType, model: string) => void;
  onCancel: () => void;
  onSetupRequired: (provider: ProviderType) => void;
  onManageProvider?: (provider: ProviderType) => void;
  onOpenAPISettings?: () => void;
  _availableTerminalHeight?: number;
  terminalWidth: number;
}

type SelectionMode = 'category' | 'provider' | 'model' | 'api-settings';

export const ProviderSelectionDialog: React.FC<ProviderSelectionDialogProps> = ({
  onSelect,
  onCancel,
  onSetupRequired,
  onManageProvider,
  onOpenAPISettings,
  _availableTerminalHeight,
  terminalWidth,
}) => {
  const [mode, setMode] = useState<SelectionMode>('category');
  const [selectedCategory, setSelectedCategory] = useState<'local' | 'cloud' | 'none' | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [availableProviders, setAvailableProviders] = useState<ProviderType[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isCheckingProvider, setIsCheckingProvider] = useState(false);
  const [providerConfigurations, setProviderConfigurations] = useState<Record<string, boolean>>({});

  // Helper function to check if provider needs setup
  const checkProviderNeedsSetup = async (provider: ProviderType, isLocal: boolean): Promise<boolean> => {
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
      if (provider === ProviderType.HUGGINGFACE) {
        // Always show setup for HuggingFace as it requires manual server configuration
        return true; // Needs setup - show configuration guide
      }
      return false; // Other local providers don't need setup check for now
    } else {
      // For cloud providers, always show setup dialog for initial configuration
      // This will handle both API key and OAuth authentication methods
      return !hasStoredCredentials(provider);
    }
  };

  // Categories
  const categories = useMemo(() => [
    { 
      id: 'local' as const, 
      name: t('localAI'), 
      description: t('localAIDescription'),
      providers: [ProviderType.OLLAMA, ProviderType.HUGGINGFACE, ProviderType.VLLM]
    },
    { 
      id: 'cloud' as const, 
      name: t('cloudAI'), 
      description: t('cloudAIDescription'),
      providers: [ProviderType.ANTHROPIC, ProviderType.OPENAI, ProviderType.GEMINI, ProviderType.MISTRAL, ProviderType.HUGGINGFACE]
    },
    { 
      id: 'settings' as const,
      name: 'Settings',
      description: 'Manage API keys and provider configurations',
      providers: []
    },
    { 
      id: 'none' as const,
      name: 'Skip Setup',
      description: 'Do not configure AI provider now',
      providers: []
    }
  ], []);

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
            configs[provider] = true; // Other local providers don't need checking
          }
        } else {
          configs[provider] = hasStoredCredentials(provider);
        }
      }
      
      setProviderConfigurations(configs);
    };
    
    checkProviderConfigurations();
  }, [availableProviders, selectedCategory]);

  // Provider name display
  const getProviderDisplayName = (provider: ProviderType): string => {
    const isLocal = selectedCategory === 'local';
    
    switch (provider) {
      case ProviderType.OLLAMA:
        return 'Ollama';
      case ProviderType.HUGGINGFACE:
        return isLocal ? 'HuggingFace' : 'HuggingFace';
      case ProviderType.VLLM:
        return 'vLLM';
      case ProviderType.ANTHROPIC:
        return 'Anthropic';
      case ProviderType.OPENAI:
        return 'OpenAI';
      case ProviderType.GEMINI:
        return 'Google Gemini';
      case ProviderType.MISTRAL:
        return 'Mistral';
      default:
        return String(provider);
    }
  };

  // Get status indicator
  const getStatusIndicator = (isConfigured: boolean): string => {
    return isConfigured ? '•' : '◦'; // Small bullet vs small hollow circle
  };

  // Get status indicator color
  const getStatusColor = (isConfigured: boolean): string => {
    return isConfigured ? Colors.AccentGreen : Colors.Gray; // Green for configured, gray for unconfigured
  };

  // Get status legend with proper colors
  const getStatusLegend = (): { text: string; color: string }[] => {
    const isLocal = selectedCategory === 'local';
    return [
      { text: '•', color: Colors.AccentGreen },
      { text: ' Configured', color: Colors.Gray },
      { text: '   ', color: Colors.Gray },
      { text: '◦', color: Colors.Gray },
      { text: ' Setup required', color: Colors.Gray }
    ];
  };

  // Provider descriptions - context dependent
  const getProviderDescription = (provider: ProviderType): string => {
    const isLocal = selectedCategory === 'local';
    
    switch (provider) {
      case ProviderType.OLLAMA:
        return 'Popular local AI runtime - Easy setup, excellent models';
      case ProviderType.HUGGINGFACE:
        return isLocal 
          ? 'Open source AI ecosystem for local execution'
          : 'Open source AI ecosystem with cloud access';
      case ProviderType.VLLM:
        return 'High-performance inference engine for local models';
      case ProviderType.ANTHROPIC:
        return 'Claude API - Superior reasoning and safety';
      case ProviderType.OPENAI:
        return 'Industry standard, versatile';
      case ProviderType.GEMINI:
        return 'Long context, multimodal';
      case ProviderType.MISTRAL:
        return 'European AI, efficient and high-performance';
      default:
        return '';
    }
  };

  useEffect(() => {
    if (mode === 'provider' && selectedCategory) {
      const categoryData = categories.find(c => c.id === selectedCategory);
      setAvailableProviders(categoryData?.providers || []);
      setHighlightedIndex(0);
    } else if (mode === 'model' && selectedProvider) {
      const loadModels = async () => {
        if (selectedProvider === ProviderType.OLLAMA) {
          // For Ollama, check actually installed models
          try {
            const { checkOllamaInstallation } = await import('../../utils/ollamaSetup.js');
            const status = await checkOllamaInstallation();
            
            if (status.installedModels.length > 0) {
              // Convert installed models to ModelInfo format
              const installedModelInfos: ModelInfo[] = status.installedModels.map(modelId => ({
                id: modelId,
                name: modelId,
                provider: ProviderType.OLLAMA,
                category: 'local' as const,
                description: `Installed Ollama model: ${modelId}`,
                contextLength: 128000,
                capabilities: ['chat', 'code']
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
          const models = selectedCategory === 'local' ? getLocalModels() : getCloudModels();
          const providerModels = models.filter((m: ModelInfo) => m.provider === selectedProvider);
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
        
        if (selected.id === 'none') {
          // User chose not to configure - close dialog
          onCancel();
          return;
        }
        
        setSelectedCategory(selected.id as 'local' | 'cloud');
        setMode('provider');
      } else if (mode === 'provider') {
        // Check if back option is selected
        if (highlightedIndex === availableProviders.length) {
          setMode('category');
          setSelectedCategory(null);
          return;
        }
        
        const selected = availableProviders[highlightedIndex];
        
        // For cloud providers, check if API key is already configured
        if (selectedCategory === 'cloud') {
          console.log('Provider selected in cloud category:', selected);
          setIsCheckingProvider(true);
          checkProviderNeedsSetup(selected, false).then((needsSetup) => {
            setIsCheckingProvider(false);
            if (needsSetup) {
              console.log('API key not found, calling onSetupRequired...');
              onSetupRequired(selected);
            } else {
              console.log('API key already configured, proceeding to model selection...');
              // Provider is ready, proceed to model selection
              setSelectedProvider(selected);
              setMode('model');
            }
          }).catch(() => {
            setIsCheckingProvider(false);
            // On error, assume setup is needed
            onSetupRequired(selected);
          });
          return;
        }
        
        // For local providers, check if setup is needed
        setIsCheckingProvider(true);
        checkProviderNeedsSetup(selected, selectedCategory === 'local').then((needsSetup) => {
          setIsCheckingProvider(false);
          if (needsSetup) {
            onSetupRequired(selected);
          } else {
            // Provider is ready, proceed to model selection
            setSelectedProvider(selected);
            setMode('model');
          }
        }).catch(() => {
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
      width={terminalWidth - 4}
    >
      <Box marginBottom={1} justifyContent="center">
        <Text bold color={Colors.AccentBlue}>
          {t('providerSelectionTitle')}
        </Text>
      </Box>

      {mode === 'category' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.Gray}>
              {t('selectCategoryPrompt')}
            </Text>
          </Box>
          
          {categories.map((category, index) => (
            <Box key={category.id} paddingLeft={1}>
              <Text
                color={index === highlightedIndex ? Colors.AccentBlue : Colors.Foreground}
                bold={index === highlightedIndex}
              >
                {index === highlightedIndex ? '> ' : '  '}{category.name}   <Text color={index === highlightedIndex ? Colors.Comment : Colors.Gray}>{category.description}</Text>
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {mode === 'provider' && selectedCategory && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.Gray}>
              {t('selectProviderPrompt')}
            </Text>
          </Box>
          
          {isCheckingProvider && (
            <Box paddingLeft={1} marginBottom={1}>
              <Text color={Colors.AccentBlue}>
                🔍 Checking provider availability...
              </Text>
            </Box>
          )}
          
          {availableProviders.map((provider, index) => {
            const isConfigured = providerConfigurations[provider] || false;
            const statusColor = getStatusColor(isConfigured);
            
            return (
              <Box key={provider} paddingLeft={1}>
                <Text
                  color={index === highlightedIndex ? Colors.AccentBlue : Colors.Foreground}
                  bold={index === highlightedIndex}
                >
                  {index === highlightedIndex ? '> ' : '  '}
                  <Text color={statusColor}>{getStatusIndicator(isConfigured)}</Text>
                  {' '}{getProviderDisplayName(provider).padEnd(18)}
                  <Text color={index === highlightedIndex ? Colors.Comment : Colors.Gray}>
                    {getProviderDescription(provider)}
                    {isConfigured && ' (Configured)'}
                  </Text>
                </Text>
              </Box>
            );
          })}
          
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
              <Text color={Colors.Gray}>
                Enter: Use provider | ← Back
              </Text>
            </Box>
          </Box>
          
          {/* Back option */}
          <Box paddingLeft={1}>
            <Text
              color={availableProviders.length === highlightedIndex ? Colors.AccentBlue : Colors.Gray}
              bold={availableProviders.length === highlightedIndex}
            >
              {availableProviders.length === highlightedIndex ? '> ' : '  '}← {t('navBack').replace('← ', '')}
            </Text>
          </Box>
        </Box>
      )}

      {mode === 'model' && selectedProvider && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.Gray}>
              {t('selectModelPrompt')}
            </Text>
          </Box>
          
          {availableModels.length === 0 ? (
            <Box paddingX={2} paddingY={1} borderStyle="single" borderColor={Colors.AccentRed}>
              <Text color={Colors.AccentRed}>
                {t('noModelsAvailable')} {selectedProvider}.
                {(() => {
                  if (selectedCategory === 'local') {
                    if (selectedProvider === ProviderType.HUGGINGFACE) {
                      return ' Please verify that HuggingFace local models are configured properly.';
                    }
                    return ` ${t('installModels')}`;
                  }
                  return ` ${t('checkApiKey')}`;
                })()}
              </Text>
            </Box>
          ) : (
            availableModels.map((model, index) => (
              <Box key={model.id} paddingLeft={1}>
                <Text color={index === highlightedIndex ? Colors.AccentBlue : Colors.Foreground}>
                  {index === highlightedIndex ? '> ' : '  '}
                  <Text bold={true}>{model.name}</Text>
                  <Text color={index === highlightedIndex ? Colors.Comment : Colors.Gray}>
                    {' '}{model.description} ({model.contextLength.toLocaleString()}t | {model.capabilities.join(', ')})
                  </Text>
                </Text>
              </Box>
            ))
          )}
          
          {/* Back option for models */}
          <Box paddingLeft={1}>
            <Text
              color={availableModels.length === highlightedIndex ? Colors.AccentBlue : Colors.Gray}
              bold={availableModels.length === highlightedIndex}
            >
              {availableModels.length === highlightedIndex ? '> ' : '  '}← {t('navBack').replace('← ', '')}
            </Text>
          </Box>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={Colors.Gray} dimColor>
          {mode === 'category' && `${t('navMove')} | ${t('navSelect')} | ${t('navCancel')}`}
          {mode === 'provider' && `${t('navMove')} | Enter: Use | ${t('navBack')} | ${t('navCancel')}`}
          {mode === 'model' && `${t('navMove')} | ${t('navSelect')} | Select "${t('navBack').replace('← ', '')}" to go back | ${t('navCancel')}`}
        </Text>
      </Box>
    </Box>
  );
};