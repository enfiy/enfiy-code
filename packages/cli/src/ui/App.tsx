/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Box,
  DOMElement,
  measureElement,
  Static,
  Text,
  useStdin,
  useStdout,
  useInput,
  type Key as InkKeyType,
} from 'ink';
import { StreamingState, type HistoryItem, MessageType } from './types.js';
import { useTerminalSize } from './hooks/useTerminalSize.js';
import { useEnfiyStream } from './hooks/useEnfiyStream.js';
import { useLoadingIndicator } from './hooks/useLoadingIndicator.js';
import { useThemeCommand } from './hooks/useThemeCommand.js';
import { useAuthCommand } from './hooks/useAuthCommand.js';
import { useEditorSettings } from './hooks/useEditorSettings.js';
import { useSlashCommandProcessor } from './hooks/slashCommandProcessor.js';
import { useAutoAcceptIndicator } from './hooks/useAutoAcceptIndicator.js';
import { useConsoleMessages } from './hooks/useConsoleMessages.js';
import { Header } from './components/Header.js';
import { LoadingIndicator } from './components/LoadingIndicator.js';
import { AutoAcceptIndicator } from './components/AutoAcceptIndicator.js';
import { ShellModeIndicator } from './components/ShellModeIndicator.js';
import { InputPrompt } from './components/InputPrompt.js';
import { Footer } from './components/Footer.js';
import { ThemeDialog } from './components/ThemeDialog.js';
import { AuthDialog } from './components/AuthDialog.js';
import { AuthInProgress } from './components/AuthInProgress.js';
import { EditorSettingsDialog } from './components/EditorSettingsDialog.js';
import { Colors } from './colors.js';
import { Help } from './components/Help.js';
import { loadHierarchicalEnfiyMemory } from '../config/config.js';
import { LoadedSettings, SettingScope } from '../config/settings.js';
import { Tips } from './components/Tips.js';
import { useConsolePatcher } from './components/ConsolePatcher.js';
import { DetailedMessagesDisplay } from './components/DetailedMessagesDisplay.js';
import { HistoryItemDisplay } from './components/HistoryItemDisplay.js';
import { ContextSummaryDisplay } from './components/ContextSummaryDisplay.js';
import { useHistory } from './hooks/useHistoryManager.js';
import process from 'node:process';
import {
  getErrorMessage,
  type Config,
  getAllEnfiyMdFilenames,
  ApprovalMode,
  isEditorAvailable,
  EditorType,
  getProviderFromModel,
  getCompatibleModel,
} from '@enfiy/core';
// import { validateAuthMethod } from '../config/auth.js';
import { useLogger } from './hooks/useLogger.js';
import { StreamingContext } from './contexts/StreamingContext.js';
import {
  SessionStatsProvider,
  useSessionStats,
} from './contexts/SessionContext.js';
import { useGitBranchName } from './hooks/useGitBranchName.js';
import { useBracketedPaste } from './hooks/useBracketedPaste.js';
import { useTextBuffer } from './components/shared/text-buffer.js';
import * as fs from 'fs';
import { UpdateNotification } from './components/UpdateNotification.js';
import { checkForUpdates } from './utils/updateCheck.js';
import { OverflowProvider } from './contexts/OverflowContext.js';
import { ShowMoreLines } from './components/ShowMoreLines.js';
import { PrivacyNotice } from './privacy/PrivacyNotice.js';
import {
  ProviderSelectionDialog,
  ProviderSetupDialog,
  CloudAISetupDialog,
  APISettingsDialog,
} from './components/LazyComponents.js';
import { ProviderType, AuthType } from '@enfiy/core';

// Local interface for provider setup dialog compatibility
interface LocalProviderSetupConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  authMethod?: 'api-key' | 'subscription' | 'local';
}
import { t } from './utils/i18n.js';
import { storeApiKey } from '../utils/secureStorage.js';

const CTRL_EXIT_PROMPT_DURATION_MS = 1000;

interface AppProps {
  config: Config;
  settings: LoadedSettings;
  startupWarnings?: string[];
}

export const AppWrapper = (props: AppProps) => (
  <SessionStatsProvider>
    <App {...props} />
  </SessionStatsProvider>
);

