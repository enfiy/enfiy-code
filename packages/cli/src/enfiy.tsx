/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'ink';
import { AppWrapper } from './ui/App.js';
import { loadCliConfig } from './config/config.js';
import { readStdin } from './utils/readStdin.js';
import { basename } from 'node:path';
import v8 from 'node:v8';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { start_sandbox } from './utils/sandbox.js';
import {
  LoadedSettings,
  loadSettings,
  SettingScope,
} from './config/settings.js';
import { themeManager } from './ui/themes/theme-manager.js';
import { getStartupWarnings } from './utils/startupWarnings.js';
import { runNonInteractive } from './nonInteractiveCli.js';
import { loadExtensions, Extension } from './config/extension.js';
import { cleanupCheckpoints } from './utils/cleanup.js';
import { loadApiKeysIntoEnvironment } from './utils/secureStorage.js';
import {
  ApprovalMode,
  Config,
  ShellTool,
  sessionId,
  logUserPrompt,
  AuthType,
} from '@enfiy/core';
import { validateAuthMethod } from './config/auth.js';
import { setMaxSizedBoxDebugging } from './ui/components/shared/MaxSizedBox.js';

function getNodeMemoryArgs(config: Config): string[] {
  const totalMemoryMB = os.totalmem() / (1024 * 1024);
  const heapStats = v8.getHeapStatistics();
  const currentMaxOldSpaceSizeMb = Math.floor(
    heapStats.heap_size_limit / 1024 / 1024,
  );

  // Set target to 50% of total memory
  const targetMaxOldSpaceSizeInMB = Math.floor(totalMemoryMB * 0.5);
  if (config.getDebugMode()) {
    console.debug(
      `Current heap size ${currentMaxOldSpaceSizeMb.toFixed(2)} MB`,
    );
  }

  if (process.env.ENFIY_CLI_NO_RELAUNCH) {
    return [];
  }

  if (targetMaxOldSpaceSizeInMB > currentMaxOldSpaceSizeMb) {
    if (config.getDebugMode()) {
      console.debug(
        `Need to relaunch with more memory: ${targetMaxOldSpaceSizeInMB.toFixed(2)} MB`,
      );
    }
    return [`--max-old-space-size=${targetMaxOldSpaceSizeInMB}`];
  }

  return [];
}

async function relaunchWithAdditionalArgs(additionalArgs: string[]) {
  const nodeArgs = [...additionalArgs, ...process.argv.slice(1)];
  const newEnv = { ...process.env, ENFIY_CLI_NO_RELAUNCH: 'true' };

  const child = spawn(process.execPath, nodeArgs, {
    stdio: 'inherit',
    env: newEnv,
  });

  await new Promise((resolve) => child.on('close', resolve));
  process.exit(0);
}

