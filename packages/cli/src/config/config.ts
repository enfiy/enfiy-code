/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import process from 'node:process';
import {
  Config,
  loadServerHierarchicalMemory,
  setEnfiyMdFilename as setServerEnfiyMdFilename,
  getCurrentEnfiyMdFilename,
  ApprovalMode,
  ENFIY_CONFIG_DIR as ENFIY_DIR,
  DEFAULT_ENFIY_EMBEDDING_MODEL,
  DEFAULT_ENFIY_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_ANTHROPIC_MODEL,
  FileDiscoveryService,
  TelemetryTarget,
  getCompatibleModel,
} from '@enfiy/core';
import { Settings } from './settings.js';

import { Extension } from './extension.js';
import { getCliVersion } from '../utils/version.js';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadSandboxConfig } from './sandboxConfig.js';

// Simple console logger for now - replace with actual logger if available
const logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...args: any[]) => console.error('[ERROR]', ...args),
};

interface CliArgs {
  model: string | undefined;
  sandbox: boolean | string | undefined;
  'sandbox-image': string | undefined;
  debug: boolean | undefined;
  prompt: string | undefined;
  all_files: boolean | undefined;
  show_memory_usage: boolean | undefined;
  auto: boolean | undefined;
  telemetry: boolean | undefined;
  checkpointing: boolean | undefined;
  telemetryTarget: string | undefined;
  telemetryOtlpEndpoint: string | undefined;
  telemetryLogPrompts: boolean | undefined;
}

async function parseArguments(): Promise<CliArgs> {
  const argv = await yargs(hideBin(process.argv))
    .usage('$0 [options]')
    .group(['model', 'prompt'], 'Basic Options:')
    .option('model', {
      alias: 'm',
      type: 'string',
      description: 'AI model to use',
    })
    .option('prompt', {
      alias: 'p',
      type: 'string',
      description: 'Initial prompt (appended to stdin input)',
    })
    .group(['sandbox', 'sandbox-image'], 'Sandbox Options:')
    .option('sandbox', {
      alias: 's',
      type: 'boolean',
      description: 'Run in isolated sandbox environment',
    })
    .option('sandbox-image', {
      type: 'string',
      description: 'Custom sandbox container image',
    })
    .group(['debug', 'show_memory_usage'], 'Development Options:')
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug mode with verbose logging',
      default: false,
    })
    .option('show_memory_usage', {
      type: 'boolean',
      description: 'Display memory usage in status bar',
      default: false,
    })
    .group(['all_files', 'checkpointing', 'auto'], 'Workflow Options:')
    .option('all_files', {
      alias: 'a',
      type: 'boolean',
      description: 'Include all files in project context',
      default: false,
    })
    .option('checkpointing', {
      alias: 'c',
      type: 'boolean',
      description: 'Enable file edit checkpointing',
      default: false,
    })
    .option('auto', {
      alias: 'y',
      type: 'boolean',
      description: 'Automatically approve all AI actions without confirmation',
      default: false,
    })
    .group(
      [
        'telemetry',
        'telemetry-target',
        'telemetry-otlp-endpoint',
        'telemetry-log-prompts',
      ],
      'Telemetry Options:',
    )
    .option('telemetry', {
      type: 'boolean',
      description: 'Enable usage telemetry collection',
    })
    .option('telemetry-target', {
      type: 'string',
      choices: ['local', 'gcp'],
      description: 'Telemetry destination (local or gcp)',
    })
    .option('telemetry-otlp-endpoint', {
      type: 'string',
      description: 'Custom OTLP endpoint for telemetry',
    })
    .option('telemetry-log-prompts', {
      type: 'boolean',
      description: 'Include user prompts in telemetry data',
    })
    .version(await getCliVersion())
    .alias('v', 'version')
    .help()
    .alias('h', 'help')
    .example('$0', 'Start interactive mode')
    .example('$0 -m "gpt-4"', 'Use specific model')
    .example('$0 -p "Review my code"', 'Start with a prompt')
    .example('$0 --auto', 'Auto-approve all actions')
    .epilog('For more information, visit: https://github.com/enfiy/enfiy-code')
    .strict().argv;

  return argv;
}

// This function is now a thin wrapper around the server's implementation.
// It's kept in the CLI for now as App.tsx directly calls it for memory refresh.
// TODO: Consider if App.tsx should get memory via a server call or if Config should refresh itself.
export async function loadHierarchicalEnfiyMemory(
  currentWorkingDirectory: string,
  debugMode: boolean,
  fileService: FileDiscoveryService,
  extensionContextFilePaths: string[] = [],
): Promise<{ memoryContent: string; fileCount: number }> {
  if (debugMode) {
    logger.debug(
      `CLI: Delegating hierarchical memory load to server for CWD: ${currentWorkingDirectory}`,
    );
  }
  // Directly call the server function.
  // The server function will use its own homedir() for the global path.
  return loadServerHierarchicalMemory(
    currentWorkingDirectory,
    debugMode,
    fileService,
    extensionContextFilePaths,
  );
}

