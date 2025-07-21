#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
/**
 * License Header Update Script
 * Updates copyright headers for all files in the Enfiy ecosystem
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

// File categorization based on analysis
const DUAL_COPYRIGHT_FILES = [
  // CLI - Core Infrastructure
  'packages/cli/src/enfiy.tsx',
  'packages/cli/src/nonInteractiveCli.ts',
  'packages/cli/src/setupTests.ts',

  // CLI - Config
  'packages/cli/src/config/config.ts',
  'packages/cli/src/config/settings.ts',
  'packages/cli/src/config/extension.ts',
  'packages/cli/src/config/auth.ts',
  'packages/cli/src/config/sandboxConfig.ts',

  // CLI - Core UI
  'packages/cli/src/ui/App.tsx',
  'packages/cli/src/ui/colors.ts',
  'packages/cli/src/ui/constants.ts',
  'packages/cli/src/ui/types.ts',

  // CLI - Basic Components
  'packages/cli/src/ui/components/LoadingIndicator.tsx',
  'packages/cli/src/ui/components/InputPrompt.tsx',
  'packages/cli/src/ui/components/Footer.tsx',
  'packages/cli/src/ui/components/Header.tsx',
  'packages/cli/src/ui/components/AuthDialog.tsx',

  // CLI - Hooks
  'packages/cli/src/ui/hooks/useInputHistory.ts',
  'packages/cli/src/ui/hooks/useTerminalSize.ts',
  'packages/cli/src/ui/hooks/useTimer.ts',
  'packages/cli/src/ui/hooks/useStateAndRef.ts',
  'packages/cli/src/ui/hooks/useKeypress.ts',

  // CLI - Themes
  'packages/cli/src/ui/themes/theme.ts',
  'packages/cli/src/ui/themes/theme-manager.ts',

  // CLI - Utils
  'packages/cli/src/utils/version.ts',
  'packages/cli/src/utils/startupWarnings.ts',
  'packages/cli/src/utils/readStdin.ts',
  'packages/cli/src/utils/package.ts',
  'packages/cli/src/utils/sandbox.ts',
  'packages/cli/src/utils/cleanup.ts',
  'packages/cli/src/utils/debugLogger.ts',

  // CLI - UI Utils
  'packages/cli/src/ui/utils/textUtils.ts',
  'packages/cli/src/ui/utils/markdownUtilities.ts',
  'packages/cli/src/ui/utils/formatters.ts',
  'packages/cli/src/ui/utils/i18n.ts',
  'packages/cli/src/ui/utils/commandUtils.ts',
  'packages/cli/src/ui/utils/MarkdownDisplay.tsx',
  'packages/cli/src/ui/utils/CodeColorizer.tsx',

  // Core - Framework
  'packages/core/src/index.ts',
  'packages/core/src/config/config.ts',
  'packages/core/src/core/logger.ts',
  'packages/core/src/core/tokenLimits.ts',
  'packages/core/src/core/prompts.ts',
  'packages/core/src/core/client.ts',
  'packages/core/src/core/contentGenerator.ts',

  // Core - Tools (modified from original)
  'packages/core/src/tools/tools.ts',
  'packages/core/src/tools/edit.ts',
  'packages/core/src/tools/read-file.ts',
  'packages/core/src/tools/write-file.ts',
  'packages/core/src/tools/shell.ts',
  'packages/core/src/tools/ls.ts',
  'packages/core/src/tools/grep.ts',
  'packages/core/src/tools/glob.ts',
  'packages/core/src/tools/tool-registry.ts',

  // Core - Utils
  'packages/core/src/utils/paths.ts',
  'packages/core/src/utils/errors.ts',
  'packages/core/src/utils/fileUtils.ts',
  'packages/core/src/utils/editor.ts',
  'packages/core/src/utils/gitUtils.ts',
  'packages/core/src/utils/session.ts',
  'packages/core/src/utils/user_id.ts',
  'packages/core/src/utils/retry.ts',

  // Core - Telemetry
  'packages/core/src/telemetry/index.ts',
  'packages/core/src/telemetry/sdk.ts',
  'packages/core/src/telemetry/types.ts',
  'packages/core/src/telemetry/constants.ts',
  'packages/core/src/telemetry/loggers.ts',
  'packages/core/src/telemetry/metrics.ts',
];

const SINGLE_COPYRIGHT_FILES = [
  // CLI - Multi-Provider
  'packages/cli/src/services/providerSetupService.ts',
  'packages/cli/src/services/modelManager.ts',
  'packages/cli/src/commands/setupLocalAI.ts',

  // CLI - Enfiy Components
  'packages/cli/src/ui/components/EnfiyAsciiArt.tsx',
  'packages/cli/src/ui/components/EnfiyRespondingSpinner.tsx',
  'packages/cli/src/ui/components/ModelSelectionDialog.tsx',
  'packages/cli/src/ui/components/APISettingsDialog.tsx',
  'packages/cli/src/ui/components/CloudAISetupDialog.tsx',
  'packages/cli/src/ui/components/LocalAISetupDialog.tsx',
  'packages/cli/src/ui/components/ProviderSelectionDialog.tsx',

  // CLI - Multi-Provider Utils
  'packages/cli/src/utils/ollamaSetup.ts',
  'packages/cli/src/utils/huggingfaceSetup.ts',
  'packages/cli/src/utils/modelUtils.ts',
  'packages/cli/src/utils/secureStorage.ts',

  // CLI - Advanced Hooks
  'packages/cli/src/ui/hooks/useModelAutoSwitching.ts',
  'packages/cli/src/ui/hooks/useAuthCommand.ts',
  'packages/cli/src/ui/hooks/usePrivacySettings.ts',
  'packages/cli/src/ui/hooks/useOptimizedBundle.ts',

  // Core - Providers
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

  // Core - Multi-Provider System
  'packages/core/src/core/multiProviderClient.ts',
  'packages/core/src/core/enfiyChat.ts',
  'packages/core/src/config/models.ts',

  // Core - Enhanced Tools
  'packages/core/src/tools/web-search.ts',
  'packages/core/src/tools/web-fetch.ts',
  'packages/core/src/tools/mcp-tool.ts',
  'packages/core/src/tools/mcp-client.ts',
  'packages/core/src/tools/memoryTool.ts',
  'packages/core/src/tools/read-many-files.ts',
];

function updateLicenseHeader(filePath, newHeader) {
  try {
    const fullPath = path.resolve(projectRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Remove existing license header (everything before the first import/export/etc)
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
        // Skip empty lines after license
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
  console.log('🚀 Starting license header updates...\n');

  let dualUpdated = 0;
  let singleUpdated = 0;
  let errors = 0;

  console.log(
    '📝 Updating files with dual copyright (Google LLC + Hayate Esaki)...',
  );
  for (const filePath of DUAL_COPYRIGHT_FILES) {
    if (updateLicenseHeader(filePath, DUAL_COPYRIGHT)) {
      console.log(`✅ ${filePath}`);
      dualUpdated++;
    } else {
      errors++;
    }
  }

  console.log(
    '\n📝 Updating files with single copyright (Hayate Esaki only)...',
  );
  for (const filePath of SINGLE_COPYRIGHT_FILES) {
    if (updateLicenseHeader(filePath, SINGLE_COPYRIGHT)) {
      console.log(`✅ ${filePath}`);
      singleUpdated++;
    } else {
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Dual copyright files updated: ${dualUpdated}`);
  console.log(`   Single copyright files updated: ${singleUpdated}`);
  console.log(`   Total files updated: ${dualUpdated + singleUpdated}`);
  console.log(`   Errors: ${errors}`);
  console.log('\n✨ License header update complete!');
}

main();