export async function main() {
  // Handle setup commands early
  const args = process.argv;
  if (args.length > 2 && args[2] === 'setup') {
    const { setupLocalAI, displaySetupHelp } = await import(
      './commands/setupLocalAI.js'
    );

    if (args.length === 3 || args.includes('--help') || args.includes('-h')) {
      displaySetupHelp();
      return;
    }

    const provider = args[3] as 'ollama' | 'huggingface' | 'all';
    const options = {
      provider,
      check: args.includes('--check'),
      install: args.includes('--install'),
      start: args.includes('--start'),
      interactive: args.includes('--interactive'),
      model: args.find((arg, index) => args[index - 1] === '--model'),
    };

    await setupLocalAI(options);
    return;
  }

  const workspaceRoot = process.cwd();
  const settings = loadSettings(workspaceRoot);

  // Load API keys from secure storage into environment variables
  loadApiKeysIntoEnvironment();

  await cleanupCheckpoints();
  if (settings.errors.length > 0) {
    for (const error of settings.errors) {
      let errorMessage = `Error in ${error.path}: ${error.message}`;
      if (!process.env.NO_COLOR) {
        errorMessage = `\x1b[31m${errorMessage}\x1b[0m`;
      }
      console.error(errorMessage);
      console.error(`Please fix ${error.path} and try again.`);
    }
    process.exit(1);
  }

  const extensions = loadExtensions(workspaceRoot);
  const config = await loadCliConfig(settings.merged, extensions, sessionId);

  // set default fallback authentication based on provider and model
  if (!settings.merged.selectedAuthType) {
    const selectedProvider = settings.merged.selectedProvider;
    const selectedModel = settings.merged.selectedModel;
    let defaultAuthType: string = AuthType.API_KEY;
    
    // Detect appropriate auth type based on provider and model
    if (selectedProvider === 'ollama' || (selectedModel && selectedModel.includes('llama'))) {
      defaultAuthType = 'local'; // Use 'local' for Ollama/local models
    } else if (selectedProvider && ['openai', 'anthropic', 'mistral', 'huggingface'].includes(selectedProvider)) {
      defaultAuthType = AuthType.API_KEY;
    } else if (selectedProvider === 'gemini' || selectedProvider === 'google' || (selectedModel && selectedModel.includes('gemini'))) {
      defaultAuthType = AuthType.USE_GEMINI;
    }
    
    settings.setValue(SettingScope.User, 'selectedAuthType', defaultAuthType);
  }

  setMaxSizedBoxDebugging(config.getDebugMode());

  // Initialize centralized FileDiscoveryService
  config.getFileService();
  if (config.getCheckpointingEnabled()) {
    try {
      await config.getGitService();
    } catch {
      // For now swallow the error, later log it.
    }
  }

  if (settings.merged.theme) {
    if (!themeManager.setActiveTheme(settings.merged.theme)) {
      // If the theme is not found during initial load, log a warning and continue.
      // The useThemeCommand hook in App.tsx will handle opening the dialog.
      console.warn(`Warning: Theme "${settings.merged.theme}" not found.`);
    }
  }

  const memoryArgs = settings.merged.autoConfigureMaxOldSpaceSize
    ? getNodeMemoryArgs(config)
    : [];

  // hop into sandbox if we are outside and sandboxing is enabled
  if (!process.env.SANDBOX) {
    const sandboxConfig = config.getSandbox();
    if (sandboxConfig) {
      if (settings.merged.selectedAuthType) {
        // Validate authentication here because the sandbox will interfere with the Oauth2 web redirect.
        try {
          const err = validateAuthMethod(settings.merged.selectedAuthType);
          if (err) {
            throw new Error(err);
          }
          await config.refreshAuth(settings.merged.selectedAuthType);
        } catch (err) {
          console.error('Authentication Error:', err);
          console.error('Please reconfigure your authentication settings.');
          // Don't exit here - let sandbox continue
        }
      }
      await start_sandbox(sandboxConfig, memoryArgs);
      process.exit(0);
    } else {
      // Not in a sandbox and not entering one, so relaunch with additional
      // arguments to control memory usage if needed.
      if (memoryArgs.length > 0) {
        await relaunchWithAdditionalArgs(memoryArgs);
        process.exit(0);
      }
    }
  }
  let input = config.getQuestion();
  const startupWarnings = await getStartupWarnings();

  // Render UI, passing necessary config values. Check that there is no command line question.
  if (process.stdin.isTTY && input?.length === 0) {
    setWindowTitle(basename(workspaceRoot), settings);

    // Initialize auth if a valid auth type is selected
    if (settings.merged.selectedAuthType) {
      try {
        const err = validateAuthMethod(settings.merged.selectedAuthType);
        if (!err) {
          await config.refreshAuth(settings.merged.selectedAuthType);
        }
      } catch (error) {
        console.debug('Initial auth setup will be handled by UI:', error);
      }
    }

    render(
      <React.StrictMode>
        <AppWrapper
          config={config}
          settings={settings}
          startupWarnings={startupWarnings}
        />
      </React.StrictMode>,
      { exitOnCtrlC: false },
    );
    return;
  }
  // If not a TTY, read from stdin
  // This is for cases where the user pipes input directly into the command
  if (!process.stdin.isTTY) {
    input += await readStdin();
  }
  if (!input) {
    throw new Error('No input provided via stdin.');
  }

  logUserPrompt(config, {
    'event.name': 'user_prompt',
    'event.timestamp': new Date().toISOString(),
    prompt: input,
    prompt_length: input.length,
  });

  // Non-interactive mode handled by runNonInteractive
  const nonInteractiveConfig = await loadNonInteractiveConfig(
    config,
    extensions,
    settings,
  );

  await runNonInteractive(nonInteractiveConfig, input);
  process.exit(0);
}

