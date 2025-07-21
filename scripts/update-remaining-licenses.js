#!/usr/bin/env node

/**
 * Update remaining license headers for files not covered in the first script
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// License templates
const DUAL_COPYRIGHT = `/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */`;

const SINGLE_COPYRIGHT = `/**
 * @license
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */`;

// Files already processed in the main script
const ALREADY_PROCESSED = [
  'packages/cli/src/enfiy.tsx',
  'packages/cli/src/nonInteractiveCli.ts',
  'packages/cli/src/setupTests.ts',
  'packages/cli/src/config/config.ts',
  'packages/cli/src/config/settings.ts',
  'packages/cli/src/config/extension.ts',
  'packages/cli/src/config/auth.ts',
  'packages/cli/src/config/sandboxConfig.ts',
  'packages/cli/src/ui/App.tsx',
  'packages/cli/src/ui/colors.ts',
  'packages/cli/src/ui/constants.ts',
  'packages/cli/src/ui/types.ts',
  'packages/cli/src/ui/components/LoadingIndicator.tsx',
  'packages/cli/src/ui/components/InputPrompt.tsx',
  'packages/cli/src/ui/components/Footer.tsx',
  'packages/cli/src/ui/components/Header.tsx',
  'packages/cli/src/ui/components/AuthDialog.tsx',
  'packages/cli/src/ui/hooks/useInputHistory.ts',
  'packages/cli/src/ui/hooks/useTerminalSize.ts',
  'packages/cli/src/ui/hooks/useTimer.ts',
  'packages/cli/src/ui/hooks/useStateAndRef.ts',
  'packages/cli/src/ui/hooks/useKeypress.ts',
  'packages/cli/src/ui/themes/theme.ts',
  'packages/cli/src/ui/themes/theme-manager.ts',
  'packages/cli/src/utils/version.ts',
  'packages/cli/src/utils/startupWarnings.ts',
  'packages/cli/src/utils/readStdin.ts',
  'packages/cli/src/utils/package.ts',
  'packages/cli/src/utils/sandbox.ts',
  'packages/cli/src/utils/cleanup.ts',
  'packages/cli/src/utils/debugLogger.ts',
  'packages/cli/src/ui/utils/textUtils.ts',
  'packages/cli/src/ui/utils/markdownUtilities.ts',
  'packages/cli/src/ui/utils/formatters.ts',
  'packages/cli/src/ui/utils/i18n.ts',
  'packages/cli/src/ui/utils/commandUtils.ts',
  'packages/cli/src/ui/utils/MarkdownDisplay.tsx',
  'packages/cli/src/ui/utils/CodeColorizer.tsx',
  'packages/core/src/index.ts',
  'packages/core/src/config/config.ts',
  'packages/core/src/core/logger.ts',
  'packages/core/src/core/tokenLimits.ts',
  'packages/core/src/core/prompts.ts',
  'packages/core/src/core/client.ts',
  'packages/core/src/core/contentGenerator.ts',
  'packages/core/src/tools/tools.ts',
  'packages/core/src/tools/edit.ts',
  'packages/core/src/tools/read-file.ts',
  'packages/core/src/tools/write-file.ts',
  'packages/core/src/tools/shell.ts',
  'packages/core/src/tools/ls.ts',
  'packages/core/src/tools/grep.ts',
  'packages/core/src/tools/glob.ts',
  'packages/core/src/tools/tool-registry.ts',
  'packages/core/src/utils/paths.ts',
  'packages/core/src/utils/errors.ts',
  'packages/core/src/utils/fileUtils.ts',
  'packages/core/src/utils/editor.ts',
  'packages/core/src/utils/gitUtils.ts',
  'packages/core/src/utils/session.ts',
  'packages/core/src/utils/user_id.ts',
  'packages/core/src/utils/retry.ts',
  'packages/core/src/telemetry/index.ts',
  'packages/core/src/telemetry/sdk.ts',
  'packages/core/src/telemetry/types.ts',
  'packages/core/src/telemetry/constants.ts',
  'packages/core/src/telemetry/loggers.ts',
  'packages/core/src/telemetry/metrics.ts',
  'packages/cli/src/services/providerSetupService.ts',
  'packages/cli/src/services/modelManager.ts',
  'packages/cli/src/commands/setupLocalAI.ts',
  'packages/cli/src/ui/components/EnfiyAsciiArt.tsx',
  'packages/cli/src/ui/components/EnfiyRespondingSpinner.tsx',
  'packages/cli/src/ui/components/ModelSelectionDialog.tsx',
  'packages/cli/src/ui/components/APISettingsDialog.tsx',
  'packages/cli/src/ui/components/CloudAISetupDialog.tsx',
  'packages/cli/src/ui/components/LocalAISetupDialog.tsx',
  'packages/cli/src/ui/components/ProviderSelectionDialog.tsx',
  'packages/cli/src/utils/ollamaSetup.ts',
  'packages/cli/src/utils/huggingfaceSetup.ts',
  'packages/cli/src/utils/modelUtils.ts',
  'packages/cli/src/utils/secureStorage.ts',
  'packages/cli/src/ui/hooks/useModelAutoSwitching.ts',
  'packages/cli/src/ui/hooks/useAuthCommand.ts',
  'packages/cli/src/ui/hooks/usePrivacySettings.ts',
  'packages/cli/src/ui/hooks/useOptimizedBundle.ts',
  'packages/core/src/providers/types.ts',
  'packages/core/src/providers/provider-factory.ts',
  'packages/core/src/providers/gemini-provider.ts',
  'packages/core/src/providers/openai-provider.ts',
  'packages/core/src/providers/ollama-provider.ts',
  'packages/core/src/providers/mistral-provider.ts',
  'packages/core/src/providers/openrouter-provider.ts',
  'packages/core/src/providers/lmstudio-provider.ts',
  'packages/core/src/providers/base-provider.ts',
  'packages/core/src/providers/provider-detector.ts',
  'packages/core/src/providers/model-registry.ts',
  'packages/core/src/core/multiProviderClient.ts',
  'packages/core/src/core/enfiyChat.ts',
  'packages/core/src/config/models.ts',
  'packages/core/src/tools/web-search.ts',
  'packages/core/src/tools/web-fetch.ts',
  'packages/core/src/tools/mcp-tool.ts',
  'packages/core/src/tools/mcp-client.ts',
  'packages/core/src/tools/memoryTool.ts',
  'packages/core/src/tools/read-many-files.ts',
];

function getAllTsJsFiles() {
  const findFiles = (dir) => {
    const files = [];
    try {
      const entries = fs.readdirSync(path.resolve(projectRoot, dir), {
        withFileTypes: true,
      });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...findFiles(fullPath));
        } else if (entry.name.match(/\.(ts|tsx|js)$/)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not read directory ${dir}: ${error.message}`);
    }

    return files;
  };

  return [...findFiles('packages/cli/src'), ...findFiles('packages/core/src')];
}

