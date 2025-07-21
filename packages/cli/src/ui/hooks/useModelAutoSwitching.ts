/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { useCallback, useRef } from 'react';
import { Config } from '@enfiy/core';
import { ModelManager } from '../../services/modelManager.js';
import { MessageType } from '../types.js';

interface UseModelAutoSwitchingProps {
  config: Config | null;
  addMessage: (message: {
    type: MessageType;
    content: string;
    timestamp: Date;
  }) => void;
  isEnabled?: boolean;
}

export function useModelAutoSwitching({
  config,
  addMessage,
  isEnabled = true,
}: UseModelAutoSwitchingProps) {
  const modelManagerRef = useRef<ModelManager | null>(null);
  const switchingInProgress = useRef<Set<string>>(new Set());

  // Get or create ModelManager instance
  const getModelManager = useCallback(() => {
    if (!config) return null;

    if (!modelManagerRef.current) {
      modelManagerRef.current = new ModelManager(config);
    }
    return modelManagerRef.current;
  }, [config]);

  // Handle model errors and attempt auto-switching
  const handleModelError = useCallback(
    async (error: unknown, currentModel?: string): Promise<string | null> => {
      if (!isEnabled || !config) return null;

      const modelManager = getModelManager();
      if (!modelManager) return null;

      const modelName = currentModel || config.getModel();

      // Prevent concurrent switching for the same model
      if (switchingInProgress.current.has(modelName)) {
        return null;
      }

      try {
        switchingInProgress.current.add(modelName);

        // Check if we should switch models based on the error
        const fallbackModel = await modelManager.shouldSwitchModel(
          modelName,
          error,
        );

        if (fallbackModel) {
          // Attempt to switch to the fallback model
          const switched = await modelManager.switchToModel(fallbackModel);

          if (switched) {
            // Notify user of the automatic switch
            addMessage({
              type: MessageType.INFO,
              content: `Auto-switched from ${modelName} to ${fallbackModel}\nReason: ${getErrorReason(error)}`,
              timestamp: new Date(),
            });

            return fallbackModel;
          } else {
            addMessage({
              type: MessageType.ERROR,
              content: `Failed to auto-switch to ${fallbackModel}. Please check model availability.`,
              timestamp: new Date(),
            });
          }
        }

        return null;
      } catch (switchError) {
        console.error('Error during auto-switching:', switchError);
        return null;
      } finally {
        switchingInProgress.current.delete(modelName);
      }
    },
    [isEnabled, config, getModelManager, addMessage],
  );

  // Monitor model usage and suggest switches
  const checkModelUsage = useCallback(
    async (modelName?: string): Promise<void> => {
      if (!isEnabled || !config) return;

      const modelManager = getModelManager();
      if (!modelManager) return;

      const currentModel = modelName || config.getModel();

      try {
        const usage = await modelManager.getModelUsage(currentModel);
        const usagePercent =
          usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;

        // Warn when approaching limits
        if (usagePercent >= 85 && usagePercent < 95) {
          const fallbackModel =
            await modelManager.shouldSwitchModel(currentModel);
          if (fallbackModel) {
            addMessage({
              type: MessageType.INFO,
              content: `Model ${currentModel} usage at ${Math.round(usagePercent)}%. Consider switching to ${fallbackModel} with /model switch ${fallbackModel}`,
              timestamp: new Date(),
            });
          }
        }

        // Auto-switch when very close to limit
        if (usagePercent >= 95) {
          await handleModelError(
            { message: 'Usage limit approaching' },
            currentModel,
          );
        }
      } catch (error) {
        console.error('Error checking model usage:', error);
      }
    },
    [isEnabled, config, getModelManager, addMessage, handleModelError],
  );

  // Get model status and suggestions
  const getModelStatus = useCallback(
    async (modelName?: string) => {
      if (!config) return null;

      const modelManager = getModelManager();
      if (!modelManager) return null;

      const currentModel = modelName || config.getModel();

      try {
        const usage = await modelManager.getModelUsage(currentModel);
        const fallbackModel =
          await modelManager.shouldSwitchModel(currentModel);

        return {
          model: currentModel,
          usage,
          usagePercent:
            usage.limit > 0 ? Math.round((usage.used / usage.limit) * 100) : 0,
          suggestedFallback: fallbackModel,
          autoSwitchEnabled: isEnabled,
        };
      } catch (error) {
        console.error('Error getting model status:', error);
        return null;
      }
    },
    [config, getModelManager, isEnabled],
  );

  // Clear model usage cache
  const clearUsageCache = useCallback(() => {
    const modelManager = getModelManager();
    if (modelManager) {
      modelManager.clearUsageCache();
    }
  }, [getModelManager]);

  return {
    handleModelError,
    checkModelUsage,
    getModelStatus,
    clearUsageCache,
    isAutoSwitchingEnabled: isEnabled,
  };
}

// Helper function to extract human-readable error reasons
function getErrorReason(error: unknown): string {
  const errorObj = error as { status?: number; message?: string }; // Type assertion for error object

  if (errorObj?.status !== undefined && errorObj.status === 429) {
    return 'Rate limit exceeded';
  }

  if (errorObj?.status !== undefined && errorObj.status >= 500) {
    return 'Server error';
  }

  if (errorObj?.message?.includes('rate limit')) {
    return 'Rate limit exceeded';
  }

  if (errorObj?.message?.includes('quota')) {
    return 'Quota exceeded';
  }

  if (errorObj?.message?.includes('limit')) {
    return 'Usage limit reached';
  }

  return errorObj?.message || 'Model error';
}

// Example of how to integrate this hook into a component
/*
import { useModelAutoSwitching } from './useModelAutoSwitching';

function MyComponent({ config, addMessage }) {
  const { handleModelError, checkModelUsage, getModelStatus } = useModelAutoSwitching({
    config,
    addMessage,
    isEnabled: true,
  });

  // Example usage:
  async function makeApiCall() {
    try {
      // ... make API call with current model
    } catch (error) {
      const newModel = await handleModelError(error);
      if (newModel) {
        // Retry with new model
      }
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      checkModelUsage();
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkModelUsage]);

  return (
    // ... component JSX
  );
}
*/
