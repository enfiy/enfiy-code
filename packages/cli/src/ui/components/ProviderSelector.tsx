/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Text, Box, useInput } from 'ink';
import { Colors } from '../colors.js';
import { ProviderType, ProviderConfig, ProviderFactory } from '@enfiy/core';

interface ProviderOption {
  type: ProviderType;
  name: string;
  available: boolean;
  isLocal: boolean;
}

interface ProviderSelectorProps {
  onProviderSelected: (config: ProviderConfig) => void;
  onCancel: () => void;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  onProviderSelected,
  onCancel,
}) => {
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function detectProviders() {
      try {
        const detected = await ProviderFactory.detectAvailableProviders();
        const providerOptions: ProviderOption[] = detected.map((p: { type: ProviderType; name: string; available: boolean }) => ({
          type: p.type,
          name: p.name,
          available: p.available,
          isLocal: p.type === ProviderType.OLLAMA,
        }));

        // Sort: available local providers first, then available cloud providers, then unavailable
        providerOptions.sort((a, b) => {
          if (a.available && !b.available) return -1;
          if (!a.available && b.available) return 1;
          if (a.available && b.available) {
            if (a.isLocal && !b.isLocal) return -1;
            if (!a.isLocal && b.isLocal) return 1;
          }
          return 0;
        });

        setProviders(providerOptions);
        
        // Select first available local provider by default
        const defaultIndex = providerOptions.findIndex(p => p.available && p.isLocal);
        if (defaultIndex >= 0) {
          setSelectedIndex(defaultIndex);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to detect providers');
      } finally {
        setLoading(false);
      }
    }

    detectProviders();
  }, []);

  useInput((input, key) => {
    if (loading) return;

    if (key.upArrow) {
      setSelectedIndex(prev => prev > 0 ? prev - 1 : providers.length - 1);
    } else if (key.downArrow) {
      setSelectedIndex(prev => prev < providers.length - 1 ? prev + 1 : 0);
    } else if (key.return) {
      const selected = providers[selectedIndex];
      if (selected?.available) {
        createProviderConfig(selected.type).then(config => {
          onProviderSelected(config);
        }).catch(error => {
          console.error('Failed to create provider config:', error);
          // Fallback to basic config
          onProviderSelected(ProviderFactory.getDefaultProviderConfig());
        });
      }
    } else if (key.escape || input === 'q') {
      onCancel();
    }
  });

  const createProviderConfig = async (type: ProviderType): Promise<ProviderConfig> => {
    switch (type) {
      case ProviderType.OLLAMA: {
        // Get the first available installed model for Ollama
        let model = 'llama3.2:3b'; // Default fallback
        try {
          const { checkOllamaInstallation } = await import('../../utils/ollamaSetup.js');
          const status = await checkOllamaInstallation();
          if (status.installedModels.length > 0) {
            model = status.installedModels[0];
          }
        } catch (error) {
          console.debug('Could not check Ollama models, using default:', error);
        }
        
        return {
          type: ProviderType.OLLAMA,
          baseUrl: 'http://localhost:11434',
          model,
          temperature: 0.7,
        };
      }
      case ProviderType.GEMINI:
        return {
          type: ProviderType.GEMINI,
          model: 'gemini-2.0-flash-exp',
          temperature: 0.7,
        };
      default:
        return ProviderFactory.getDefaultProviderConfig();
    }
  };

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={Colors.AccentBlue}>🔍 Detecting available AI providers...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={Colors.AccentRed}>❌ Error: {error}</Text>
        <Text color={Colors.Comment}>Press any key to continue with default settings</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text color={Colors.AccentBlue} bold>
        🤖 Select AI Provider
      </Text>
      <Text color={Colors.Comment}>
        Use ↑/↓ to navigate, Enter to select, Esc to cancel
      </Text>
      <Box marginY={1} />
      
      {providers.map((provider, index) => {
        const isSelected = index === selectedIndex;
        const isAvailable = provider.available;
        
        return (
          <Box key={provider.type} marginBottom={0}>
            <Text color={isSelected ? Colors.AccentBlue : Colors.Foreground}>
              {isSelected ? '▶ ' : '  '}
              {isAvailable ? '✅' : '❌'} {provider.name}
              {provider.isLocal ? ' (Local)' : ' (Cloud)'}
              {!isAvailable && ' - Not Available'}
            </Text>
          </Box>
        );
      })}
      
      <Box marginY={1} />
      
      {providers[selectedIndex]?.available ? (
        <Box flexDirection="column">
          <Text color={Colors.AccentGreen}>
            ✨ {providers[selectedIndex].name} is ready to use
          </Text>
          {providers[selectedIndex].isLocal && (
            <Text color={Colors.Comment}>
              💡 Local providers keep your data private and work offline
            </Text>
          )}
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text color={Colors.AccentYellow}>
            ⚠️  {providers[selectedIndex]?.name} is not available
          </Text>
          {providers[selectedIndex]?.type === ProviderType.OLLAMA && (
            <Text color={Colors.Comment}>
              💡 Install Ollama from https://ollama.ai to use local AI models
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};