function categorizeFile(filePath) {
  // Test files - generally new for Enfiy
  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return 'SINGLE';
  }

  // Integration test files - new
  if (filePath.includes('.integration.')) {
    return 'SINGLE';
  }

  // Theme files - likely modified from original
  if (filePath.includes('/themes/')) {
    return 'DUAL';
  }

  // Hooks - determine by functionality
  if (filePath.includes('/hooks/')) {
    // Core hooks likely modified from original
    const coreHooks = [
      'useCompletion',
      'useEditorSettings',
      'useGitBranchName',
      'useLoadingIndicator',
      'useBracketedPaste',
      'usePhraseCycler',
    ];

    // New hooks for multi-provider/Enfiy features
    const newHooks = [
      'atCommandProcessor',
      'slashCommandProcessor',
      'shellCommandProcessor',
      'useAutoAcceptIndicator',
    ];

    const baseName = path.basename(filePath, path.extname(filePath));

    if (coreHooks.some((hook) => baseName.includes(hook))) {
      return 'DUAL';
    }

    if (newHooks.some((hook) => baseName.includes(hook))) {
      return 'SINGLE';
    }

    // Default hooks to modified (core CLI functionality)
    return 'DUAL';
  }

  // Components - determine by name
  if (filePath.includes('/components/')) {
    // New components for multi-provider/Enfiy
    const newComponents = [
      'SuggestionsDisplay',
      'Help',
      'ThemeDialog',
      'ConfigDialog',
      'WarningDisplay',
      'OutputDisplay',
      'ConsoleOutput',
    ];

    const baseName = path.basename(filePath, path.extname(filePath));

    if (newComponents.some((comp) => baseName.includes(comp))) {
      return 'SINGLE';
    }

    // Components in /shared/ are likely modified from original
    if (filePath.includes('/shared/')) {
      return 'DUAL';
    }

    // Messages components - likely modified
    if (filePath.includes('/messages/')) {
      return 'DUAL';
    }

    // Most other components likely new for Enfiy
    return 'SINGLE';
  }

  // Utils - determine by functionality
  if (filePath.includes('/utils/')) {
    // Core utils likely modified
    const coreUtils = [
      'keyboardShortcuts',
      'windowSize',
      'terminalUtils',
      'errorParsing',
    ];

    // New utils for Enfiy
    const newUtils = [
      'processTreeKiller',
      'apiUtils',
      'configHelpers',
      'validations',
    ];

    const baseName = path.basename(filePath, path.extname(filePath));

    if (coreUtils.some((util) => baseName.includes(util))) {
      return 'DUAL';
    }

    if (newUtils.some((util) => baseName.includes(util))) {
      return 'SINGLE';
    }

    // Default utils to modified (core functionality)
    return 'DUAL';
  }

  // Privacy/legal components - new for Enfiy
  if (filePath.includes('/privacy/')) {
    return 'SINGLE';
  }

  // Commands - new for multi-provider
  if (filePath.includes('/commands/')) {
    return 'SINGLE';
  }

  // Services - new for multi-provider
  if (filePath.includes('/services/')) {
    return 'SINGLE';
  }

  // Core tools beyond basics - new
  if (filePath.includes('/tools/') && filePath.includes('packages/core')) {
    const newTools = [
      'bfsFileSearch',
      'codeBlockConverter',
      'fetch',
      'file-detection',
      'generateContentResponseUtilities',
      'LruCache',
      'messageInspectors',
      'nextSpeakerChecker',
      'schemaValidator',
    ];

    const baseName = path.basename(filePath, path.extname(filePath));

    if (newTools.some((tool) => baseName.includes(tool))) {
      return 'SINGLE';
    }

    // Default to modified for core tools
    return 'DUAL';
  }

  // Core utils beyond basics - mixed
  if (filePath.includes('/utils/') && filePath.includes('packages/core')) {
    const newCoreUtils = [
      'bfsFileSearch',
      'codeBlockConverter',
      'fetch',
      'file-detection',
      'generateContentResponseUtilities',
      'LruCache',
      'messageInspectors',
      'nextSpeakerChecker',
      'schemaValidator',
      'errorReporting',
    ];

    const baseName = path.basename(filePath, path.extname(filePath));

    if (newCoreUtils.some((util) => baseName.includes(util))) {
      return 'SINGLE';
    }

    // Default to modified
    return 'DUAL';
  }

  // Default to dual for core infrastructure
  return 'DUAL';
}