export async function loadCliConfig(
  settings: Settings,
  extensions: Extension[],
  sessionId: string,
): Promise<Config> {
  loadEnvironment();

  // Load API keys from secure storage into environment variables
  try {
    const { loadApiKeysIntoEnvironment } = await import(
      '../utils/secureStorage.js'
    );
    loadApiKeysIntoEnvironment();
  } catch (error) {
    console.error('Could not load API keys from secure storage:', error);
  }

  const argv = await parseArguments();
  const debugMode = argv.debug || false;

  // Set the context filename in the server's memoryTool module BEFORE loading memory
  // TODO(b/343434939): This is a bit of a hack. The contextFileName should ideally be passed
  // directly to the Config constructor in core, and have core handle setEnfiyMdFilename.
  // However, loadHierarchicalEnfiyMemory is called *before* createServerConfig.
  if (settings.contextFileName) {
    setServerEnfiyMdFilename(settings.contextFileName);
  } else {
    // Reset to default if not provided in settings.
    setServerEnfiyMdFilename(getCurrentEnfiyMdFilename());
  }

  const extensionContextFilePaths = extensions.flatMap((e) => e.contextFiles);

  const fileService = new FileDiscoveryService(process.cwd());
  // Call the (now wrapper) loadHierarchicalEnfiyMemory which calls the server's version
  const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
    process.cwd(),
    debugMode,
    fileService,
    extensionContextFilePaths,
  );

  const mcpServers = mergeMcpServers(settings, extensions);

  const sandboxConfig = await loadSandboxConfig(settings, argv);

  return new Config({
    sessionId,
    embeddingModel: DEFAULT_ENFIY_EMBEDDING_MODEL,
    sandbox: sandboxConfig,
    targetDir: process.cwd(),
    debugMode,
    question: argv.prompt || '',
    fullContext: argv.all_files || false,
    coreTools: settings.coreTools || undefined,
    excludeTools: settings.excludeTools || undefined,
    toolDiscoveryCommand: settings.toolDiscoveryCommand,
    toolCallCommand: settings.toolCallCommand,
    mcpServerCommand: settings.mcpServerCommand,
    mcpServers,
    userMemory: memoryContent,
    enfiyMdFileCount: fileCount,
    approvalMode: argv.auto || false ? ApprovalMode.YOLO : ApprovalMode.DEFAULT,
    showMemoryUsage:
      argv.show_memory_usage || settings.showMemoryUsage || false,
    accessibility: settings.accessibility,
    telemetry: {
      enabled: argv.telemetry ?? settings.telemetry?.enabled,
      target: (argv.telemetryTarget ??
        settings.telemetry?.target) as TelemetryTarget,
      otlpEndpoint:
        argv.telemetryOtlpEndpoint ??
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
        settings.telemetry?.otlpEndpoint,
      logPrompts: argv.telemetryLogPrompts ?? settings.telemetry?.logPrompts,
    },
    usageStatisticsEnabled: settings.usageStatisticsEnabled ?? true,
    // Git-aware file filtering settings
    fileFiltering: {
      respectGitIgnore: settings.fileFiltering?.respectGitIgnore,
      enableRecursiveFileSearch:
        settings.fileFiltering?.enableRecursiveFileSearch,
    },
    checkpointing: argv.checkpointing || settings.checkpointing?.enabled,
    proxy:
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy,
    cwd: process.cwd(),
    fileDiscoveryService: fileService,
    bugCommand: settings.bugCommand,
    model: resolveModelWithSmartFallback(argv.model, settings),
    extensionContextFilePaths,
  });
}

/**
 * Smart model resolution with fallback strategy
 */
function resolveModelWithSmartFallback(argvModel: string | undefined, settings: Settings): string {
  const settingsModel = settings.selectedModel;
  const settingsProvider = settings.selectedProvider;
  
  // 1. Use explicitly provided command-line model
  if (argvModel) {
    return argvModel;
  }
  
  // 2. Use configured model from settings, ensuring compatibility
  if (settingsModel && settingsProvider) {
    return getCompatibleModel(settingsModel, settingsProvider);
  } else if (settingsModel) {
    return settingsModel;
  }
  
  // 3. Use environment variables
  if (process.env.ENFIY_MODEL) {
    return process.env.ENFIY_MODEL;
  }
  
  if (process.env.GEMINI_MODEL) {
    return process.env.GEMINI_MODEL;
  }
  
  // 4. Check for available API keys to determine best default
  if (process.env.GEMINI_API_KEY) {
    return DEFAULT_GEMINI_MODEL;
  }
  
  if (process.env.OPENAI_API_KEY) {
    return DEFAULT_OPENAI_MODEL;
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    return DEFAULT_ANTHROPIC_MODEL;
  }
  
  // 5. Final fallback - use the configured default
  return DEFAULT_ENFIY_MODEL;
}

function mergeMcpServers(settings: Settings, extensions: Extension[]) {
  const mcpServers = { ...(settings.mcpServers || {}) };
  for (const extension of extensions) {
    Object.entries(extension.config.mcpServers || {}).forEach(
      ([key, server]) => {
        if (mcpServers[key]) {
          logger.warn(
            `Skipping extension MCP config for server with key "${key}" as it already exists.`,
          );
          return;
        }
        mcpServers[key] = server;
      },
    );
  }
  return mcpServers;
}
function findEnvFile(startDir: string): string | null {
  let currentDir = path.resolve(startDir);
  while (true) {
    // prefer enfiy-specific .env under ENFIY_DIR
    const enfiyEnvPath = path.join(currentDir, ENFIY_DIR, '.env');
    if (fs.existsSync(enfiyEnvPath)) {
      return enfiyEnvPath;
    }
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir || !parentDir) {
      // check .env under home as fallback, again preferring enfiy-specific .env
      const homeEnfiyEnvPath = path.join(os.homedir(), ENFIY_DIR, '.env');
      if (fs.existsSync(homeEnfiyEnvPath)) {
        return homeEnfiyEnvPath;
      }
      const homeEnvPath = path.join(os.homedir(), '.env');
      if (fs.existsSync(homeEnvPath)) {
        return homeEnvPath;
      }
      return null;
    }
    currentDir = parentDir;
  }
}

export function loadEnvironment(): void {
  const envFilePath = findEnvFile(process.cwd());
  if (envFilePath) {
    dotenv.config({ path: envFilePath, quiet: true });
  }
}
