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
import { ProviderType, Config } from '@enfiy/core';
import { ModelManager } from '../../services/modelManager.js';

export interface ModelSelectionDialogProps {
  config: Config;
  onSelect: (modelName: string) => void;
  onCancel: () => void;
  terminalWidth: number;
}

interface ModelInfo {
  name: string;
  provider: ProviderType;
  description: string;
  isAvailable: boolean;
  costTier: string;
  usage?: {
    used: number;
    limit: number;
    resetTime?: Date;
  };
}

export const ModelSelectionDialog: React.FC<ModelSelectionDialogProps> = ({
  config,
  onSelect,
  onCancel,
  terminalWidth,
}) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentModel, setCurrentModel] = useState<string>('');

  // Add close option to the list
  const totalItems = models.length + 1; // +1 for close option

  const getProviderDisplayName = (provider: ProviderType): string => {
    switch (provider) {
      case ProviderType.OPENAI:
        return 'OpenAI';
      case ProviderType.GEMINI:
        return 'Google Gemini';
      case ProviderType.MISTRAL:
        return 'Mistral';
      case ProviderType.OPENROUTER:
        return 'OpenRouter';
      case ProviderType.OLLAMA:
        return 'Ollama';
      default:
        return String(provider);
    }
  };

  // Load models and current model
  useEffect(() => {
    const loadModels = async () => {
      try {
        const modelManager = new ModelManager(config);
        const availableModels = await modelManager.getAvailableModels();
        const current = config.getModel() || '';

        // Get usage information for each model
        const modelsWithUsage = await Promise.all(
          availableModels.map(async (model) => {
            const usage = await modelManager.getModelUsage(model.name);
            return {
              name: model.name,
              provider: model.provider as ProviderType,
              description: model.description,
              isAvailable: model.isAvailable,
              costTier: model.costTier,
              usage,
            };
          }),
        );

        setModels(modelsWithUsage);
        setCurrentModel(current);

        // Set highlighted index to current model if found
        const currentIndex = modelsWithUsage.findIndex(
          (m) => m.name === current,
        );
        if (currentIndex >= 0) {
          setHighlightedIndex(currentIndex);
        }
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [config]);

  // Group models by provider
  const _groupedModels = useMemo(() => {
    const groups: Record<string, ModelInfo[]> = {};
    models.forEach((model) => {
      const providerName = getProviderDisplayName(model.provider);
      if (!groups[providerName]) {
        groups[providerName] = [];
      }
      groups[providerName].push(model);
    });
    return groups;
  }, [models]);

  const _getUsageDisplay = (model: ModelInfo): string => {
    if (!model.usage || model.usage.limit === 0) {
      return 'Unlimited';
    }

    const percent = Math.round((model.usage.used / model.usage.limit) * 100);
    return `${model.usage.used}/${model.usage.limit} (${percent}%)`;
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
      setHighlightedIndex(Math.min(totalItems - 1, highlightedIndex + 1));
    }

    if (key.return) {
      // Check if close option is selected (last item)
      if (highlightedIndex === models.length) {
        onCancel();
        return;
      }

      if (models[highlightedIndex]) {
        onSelect(models[highlightedIndex].name);
      }
    }
  });

  if (loading) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={Colors.BorderGray}
        paddingX={2}
        paddingY={1}
        width={Math.min(terminalWidth - 4, 100)}
      >
        <Box marginBottom={1} justifyContent="center">
          <Text bold color={Colors.AccentBlue}>
            Loading Models...
          </Text>
        </Box>
      </Box>
    );
  }

  const width = Math.min(terminalWidth - 4, 100);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={Colors.BorderGray}
      paddingX={2}
      paddingY={1}
      width={width}
    >
      <Box marginBottom={1} justifyContent="center">
        <Text bold color={Colors.AccentBlue}>
          Model Selection
        </Text>
      </Box>

      <Box>
        <Text color={Colors.Gray}>Select the model you want to use:</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={Colors.Gray}>
          Current:{' '}
          <Text bold color={Colors.AccentGreen}>
            {currentModel}
          </Text>
        </Text>
      </Box>

      <Box flexDirection="column">
        {models.map((model, index) => {
          const isHighlighted = index === highlightedIndex;
          const isCurrent = model.name === currentModel;
          const prefix = isHighlighted ? '> ' : '  ';

          // Truncate long model names
          const displayName =
            model.name.length > 30
              ? model.name.substring(0, 27) + '...'
              : model.name;

          return (
            <Box key={model.name} paddingLeft={1}>
              <Box width={35}>
                <Text
                  color={
                    isHighlighted
                      ? Colors.AccentBlue
                      : isCurrent
                        ? Colors.AccentGreen
                        : Colors.Foreground
                  }
                  bold={isHighlighted || isCurrent}
                >
                  {prefix}
                  {displayName}
                  {isCurrent && ' (current)'}
                </Text>
              </Box>
              <Box flexGrow={1}>
                <Text color={Colors.Comment}>{model.description}</Text>
              </Box>
            </Box>
          );
        })}

        {/* Close option */}
        <Box paddingLeft={1}>
          <Text
            color={
              highlightedIndex === models.length
                ? Colors.AccentBlue
                : Colors.Foreground
            }
            bold={highlightedIndex === models.length}
          >
            {highlightedIndex === models.length ? '> ' : '  '}
            Close
          </Text>
        </Box>
      </Box>

      <Box>
        <Text color={Colors.Gray}>Move | Enter Select | Esc Cancel</Text>
      </Box>
    </Box>
  );
};

// Named export only