const App = ({ config, settings, startupWarnings = [] }: AppProps) => {
  useBracketedPaste();
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const { stdout } = useStdout();

  useEffect(() => {
    checkForUpdates().then(setUpdateMessage);
  }, []);

  const { history, addItem, clearItems, loadHistory } = useHistory();
  const {
    consoleMessages,
    handleNewMessage,
    clearConsoleMessages: clearConsoleMessagesState,
  } = useConsoleMessages();
  const { stats: sessionStats } = useSessionStats();
  const [staticNeedsRefresh, setStaticNeedsRefresh] = useState(false);
  const [staticKey, setStaticKey] = useState(0);
  const refreshStatic = useCallback(() => {
    stdout.write('\x1b[2J\x1b[H');
    setStaticKey((prev) => prev + 1);
  }, [setStaticKey, stdout]);

  const [enfiyMdFileCount, setEnfiyMdFileCount] = useState<number>(0);
  const [debugMessage, setDebugMessage] = useState<string>('');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [footerHeight, setFooterHeight] = useState<number>(0);
  const [corgiMode, setCorgiMode] = useState(false);
  const _showMemoryUsage = config.getDebugMode() || config.getShowMemoryUsage();
  const [currentModel, setCurrentModel] = useState(() => {
    const settingsModel = settings.merged.selectedModel;

    // If we have a valid settings model that differs from config, sync it immediately
    if (
      settingsModel &&
      settingsModel !== 'gemini-2.5-pro' &&
      settingsModel !== 'llama3.2:8b' &&
      settingsModel !== '' &&
      settingsModel !== config.getModel()
    ) {
      config.setModel(settingsModel);
    }

    // Start with empty if no proper model is configured
    if (
      !settingsModel ||
      settingsModel === 'gemini-2.5-pro' ||
      settingsModel === 'llama3.2:8b' ||
      settingsModel === ''
    ) {
      return '';
    }

    return settingsModel;
  });
  const [shellModeActive, setShellModeActive] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false);
  const [showToolDescriptions, setShowToolDescriptions] =
    useState<boolean>(false);
  const [ctrlCPressedOnce, setCtrlCPressedOnce] = useState(false);
  const [quittingMessages, setQuittingMessages] = useState<
    HistoryItem[] | null
  >(null);
  const ctrlCTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [ctrlDPressedOnce, setCtrlDPressedOnce] = useState(false);
  const ctrlDTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [constrainHeight, setConstrainHeight] = useState<boolean>(true);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState<boolean>(false);
  const [showProviderSelection, setShowProviderSelection] =
    useState<boolean>(false);
  const [showProviderSetup, setShowProviderSetup] = useState<boolean>(false);
  const [showCloudAISetup, setShowCloudAISetup] = useState<boolean>(false);
  const [showAPISettings, setShowAPISettings] = useState<boolean>(false);
  const [setupProvider, setSetupProvider] = useState<ProviderType | null>(null);
  const [isManagingProvider, setIsManagingProvider] = useState<boolean>(false);
  const [isFirstRun, setIsFirstRun] = useState<boolean>(true);
  const [preselectedProvider, setPreselectedProvider] =
    useState<ProviderType | null>(null);

  const openPrivacyNotice = useCallback(() => {
    setShowPrivacyNotice(true);
  }, []);

  const handleProviderSelect = useCallback(
    (provider: ProviderType, model: string) => {
      // Save the selected provider and model to config
      const providerCategories: Record<ProviderType, string> = {
        [ProviderType.OLLAMA]: t('localAI'),
        [ProviderType.VLLM]: t('localAI'),
        [ProviderType.ANTHROPIC]: t('cloudAI'),
        [ProviderType.OPENAI]: t('cloudAI'),
        [ProviderType.GEMINI]: t('cloudAI'),
        [ProviderType.MISTRAL]: t('cloudAI'),
        [ProviderType.HUGGINGFACE]: t('cloudAI'),
        [ProviderType.OPENROUTER]: t('cloudAI'),
      };

      const providerName = `${provider.toUpperCase()} (${providerCategories[provider] || t('cloudAI')})`;

      // Ensure model and provider compatibility
      const compatibleModel = getCompatibleModel(model, provider);
      if (compatibleModel !== model) {
        console.log(`Model ${model} is not compatible with ${provider}, using ${compatibleModel} instead`);
      }

      // Update the model in config and current state
      config.setModel(compatibleModel);
      setCurrentModel(compatibleModel);

      // Save to settings for persistence across sessions
      settings.setValue(SettingScope.User, 'selectedProvider', provider);
      settings.setValue(SettingScope.User, 'selectedModel', compatibleModel);

      addItem(
        {
          type: MessageType.INFO,
          text: `${t('setupComplete')} ${providerName} | Model: ${model}`,
        },
        Date.now(),
      );

      addItem(
        {
          type: MessageType.INFO,
          text: t('readyMessage'),
        },
        Date.now(),
      );

      // Add Japanese input notice if locale is Japanese
      const locale = process.env.LANG || '';
      if (locale.includes('ja_JP') || locale.includes('ja')) {
        addItem(
          {
            type: MessageType.INFO,
            text: 'Input Note: For complex text input, use Ctrl+X for external editor or copy & paste.',
          },
          Date.now(),
        );
      }

      // Add Enfiy introduction message
      addItem(
        {
          type: MessageType.ENFIY,
          text: `${t('welcomeTitle')}

${t('welcomeMessage')}

${t('keyFeatures')}
• ${t('featureFileOps')}
• ${t('featureCodeSearch')}
• ${t('featureShellCommands')}
• ${t('featureSuggestions')}

${t('helpMessage')}`,
          // model: currentModel,
        },
        Date.now(),
      );

      setShowProviderSelection(false);
      setPreselectedProvider(null); // Clear preselection
      setIsFirstRun(false);
    },
    [addItem, config, setCurrentModel, settings],
  );

  const handleProviderSelectionCancel = useCallback(() => {
    setShowProviderSelection(false);
    setPreselectedProvider(null); // Clear preselection
    // If it's first run and they cancel, just set first run to false
    if (isFirstRun) {
      setIsFirstRun(false);
    }
  }, [isFirstRun]);

  const openProviderSelection = useCallback(() => {
    setShowProviderSelection(true);
  }, []);

  const handleProviderSetupRequired = useCallback((provider: ProviderType) => {
    console.log('handleProviderSetupRequired called with provider:', provider);
    const cloudProviders = [
      ProviderType.ANTHROPIC,
      ProviderType.OPENAI,
      ProviderType.GEMINI,
      ProviderType.MISTRAL,
    ];

    setSetupProvider(provider);
    setShowProviderSelection(false);
    setIsManagingProvider(false);

    if (cloudProviders.includes(provider)) {
      console.log(
        'Provider is cloud provider, setting showCloudAISetup to true',
      );
      setShowCloudAISetup(true);
    } else {
      console.log(
        'Provider is local provider, setting showProviderSetup to true',
      );
      setShowProviderSetup(true);
    }
  }, []);

  const handleProviderManagement = useCallback((provider: ProviderType) => {
    setSetupProvider(provider);
    setShowProviderSelection(false);
    setIsManagingProvider(true);
    setShowCloudAISetup(true);
  }, []);

  const lastMessageRef = useRef<string>('');
  const lastMessageTimestamp = useRef<number>(0);

  const handleCloudAISetupComplete = useCallback(
    (setupConfig: {
      type: ProviderType;
      apiKey: string;
      endpoint?: string;
    }) => {
      setShowCloudAISetup(false);
      setSetupProvider(null);

      const wasManaging = isManagingProvider;
      setIsManagingProvider(false);

      // 管理モードからの場合は、Settingsに戻る
      if (wasManaging) {
        setShowAPISettings(true);
      } else {
        // After API key configuration, show provider selection for model choice
        setPreselectedProvider(setupConfig.type);
        setShowProviderSelection(true);

        // Add success message only once with timestamp-based deduplication
        const message = `${setupConfig.type.toUpperCase()} API key configured successfully. Please select a model.`;
        const now = Date.now();

        // Only add message if it's different from the last one OR if enough time has passed (prevent rapid duplicates)
        if (
          lastMessageRef.current !== message ||
          now - lastMessageTimestamp.current > 1000
        ) {
          lastMessageRef.current = message;
          lastMessageTimestamp.current = now;
          addItem(
            {
              type: MessageType.INFO,
              text: message,
            },
            now,
          );
        }
      }
    },
    [addItem, isManagingProvider],
  );

  const handleCloudAISetupCancel = useCallback(() => {
    // Check if current model uses the provider that was being configured
    if (setupProvider && currentModel) {
      const currentModelProvider = getProviderFromModel(currentModel);
      if (currentModelProvider === setupProvider) {
        // API key might have been deleted, check if it's still available
        import('../utils/secureStorage.js').then(({ hasStoredCredentials }) => {
          if (!hasStoredCredentials(setupProvider)) {
            // API key was deleted and current model uses this provider - reset model
            console.log(
              `API key for ${setupProvider} was deleted. Resetting current model: ${currentModel}`,
            );
            setCurrentModel('');
            config.setModel('');
            settings.setValue(SettingScope.User, 'selectedModel', '');
            settings.setValue(SettingScope.User, 'selectedProvider', '');

            // Add info message about model being disabled
            addItem(
              {
                type: MessageType.INFO,
                text: `Current model "${currentModel}" disabled due to missing API key for ${setupProvider}. Please select a new model.`,
              },
              Date.now(),
            );
          }
        });
      }
    }

    setShowCloudAISetup(false);
    setSetupProvider(null);

    // 管理モードからの場合は、Settingsに戻る
    if (isManagingProvider) {
      setShowAPISettings(true);
      setIsManagingProvider(false);
    } else {
      // 通常の場合はプロバイダー選択に戻る
      setShowProviderSelection(true);
    }
  }, [
    isManagingProvider,
    setupProvider,
    currentModel,
    config,
    settings,
    addItem,
  ]);

  const handleOpenAPISettings = useCallback(() => {
    setShowProviderSelection(false);
    setShowAPISettings(true);
  }, []);

  const handleAPISettingsCancel = useCallback(() => {
    setShowAPISettings(false);
    setShowProviderSelection(true);
  }, []);

  const handleAPISettingsManageProvider = useCallback(
    (provider: ProviderType) => {
      setSetupProvider(provider);
      setShowAPISettings(false);
      setIsManagingProvider(true);
      setShowCloudAISetup(true);
    },
    [],
  );

  const handleProviderSetupComplete = useCallback(
    async (providerConfig: LocalProviderSetupConfig) => {
      console.log('Provider setup completing with config:', providerConfig);

      try {
        // Store API key if provided
        if (providerConfig.apiKey) {
          storeApiKey(
            providerConfig.type,
            providerConfig.apiKey,
            providerConfig.baseUrl,
            'api-key',
          );

          // Set proper auth type - Enfiy only uses API keys
          const authType = AuthType.API_KEY;
          settings.setValue(SettingScope.User, 'selectedAuthType', authType);
          console.log('Saved auth type to settings:', authType);
        }

        // Set the model in config and state
        if (providerConfig.model) {
          console.log(
            'Setting model and provider:',
            providerConfig.model,
            providerConfig.type,
          );

          // Update config
          config.setModel(providerConfig.model);
          setCurrentModel(providerConfig.model);

          // Save to settings for persistence
          settings.setValue(
            SettingScope.User,
            'selectedModel',
            providerConfig.model,
          );
          settings.setValue(
            SettingScope.User,
            'selectedProvider',
            providerConfig.type,
          );

          console.log('Saved model and provider to settings');

          // Refresh auth if needed
          if (providerConfig.apiKey) {
            try {
              const authType = AuthType.API_KEY;
              await config.refreshAuth(authType);
              console.log('Auth refreshed successfully');
            } catch (error) {
              console.error('Failed to refresh auth:', error);
              addItem(
                {
                  type: MessageType.ERROR,
                  text: `Failed to initialize ${typeof providerConfig.type === 'string' ? providerConfig.type.toUpperCase() : 'provider'}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
                Date.now(),
              );
              return;
            }
          }
        }

        // Additional verification for Ollama
        if (providerConfig.type === ProviderType.OLLAMA) {
          try {
            const response = await fetch('http://localhost:11434/api/tags', {
              method: 'GET',
              signal: AbortSignal.timeout(3000),
            });

            if (!response.ok) {
              addItem(
                {
                  type: MessageType.ERROR,
                  text: 'Error: Ollama is not running. Please start Ollama service first with: ollama serve',
                },
                Date.now(),
              );
              setShowProviderSetup(false);
              setSetupProvider(null);
              setShowProviderSelection(true);
              return;
            }

            const data = await response.json();
            const models = data.models || [];

            if (models.length === 0) {
              addItem(
                {
                  type: MessageType.ERROR,
                  text: 'Error: No models found. Please install a model first (e.g., ollama pull llama3.2:8b)',
                },
                Date.now(),
              );
              setShowProviderSetup(false);
              setSetupProvider(null);
              setShowProviderSelection(true);
              return;
            }

            // Check if the specific model exists
            const modelExists = models.some(
              (model: { name: string }) => model.name === providerConfig.model,
            );
            if (!modelExists) {
              addItem(
                {
                  type: MessageType.ERROR,
                  text: `Error: Model "${providerConfig.model}" not found. Available models: ${models.map((m: { name: string }) => m.name).join(', ')}`,
                },
                Date.now(),
              );
              setShowProviderSetup(false);
              setSetupProvider(null);
              setShowProviderSelection(true);
              return;
            }
          } catch (error) {
            addItem(
              {
                type: MessageType.ERROR,
                text: `Error: Failed to connect to Ollama: ${error instanceof Error ? error.message : 'Connection failed'}. Please ensure Ollama is running.`,
              },
              Date.now(),
            );
            setShowProviderSetup(false);
            setSetupProvider(null);
            setShowProviderSelection(true);
            return;
          }
        }

        addItem(
          {
            type: MessageType.INFO,
            text: `${typeof providerConfig.type === 'string' ? providerConfig.type.toUpperCase() : 'Provider'} setup completed successfully! Using model: ${typeof providerConfig.model === 'string' ? providerConfig.model : 'default'}`,
          },
          Date.now(),
        );

        // Reinitialize client for the new provider
        try {
          await config.reinitializeEnfiyClient();
          console.log('Client reinitialized for new provider');
        } catch (error) {
          console.error('Failed to reinitialize client:', error);
        }

        setShowProviderSetup(false);
        setSetupProvider(null);
        setIsFirstRun(false);
      } catch (error) {
        console.error('Error during provider setup:', error);
        addItem(
          {
            type: MessageType.ERROR,
            text: `Failed to complete ${providerConfig.type.toUpperCase()} setup: ${error}`,
          },
          Date.now(),
        );
      }
    },
    [addItem, config, settings, setCurrentModel],
  );

  const handleProviderSetupCancel = useCallback(() => {
    setShowProviderSetup(false);
    setSetupProvider(null);
    setShowProviderSelection(true);
  }, []);

  const handleSwitchToCloud = useCallback(() => {
    setShowProviderSetup(false);
    setSetupProvider(null);
    setShowProviderSelection(true);
    // TODO: Could add logic to pre-select cloud category in ProviderSelectionDialog
  }, []);

  // Check if this is first run (no provider configured)
  useEffect(() => {
    const checkProviderConfiguration = async () => {
      // Skip if we're already in setup mode
      if (showProviderSelection || showProviderSetup) {
        console.log('Skipping provider check - already in setup mode');
        return;
      }

      // 設定ファイルまたは環境変数でプロバイダーが設定されているかチェック
      const _currentModel = config.getModel();
      const hasValidProvider =
        settings.merged.selectedProvider &&
        settings.merged.selectedProvider !== '';
      const hasValidModel =
        settings.merged.selectedModel && settings.merged.selectedModel !== '';

      // Check if API key exists for the configured provider
      let hasApiKey = false;
      if (hasValidProvider && settings.merged.selectedProvider) {
        const { hasStoredCredentials } = await import(
          '../utils/secureStorage.js'
        );
        hasApiKey = hasStoredCredentials(settings.merged.selectedProvider);

        // For local providers, API key is not required
        const localProviders = ['ollama', 'vllm', 'huggingface'];
        if (
          localProviders.includes(
            settings.merged.selectedProvider.toLowerCase(),
          )
        ) {
          hasApiKey = true;
        }
      }

      // Only show provider selection if configuration is incomplete
      // Remove isFirstRun from the condition - rely on actual configuration state
      if (!hasValidProvider || !hasValidModel || !hasApiKey) {
        // プロバイダー検出を実行
        try {
          const { getRecommendedProvider } = await import('@enfiy/core');
          const recommended = await getRecommendedProvider();

          console.log('Configuration check:', {
            hasValidProvider,
            hasValidModel,
            hasApiKey,
            provider: settings.merged.selectedProvider,
            model: settings.merged.selectedModel,
          });

          // Only show provider detection message if not first run
          if (!isFirstRun) {
            addItem(
              {
                type: MessageType.INFO,
                text: `${recommended.type.toUpperCase()} ready`,
              },
              Date.now(),
            );
          }

          // 自動的にプロバイダー選択を表示（Settings画面やCloudAI設定画面が開いていない場合のみ）
          setTimeout(() => {
            if (!showAPISettings && !showCloudAISetup && !showProviderSetup) {
              setShowProviderSelection(true);
            }
          }, 500);
        } catch (_error) {
          // Show provider selection even if detection fails（Settings画面やCloudAI設定画面が開いていない場合のみ）
          setTimeout(() => {
            if (!showAPISettings && !showCloudAISetup && !showProviderSetup) {
              setShowProviderSelection(true);
            }
          }, 500);
        }
      } else {
        // Provider, model, and API key are all configured
        // Restore the last used model to the current state
        if (
          settings.merged.selectedModel &&
          settings.merged.selectedModel !== currentModel
        ) {
          // Ensure model and provider compatibility
          const selectedProvider = settings.merged.selectedProvider || 'gemini';
          const compatibleModel = getCompatibleModel(settings.merged.selectedModel, selectedProvider);
          
          if (compatibleModel !== settings.merged.selectedModel) {
            console.log(
              `Model ${settings.merged.selectedModel} is not compatible with ${selectedProvider}, using ${compatibleModel} instead`
            );
            // Update settings with compatible model
            settings.setValue(SettingScope.User, 'selectedModel', compatibleModel);
          }
          
          console.log(
            'Restoring last used model:',
            compatibleModel,
          );
          console.log('Config model before:', config.getModel());
          setCurrentModel(compatibleModel);
          config.setModel(compatibleModel);
          console.log('Config model after:', config.getModel());
        }

        if (isFirstRun) {
          setIsFirstRun(false);
        }
      }
    };

    checkProviderConfiguration();
  }, [
    config,
    addItem,
    isFirstRun,
    showProviderSelection,
    showProviderSetup,
    showCloudAISetup,
    showAPISettings,
    settings,
    settings.merged.selectedModel,
    settings.merged.selectedProvider,
    currentModel,
  ]);

  const errorCount = useMemo(
    () => consoleMessages.filter((msg) => msg.type === 'error').length,
    [consoleMessages],
  );

  const {
    isThemeDialogOpen,
    openThemeDialog,
    handleThemeSelect,
    handleThemeHighlight,
  } = useThemeCommand(settings, setThemeError, addItem);

  const {
    isAuthDialogOpen,
    openAuthDialog,
    handleAuthSelect,
    handleAuthHighlight,
    isAuthenticating,
    cancelAuthentication,
  } = useAuthCommand(settings, setAuthError, config);

  // Disable automatic auth validation - let users choose their provider first
  // useEffect(() => {
  //   if (settings.merged.selectedAuthType) {
  //     const error = validateAuthMethod(settings.merged.selectedAuthType);
  //     if (error) {
  //       setAuthError(error);
  //       openAuthDialog();
  //     }
  //   }
  // }, [settings.merged.selectedAuthType, openAuthDialog, setAuthError]);

  const {
    isEditorDialogOpen,
    openEditorDialog,
    handleEditorSelect,
    exitEditorDialog,
  } = useEditorSettings(settings, setEditorError, addItem);

  const toggleCorgiMode = useCallback(() => {
    setCorgiMode((prev) => !prev);
  }, []);

  const performMemoryRefresh = useCallback(async () => {
    addItem(
      {
        type: MessageType.INFO,
        text: 'Refreshing hierarchical memory (ENFIY.md or other context files)...',
      },
      Date.now(),
    );
    try {
      const { memoryContent, fileCount } = await loadHierarchicalEnfiyMemory(
        process.cwd(),
        config.getDebugMode(),
        config.getFileService(),
        config.getExtensionContextFilePaths(),
      );
      config.setUserMemory(memoryContent);
      config.setEnfiyMdFileCount(fileCount);
      setEnfiyMdFileCount(fileCount);

      addItem(
        {
          type: MessageType.INFO,
          text: `Memory refreshed successfully. ${memoryContent.length > 0 ? `Loaded ${memoryContent.length} characters from ${fileCount} file(s).` : 'No memory content found.'}`,
        },
        Date.now(),
      );
      if (config.getDebugMode()) {
        console.log(
          `[DEBUG] Refreshed memory content in config: ${memoryContent.substring(0, 200)}...`,
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      addItem(
        {
          type: MessageType.ERROR,
          text: `Error refreshing memory: ${errorMessage}`,
        },
        Date.now(),
      );
      console.error('Error refreshing memory:', error);
    }
  }, [config, addItem]);

  // Watch for model changes (e.g., from Flash fallback)
  useEffect(() => {
    const checkModelChange = () => {
      const configModel = config.getModel();
      // Don't override with default models unless they were explicitly set
      if (configModel !== currentModel) {
        // Model change detected

        // Check settings for the actual selected model
        const settingsModel = settings.merged.selectedModel;
        if (settingsModel && settingsModel !== configModel) {
          // Using settings model instead
          setCurrentModel(settingsModel);
          return;
        }

        // If it's a default model and we don't have a model set, don't show it
        if (
          (configModel === 'gemini-2.5-pro' || configModel === 'llama3.2:8b') &&
          !currentModel
        ) {
          // Skipping default model override
          return;
        }
        // Updating model
        setCurrentModel(configModel);
      }
    };

    // Check immediately and then periodically
    checkModelChange();
    const interval = setInterval(checkModelChange, 1000); // Check every second

    return () => clearInterval(interval);
  }, [config, currentModel, settings.merged.selectedModel]);

  // Set up Flash fallback handler
  useEffect(() => {
    const flashFallbackHandler = async (
      currentModel: string,
      fallbackModel: string,
    ): Promise<boolean> => {
      // Add message to UI history
      addItem(
        {
          type: MessageType.INFO,
          text: `Notice: Slow response times detected. Automatically switching from ${currentModel} to ${fallbackModel} for faster responses for the remainder of this session.
To avoid this you can either upgrade to Standard tier. See: https://goo.gle/set-up-gemini-code-assist
Or you can utilize a Gemini API Key. See: https://goo.gle/enfiy-cli-docs-auth#gemini-api-key
You can switch authentication methods by typing /auth`,
        },
        Date.now(),
      );
      return true; // Always accept the fallback
    };

    config.setFlashFallbackHandler(flashFallbackHandler);
  }, [config, addItem]);

  const {
    handleSlashCommand,
    slashCommands,
    pendingHistoryItems: pendingSlashCommandHistoryItems,
  } = useSlashCommandProcessor(
    config,
    settings,
    history,
    addItem,
    clearItems,
    loadHistory,
    refreshStatic,
    setShowHelp,
    setDebugMessage,
    openThemeDialog,
    openAuthDialog,
    openEditorDialog,
    performMemoryRefresh,
    toggleCorgiMode,
    showToolDescriptions,
    setQuittingMessages,
    openPrivacyNotice,
    openProviderSelection,
  );
  const pendingHistoryItems = [...pendingSlashCommandHistoryItems];

  const { rows: terminalHeight, columns: terminalWidth } = useTerminalSize();
  const isInitialMount = useRef(true);
  const { stdin, setRawMode } = useStdin();
  const isValidPath = useCallback((filePath: string): boolean => {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (_e) {
      return false;
    }
  }, []);

  const widthFraction = 0.9;
  const inputWidth = Math.max(
    20,
    Math.floor(terminalWidth * widthFraction) - 3,
  );
  const suggestionsWidth = Math.max(60, Math.floor(terminalWidth * 0.8));

  const buffer = useTextBuffer({
    initialText: '',
    viewport: { height: 10, width: inputWidth },
    stdin,
    setRawMode,
    isValidPath,
  });

  const handleExit = useCallback(
    (
      pressedOnce: boolean,
      setPressedOnce: (value: boolean) => void,
      timerRef: React.RefObject<NodeJS.Timeout | null>,
    ) => {
      if (pressedOnce) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        const quitCommand = slashCommands.find(
          (cmd) => cmd.name === 'quit' || cmd.altName === 'exit',
        );
        if (quitCommand) {
          quitCommand.action('quit', '', '');
        } else {
          process.exit(0);
        }
      } else {
        setPressedOnce(true);
        timerRef.current = setTimeout(() => {
          setPressedOnce(false);
          timerRef.current = null;
        }, CTRL_EXIT_PROMPT_DURATION_MS);
      }
    },
    [slashCommands],
  );

  useInput((input: string, key: InkKeyType) => {
    let enteringConstrainHeightMode = false;
    if (!constrainHeight) {
      // Automatically re-enter constrain height mode if the user types
      // anything. When constrainHeight==false, the user will experience
      // significant flickering so it is best to disable it immediately when
      // the user starts interacting with the app.
      enteringConstrainHeightMode = true;
      setConstrainHeight(true);
    }

    if (key.ctrl && input === 'o') {
      setShowErrorDetails((prev) => !prev);
    } else if (key.ctrl && input === 't') {
      const newValue = !showToolDescriptions;
      setShowToolDescriptions(newValue);

      const mcpServers = config.getMcpServers();
      if (Object.keys(mcpServers || {}).length > 0) {
        handleSlashCommand(newValue ? '/mcp desc' : '/mcp nodesc');
      }
    } else if (key.ctrl && (input === 'c' || input === 'C')) {
      handleExit(ctrlCPressedOnce, setCtrlCPressedOnce, ctrlCTimerRef);
    } else if (key.ctrl && (input === 'd' || input === 'D')) {
      if (buffer.text.length > 0) {
        // Do nothing if there is text in the input.
        return;
      }
      handleExit(ctrlDPressedOnce, setCtrlDPressedOnce, ctrlDTimerRef);
    } else if (key.ctrl && input === 's' && !enteringConstrainHeightMode) {
      setConstrainHeight(false);
    }
  });

  useConsolePatcher({
    onNewMessage: handleNewMessage,
    debugMode: config.getDebugMode(),
  });

  useEffect(() => {
    if (config) {
      setEnfiyMdFileCount(config.getEnfiyMdFileCount());
    }
  }, [config]);

  const getPreferredEditor = useCallback(() => {
    const editorType = settings.merged.preferredEditor;
    const isValidEditor = isEditorAvailable(editorType);
    if (!isValidEditor) {
      openEditorDialog();
      return;
    }
    return editorType as EditorType;
  }, [settings, openEditorDialog]);

  const onAuthError = useCallback(() => {
    setAuthError('reauth required');
    openAuthDialog();
  }, [openAuthDialog, setAuthError]);

  const {
    streamingState,
    submitQuery,
    initError,
    pendingHistoryItems: pendingEnfiyHistoryItems,
    thought,
  } = useEnfiyStream(
    config.getEnfiyClient(),
    history,
    addItem,
    setShowHelp,
    config,
    setDebugMessage,
    handleSlashCommand,
    shellModeActive,
    getPreferredEditor,
    onAuthError,
    performMemoryRefresh,
    currentModel,
  );
  pendingHistoryItems.push(...pendingEnfiyHistoryItems);
  const { elapsedTime, currentLoadingPhrase } =
    useLoadingIndicator(streamingState);
  const showAutoAcceptIndicator = useAutoAcceptIndicator({ config });

  const handleFinalSubmit = useCallback(
    (submittedValue: string) => {
      const trimmedValue = submittedValue.trim();
      if (trimmedValue.length > 0) {
        submitQuery(trimmedValue);
      }
    },
    [submitQuery],
  );

  const logger = useLogger();
  const [userMessages, setUserMessages] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserMessages = async () => {
      const pastMessagesRaw = (await logger?.getPreviousUserMessages()) || []; // Newest first

      const currentSessionUserMessages = history
        .filter(
          (item): item is HistoryItem & { type: 'user'; text: string } =>
            item.type === 'user' &&
            typeof item.text === 'string' &&
            item.text.trim() !== '',
        )
        .map((item) => item.text)
        .reverse(); // Newest first, to match pastMessagesRaw sorting

      // Combine, with current session messages being more recent
      const combinedMessages = [
        ...currentSessionUserMessages,
        ...pastMessagesRaw,
      ];

      // Deduplicate consecutive identical messages from the combined list (still newest first)
      const deduplicatedMessages: string[] = [];
      if (combinedMessages.length > 0) {
        deduplicatedMessages.push(combinedMessages[0]); // Add the newest one unconditionally
        for (let i = 1; i < combinedMessages.length; i++) {
          if (combinedMessages[i] !== combinedMessages[i - 1]) {
            deduplicatedMessages.push(combinedMessages[i]);
          }
        }
      }
      // Reverse to oldest first for useInputHistory
      setUserMessages(deduplicatedMessages.reverse());
    };
    fetchUserMessages();
  }, [history, logger]);

  const isInputActive = streamingState === StreamingState.Idle && !initError;

  const handleClearScreen = useCallback(() => {
    clearItems();
    clearConsoleMessagesState();
    console.clear();
    refreshStatic();
  }, [clearItems, clearConsoleMessagesState, refreshStatic]);

  const mainControlsRef = useRef<DOMElement>(null);
  const pendingHistoryItemRef = useRef<DOMElement>(null);

  useEffect(() => {
    if (mainControlsRef.current) {
      const fullFooterMeasurement = measureElement(mainControlsRef.current);
      setFooterHeight(fullFooterMeasurement.height);
    }
  }, [terminalHeight, consoleMessages, showErrorDetails]);

  const staticExtraHeight = /* margins and padding */ 3;
  const availableTerminalHeight = useMemo(
    () => terminalHeight - footerHeight - staticExtraHeight,
    [terminalHeight, footerHeight],
  );

  useEffect(() => {
    // skip refreshing Static during first mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // debounce so it doesn't fire up too often during resize
    const handler = setTimeout(() => {
      setStaticNeedsRefresh(false);
      refreshStatic();
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [terminalWidth, terminalHeight, refreshStatic]);

  useEffect(() => {
    if (streamingState === StreamingState.Idle && staticNeedsRefresh) {
      setStaticNeedsRefresh(false);
      refreshStatic();
    }
  }, [streamingState, refreshStatic, staticNeedsRefresh]);

  const filteredConsoleMessages = useMemo(() => {
    if (config.getDebugMode()) {
      return consoleMessages;
    }
    return consoleMessages.filter((msg) => msg.type !== 'debug');
  }, [consoleMessages, config]);

  const branchName = useGitBranchName(config.getTargetDir());

  const contextFileNames = useMemo(() => {
    const fromSettings = settings.merged.contextFileName;
    if (fromSettings) {
      return Array.isArray(fromSettings) ? fromSettings : [fromSettings];
    }
    return getAllEnfiyMdFilenames();
  }, [settings.merged.contextFileName]);

  if (quittingMessages) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        {quittingMessages.map((item) => (
          <HistoryItemDisplay
            key={item.id}
            availableTerminalHeight={
              constrainHeight ? availableTerminalHeight : undefined
            }
            terminalWidth={terminalWidth}
            item={item}
            isPending={false}
            config={config}
          />
        ))}
      </Box>
    );
  }
  const mainAreaWidth = Math.floor(terminalWidth * 0.95);
  const debugConsoleMaxHeight = Math.floor(Math.max(terminalHeight * 0.2, 5));
  // Arbitrary threshold to ensure that items in the static area are large
  // enough but not too large to make the terminal hard to use.
  const staticAreaMaxItemHeight = Math.max(terminalHeight * 4, 100);
  return (
    <StreamingContext.Provider value={streamingState}>
      <Box flexDirection="column" marginBottom={0} width="95%">
        {/*
         * The Static component is an Ink intrinsic in which there can only be 1 per application.
         * Because of this restriction we're hacking it slightly by having a 'header' item here to
         * ensure that it's statically rendered.
         *
         * Background on the Static Item: Anything in the Static component is written a single time
         * to the console. Think of it like doing a console.log and then never using ANSI codes to
         * clear that content ever again. Effectively it has a moving frame that every time new static
         * content is set it'll flush content to the terminal and move the area which it's "clearing"
         * down a notch. Without Static the area which gets erased and redrawn continuously grows.
         */}
        <Static
          key={staticKey}
          items={[
            <Box flexDirection="column" key="header">
              <Header terminalWidth={terminalWidth} />
              <Tips config={config} />
              {updateMessage && <UpdateNotification message={updateMessage} />}
            </Box>,
            ...history.map((h) => (
              <HistoryItemDisplay
                terminalWidth={mainAreaWidth}
                availableTerminalHeight={staticAreaMaxItemHeight}
                key={h.id}
                item={h}
                isPending={false}
                config={config}
              />
            )),
          ]}
        >
          {(item) => item}
        </Static>
        <OverflowProvider>
          <Box ref={pendingHistoryItemRef} flexDirection="column">
            {pendingHistoryItems.map((item, i) => (
              <HistoryItemDisplay
                key={i}
                availableTerminalHeight={
                  constrainHeight ? availableTerminalHeight : undefined
                }
                terminalWidth={mainAreaWidth}
                // TODO(taehykim): It seems like references to ids aren't necessary in
                // HistoryItemDisplay. Refactor later. Use a fake id for now.
                item={{ ...item, id: 0 }}
                isPending={true}
                config={config}
                isFocused={!isEditorDialogOpen}
              />
            ))}
            <ShowMoreLines constrainHeight={constrainHeight} />
          </Box>
        </OverflowProvider>

        {showHelp && <Help commands={slashCommands} />}

        <Box flexDirection="column" ref={mainControlsRef}>
          {startupWarnings.length > 0 && (
            <Box
              borderStyle="round"
              borderColor={Colors.AccentYellow}
              paddingX={1}
              marginY={1}
              flexDirection="column"
            >
              {startupWarnings.map((warning, index) => (
                <Text key={index} color={Colors.AccentYellow}>
                  {warning}
                </Text>
              ))}
            </Box>
          )}

          {isThemeDialogOpen ? (
            <Box flexDirection="column">
              {themeError && (
                <Box marginBottom={1}>
                  <Text color={Colors.AccentRed}>{themeError}</Text>
                </Box>
              )}
              <ThemeDialog
                onSelect={handleThemeSelect}
                onHighlight={handleThemeHighlight}
                settings={settings}
                availableTerminalHeight={
                  constrainHeight
                    ? terminalHeight - staticExtraHeight
                    : undefined
                }
                terminalWidth={mainAreaWidth}
              />
            </Box>
          ) : isAuthenticating ? (
            <AuthInProgress
              onTimeout={() => {
                setAuthError('Authentication timed out. Please try again.');
                cancelAuthentication();
                openAuthDialog();
              }}
            />
          ) : isAuthDialogOpen ? (
            <Box flexDirection="column">
              <AuthDialog
                onSelect={handleAuthSelect}
                onHighlight={handleAuthHighlight}
                settings={settings}
                initialErrorMessage={authError}
              />
            </Box>
          ) : isEditorDialogOpen ? (
            <Box flexDirection="column">
              {editorError && (
                <Box marginBottom={1}>
                  <Text color={Colors.AccentRed}>{editorError}</Text>
                </Box>
              )}
              <EditorSettingsDialog
                onSelect={handleEditorSelect}
                settings={settings}
                onExit={exitEditorDialog}
              />
            </Box>
          ) : showPrivacyNotice ? (
            <PrivacyNotice
              onExit={() => setShowPrivacyNotice(false)}
              config={config}
            />
          ) : showProviderSelection ? (
            <ProviderSelectionDialog
              onSelect={handleProviderSelect}
              onCancel={handleProviderSelectionCancel}
              onSetupRequired={handleProviderSetupRequired}
              _onManageProvider={handleProviderManagement}
              onOpenAPISettings={handleOpenAPISettings}
              _availableTerminalHeight={
                constrainHeight ? availableTerminalHeight : undefined
              }
              terminalWidth={mainAreaWidth}
              _inputWidth={inputWidth}
              preselectedProvider={preselectedProvider ?? undefined}
            />
          ) : showAPISettings ? (
            <APISettingsDialog
              onManageProvider={handleAPISettingsManageProvider}
              onCancel={handleAPISettingsCancel}
              terminalWidth={mainAreaWidth}
            />
          ) : showCloudAISetup && setupProvider ? (
            <CloudAISetupDialog
              provider={setupProvider}
              onComplete={handleCloudAISetupComplete}
              onCancel={handleCloudAISetupCancel}
              terminalWidth={mainAreaWidth}
              isManaging={isManagingProvider}
              forceAuthSelection={!isManagingProvider}
              inputWidth={inputWidth}
            />
          ) : showProviderSetup && setupProvider ? (
            <ProviderSetupDialog
              provider={setupProvider}
              onComplete={handleProviderSetupComplete}
              onCancel={handleProviderSetupCancel}
              onSwitchToCloud={handleSwitchToCloud}
              terminalWidth={mainAreaWidth}
            />
          ) : (
            <>
              <LoadingIndicator
                thought={
                  streamingState === StreamingState.WaitingForConfirmation ||
                  config.getAccessibility()?.disableLoadingPhrases
                    ? undefined
                    : thought
                }
                currentLoadingPhrase={
                  config.getAccessibility()?.disableLoadingPhrases
                    ? undefined
                    : currentLoadingPhrase
                }
                elapsedTime={elapsedTime}
              />
              <Box
                marginTop={1}
                display="flex"
                justifyContent="space-between"
                width="100%"
              >
                <Box>
                  {process.env.GEMINI_SYSTEM_MD && (
                    <Text color={Colors.AccentRed}>|⌐■_■| </Text>
                  )}
                  {ctrlCPressedOnce ? (
                    <Text color={Colors.AccentYellow}>
                      Press Ctrl+C again to exit.
                    </Text>
                  ) : ctrlDPressedOnce ? (
                    <Text color={Colors.AccentYellow}>
                      Press Ctrl+D again to exit.
                    </Text>
                  ) : (
                    <ContextSummaryDisplay
                      enfiyMdFileCount={enfiyMdFileCount}
                      contextFileNames={contextFileNames}
                      mcpServers={config.getMcpServers()}
                      showToolDescriptions={showToolDescriptions}
                    />
                  )}
                </Box>
                <Box>
                  {showAutoAcceptIndicator !== ApprovalMode.DEFAULT &&
                    !shellModeActive && (
                      <AutoAcceptIndicator
                        approvalMode={showAutoAcceptIndicator}
                      />
                    )}
                  {shellModeActive && <ShellModeIndicator />}
                </Box>
              </Box>

              {showErrorDetails && (
                <OverflowProvider>
                  <DetailedMessagesDisplay
                    messages={filteredConsoleMessages}
                    maxHeight={
                      constrainHeight ? debugConsoleMaxHeight : undefined
                    }
                    width={inputWidth}
                  />
                  <ShowMoreLines constrainHeight={constrainHeight} />
                </OverflowProvider>
              )}

              {isInputActive && (
                <InputPrompt
                  buffer={buffer}
                  inputWidth={inputWidth}
                  suggestionsWidth={suggestionsWidth}
                  onSubmit={handleFinalSubmit}
                  userMessages={userMessages}
                  onClearScreen={handleClearScreen}
                  config={config}
                  slashCommands={slashCommands}
                  shellModeActive={shellModeActive}
                  setShellModeActive={setShellModeActive}
                />
              )}
            </>
          )}

          {initError && streamingState !== StreamingState.Responding && (
            <Box
              borderStyle="round"
              borderColor={Colors.AccentRed}
              paddingX={1}
              marginBottom={1}
            >
              {history.find(
                (item) =>
                  item.type === 'error' && item.text?.includes(initError),
              )?.text ? (
                <Text color={Colors.AccentRed}>
                  {
                    history.find(
                      (item) =>
                        item.type === 'error' && item.text?.includes(initError),
                    )?.text
                  }
                </Text>
              ) : (
                <>
                  <Text color={Colors.AccentRed}>
                    Initialization Error: {initError}
                  </Text>
                  <Text color={Colors.AccentRed}>
                    {' '}
                    Please check API key and configuration.
                  </Text>
                </>
              )}
            </Box>
          )}
          <Footer
            model={currentModel}
            targetDir={config.getTargetDir()}
            debugMode={config.getDebugMode()}
            branchName={branchName}
            debugMessage={debugMessage}
            corgiMode={corgiMode}
            errorCount={errorCount}
            showErrorDetails={showErrorDetails}
            showMemoryUsage={
              config.getDebugMode() || config.getShowMemoryUsage()
            }
            promptTokenCount={sessionStats.currentResponse.promptTokenCount}
            candidatesTokenCount={
              sessionStats.currentResponse.candidatesTokenCount
            }
            totalTokenCount={sessionStats.currentResponse.totalTokenCount}
            isSlashCommand={buffer.text.trim().startsWith('/')}
          />
        </Box>
      </Box>
    </StreamingContext.Provider>
  );
};
