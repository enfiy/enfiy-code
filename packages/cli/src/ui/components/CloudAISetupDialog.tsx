/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { ProviderType, AuthType } from '@enfiy/core';
import {
  storeApiKey,
  removeApiKey,
  getApiKey,
  validateApiKey,
} from '../../utils/secureStorage.js';
import { debugLogger } from '../../utils/debugLogger.js';

export interface CloudAISetupDialogProps {
  provider: ProviderType;
  onComplete: (config: CloudAIConfig) => void;
  onCancel: () => void;
  terminalWidth: number;
  isManaging?: boolean;
  forceAuthSelection?: boolean;
  inputWidth?: number;
}

interface CloudAIConfig {
  type: ProviderType;
  apiKey: string;
  authType?: AuthType;
  endpoint?: string;
}

type SetupStep =
  | 'auth-method-selection'
  | 'api-key-input'
  | 'api-key-validation'
  | 'oauth-setup'
  | 'subscription-login'
  | 'api-key-management'
  | 'complete'
  | 'auto-complete';

type ManagementAction = 'view' | 'update' | 'delete' | 'back';

export const CloudAISetupDialog: React.FC<CloudAISetupDialogProps> = ({
  provider,
  onComplete,
  onCancel,
  terminalWidth,
  isManaging = false,
  forceAuthSelection = false,
  inputWidth,
}) => {
  const [step, setStep] = useState<SetupStep>(() => {
    console.log('CloudAISetupDialog initial step determination:', {
      provider,
      isManaging,
      forceAuthSelection,
    });

    // If managing from Settings, go directly to management screen
    if (isManaging) {
      console.log('Going to management screen (isManaging=true)');
      return 'api-key-management';
    }

    // Check if API key already exists
    const existingKey = getApiKey(provider);
    console.log('Existing key check:', {
      hasKey: !!existingKey,
      keyPreview: existingKey ? existingKey.substring(0, 10) + '...' : 'none',
    });

    // If we have an existing key and not forcing auth selection and managing
    if (existingKey && !forceAuthSelection && isManaging) {
      console.log('Going to management screen (existing key found)');
      return 'api-key-management';
    }

    // Always show authentication method selection screen
    // This allows users to see available options even if API key exists
    console.log('Always showing auth method selection screen');
    return 'auth-method-selection';
  });

  const [apiKey, setApiKey] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(() => {
    console.log('CloudAISetupDialog: initializing highlightedIndex to 0');
    return 0;
  });
  const [isInputMode, setIsInputMode] = useState(false);

  // Get available auth methods for provider
  // Get base auth methods for provider without delete option
  const getBaseAuthMethods = useCallback((): Array<{
    id: string;
    name: string;
    description: string;
  }> => {
    switch (provider) {
      case ProviderType.GEMINI:
        return [
          {
            id: 'api-key',
            name: 'API Key',
            description: 'Use Gemini API key from Google AI Studio',
          },
        ];
      case ProviderType.OPENAI:
        return [
          {
            id: 'api-key',
            name: 'API Key',
            description: 'Use OpenAI API key from platform.openai.com',
          },
        ];
      case ProviderType.MISTRAL:
        return [
          {
            id: 'api-key',
            name: 'API Key',
            description: 'Use Mistral API key from console.mistral.ai',
          },
        ];
      case ProviderType.OPENROUTER:
        return [
          {
            id: 'api-key',
            name: 'API Key',
            description: 'Use OpenRouter API key from openrouter.ai',
          },
        ];
      case ProviderType.ANTHROPIC:
        return [
          {
            id: 'api-key',
            name: 'API Key',
            description: 'Use API key from Anthropic console',
          },
        ];
      default:
        return [
          {
            id: 'api-key',
            name: 'API Key',
            description: 'Use API key authentication',
          },
        ];
    }
  }, [provider]);

  // Get available auth methods for provider
  const getAuthMethods = useCallback(
    (): Array<{
      id: string;
      name: string;
      description: string;
    }> => getBaseAuthMethods(),
    [getBaseAuthMethods],
  );

  // Get provider display name
  const getProviderDisplayName = useCallback((): string => {
    switch (provider) {
      case ProviderType.OPENAI:
        return 'OpenAI';
      case ProviderType.GEMINI:
        return 'Google Gemini';
      case ProviderType.MISTRAL:
        return 'Mistral AI';
      case ProviderType.ANTHROPIC:
        return 'Anthropic';
      case ProviderType.OPENROUTER:
        return 'OpenRouter';
      default:
        return provider.toUpperCase();
    }
  }, [provider]);

  // Get API key instructions
  const getApiKeyInstructions = (): string[] => {
    switch (provider) {
      case ProviderType.OPENAI:
        return [
          '1. Visit https://platform.openai.com/api-keys',
          '2. Sign in to your account',
          '3. Click "Create new secret key"',
          '4. Copy the key (starts with "sk-")',
        ];
      case ProviderType.GEMINI:
        return [
          '1. Visit https://makersuite.google.com/app/apikey',
          '2. Sign in with your Google account',
          '3. Click "Create API key"',
          '4. Copy the key (starts with "AIza")',
        ];
      case ProviderType.MISTRAL:
        return [
          '1. Visit https://console.mistral.ai/',
          '2. Sign in or create an account',
          '3. Go to API Keys section',
          '4. Create a new API key',
          '5. Copy the generated key',
        ];
      case ProviderType.OPENROUTER:
        return [
          '1. Visit https://openrouter.ai/keys',
          '2. Sign in or create an account',
          '3. Click "Create Key"',
          '4. Set optional name and credit limit',
          '5. Copy the API key (starts with "sk-or-")',
        ];
      case ProviderType.ANTHROPIC:
        return [
          '1. Visit https://console.anthropic.com/account/keys',
          '2. Sign in or create an account',
          '3. Click "Create Key"',
          '4. Give your key a name',
          '5. Copy the API key (starts with "sk-ant-")',
        ];
      default:
        return [
          'Please check the provider documentation for API key setup instructions.',
        ];
    }
  };

  const getMaxIndex = useCallback((): number => {
    switch (step) {
      case 'auth-method-selection':
        return getAuthMethods().length; // Auth methods + Back
      case 'api-key-input': {
        const existingKey = getApiKey(provider);
        return existingKey ? 2 : 1; // If existing key: Use existing, Enter new, Back (0,1,2) | No existing: Enter new, Back (0,1)
      }
      case 'api-key-management':
        return 3; // View, Update, Delete, Back
      default:
        return 0;
    }
  }, [step, getAuthMethods, provider]);

  const cleanApiKey = useCallback((key: string): string => {
    // Remove bracketed paste mode escape sequences and other unwanted characters
    const cleaned = key
      .replace(/\[200~/g, '') // Remove bracketed paste start
      .replace(/\[201~/g, '') // Remove bracketed paste end
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0E-\x1F\x7F]/gu, '') // Remove control characters except tab, newline, carriage return
      .replace(/\r?\n/g, '') // Remove line breaks
      .replace(/\t/g, ''); // Remove tabs

    // Only trim leading/trailing whitespace, preserve internal spaces for API keys that might need them
    return cleaned.trim();
  }, []);

  const validateAndSaveApiKey = useCallback(async () => {
    // Prevent duplicate calls
    if (step === 'api-key-validation' || step === 'complete') {
      return;
    }

    try {
      const cleanedApiKey = cleanApiKey(apiKey);

      debugLogger.info('validation-flow', 'validateAndSaveApiKey called', {
        provider,
        providerType: typeof provider,
        originalKey: apiKey,
        cleanedKey: cleanedApiKey,
        keyLength: cleanedApiKey.length,
        keyPrefix: cleanedApiKey.substring(0, 10),
        fullKey: cleanedApiKey,
      });

      const isValid = validateApiKey(provider, cleanedApiKey);
      debugLogger.info('validation-flow', 'Validation completed', { isValid });

      if (!isValid) {
        setValidationError(
          `Invalid API key format for ${getProviderDisplayName()}`,
        );
        setStep('api-key-input');
        return;
      }

      // Store the cleaned API key with correct auth method
      storeApiKey(provider, cleanedApiKey, undefined, 'api-key');
      setStep('complete');

      // Complete setup immediately
      onComplete({
        type: provider,
        authType: AuthType.API_KEY,
        apiKey: cleanedApiKey,
      });
    } catch (error) {
      setValidationError(`Failed to validate API key: ${error}`);
      setStep('api-key-input');
    }
  }, [
    apiKey,
    cleanApiKey,
    provider,
    getProviderDisplayName,
    setValidationError,
    setStep,
    onComplete,
    step,
  ]);

  const handleEnterKey = useCallback(() => {
    switch (step) {
      case 'auth-method-selection': {
        const authMethods = getAuthMethods();
        if (highlightedIndex === authMethods.length) {
          // Back option selected
          onCancel();
        } else {
          const selectedMethod = authMethods[highlightedIndex];

          if (selectedMethod.id === 'api-key') {
            setStep('api-key-input');
            setHighlightedIndex(0);
          }
        }
        break;
      }

      case 'api-key-input': {
        const existingKey = getApiKey(provider);
        if (existingKey) {
          // With existing key: Use existing (0), Enter new (1), Back (2)
          if (highlightedIndex === 0) {
            // Use existing API key
            onComplete({
              type: provider,
              authType: AuthType.API_KEY,
              apiKey: existingKey,
            });
          } else if (highlightedIndex === 1) {
            // Enter new API key
            setIsInputMode(true);
          } else if (highlightedIndex === 2) {
            // Back option selected
            setStep('auth-method-selection');
            setHighlightedIndex(0);
          }
        } else {
          // Without existing key: Enter new (0), Back (1)
          if (highlightedIndex === 0) {
            setIsInputMode(true);
          } else if (highlightedIndex === 1) {
            // Back option selected
            setStep('auth-method-selection');
            setHighlightedIndex(0);
          }
        }
        break;
      }

      case 'api-key-management': {
        const actions: ManagementAction[] = [
          'view',
          'update',
          'delete',
          'back',
        ];
        const action = actions[highlightedIndex];

        switch (action) {
          case 'view':
            // Show masked API key
            break;
          case 'update':
            setStep('api-key-input');
            setApiKey('');
            setIsInputMode(false);
            setHighlightedIndex(0);
            break;
          case 'delete':
            removeApiKey(provider);
            onCancel();
            break;
          case 'back':
            onCancel();
            break;
          default:
            break;
        }
        break;
      }

      case 'complete':
        // Complete step - this should not trigger onComplete again
        // onComplete is already called when we reach this step
        break;

      default:
        // Unknown step
        break;
    }
  }, [
    highlightedIndex,
    step,
    getAuthMethods,
    onCancel,
    onComplete,
    provider,
    setApiKey,
    setIsInputMode,
  ]);

  const handleInput = useCallback(
    (input: string, key: Record<string, boolean>) => {
      if (key.escape || (key.ctrl && input === 'c')) {
        if (step === 'api-key-input' && isInputMode) {
          setIsInputMode(false);
          setHighlightedIndex(0);
          return;
        }
        onCancel();
        return;
      }

      // Special handling for api-key-input step
      if (step === 'api-key-input' && isInputMode) {
        if (key.upArrow || key.downArrow) {
          // Allow arrow navigation
        } else if (key.return) {
          const finalKey = apiKey.trim();
          if (finalKey) {
            setIsInputMode(false);
            setStep('api-key-validation');
            validateAndSaveApiKey();
          }
          return;
        } else if (key.backspace || key.delete) {
          setApiKey((prev) => {
            const chars = Array.from(prev);
            return chars.slice(0, -1).join('');
          });
          return;
        } else if (input && input.length > 0) {
          // Handle both single characters and pasted content
          if (!key.ctrl && !key.meta && !key.alt) {
            // Buffer input to handle IME composition properly
            setTimeout(() => {
              setApiKey((prev) => {
                const newValue = prev + input;
                return cleanApiKey(newValue);
              });
            }, 0);
          }
          return;
        }
      }

      // Navigation for all modes (including input mode for api-key-input)
      if (key.upArrow) {
        setHighlightedIndex((prev) => {
          const newIndex = Math.max(0, prev - 1);
          console.log(
            'Up arrow: changing highlightedIndex from',
            prev,
            'to',
            newIndex,
          );
          // Handle input mode for api-key-input step
          if (step === 'api-key-input') {
            const existingKey = getApiKey(provider);
            if (existingKey) {
              // With existing key: Use existing (0), Enter new (1), Back (2)
              // Only enable input mode for index 1 (Enter new)
              setIsInputMode(newIndex === 1);
            } else {
              // Without existing key: Enter new (0), Back (1)
              // Enable input mode for index 0 (Enter new)
              setIsInputMode(newIndex === 0);
            }
          } else {
            setIsInputMode(false);
          }
          return newIndex;
        });
        return;
      }

      if (key.downArrow) {
        const maxIndex = getMaxIndex();
        setHighlightedIndex((prev) => {
          const newIndex = Math.min(maxIndex, prev + 1);
          console.log(
            'Down arrow: changing highlightedIndex from',
            prev,
            'to',
            newIndex,
            'maxIndex:',
            maxIndex,
          );
          // If moving away from index 0 in api-key-input step, disable input mode
          // Handle input mode for api-key-input step
          if (step === 'api-key-input') {
            const existingKey = getApiKey(provider);
            if (existingKey) {
              // With existing key: Use existing (0), Enter new (1), Back (2)
              // Only enable input mode for index 1 (Enter new)
              setIsInputMode(newIndex === 1);
            } else {
              // Without existing key: Enter new (0), Back (1)
              // Enable input mode for index 0 (Enter new)
              setIsInputMode(newIndex === 0);
            }
          } else {
            setIsInputMode(false);
          }
          return newIndex;
        });
        return;
      }

      if (key.return) {
        handleEnterKey();
      }
    },
    [
      step,
      isInputMode,
      apiKey,
      getMaxIndex,
      handleEnterKey,
      onCancel,
      provider,
      validateAndSaveApiKey,
      cleanApiKey,
    ],
  );

  useInput(handleInput);

  // Fix highlighted index when it's out of bounds
  useEffect(() => {
    if (step === 'auth-method-selection') {
      const authMethods = getAuthMethods();
      if (highlightedIndex > authMethods.length) {
        console.log(
          'Fixing out of bounds highlightedIndex:',
          highlightedIndex,
          'max:',
          authMethods.length,
        );
        setHighlightedIndex(0);
      }
    }
  }, [step, highlightedIndex, getAuthMethods]);

  // Handle auto-complete for existing API keys
  useEffect(() => {
    if (step === 'auto-complete') {
      const existingKey = getApiKey(provider);
      if (existingKey) {
        console.log('Auto-completing with existing API key');
        onComplete({
          type: provider,
          authType: AuthType.API_KEY,
          apiKey: existingKey,
        });
      }
    }
  }, [step, provider, onComplete]);

  // Auto-focus input when entering api-key-input step
  useEffect(() => {
    if (step === 'api-key-input') {
      const existingKey = getApiKey(provider);
      if (existingKey) {
        // With existing key: only enable input mode for index 1 (Enter new)
        setIsInputMode(highlightedIndex === 1);
      } else {
        // Without existing key: enable input mode for index 0 (Enter new)
        setIsInputMode(highlightedIndex === 0);
      }
    }
  }, [step, highlightedIndex, provider]);

  // Don't render anything during auto-complete
  if (step === 'auto-complete') {
    return null;
  }

  const renderContent = () => {
    const width = inputWidth
      ? Math.min(inputWidth, 80)
      : Math.min(terminalWidth - 4, 80);

    switch (step) {
      case 'auth-method-selection': {
        const authMethods = getAuthMethods();
        // console.log('Rendering auth method selection:', {
        //   provider,
        //   authMethods,
        //   highlightedIndex
        // });

        // Fix: Ensure highlightedIndex is not out of bounds - use useEffect to avoid render loop
        // if (highlightedIndex > authMethods.length) {
        //   console.log('WARNING: highlightedIndex out of bounds, resetting to 0. Current:', highlightedIndex, 'Max allowed:', authMethods.length);
        //   setHighlightedIndex(0);
        // }

        return (
          <Box flexDirection="column" width={width}>
            <Text color={Colors.Gray}>
              Choose how you want to authenticate with{' '}
              {getProviderDisplayName()}
            </Text>
            <Text> </Text>

            {authMethods.map((method, index) => (
              <Box key={method.id} paddingLeft={1}>
                <Box width={35}>
                  <Text
                    color={
                      index === highlightedIndex
                        ? Colors.AccentBlue
                        : Colors.Foreground
                    }
                    bold={index === highlightedIndex}
                  >
                    {index === highlightedIndex ? '> ' : '  '}
                    {method.name}
                  </Text>
                </Box>
                <Box flexGrow={1}>
                  <Text
                    color={
                      index === highlightedIndex ? Colors.Comment : Colors.Gray
                    }
                  >
                    {method.description}
                  </Text>
                </Box>
              </Box>
            ))}

            <Box paddingLeft={1}>
              <Box width={35}>
                <Text
                  color={
                    authMethods.length === highlightedIndex
                      ? Colors.AccentBlue
                      : Colors.Gray
                  }
                  bold={authMethods.length === highlightedIndex}
                >
                  {authMethods.length === highlightedIndex ? '> ' : '  '}← Back
                </Text>
              </Box>
              <Box flexGrow={1}>
                <Text color={Colors.Comment}>Return to provider selection</Text>
              </Box>
            </Box>
          </Box>
        );
      }

      case 'api-key-input': {
        const existingKey = getApiKey(provider);

        return (
          <Box flexDirection="column" width={width}>
            {existingKey ? (
              <>
                <Text color={Colors.Gray}>
                  API key configuration for {getProviderDisplayName()}
                </Text>
                <Text> </Text>
                <Text color={Colors.AccentGreen}>
                  ✓ API key already configured: {existingKey.substring(0, 6)}...
                  {existingKey.slice(-4)}
                </Text>
                <Text> </Text>

                {/* Use existing API key option */}
                <Box paddingLeft={1}>
                  <Box width={35}>
                    <Text
                      color={
                        highlightedIndex === 0
                          ? Colors.AccentBlue
                          : Colors.Foreground
                      }
                      bold={highlightedIndex === 0}
                    >
                      {highlightedIndex === 0 ? '> ' : '  '}Use Existing API Key
                    </Text>
                  </Box>
                  <Box flexGrow={1}>
                    <Text
                      color={
                        highlightedIndex === 0 ? Colors.Comment : Colors.Gray
                      }
                    >
                      Continue with current configuration
                    </Text>
                  </Box>
                </Box>

                {/* Enter new API key option */}
                <Box paddingLeft={1}>
                  <Box width={35}>
                    <Text
                      color={
                        highlightedIndex === 1
                          ? Colors.AccentBlue
                          : Colors.Foreground
                      }
                      bold={highlightedIndex === 1}
                    >
                      {highlightedIndex === 1 ? '> ' : '  '}Enter New API Key
                    </Text>
                  </Box>
                  <Box flexGrow={1}>
                    <Text
                      color={
                        highlightedIndex === 1 ? Colors.Comment : Colors.Gray
                      }
                    >
                      Replace with a different key
                    </Text>
                  </Box>
                </Box>

                {/* Back option */}
                <Box paddingLeft={1}>
                  <Box width={35}>
                    <Text
                      color={
                        highlightedIndex === 2
                          ? Colors.AccentBlue
                          : Colors.Foreground
                      }
                      bold={highlightedIndex === 2}
                    >
                      {highlightedIndex === 2 ? '> ' : '  '}← Back
                    </Text>
                  </Box>
                  <Box flexGrow={1}>
                    <Text color={Colors.Comment}>
                      Return to authentication method selection
                    </Text>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <Text color={Colors.Gray}>
                  Enter your API key (typically 30-60 characters)
                </Text>
                <Text> </Text>

                {validationError && (
                  <>
                    <Text color={Colors.AccentRed}>{validationError}</Text>
                    <Text> </Text>
                  </>
                )}

                <Text bold>How to get your API key:</Text>
                {getApiKeyInstructions().map((instruction, index) => (
                  <Text key={index} color={Colors.Gray}>
                    {instruction}
                  </Text>
                ))}
                <Text> </Text>

                {/* Enter API Key option */}
                <Box paddingLeft={1}>
                  <Text
                    color={
                      highlightedIndex === 0
                        ? Colors.AccentBlue
                        : Colors.Foreground
                    }
                    bold={highlightedIndex === 0}
                  >
                    {highlightedIndex === 0 ? '> ' : '  '}Enter API Key:
                  </Text>
                </Box>
              </>
            )}

            {/* Show input box when in input mode (new key entry) */}
            {((!existingKey && highlightedIndex === 0) ||
              (existingKey && highlightedIndex === 1)) &&
              isInputMode && (
                <>
                  {/* Input box - always visible, active when selected and in input mode */}
                  <Box paddingLeft={1} paddingRight={1}>
                    <Box
                      borderStyle="single"
                      borderColor={
                        highlightedIndex === 0 && !isInputMode
                          ? Colors.AccentBlue
                          : isInputMode
                            ? Colors.AccentBlue
                            : Colors.Gray
                      }
                      paddingX={1}
                      paddingY={0}
                      width={width - 4}
                    >
                      {isInputMode ? (
                        apiKey.length > 0 ? (
                          <>
                            <Text wrap="wrap" color={Colors.AccentYellow}>
                              {apiKey.replace(/./g, '*')}
                            </Text>
                            <Text color={Colors.AccentBlue}>█</Text>
                          </>
                        ) : (
                          <>
                            <Text color={Colors.AccentBlue}>█</Text>
                            <Text color={Colors.Gray}>
                              Paste your API key here...
                            </Text>
                          </>
                        )
                      ) : (
                        <Text color={Colors.Gray}>
                          Paste your API key here...
                        </Text>
                      )}
                    </Box>
                  </Box>

                  <Text> </Text>
                </>
              )}

            {/* Show back option when no existing key */}
            {!existingKey && (
              <Box paddingLeft={1}>
                <Box width={35}>
                  <Text
                    color={
                      highlightedIndex === 1 ? Colors.AccentBlue : Colors.Gray
                    }
                    bold={highlightedIndex === 1}
                  >
                    {highlightedIndex === 1 ? '> ' : '  '}← Back
                  </Text>
                </Box>
                <Box flexGrow={1}>
                  <Text color={Colors.Comment}>
                    Return to authentication method selection
                  </Text>
                </Box>
              </Box>
            )}
          </Box>
        );
      }

      case 'api-key-validation':
        return (
          <Box flexDirection="column" width={width}>
            <Text color={Colors.AccentYellow}>
              Checking API key format and saving securely...
            </Text>
          </Box>
        );

      case 'api-key-management': {
        const existingKey = getApiKey(provider);
        const maskedKey = existingKey
          ? (() => {
              // Handle special authentication types
              if (existingKey === 'OAUTH_AUTHENTICATED') {
                return 'OAuth Authentication';
              }
              if (existingKey.includes('CLAUDE_PRO_SUBSCRIPTION')) {
                return 'Claude Pro Subscription';
              }
              if (existingKey.includes('CLAUDE_MAX_SUBSCRIPTION')) {
                return 'Claude Max Subscription';
              }

              if (existingKey.length <= 8) {
                return '•'.repeat(existingKey.length);
              }

              // Calculate middle dots to keep total under 25 chars
              const prefixLength = 3;
              const suffixLength = 3;
              const maxTotalLength = 25;
              const maxMiddleDots =
                maxTotalLength - prefixLength - suffixLength;

              const actualMiddleLength =
                existingKey.length - prefixLength - suffixLength;
              const middleDots = Math.min(actualMiddleLength, maxMiddleDots);

              return (
                existingKey.slice(0, prefixLength) +
                '•'.repeat(middleDots) +
                existingKey.slice(-suffixLength)
              );
            })()
          : 'No key found';

        const isOAuthAuth =
          existingKey === 'OAUTH_AUTHENTICATED' ||
          (existingKey && existingKey.includes('CLAUDE_PRO_SUBSCRIPTION')) ||
          (existingKey && existingKey.includes('CLAUDE_MAX_SUBSCRIPTION'));
        const managementOptions = [
          {
            label: isOAuthAuth ? 'View Authentication' : 'View API Key',
            description: `Current: ${maskedKey}`,
          },
          {
            label: isOAuthAuth ? 'Update Authentication' : 'Update API Key',
            description: isOAuthAuth
              ? 'Change authentication method'
              : 'Replace with new key',
          },
          {
            label: isOAuthAuth ? 'Remove Authentication' : 'Delete API Key',
            description: isOAuthAuth
              ? 'Remove stored authentication'
              : 'Remove stored key',
          },
          { label: 'Back', description: 'Return to provider selection' },
        ];

        return (
          <Box flexDirection="column" width={width}>
            <Text color={Colors.Gray}>Manage your API key configuration</Text>
            <Text color={Colors.Gray}>
              API key shown in shortened format for security (max 25 chars)
            </Text>
            <Text> </Text>

            {managementOptions.map((option, index) => (
              <Box key={index} paddingLeft={1}>
                <Text
                  color={
                    index === highlightedIndex
                      ? Colors.AccentBlue
                      : Colors.Foreground
                  }
                  bold={index === highlightedIndex}
                >
                  {index === highlightedIndex ? '> ' : '  '}
                  {option.label.padEnd(16)}
                  <Text
                    color={
                      index === highlightedIndex ? Colors.Comment : Colors.Gray
                    }
                  >
                    {option.description}
                  </Text>
                </Text>
              </Box>
            ))}
          </Box>
        );
      }

      case 'complete':
        return (
          <Box flexDirection="column" width={width}>
            <Text color={Colors.AccentGreen}>API Key Setup Complete!</Text>
            <Text> </Text>
            <Text>Provider: {getProviderDisplayName()}</Text>
            <Text>Status: Configured</Text>
            <Text> </Text>
            <Text color={Colors.AccentYellow}>Press Enter to continue...</Text>
          </Box>
        );

      default:
        console.log('Unknown step:', step);
        return (
          <Box flexDirection="column" width={width}>
            <Text color={Colors.AccentRed}>Unknown step: {step}</Text>
            <Text color={Colors.Gray}>Provider: {provider}</Text>
            <Text color={Colors.Gray}>Please report this as a bug.</Text>
          </Box>
        );
    }
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={Colors.BorderGray}
      paddingX={2}
      paddingY={1}
      width={
        inputWidth
          ? Math.min(inputWidth + 8, terminalWidth - 4)
          : terminalWidth - 4
      }
    >
      <Box marginBottom={1} justifyContent="center">
        <Text bold color={Colors.AccentBlue}>
          {step === 'api-key-management'
            ? `Manage ${getProviderDisplayName()} API Key`
            : `Setup ${getProviderDisplayName()} API Key`}
        </Text>
      </Box>

      {renderContent()}
      <Text> </Text>
      <Text color={Colors.Gray}>
        {step === 'api-key-input' && isInputMode
          ? 'Type your API key | Enter: Validate & Save | Esc: ← Back'
          : 'Arrow keys: Navigate | Enter: Select | Esc: Cancel'}
      </Text>
    </Box>
  );
};
