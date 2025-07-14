/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { ProviderType } from '@enfiy/core';
import { t } from '../utils/i18n.js';

export interface ProviderSetupDialogProps {
  provider: ProviderType;
  onComplete: (config: LocalProviderConfig) => void;
  onCancel: () => void;
  onSwitchToCloud?: () => void;
  terminalWidth: number;
}

interface LocalProviderConfig {
  type: ProviderType;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  authMethod?: 'api-key' | 'subscription' | 'local';
}

type SetupStep = 'method' | 'api-key' | 'subscription' | 'local-install' | 'local-install-guide' | 'model';

export const ProviderSetupDialog: React.FC<ProviderSetupDialogProps> = ({
  provider,
  onComplete,
  onCancel,
  onSwitchToCloud,
  terminalWidth,
}) => {
  const [step, setStep] = useState<SetupStep>('method');
  const [authMethod, setAuthMethod] = useState<'api-key' | 'subscription' | 'local'>('api-key');
  const [apiKey, setApiKey] = useState('');
  const [_isLocalInstalled, setIsLocalInstalled] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const isLocalProvider = [ProviderType.OLLAMA, ProviderType.HUGGINGFACE].includes(provider);
  const isCloudProvider = [ProviderType.OPENAI, ProviderType.ANTHROPIC, ProviderType.GEMINI, ProviderType.MISTRAL].includes(provider);

  const checkOllamaInstallation = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      setIsLocalInstalled(response.ok);
      if (response.ok) {
        setStep('model');
      } else {
        setStep('local-install');
      }
    } catch {
      setIsLocalInstalled(false);
      setStep('local-install');
    }
  }, []);

  // Check if local provider is installed
  useEffect(() => {
    if (isLocalProvider && provider === ProviderType.OLLAMA) {
      checkOllamaInstallation();
    } else if (isCloudProvider) {
      // For cloud providers, always start with method selection
      setStep('method');
    }
  }, [isLocalProvider, isCloudProvider, provider, checkOllamaInstallation]);

  // Reset highlighted index when step changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [step]);

  const handleInput = useCallback((input: string, key: Record<string, boolean>) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      onCancel();
      return;
    }

    // Handle arrow keys for navigation
    if (key.upArrow) {
      if (step === 'method' && isCloudProvider) {
        setHighlightedIndex(prev => Math.max(0, prev - 1));
      } else if (step === 'local-install') {
        setHighlightedIndex(prev => Math.max(0, prev - 1));
      } else if (step === 'local-install-guide') {
        setHighlightedIndex(prev => Math.max(0, prev - 1));
      }
      return;
    }

    if (key.downArrow) {
      if (step === 'method' && isCloudProvider) {
        setHighlightedIndex(prev => Math.min(2, prev + 1)); // +1 for back option
      } else if (step === 'local-install') {
        setHighlightedIndex(prev => Math.min(2, prev + 1)); // 3 options now
      } else if (step === 'local-install-guide') {
        setHighlightedIndex(prev => Math.min(1, prev + 1)); // 2 options
      }
      return;
    }

    // Handle Enter key
    if (key.return) {
      if (step === 'method' && isCloudProvider) {
        if (highlightedIndex === 0) {
          console.log('🔧 Setting authMethod to api-key and step to api-key');
          setAuthMethod('api-key');
          setStep('api-key');
        } else if (highlightedIndex === 1) {
          setAuthMethod('subscription');
          setStep('subscription');
        } else if (highlightedIndex === 2) {
          onCancel(); // Back option
          return;
        }
      } else if (step === 'method' && isLocalProvider) {
        setAuthMethod('local');
        checkOllamaInstallation();
      } else if (step === 'api-key' && currentInput.trim()) {
        setApiKey(currentInput.trim());
        setStep('model');
      } else if (step === 'local-install') {
        if (highlightedIndex === 0) {
          setStep('local-install-guide');
        } else if (highlightedIndex === 1) {
          // Switch to cloud AI - trigger provider selection with cloud category
          if (onSwitchToCloud) {
            onSwitchToCloud();
          } else {
            onCancel(); // Fallback to cancel
          }
        } else {
          onCancel(); // Go back
        }
      } else if (step === 'local-install-guide') {
        if (highlightedIndex === 0) {
          checkOllamaInstallation();
        } else {
          onCancel(); // Go back
        }
      } else if (step === 'model') {
        // Validate that we have required credentials for cloud providers
        if (isCloudProvider && authMethod === 'api-key' && !apiKey) {
          // API key is required but not provided - go back to API key input
          setStep('api-key');
          return;
        }
        
        onComplete({
          type: provider,
          apiKey: authMethod === 'api-key' ? apiKey : undefined,
          authMethod,
          model: getDefaultModel(provider),
        });
      }
      return;
    }

    // Handle text input for API key
    if (step === 'api-key') {
      if (key.backspace || key.delete) {
        setCurrentInput(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.alt) {
        setCurrentInput(prev => prev + input);
      }
    }
  }, [step, currentInput, apiKey, authMethod, provider, onComplete, onCancel, onSwitchToCloud, isLocalProvider, highlightedIndex, checkOllamaInstallation, isCloudProvider]);

  useInput(handleInput);

  const getDefaultModel = (provider: ProviderType): string => {
    switch (provider) {
      case ProviderType.OLLAMA:
        return 'llama3.2:8b';
      case ProviderType.OPENAI:
        return 'gpt-4o-mini';
      case ProviderType.ANTHROPIC:
        return 'claude-3-5-sonnet-20241022';
      case ProviderType.GEMINI:
        return 'gemini-2.0-flash-exp';
      default:
        return 'default';
    }
  };

  const getProviderInstructions = () => {
    switch (provider) {
      case ProviderType.OLLAMA:
        return {
          name: 'Ollama',
          description: 'Local AI runtime for open-source models',
          installUrl: 'https://ollama.com',
          features: ['Privacy-focused', 'No API costs', 'Offline capable'],
          benefits: 'Run AI models locally on your computer - completely private and free',
          installTime: '~5 minutes',
        };
      case ProviderType.OPENAI:
        return {
          name: 'OpenAI',
          description: 'GPT models and advanced AI capabilities',
          apiUrl: 'https://platform.openai.com/api-keys',
          subscriptionUrl: 'https://chatgpt.com',
          subscriptionName: 'ChatGPT Plus/Pro',
          features: ['Industry-leading models', 'Wide capability range', 'Well-documented'],
          benefits: 'Most popular AI service with excellent performance',
          installTime: '~1 minute',
        };
      case ProviderType.ANTHROPIC:
        return {
          name: 'Anthropic',
          description: 'Claude models with advanced reasoning',
          apiUrl: 'https://console.anthropic.com/account/keys',
          subscriptionUrl: 'https://claude.ai',
          subscriptionName: 'Claude Pro',
          features: ['Superior reasoning', 'Long context windows', 'Safety-focused'],
          benefits: 'Advanced reasoning and coding capabilities with focus on safety',
          installTime: '~1 minute',
        };
      case ProviderType.GEMINI:
        return {
          name: 'Google Gemini',
          description: 'Google\'s multimodal AI models',
          apiUrl: 'https://aistudio.google.com/app/apikey',
          subscriptionUrl: 'https://gemini.google.com',
          subscriptionName: 'Gemini Advanced',
          features: ['Multimodal capabilities', 'Large context windows', 'Fast inference'],
          benefits: 'Free tier available with excellent multimodal capabilities',
          installTime: '~1 minute',
        };
      default:
        return { name: provider, description: '', features: [], benefits: '', installTime: '' };
    }
  };

  const providerInfo = getProviderInstructions();

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={Colors.BorderGray}
      paddingX={2}
      paddingY={1}
      width={Math.min(terminalWidth - 6, 100)}
    >
      <Box marginBottom={1} justifyContent="center">
        <Text bold color={Colors.AccentBlue}>
          Setup {providerInfo.name}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={Colors.Gray}>
          {providerInfo.description}
        </Text>
      </Box>

      {step === 'method' && isCloudProvider && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.Foreground}>
              Choose authentication method:
            </Text>
          </Box>
          
          <Box paddingLeft={1}>
            <Text 
              color={highlightedIndex === 0 ? Colors.AccentBlue : Colors.Foreground}
              bold={highlightedIndex === 0}
            >
              {highlightedIndex === 0 ? '> ' : '  '}API Key (recommended for developers)
            </Text>
          </Box>
          <Box paddingLeft={1}>
            <Text 
              color={highlightedIndex === 1 ? Colors.AccentBlue : Colors.Foreground}
              bold={highlightedIndex === 1}
            >
              {highlightedIndex === 1 ? '> ' : '  '}Web Subscription ({providerInfo.subscriptionName || 'Premium service'})
            </Text>
          </Box>
          
          {/* Back option */}
          <Box paddingLeft={1}>
            <Text 
              color={highlightedIndex === 2 ? Colors.AccentBlue : Colors.Gray}
              bold={highlightedIndex === 2}
            >
              {highlightedIndex === 2 ? '> ' : '  '}← {t('navBack').replace('← ', '')}
            </Text>
          </Box>
          
          <Box marginTop={1}>
            <Text color={Colors.Gray} dimColor>
              Use ↑↓ to navigate | Enter to select | Select &ldquo;{t('navBack').replace('← ', '')}&rdquo; to go back | Esc to cancel
            </Text>
          </Box>
        </Box>
      )}

      {step === 'api-key' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.Foreground}>
              Enter your {providerInfo.name} API key:
            </Text>
          </Box>
          
          <Box paddingLeft={1} marginBottom={1}>
            <Text color={Colors.AccentBlue}>
              Key: {"*".repeat(Math.min(currentInput.length, 20))}
              {currentInput.length > 20 && "..."}
            </Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text color={Colors.Gray} dimColor>
              Get your API key: {providerInfo.apiUrl}
            </Text>
          </Box>
          
          <Box>
            <Text color={Colors.Gray} dimColor>
              Type your key and press Enter | Esc to cancel
            </Text>
          </Box>
        </Box>
      )}

      {step === 'local-install' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.AccentYellow}>
              🚀 {providerInfo.name} Setup Required
            </Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text color={Colors.Foreground}>
              {providerInfo.benefits || `${providerInfo.name} needs to be installed first`}
            </Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text color={Colors.Gray}>
              ⏱️ Setup time: {providerInfo.installTime || '~5 minutes'}
            </Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text color={Colors.Foreground}>
              Choose your next step:
            </Text>
          </Box>
          
          <Box paddingLeft={1} marginBottom={1}>
            <Text 
              color={highlightedIndex === 0 ? Colors.AccentBlue : Colors.Foreground}
              bold={highlightedIndex === 0}
            >
              {highlightedIndex === 0 ? '> ' : '  '}📦 I&apos;ll install {providerInfo.name} now ({providerInfo.installTime})
            </Text>
            <Box paddingLeft={3} marginTop={0}>
              <Text color={Colors.Gray} dimColor>
                Private, free, offline-capable AI
              </Text>
            </Box>
          </Box>
          
          <Box paddingLeft={1} marginBottom={1}>
            <Text 
              color={highlightedIndex === 1 ? Colors.AccentBlue : Colors.Foreground}
              bold={highlightedIndex === 1}
            >
              {highlightedIndex === 1 ? '> ' : '  '}☁️ Try cloud AI instead (~1 minute)
            </Text>
            <Box paddingLeft={3} marginTop={0}>
              <Text color={Colors.Gray} dimColor>
                Quick setup with OpenAI, Anthropic, or Gemini
              </Text>
            </Box>
          </Box>
          
          <Box paddingLeft={1} marginBottom={1}>
            <Text 
              color={highlightedIndex === 2 ? Colors.AccentBlue : Colors.Gray}
              bold={highlightedIndex === 2}
            >
              {highlightedIndex === 2 ? '> ' : '  '}← Back to provider selection
            </Text>
          </Box>
          
          {highlightedIndex === 0 && (
            <Box paddingLeft={1} marginTop={1} flexDirection="column">
              <Text color={Colors.AccentBlue} bold>
                📋 What happens next:
              </Text>
              <Text color={Colors.Gray}>1. You&apos;ll see detailed installation steps</Text>
              <Text color={Colors.Gray}>2. Follow the instructions to install Ollama</Text>
              <Text color={Colors.Gray}>3. Come back and we&apos;ll check if it&apos;s working</Text>
            </Box>
          )}
          
          <Box marginTop={1}>
            <Text color={Colors.Gray} dimColor>
              Use ↑↓ to navigate | Enter to select | Esc to cancel
            </Text>
          </Box>
        </Box>
      )}

      {step === 'local-install-guide' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.AccentBlue} bold>
              📦 {providerInfo.name} Installation Guide
            </Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text color={Colors.Foreground}>
              Follow these steps to install {providerInfo.name}:
            </Text>
          </Box>
          
          <Box paddingLeft={1} flexDirection="column" marginBottom={1}>
            <Text color={Colors.AccentGreen} bold>
              Step 1: Download Ollama
            </Text>
            <Text color={Colors.Gray}>
              • Visit: {providerInfo.installUrl}
            </Text>
            <Text color={Colors.Gray}>
              • Download the installer for your operating system
            </Text>
            <Text> </Text>
            
            <Text color={Colors.AccentGreen} bold>
              Step 2: Install Ollama
            </Text>
            <Text color={Colors.Gray}>
              • Run the downloaded installer
            </Text>
            <Text color={Colors.Gray}>
              • Follow the installation wizard
            </Text>
            <Text> </Text>
            
            <Text color={Colors.AccentGreen} bold>
              Step 3: Install a Model
            </Text>
            <Text color={Colors.Gray}>
              • Open your terminal/command prompt
            </Text>
            <Text color={Colors.Gray}>
              • Run: ollama pull llama3.2:8b
            </Text>
            <Text color={Colors.Gray}>
              • Wait for the model to download (~5GB)
            </Text>
            <Text> </Text>
            
            <Text color={Colors.AccentGreen} bold>
              Step 4: Verify Installation
            </Text>
            <Text color={Colors.Gray}>
              • Run: ollama list
            </Text>
            <Text color={Colors.Gray}>
              • You should see llama3.2:8b in the list
            </Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text color={Colors.Foreground}>
              When you&apos;re done, choose an option:
            </Text>
          </Box>
          
          <Box paddingLeft={1}>
            <Text 
              color={highlightedIndex === 0 ? Colors.AccentBlue : Colors.Foreground}
              bold={highlightedIndex === 0}
            >
              {highlightedIndex === 0 ? '> ' : '  '}✅ I&apos;ve completed the installation - Check now
            </Text>
          </Box>
          <Box paddingLeft={1}>
            <Text 
              color={highlightedIndex === 1 ? Colors.AccentBlue : Colors.Gray}
              bold={highlightedIndex === 1}
            >
              {highlightedIndex === 1 ? '> ' : '  '}← Go back
            </Text>
          </Box>
          
          <Box marginTop={1}>
            <Text color={Colors.Gray} dimColor>
              Use ↑↓ to navigate | Enter to select | Esc to cancel
            </Text>
          </Box>
        </Box>
      )}

      {step === 'model' && (
        <Box flexDirection="column">
          {/* Show warning if cloud provider without API key */}
          {isCloudProvider && authMethod === 'api-key' && !apiKey ? (
            <Box marginBottom={1}>
              <Text color={Colors.AccentRed}>
                ⚠️  API Key Required!
              </Text>
              <Box marginTop={1}>
                <Text color={Colors.Gray}>
                  Please go back and enter your {providerInfo.name} API key to continue.
                </Text>
              </Box>
            </Box>
          ) : (
            <>
              <Box marginBottom={1}>
                <Text color={Colors.AccentGreen}>
                  {providerInfo.name} is ready!
                </Text>
              </Box>
              
              <Box marginBottom={1}>
                <Text color={Colors.Foreground}>
                  Default model: {getDefaultModel(provider)}
                </Text>
              </Box>
              
              <Box paddingLeft={1} flexDirection="column" marginBottom={1}>
                {providerInfo.features.map((feature, index) => (
                  <Text key={index} color={Colors.Gray}>
                    - {feature}
                  </Text>
                ))}
              </Box>
            </>
          )}
          
          <Box>
            <Text color={Colors.Gray} dimColor>
              Press Enter to {isCloudProvider && authMethod === 'api-key' && !apiKey ? 'go back' : 'complete setup'} | Esc to cancel
            </Text>
          </Box>
        </Box>
      )}

      {step === 'subscription' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.Foreground}>
              Using {providerInfo.name} subscription
            </Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text color={Colors.Gray}>
              Access via: {providerInfo.subscriptionUrl}
            </Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text color={Colors.AccentYellow}>
              Note: Subscription mode provides web-based access only.
              For CLI integration, API key is recommended.
            </Text>
          </Box>
          
          <Box>
            <Text color={Colors.Gray} dimColor>
              Press Enter to continue | Esc to cancel
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};