function setWindowTitle(title: string, settings: LoadedSettings) {
  if (!settings.merged.hideWindowTitle) {
    process.stdout.write(`\x1b]2; Enfiy - ${title} \x07`);

    process.on('exit', () => {
      process.stdout.write(`\x1b]2;\x07`);
    });
  }
}

// --- Global Error Handlers ---
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION - PREVENTING CRASH:');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('Process would normally exit here, but continuing...');
  // Don't exit - try to continue
});

process.on('unhandledRejection', (reason, _promise) => {
  // Check if this is an auth-related error that should be handled gracefully
  if (reason && typeof reason === 'object' && 'message' in reason) {
    const message = (reason as Error).message || '';
    console.error('🚨 Error detected:', message);

    if (
      message.includes('Requested entity was not found') ||
      message.includes('404') ||
      message.includes('API key') ||
      message.includes('Unauthorized') ||
      message.includes('Failed to initialize AI provider') ||
      message.includes('Invalid API key format')
    ) {
      console.error('⚠️  Authentication/Provider error detected.');
      console.error(
        '💡 Please check your API key in .env file or use /provider command.',
      );
      console.error(
        '📝 Expected format: AIzaSy... (39 characters) for Gemini or provider-specific format',
      );
      return; // Don't exit for auth errors
    }

    if (message.includes('Could not load the default credentials')) {
      console.error('⚠️  Google Cloud authentication error detected.');
      console.error('💡 Enfiy Code uses API keys, not Google Cloud auth.');
      console.error(
        '📝 Please set your provider API key in .env file (e.g., GEMINI_API_KEY, OLLAMA_HOST).',
      );
      return; // Don't exit for this error
    }
  }

  // Log other unexpected unhandled rejections as critical errors
  console.error('=========================================');
  console.error('CRITICAL: Unhandled Promise Rejection!');
  console.error('=========================================');
  console.error('Reason:', reason);
  console.error('Stack trace may follow:');
  if (!(reason instanceof Error)) {
    console.error(reason);
  }
  console.error(
    '💡 If this persists, please check your .env file and API key configuration.',
  );
  // Exit for genuinely unhandled errors
  process.exit(1);
});

async function loadNonInteractiveConfig(
  config: Config,
  extensions: Extension[],
  settings: LoadedSettings,
) {
  let finalConfig = config;
  if (config.getApprovalMode() !== ApprovalMode.YOLO) {
    // Only exclude shell commands in non-interactive mode
    // File operations (EditTool, WriteFileTool) should be allowed with confirmation dialogs
    const existingExcludeTools = settings.merged.excludeTools || [];
    const interactiveTools = [
      ShellTool.Name, // Only shell commands are truly dangerous in non-interactive mode
    ];

    const newExcludeTools = [
      ...new Set([...existingExcludeTools, ...interactiveTools]),
    ];

    const nonInteractiveSettings = {
      ...settings.merged,
      excludeTools: newExcludeTools,
    };
    finalConfig = await loadCliConfig(
      nonInteractiveSettings,
      extensions,
      config.getSessionId(),
    );
  }

  return await validateNonInterActiveAuth(
    settings.merged.selectedAuthType,
    finalConfig,
  );
}

async function validateNonInterActiveAuth(
  selectedAuthType: AuthType | undefined,
  nonInteractiveConfig: Config,
) {
  // For Enfiy Code, if no auth type is selected, prompt user to configure provider
  if (!selectedAuthType) {
    console.error('Please set up an AI provider using the /provider command');
    process.exit(1);
  }

  selectedAuthType = selectedAuthType || AuthType.API_KEY;
  const err = validateAuthMethod(selectedAuthType);
  if (err != null) {
    console.error(err);
    process.exit(1);
  }

  await nonInteractiveConfig.refreshAuth(selectedAuthType);
  return nonInteractiveConfig;
}
