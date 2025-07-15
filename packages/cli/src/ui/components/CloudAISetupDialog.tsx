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
import { ProviderType, AuthType , getClaudeOAuthClient } from '@enfiy/core';
import { 
  storeApiKey, 
  removeApiKey, 
  getApiKey, 
  validateApiKey 
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
    
    // If we have an existing key and not forcing auth selection and managing
    if (existingKey && !forceAuthSelection && isManaging) {
      console.log('Going to management screen (existing key found)');
      return 'api-key-management';
    }
    
    // If we have an existing key and this is a new setup (not managing), skip API setup
    if (existingKey && !isManaging) {
      console.log('Existing key found, will complete setup automatically');
      return 'auto-complete';
    }
    
    // Check if provider has only API key auth method, skip selection
    if (provider === ProviderType.GEMINI || provider === ProviderType.ANTHROPIC || 
        provider === ProviderType.OPENAI || provider === ProviderType.MISTRAL) {
      console.log('Single auth method (API key) detected, going directly to api-key-input');
      return 'api-key-input';
    }
    
    // Show authentication method selection for providers with multiple options
    console.log('Going to authentication method selection');
    return 'auth-method-selection';
  });
  
  const [apiKey, setApiKey] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(() => {
    console.log('CloudAISetupDialog: initializing highlightedIndex to 0');
    return 0;
  });
  const [isInputMode, setIsInputMode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMethod, setAuthMethod] = useState<string>('');

  // Get available auth methods for provider
  const getAuthMethods = useCallback((): Array<{id: string, name: string, description: string}> => {
    switch (provider) {
      case ProviderType.GEMINI:
        return [
          { id: 'api-key', name: 'API Key', description: 'Use Gemini API key from Google AI Studio' }
        ];
      case ProviderType.ANTHROPIC:
        return [
          { id: 'api-key', name: 'API Key', description: 'Use Anthropic API key from console.anthropic.com' }
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
  }, [provider]);

  // Get provider display name
  const getProviderDisplayName = useCallback((): string => {
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
  }, [provider]);

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

  const getMaxIndex = useCallback((): number => {
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
  }, [step, getAuthMethods]);

  const handleClaudeSubscriptionAuth = useCallback(async (planType: 'pro' | 'max') => {
    console.log(`Starting Claude ${planType} subscription authentication`);
    setIsAuthenticating(true);
    setValidationError(null);
    
    try {
      console.log('Opening Claude.ai for OAuth authentication...');
      
      // Use Claude OAuth authentication
      const oauthResponse = await getClaudeOAuthClient();
      console.log('Claude OAuth authentication successful:', !!oauthResponse);
      
      if (!oauthResponse || !oauthResponse.access_token) {
        throw new Error('Failed to obtain Claude OAuth token');
      }
      
      // Store the OAuth token with plan type indicator
      const subscriptionToken = `CLAUDE_${planType.toUpperCase()}_OAUTH:${oauthResponse.access_token}`;
      storeApiKey(provider, subscriptionToken, undefined, 'oauth');
      
      console.log(`Claude ${planType} subscription authentication successful`);
      
      onComplete({
        type: provider,
        authType: AuthType.API_KEY,
        apiKey: subscriptionToken
      });
      
    } catch (error: unknown) {
      console.error('Claude subscription authentication failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setValidationError(`Failed to authenticate with Claude ${planType} subscription: ${errorMessage}`);
    } finally {
      setIsAuthenticating(false);
    }
  }, [provider, onComplete]);

  const handleOAuthAuthentication = useCallback(async () => {
    console.log(`Starting OAuth authentication for ${provider} with method ${authMethod}`);
    setIsAuthenticating(true);
    setValidationError(null);
    
    try {
      if (provider === ProviderType.ANTHROPIC && authMethod === 'claude-max') {
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
  }, [provider, authMethod, onComplete]);

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

  const cleanApiKey = useCallback((key: string): string => 
    // Remove bracketed paste mode escape sequences and other unwanted characters
     key
      .replace(/\[200~/g, '')  // Remove bracketed paste start
      .replace(/\[201~/g, '')  // Remove bracketed paste end
      .trim()                 // Remove leading/trailing whitespace
  , []);

  const validateAndSaveApiKey = useCallback(async () => {
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
  }, [apiKey, cleanApiKey, provider, getProviderDisplayName, setValidationError, setStep, onComplete]);

  const handleEnterKey = useCallback(() => {
    switch (step) {
      case 'auth-method-selection': {
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
          } else if (selectedMethod.id === 'oauth') {
            console.log(`Selected OAuth method: ${selectedMethod.id}`);
            setStep('oauth-setup');
            console.log('setHighlightedIndex(0) called from oauth selection');
            setHighlightedIndex(0);
          } else if (selectedMethod.id === 'claude-subscription') {
            console.log(`Selected Claude subscription method: ${selectedMethod.id}`);
            setStep('subscription-login');
            setHighlightedIndex(0);
          }
        }
        break;
      }

      case 'subscription-login':
        if (highlightedIndex === 2) {
          // Back option selected
          setStep('auth-method-selection');
          setHighlightedIndex(0);
        } else {
          // Pro or Max plan selected
          const planType = highlightedIndex === 0 ? 'pro' : 'max';
          console.log(`Starting Claude ${planType} subscription authentication`);
          handleClaudeSubscriptionAuth(planType);
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

      case 'api-key-management': {
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
  }, [highlightedIndex, step, getAuthMethods, onCancel, setAuthMethod, handleClaudeSubscriptionAuth, validationError, isAuthenticating, handleOAuthAuthentication, provider, setApiKey, setIsInputMode]);

  const handleInput = useCallback((input: string, key: Record<string, boolean>) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      // If we're in api-key-input mode and actively typing, exit input mode
      if (step === 'api-key-input' && isInputMode) {
        setIsInputMode(false);
        setHighlightedIndex(0); // Reset to "Enter API Key" option
        return;
      }
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

    // Special handling for api-key-input step
    if (step === 'api-key-input') {
      if (isInputMode) {
        // In input mode - handle text input
        if (key.return) {
          debugLogger.info('ui-interaction', 'Return key pressed in API key input', {
            apiKey,
            trimmed: apiKey.trim(),
            length: apiKey.length,
            isEmpty: !apiKey.trim(),
            provider
          });
          
          if (apiKey.trim()) {
            debugLogger.info('ui-interaction', 'Starting API key validation process', {
              key: apiKey,
              length: apiKey.length,
              provider
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
  }, [step, isInputMode, apiKey, getMaxIndex, handleEnterKey, isAuthenticating, onCancel, provider, validateAndSaveApiKey, cleanApiKey]);

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
          apiKey: existingKey
        });
      }
    }
  }, [step, provider, onComplete]);

  // Don't render anything during auto-complete
  if (step === 'auto-complete') {
    return null;
  }
  
  const renderContent = () => {
    const width = inputWidth ? Math.min(inputWidth, 80) : Math.min(terminalWidth - 4, 80);

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
      }

      case 'subscription-login':
        return (
          <Box flexDirection="column" width={width}>
            <Text color={Colors.Gray}>
              Sign in to your Claude.ai account
            </Text>
            <Text> </Text>
            
            <Text color={Colors.Foreground}>
              Choose your Claude subscription:
            </Text>
            <Text> </Text>
            
            <Box paddingLeft={1}>
              <Text color={highlightedIndex === 0 ? Colors.AccentBlue : Colors.Foreground}>
                {highlightedIndex === 0 ? '> ' : '  '}Claude Pro Plan (More usage, priority access)
              </Text>
            </Box>
            <Box paddingLeft={1}>
              <Text color={highlightedIndex === 1 ? Colors.AccentBlue : Colors.Foreground}>
                {highlightedIndex === 1 ? '> ' : '  '}Claude Max Plan (Highest usage, latest features)
              </Text>
            </Box>
            
            <Text> </Text>
            <Text color={Colors.Comment}>
              We&apos;ll open Claude.ai in your browser for secure authentication.
            </Text>
            <Text color={Colors.Comment}>
              Your login session will be used for this application.
            </Text>
            
            <Text> </Text>
            <Box paddingLeft={1}>
              <Text color={highlightedIndex === 2 ? Colors.AccentBlue : Colors.Gray}>
                {highlightedIndex === 2 ? '> ' : '  '}← Back
              </Text>
            </Box>
            
            {validationError && (
              <>
                <Text> </Text>
                <Text color={Colors.AccentRed}>Error: {validationError}</Text>
                <Text color={Colors.Comment}>Press Enter to try again</Text>
              </>
            )}
          </Box>
        );

      case 'oauth-setup': {
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
                  🔐 Authenticating with {authMethodName}...
                </Text>
                <Text> </Text>
                <Text color={Colors.Gray}>
                  {authMethod === 'oauth' 
                    ? 'Opening browser for Google account authentication...'
                    : 'Checking Claude subscription status...'
                  }
                </Text>
                {authMethod === 'oauth' && (
                  <>
                    <Text> </Text>
                    <Text color={Colors.AccentBlue}>
                      🌐 Complete authentication in your browser
                    </Text>
                    <Text color={Colors.Gray}>
                      • Browser should open automatically
                    </Text>
                    <Text color={Colors.Gray}>
                      • If not, check console for authentication URL
                    </Text>
                    <Text color={Colors.Gray}>
                      • WSL/Linux: Copy URL to Windows browser if needed
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
      }

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
            
            {/* Enter API Key option */}
            <Box paddingLeft={1}>
              <Text
                color={highlightedIndex === 0 ? Colors.AccentBlue : Colors.Foreground}
                bold={highlightedIndex === 0}
              >
                {highlightedIndex === 0 ? '> ' : '  '}Enter API Key:
              </Text>
            </Box>
            
            {/* Input box - always visible, active when selected and in input mode */}
            <Box paddingLeft={1} paddingRight={1}>
              <Box 
                borderStyle="single" 
                borderColor={highlightedIndex === 0 && !isInputMode ? Colors.AccentBlue : (isInputMode ? Colors.AccentBlue : Colors.Gray)} 
                paddingX={1} 
                paddingY={0} 
                width={width - 4}
              >
                <Text>
                  {isInputMode ? (
                    apiKey.length > 0 ? (
                      <>
                        <Text color={Colors.AccentYellow}>{apiKey.replace(/./g, '*')}</Text>
                        <Text color={Colors.AccentBlue}>█</Text>
                      </>
                    ) : (
                      <>
                        <Text color={Colors.AccentBlue}>█</Text>
                        <Text color={Colors.Gray}>Paste your API key here...</Text>
                      </>
                    )
                  ) : (
                    <Text color={Colors.Gray}>Paste your API key here...</Text>
                  )}
                </Text>
              </Box>
            </Box>
            
            {/* Back option - directly after input box */}
            <Box paddingLeft={1}>
              <Text
                color={highlightedIndex === 1 ? Colors.AccentBlue : Colors.Foreground}
                bold={highlightedIndex === 1}
              >
                {highlightedIndex === 1 ? '> ' : '  '}← Back
              </Text>
            </Box>
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

      case 'api-key-management': {
        const existingKey = getApiKey(provider);
        const maskedKey = existingKey ? (() => {
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
          const maxMiddleDots = maxTotalLength - prefixLength - suffixLength;
          
          const actualMiddleLength = existingKey.length - prefixLength - suffixLength;
          const middleDots = Math.min(actualMiddleLength, maxMiddleDots);
          
          return existingKey.slice(0, prefixLength) + '•'.repeat(middleDots) + existingKey.slice(-suffixLength);
        })() : 'No key found';

        const isOAuthAuth = existingKey === 'OAUTH_AUTHENTICATED' || (existingKey && existingKey.includes('CLAUDE_PRO_SUBSCRIPTION')) || (existingKey && existingKey.includes('CLAUDE_MAX_SUBSCRIPTION'));
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
      }

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
      width={inputWidth ? Math.min(inputWidth + 8, terminalWidth - 4) : terminalWidth - 4}
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
          ? 'Type your API key | Enter: Validate & Save | Esc: ← Back'
          : 'Arrow keys: Navigate | Enter: Select | Esc: Cancel'
        }
      </Text>
    </Box>
  );
};