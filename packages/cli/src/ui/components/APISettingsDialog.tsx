/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { ProviderType } from '@enfiy/core';
import { 
  hasStoredCredentials,
  getApiKey
} from '../../utils/secureStorage.js';

export interface APISettingsDialogProps {
  onManageProvider: (provider: ProviderType) => void;
  onCancel: () => void;
  terminalWidth: number;
}

interface ConfiguredProvider {
  type: ProviderType;
  displayName: string;
  isConfigured: boolean;
  maskedKey?: string;
}

export const APISettingsDialog: React.FC<APISettingsDialogProps> = ({
  onManageProvider,
  onCancel,
  terminalWidth,
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [configuredProviders, setConfiguredProviders] = useState<ConfiguredProvider[]>([]);

  // Get provider display name
  const getProviderDisplayName = (provider: ProviderType): string => {
    switch (provider) {
      case ProviderType.ANTHROPIC:
        return 'Anthropic Claude';
      case ProviderType.OPENAI:
        return 'OpenAI';
      case ProviderType.GEMINI:
        return 'Google Gemini';
      case ProviderType.MISTRAL:
        return 'Mistral AI';
      case ProviderType.HUGGINGFACE:
        return 'HuggingFace';
      default:
        return provider.toUpperCase();
    }
  };

  // Get masked API key or auth method
  const getMaskedKey = (provider: ProviderType): string => {
    const key = getApiKey(provider);
    if (!key) return 'Not configured';
    
    // Handle special authentication types
    if (key === 'OAUTH_AUTHENTICATED') {
      return 'Google Account';
    }
    if (key === 'CLAUDE_MAX_AUTHENTICATED') {
      return 'Claude Max Plan';
    }
    
    if (key.length <= 8) {
      return '•'.repeat(key.length);
    }
    
    // Calculate middle dots to keep total under 25 chars
    const prefixLength = 3;
    const suffixLength = 3;
    const maxTotalLength = 25;
    const maxMiddleDots = maxTotalLength - prefixLength - suffixLength;
    
    const actualMiddleLength = key.length - prefixLength - suffixLength;
    const middleDots = Math.min(actualMiddleLength, maxMiddleDots);
    
    return key.slice(0, prefixLength) + '•'.repeat(middleDots) + key.slice(-suffixLength);
  };

  // Load configured providers
  const loadConfiguredProviders = useCallback(() => {
    const cloudProviders = [
      ProviderType.ANTHROPIC,
      ProviderType.OPENAI,
      ProviderType.GEMINI,
      ProviderType.MISTRAL,
      ProviderType.HUGGINGFACE
    ];

    const providers: ConfiguredProvider[] = cloudProviders.map(provider => ({
      type: provider,
      displayName: getProviderDisplayName(provider),
      isConfigured: hasStoredCredentials(provider),
      maskedKey: getMaskedKey(provider)
    }));

    setConfiguredProviders(providers);
  }, []);

  useEffect(() => {
    loadConfiguredProviders();
  }, [loadConfiguredProviders]);

  const handleInput = useCallback((input: string, key: Record<string, boolean>) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      onCancel();
      return;
    }

    if (key.upArrow) {
      setHighlightedIndex(prev => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow) {
      setHighlightedIndex(prev => Math.min(configuredProviders.length, prev + 1));
      return;
    }

    if (key.return) {
      if (highlightedIndex === configuredProviders.length) {
        // Back option selected
        onCancel();
      } else {
        // Provider selected
        const selectedProvider = configuredProviders[highlightedIndex];
        onManageProvider(selectedProvider.type);
      }
    }

    if (key.leftArrow || key.backspace) {
      onCancel();
    }
  }, [highlightedIndex, configuredProviders, onCancel, onManageProvider]);

  useInput(handleInput);

  const renderContent = () => {
    const width = Math.min(terminalWidth - 4, 80);

    return (
      <Box flexDirection="column" width={width}>
        <Text color={Colors.Gray}>
          Manage your cloud AI provider API keys and configurations
        </Text>
        <Text color={Colors.Gray}>
          API keys are displayed in shortened format (max 25 characters)
        </Text>
        <Text> </Text>

        {configuredProviders.map((provider, index) => (
          <Box key={provider.type} paddingLeft={1}>
            <Text
              color={index === highlightedIndex ? Colors.AccentBlue : Colors.Foreground}
              bold={index === highlightedIndex}
            >
              {index === highlightedIndex ? '> ' : '  '}
              <Text color={provider.isConfigured ? Colors.AccentGreen : Colors.Gray}>
                {provider.isConfigured ? '•' : '◦'}
              </Text>
              {' '}{provider.displayName.padEnd(18)}<Text color={index === highlightedIndex ? "{Colors.Comment}" : "{Colors.Gray}"}>{provider.isConfigured ? `${provider.maskedKey}` : 'Setup API Key'}</Text>
            </Text>
          </Box>
        ))}

        {/* Back option */}
        <Text> </Text>
        <Box paddingLeft={1}>
          <Text
            color={configuredProviders.length === highlightedIndex ? Colors.AccentBlue : Colors.Gray}
            bold={configuredProviders.length === highlightedIndex}
          >
            {configuredProviders.length === highlightedIndex ? '> ' : '  '}← Back
          </Text>
        </Box>
      </Box>
    );
  };

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
          Settings
        </Text>
      </Box>

      {renderContent()}
      <Text> </Text>
      <Text color={Colors.Gray}>
        Arrow keys: Navigate | Enter: Select | Esc/←: Back
      </Text>
    </Box>
  );
};