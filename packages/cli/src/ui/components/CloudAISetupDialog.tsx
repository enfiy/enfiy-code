/**
 * @license
 * Copyright 2025 arterect and h.esaki
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { ProviderType, AuthType } from '@enfiy/core';
import { 
  storeApiKey, 
  removeApiKey, 
  getApiKey, 
  validateApiKey 
} from '../../utils/secureStorage.js';
import { debugLogger } from '../../utils/debugLogger.ts';
import { getOauthClient } from '@enfiy/core';

interface CloudAISetupDialogProps {
  provider: ProviderType;
  onComplete: (config: CloudAIConfig) => void;
  onCancel: () => void;
  terminalWidth: number;
  isManaging?: boolean;
  forceAuthSelection?: boolean;
}

interface CloudAIConfig {
  type: ProviderType;
  apiKey: string;
  endpoint?: string;
}

type SetupStep = 
  | 'auth-method-selection'
  | 'api-key-input'
  | 'api-key-validation'
  | 'oauth-setup'
  | 'api-key-management'
  | 'complete';

type ManagementAction = 'view' | 'update' | 'delete' | 'back';

export const CloudAISetupDialog: React.FC<CloudAISetupDialogProps> = ({
  provider,
  onComplete,
  onCancel,
  terminalWidth,
  isManaging = false,
  forceAuthSelection = false,
}) => {
  const [step, setStep] = useState<SetupStep>(() => {
    console.log('CloudAISetupDialog initial step determination:', {
      provider,
      isManaging,
      forceAuthSelection
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
      keyPreview: existingKey ? existingKey.substring(0, 10) + '...' : 'none'
    });
    
    // If we have an existing key and not forcing auth selection, go to management
    if (existingKey && !forceAuthSelection) {
      console.log('Going to management screen (existing key found)');
      return 'api-key-management';
    }
    
    // Go directly to API key input for all cloud providers
    console.log('Going directly to API key input');
    return 'api-key-input';
  });
  
  const [apiKey, setApiKey] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(() => {
    console.log('CloudAISetupDialog: initializing highlightedIndex to 0');
    return 0;
  });
  const [isInputMode, setIsInputMode] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMethod, setAuthMethod] = useState<string>('');
  const [authUrl, setAuthUrl] = useState<string>('');

  // Get available auth methods for provider
  const getAuthMethods = (): Array<{id: string, name: string, description: string}> => {
    switch (provider) {
      case ProviderType.GEMINI:
        return [
          { id: 'oauth', name: 'Google Account', description: 'Sign in with your Google account (recommended)' },
          { id: 'api-key', name: 'API Key', description: 'Use Gemini API key from Google AI Studio' }
        ];
      case ProviderType.ANTHROPIC:
        return [
          { id: 'claude-max', name: 'Claude Max Plan', description: 'Use Claude Code with your Max subscription' },
          { id: 'api-key', name: 'API Key', description: 'Use Anthropic API key from console' }
        ];
      case ProviderType.OPENAI:
        return [
          { id: 'api-key', name: 'API Key', description: 'Use OpenAI API key from platform.openai.com' }
        ];
      case ProviderType.MISTRAL:
        return [
          { id: 'api-key', name: 'API Key', description: 'Use Mistral API key from console.mistral.ai' }
        ];
      case ProviderType.HUGGINGFACE:
        return [
          { id: 'api-key', name: 'API Key', description: 'Use HuggingFace token from huggingface.co' }
        ];
      default:
        return [
          { id: 'api-key', name: 'API Key', description: 'Use API key authentication' }
        ];
    }
  };

  // Get provider display name
  const getProviderDisplayName = (): string => {
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

  // Get API key instructions
  const getApiKeyInstructions = (): string[] => {
    switch (provider) {
      case ProviderType.ANTHROPIC:
        return [
          '1. Visit https://console.anthropic.com/',
          '2. Sign in or create an account',
          '3. Go to API Keys section',
          '4. Create a new API key',
          '5. Copy the key (starts with "sk-ant-api03-")'
        ];
      case ProviderType.OPENAI:
        return [
          '1. Visit https://platform.openai.com/api-keys',
          '2. Sign in to your account',
          '3. Click "Create new secret key"',
          '4. Copy the key (starts with "sk-")'
        ];
      case ProviderType.GEMINI:
        return [
          '1. Visit https://makersuite.google.com/app/apikey',
          '2. Sign in with your Google account',
          '3. Click "Create API key"',
          '4. Copy the key (starts with "AIza")'
        ];
      case ProviderType.MISTRAL:
        return [
          '1. Visit https://console.mistral.ai/',
          '2. Sign in or create an account',
          '3. Go to API Keys section',
          '4. Create a new API key',
          '5. Copy the generated key'
        ];
      case ProviderType.HUGGINGFACE:
        return [
          '1. Visit https://huggingface.co/settings/tokens',
          '2. Sign in to your account',
          '3. Click "New token"',
          '4. Select "Read" or "Write" permissions',
          '5. Copy the token (starts with "hf_")'
        ];
      default:
        return ['Please check the provider documentation for API key setup instructions.'];
    }
  };

  const handleInput = useCallback((input: string, key: Record<string, boolean>) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      // If we're in oauth-setup and authenticating, cancel the auth process
      if (step === 'oauth-setup' && isAuthenticating) {
        console.log('Cancelling OAuth authentication...');
        setIsAuthenticating(false);
        setValidationError('Authentication cancelled by user');
        setStep('auth-method-selection');
        console.log('setHighlightedIndex(0) called from cancel auth');
        setHighlightedIndex(0);
        return;
      }
      onCancel();
      return;
    }

    if (step === 'api-key-input' && isInputMode) {
      if (key.return) {
        debugLogger.info('ui-interaction', 'Return key pressed in API key input', {
          apiKey: apiKey,
          trimmed: apiKey.trim(),
          length: apiKey.length,
          isEmpty: !apiKey.trim(),
          provider: provider
        });
        
        if (apiKey.trim()) {
          debugLogger.info('ui-interaction', 'Starting API key validation process', {
            key: apiKey,
            length: apiKey.length,
            provider: provider
          });
          setIsInputMode(false);
          setStep('api-key-validation');
          validateAndSaveApiKey();
        } else {
          console.log('Enter pressed but API key is empty');
        }
      } else if (key.backspace || key.delete) {
        setApiKey(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setApiKey(prev => {
          const newValue = prev + input;
          // Clean the API key in real-time to remove any paste artifacts
          return cleanApiKey(newValue);
        });
      }
      return;
    }

    // Navigation for non-input modes
    if (key.upArrow) {
      setHighlightedIndex(prev => {
        const newIndex = Math.max(0, prev - 1);
        console.log('Up arrow: changing highlightedIndex from', prev, 'to', newIndex);
        return newIndex;
      });
      return;
    }

    if (key.downArrow) {
      const maxIndex = getMaxIndex();
      setHighlightedIndex(prev => {
        const newIndex = Math.min(maxIndex, prev + 1);
        console.log('Down arrow: changing highlightedIndex from', prev, 'to', newIndex, 'maxIndex:', maxIndex);
        return newIndex;
      });
      return;
    }

    if (key.return) {
      handleEnterKey();
    }
  }, [step, isInputMode, apiKey, highlightedIndex]);

  useInput(handleInput);

  // Fix highlighted index when it's out of bounds
  useEffect(() => {
    if (step === 'auth-method-selection') {
      const authMethods = getAuthMethods();
      if (highlightedIndex > authMethods.length) {
        console.log('Fixing out of bounds highlightedIndex:', highlightedIndex, 'max:', authMethods.length);
        setHighlightedIndex(0);
      }
    }
  }, [step, highlightedIndex]);

  const getMaxIndex = (): number => {
    switch (step) {
      case 'auth-method-selection':
        return getAuthMethods().length; // Auth methods + Back
      case 'api-key-input':
        return 1; // Start input, Cancel
      case 'api-key-management':
        return 3; // View, Update, Delete, Back
      default:
        return 0;
    }
  };

  const handleOAuthAuthentication = async () => {
    console.log(`Starting OAuth authentication for ${provider} with method ${authMethod}`);
    setIsAuthenticating(true);
    setValidationError(null);
    setAuthUrl('');
    
    try {
      if (provider === ProviderType.GEMINI && authMethod === 'oauth') {
        console.log('Initializing Google OAuth...');
        
        try {
          console.log('About to call getOauthClient()...');
          console.log('Browser should open for authentication...');
          
          // Create a promise that resolves when we have the auth URL
          const oauthClient = await getOauthClient();
          console.log('OAuth client obtained successfully:', !!oauthClient);
          console.log('Authentication flow completed');
          
          if (!oauthClient) {
            throw new Error('OAuth client is null or undefined');
          }
          
          // Store OAuth credentials as a special marker
          storeApiKey(provider, 'OAUTH_AUTHENTICATED', undefined, 'oauth');
          console.log('OAuth credentials stored');
          
          setStep('complete');
          onComplete({
            type: provider,
            apiKey: 'OAUTH_AUTHENTICATED',
          });
        } catch (oauthError: any) {
          console.error('OAuth client initialization failed:', oauthError);
          console.error('OAuth error details:', {
            name: oauthError?.name,
            message: oauthError?.message,
            stack: oauthError?.stack
          });
          throw new Error(`OAuth initialization failed: ${oauthError?.message || oauthError}`);
        }
      } else if (provider === ProviderType.ANTHROPIC && authMethod === 'claude-max') {
        console.log('Checking Claude Max subscription...');
        const hasClaudeMax = await checkClaudeMaxSubscription();
        console.log('Claude Max check result:', hasClaudeMax);
        
        if (hasClaudeMax) {
          storeApiKey(provider, 'CLAUDE_MAX_AUTHENTICATED', undefined, 'claude-max');
          console.log('Claude Max credentials stored');
          
          setStep('complete');
          onComplete({
            type: provider,
            apiKey: 'CLAUDE_MAX_AUTHENTICATED',
          });
        } else {
          console.log('Claude Max subscription not found');
          setValidationError('Claude Max subscription not found. Please upgrade your plan or use API key authentication.');
          // Stay on oauth-setup to show error message
          setStep('oauth-setup');
          setHighlightedIndex(0);
        }
      }
    } catch (error) {
      console.error('OAuth authentication error:', error);
      setValidationError(`Authentication failed: ${error}`);
      // Stay on oauth-setup to show error, don't go back immediately
      setStep('oauth-setup');
      setHighlightedIndex(0);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const checkClaudeMaxSubscription = async (): Promise<boolean> => {
    // TODO: Implement actual Claude Max subscription check
    // This could involve checking environment variables, config files,
    // or making API calls to Anthropic's subscription service
    
    // For now, always return true to test the flow
    // In production, this would check for Claude Desktop installation,
    // environment variables, or make API calls to verify subscription
    console.log('Checking Claude Max subscription...');
    
    try {
      // For testing, always return true immediately
      // In production, replace with actual subscription check
      return true;
    } catch (error) {
      console.error('Claude Max subscription check failed:', error);
      return false;
    }
  };

  const cleanApiKey = (key: string): string => {
    // Remove bracketed paste mode escape sequences and other unwanted characters
    return key
      .replace(/\[200~/g, '')  // Remove bracketed paste start
      .replace(/\[201~/g, '')  // Remove bracketed paste end
      .trim();                 // Remove leading/trailing whitespace
  };

  const validateAndSaveApiKey = async () => {
    try {
      const cleanedApiKey = cleanApiKey(apiKey);
      
      debugLogger.info('validation-flow', 'validateAndSaveApiKey called', {
        provider,
        providerType: typeof provider,
        originalKey: apiKey,
        cleanedKey: cleanedApiKey,
        keyLength: cleanedApiKey.length,
        keyPrefix: cleanedApiKey.substring(0, 10),
        fullKey: cleanedApiKey
      });
      
      const isValid = validateApiKey(provider, cleanedApiKey);
      debugLogger.info('validation-flow', 'Validation completed', { isValid });
      
      if (!isValid) {
        setValidationError(`Invalid API key format for ${getProviderDisplayName()}`);
        setStep('api-key-input');
        return;
      }

      // Store the cleaned API key
      storeApiKey(provider, cleanedApiKey);
      setStep('complete');
      
      // Complete setup immediately
      onComplete({
        type: provider,
        apiKey: cleanedApiKey,
      });

    } catch (error) {
      setValidationError(`Failed to validate API key: ${error}`);
      setStep('api-key-input');
    }
  };

  const handleEnterKey = () => {
    switch (step) {
      case 'auth-method-selection':
        const authMethods = getAuthMethods();
        if (highlightedIndex === authMethods.length) {
          // Back option selected
          onCancel();
        } else {
          const selectedMethod = authMethods[highlightedIndex];
          setAuthMethod(selectedMethod.id);
          
          if (selectedMethod.id === 'api-key') {
            setStep('api-key-input');
            setHighlightedIndex(0);
          } else if (selectedMethod.id === 'oauth' || selectedMethod.id === 'claude-max') {
            console.log(`Selected OAuth method: ${selectedMethod.id}`);
            setStep('oauth-setup');
            console.log('setHighlightedIndex(0) called from oauth/claude-max selection');
            setHighlightedIndex(0);
            // Don't auto-start authentication - wait for user confirmation
          }
        }
        break;

      case 'oauth-setup':
        if (validationError && !isAuthenticating) {
          // Try again by going back to auth method selection
          console.log('Going back to auth method selection from error state');
          setValidationError(null);
          setStep('auth-method-selection');
          setHighlightedIndex(0);
        } else if (!isAuthenticating && !validationError) {
          // Start authentication when user presses Enter
          console.log('Starting authentication from oauth-setup');
          handleOAuthAuthentication();
        }
        break;

      case 'api-key-input':
        if (highlightedIndex === 0) {
          setIsInputMode(true);
        } else {
          onCancel();
        }
        break;

      case 'api-key-management':
        const actions: ManagementAction[] = ['view', 'update', 'delete', 'back'];
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
        }
        break;

      case 'complete':
        // Complete step - this should not trigger onComplete again
        // onComplete is already called when we reach this step
        break;
    }
  };

  const renderContent = () => {
    const width = Math.min(terminalWidth - 4, 80);

    switch (step) {
      case 'auth-method-selection':
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
              Choose how you want to authenticate with {getProviderDisplayName()}
            </Text>
            <Text> </Text>
            
            {authMethods.map((method, index) => (
              <Box key={method.id} paddingLeft={1}>
                <Text
                  color={index === highlightedIndex ? Colors.AccentBlue : Colors.Foreground}
                  bold={index === highlightedIndex}
                >
                  {index === highlightedIndex ? '> ' : '  '}{method.name.padEnd(16)}<Text color={index === highlightedIndex ? Colors.Comment : Colors.Gray}>{method.description}</Text>
                </Text>
              </Box>
            ))}
            
            <Text> </Text>
            <Box paddingLeft={1}>
              <Text
                color={authMethods.length === highlightedIndex ? Colors.AccentBlue : Colors.Gray}
                bold={authMethods.length === highlightedIndex}
              >
                {authMethods.length === highlightedIndex ? '> ' : '  '}← Back
              </Text>
            </Box>
          </Box>
        );

      case 'oauth-setup':
        const authMethodName = authMethod === 'oauth' ? 'Google Account' : 'Claude Max Plan';
        return (
          <Box flexDirection="column" width={width}>
            {validationError && !isAuthenticating && (
              <>
                <Text color={Colors.AccentRed}>{validationError}</Text>
                <Text> </Text>
                <Box paddingLeft={1}>
                  <Text color={Colors.AccentBlue} bold>
                    {'> '}Press Enter to try again or Esc to go back
                  </Text>
                </Box>
                <Text> </Text>
              </>
            )}
            
            {isAuthenticating ? (
              <>
                <Text color={Colors.AccentYellow}>
                  🔗 Authenticating with {authMethodName}...
                </Text>
                <Text> </Text>
                <Text color={Colors.Gray}>
                  {authMethod === 'oauth' 
                    ? 'Opening browser for Google authentication...'
                    : 'Checking Claude Max subscription status...'
                  }
                </Text>
                {authMethod === 'oauth' && (
                  <>
                    <Text> </Text>
                    <Text color={Colors.AccentBlue}>
                      🌐 Please check your browser and complete the authentication.
                    </Text>
                    <Text color={Colors.Gray}>
                      If the browser didn't open, check your console for the authentication URL.
                    </Text>
                    <Text color={Colors.Gray}>
                      In WSL/Linux: You may need to manually copy the URL from the console.
                    </Text>
                  </>
                )}
                <Text> </Text>
                <Text color={Colors.Gray}>
                  Press Esc to cancel
                </Text>
              </>
            ) : validationError ? null : (
              <>
                <Text color={Colors.AccentBlue}>
                  Ready to authenticate with {authMethodName}
                </Text>
                <Text> </Text>
                <Text color={Colors.Gray}>
                  {authMethod === 'oauth' 
                    ? 'This will open your browser for Google account authentication.'
                    : 'This will check your Claude Max subscription status.'
                  }
                </Text>
                <Text> </Text>
                <Box paddingLeft={1}>
                  <Text color={Colors.AccentBlue} bold>
                    {'> '}Press Enter to start authentication
                  </Text>
                </Box>
                <Text> </Text>
                <Text color={Colors.Gray}>
                  Press Esc to go back
                </Text>
              </>
            )}
          </Box>
        );

      case 'api-key-input':
        return (
          <Box flexDirection="column" width={width}>
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
            
            {isInputMode ? (
              <>
                <Box paddingLeft={1}>
                  <Text color={Colors.AccentBlue} bold>
                    {'> '}Enter API Key:
                  </Text>
                </Box>
                <Box paddingLeft={1} paddingRight={1}>
                  <Box borderStyle="single" borderColor={Colors.AccentBlue} paddingX={1} paddingY={0} width={width - 4}>
                    <Text>
                      {apiKey.length > 0 ? (
                        <>
                          <Text color={Colors.AccentYellow}>{apiKey.replace(/./g, '*')}</Text>
                          <Text color={Colors.AccentBlue}>█</Text>
                        </>
                      ) : (
                        <>
                          <Text color={Colors.AccentBlue}>█</Text>
                          <Text color={Colors.Gray}>Paste your API key here...</Text>
                        </>
                      )}
                    </Text>
                  </Box>
                </Box>
                <Text> </Text>
              </>
            ) : (
              <Box paddingLeft={1}>
                <Text
                  color={highlightedIndex === 0 ? Colors.AccentBlue : Colors.Foreground}
                  bold={highlightedIndex === 0}
                >
                  {highlightedIndex === 0 ? '> ' : '  '}Start API Key Input
                </Text>
              </Box>
            )}
            {!isInputMode && (
              <Box paddingLeft={1}>
                <Text
                  color={highlightedIndex === 1 ? Colors.AccentBlue : Colors.Foreground}
                  bold={highlightedIndex === 1}
                >
                  {highlightedIndex === 1 ? '> ' : '  '}← Back
                </Text>
              </Box>
            )}
          </Box>
        );

      case 'api-key-validation':
        return (
          <Box flexDirection="column" width={width}>
            <Text color={Colors.AccentYellow}>
              🔍 Checking API key format and saving securely...
            </Text>
          </Box>
        );

      case 'api-key-management':
        const existingKey = getApiKey(provider);
        const maskedKey = existingKey ? (() => {
          // Handle special authentication types
          if (existingKey === 'OAUTH_AUTHENTICATED') {
            return 'Google Account';
          }
          if (existingKey === 'CLAUDE_MAX_AUTHENTICATED') {
            return 'Claude Max Plan';
          }
          
          if (existingKey.length <= 8) {
            return '•'.repeat(existingKey.length);
          }
          
          // Calculate middle dots to keep total under 25 chars
          const prefixLength = 3;
          const suffixLength = 3;
          const maxTotalLength = 25;
          const maxMiddleDots = maxTotalLength - prefixLength - suffixLength;
          
          const actualMiddleLength = existingKey.length - prefixLength - suffixLength;
          const middleDots = Math.min(actualMiddleLength, maxMiddleDots);
          
          return existingKey.slice(0, prefixLength) + '•'.repeat(middleDots) + existingKey.slice(-suffixLength);
        })() : 'No key found';

        const isOAuthAuth = existingKey === 'OAUTH_AUTHENTICATED' || existingKey === 'CLAUDE_MAX_AUTHENTICATED';
        const managementOptions = [
          { 
            label: isOAuthAuth ? 'View Authentication' : 'View API Key', 
            description: `Current: ${maskedKey}` 
          },
          { 
            label: isOAuthAuth ? 'Update Authentication' : 'Update API Key', 
            description: isOAuthAuth ? 'Change authentication method' : 'Replace with new key' 
          },
          { 
            label: isOAuthAuth ? 'Remove Authentication' : 'Delete API Key', 
            description: isOAuthAuth ? 'Remove stored authentication' : 'Remove stored key' 
          },
          { label: 'Back', description: 'Return to provider selection' }
        ];

        return (
          <Box flexDirection="column" width={width}>
            <Text color={Colors.Gray}>
              Manage your API key configuration
            </Text>
            <Text color={Colors.Gray}>
              API key shown in shortened format for security (max 25 chars)
            </Text>
            <Text> </Text>
            
            {managementOptions.map((option, index) => (
              <Box key={index} paddingLeft={1}>
                <Text
                  color={index === highlightedIndex ? Colors.AccentBlue : Colors.Foreground}
                  bold={index === highlightedIndex}
                >
                  {index === highlightedIndex ? '> ' : '  '}{option.label.padEnd(16)}<Text color={index === highlightedIndex ? Colors.Comment : Colors.Gray}>{option.description}</Text>
                </Text>
              </Box>
            ))}
          </Box>
        );

      case 'complete':
        return (
          <Box flexDirection="column" width={width}>
            <Text color={Colors.AccentGreen}>
              ✓ API Key Setup Complete!
            </Text>
            <Text> </Text>
            <Text>Provider: {getProviderDisplayName()}</Text>
            <Text>Status: ✓ Configured</Text>
            <Text> </Text>
            <Text color={Colors.AccentYellow}>
              Press Enter to continue...
            </Text>
          </Box>
        );

      default:
        console.log('Unknown step:', step);
        return (
          <Box flexDirection="column" width={width}>
            <Text color={Colors.AccentRed}>
              Unknown step: {step}
            </Text>
            <Text color={Colors.Gray}>
              Provider: {provider}
            </Text>
            <Text color={Colors.Gray}>
              Please report this as a bug.
            </Text>
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
      width={terminalWidth - 4}
    >
      <Box marginBottom={1} justifyContent="center">
        <Text bold color={Colors.AccentBlue}>
          {step === 'api-key-management' ? `Manage ${getProviderDisplayName()} API Key` : `Setup ${getProviderDisplayName()} API Key`}
        </Text>
      </Box>

      {renderContent()}
      <Text> </Text>
      <Text color={Colors.Gray}>
        {step === 'api-key-input' && isInputMode 
          ? 'Type your API key | Enter: Validate & Save | Esc: Cancel'
          : 'Arrow keys: Navigate | Enter: Select | Esc: Cancel'
        }
      </Text>
    </Box>
  );
};