function updateLicenseHeader(filePath, newHeader) {
  try {
    const fullPath = path.resolve(projectRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Remove existing license header
    const lines = content.split('\n');
    let contentStartIndex = 0;
    let inLicenseBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('/**')) {
        inLicenseBlock = true;
        continue;
      }

      if (inLicenseBlock && line.endsWith('*/')) {
        contentStartIndex = i + 1;
        while (
          contentStartIndex < lines.length &&
          lines[contentStartIndex].trim() === ''
        ) {
          contentStartIndex++;
        }
        break;
      }

      if (
        !inLicenseBlock &&
        line &&
        !line.startsWith('//') &&
        !line.startsWith('/*')
      ) {
        break;
      }
    }

    const remainingContent = lines.slice(contentStartIndex).join('\n');
    const newContent = newHeader + '\n\n' + remainingContent;

    fs.writeFileSync(fullPath, newContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔍 Finding remaining files to update...\n');

  const allFiles = getAllTsJsFiles();
  const remainingFiles = allFiles.filter(
    (file) => !ALREADY_PROCESSED.includes(file),
  );

  console.log(`📊 Found ${allFiles.length} total files`);
  console.log(`✅ Already processed: ${ALREADY_PROCESSED.length} files`);
  console.log(`🆕 Remaining to process: ${remainingFiles.length} files\n`);

  if (remainingFiles.length === 0) {
    console.log('🎉 All files already have correct license headers!');
    return;
  }

  let dualUpdated = 0;
  let singleUpdated = 0;
  let errors = 0;

  console.log('📝 Processing remaining files...\n');

  for (const filePath of remainingFiles) {
    const category = categorizeFile(filePath);
    const header = category === 'DUAL' ? DUAL_COPYRIGHT : SINGLE_COPYRIGHT;
    const copyrightType =
      category === 'DUAL'
        ? '(Google LLC + Hayate Esaki)'
        : '(Hayate Esaki only)';

    if (updateLicenseHeader(filePath, header)) {
      console.log(`✅ ${copyrightType} ${filePath}`);
      if (category === 'DUAL') {
        dualUpdated++;
      } else {
        singleUpdated++;
      }
    } else {
      errors++;
    }
  }

  console.log('\n📊 Final Summary:');
  console.log(`   Files with dual copyright: ${dualUpdated}`);
  console.log(`   Files with single copyright: ${singleUpdated}`);
  console.log(`   Total files updated: ${dualUpdated + singleUpdated}`);
  console.log(`   Errors: ${errors}`);
  console.log(
    `   Grand total processed: ${ALREADY_PROCESSED.length + dualUpdated + singleUpdated} files`,
  );
  console.log('\n✨ Complete license header update finished!');
}

main();
