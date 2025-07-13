/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { type PartListUnion } from '@google/genai';
import open from 'open';
import process from 'node:process';
import { UseHistoryManagerReturn } from './useHistoryManager.js';
import { useStateAndRef } from './useStateAndRef.js';
import {
  Config,
  GitService,
  Logger,
  MCPDiscoveryState,
  MCPServerStatus,
  getMCPDiscoveryState,
  getMCPServerStatus,
} from '@enfiy/core';
import { useSessionStats } from '../contexts/SessionContext.js';
import {
  Message,
  MessageType,
  HistoryItemWithoutId,
  HistoryItem,
} from '../types.js';
import { promises as fs } from 'fs';
import path from 'path';
import { createShowMemoryAction } from './useShowMemoryCommand.js';
import { GIT_COMMIT_INFO } from '../../generated/git-commit.js';
import { formatDuration, formatMemoryUsage } from '../utils/formatters.js';
import { getCliVersion } from '../../utils/version.js';
import { LoadedSettings } from '../../config/settings.js';
import { ModelManager } from '../../services/modelManager.js';
import { debugLogger } from '../../utils/debugLogger.js';

export interface SlashCommandActionReturn {
  shouldScheduleTool?: boolean;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  message?: string; // For simple messages or errors
}

export interface SlashCommand {
  name: string;
  altName?: string;
  description?: string;
  completion?: () => Promise<string[]>;
  action: (
    mainCommand: string,
    subCommand?: string,
    args?: string,
  ) =>
    | void
    | SlashCommandActionReturn
    | Promise<void | SlashCommandActionReturn>; // Action can now return this object
}

/**
 * Hook to define and process slash commands (e.g., /help, /clear).
 */
export const useSlashCommandProcessor = (
  config: Config | null,
  settings: LoadedSettings,
  _history: HistoryItem[],
  addItem: UseHistoryManagerReturn['addItem'],
  clearItems: UseHistoryManagerReturn['clearItems'],
  loadHistory: UseHistoryManagerReturn['loadHistory'],
  refreshStatic: () => void,
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>,
  onDebugMessage: (message: string) => void,
  openThemeDialog: () => void,
  openAuthDialog: () => void,
  openEditorDialog: () => void,
  performMemoryRefresh: () => Promise<void>,
  toggleCorgiMode: () => void,
  showToolDescriptions: boolean = false,
  setQuittingMessages: (message: HistoryItem[]) => void,
  openPrivacyNotice: () => void,
  openProviderSelection: () => void,
) => {
  const session = useSessionStats();
  const gitService = useMemo(() => {
    if (!config?.getProjectRoot()) {
      return;
    }
    return new GitService(config.getProjectRoot());
  }, [config]);

  const pendingHistoryItems: HistoryItemWithoutId[] = [];
  const [pendingCompressionItemRef, setPendingCompressionItem] =
    useStateAndRef<HistoryItemWithoutId | null>(null);
  if (pendingCompressionItemRef.current != null) {
    pendingHistoryItems.push(pendingCompressionItemRef.current);
  }

  const addMessage = useCallback(
    (message: Message) => {
      // Convert Message to HistoryItemWithoutId
      let historyItemContent: HistoryItemWithoutId;
      if (message.type === MessageType.ABOUT) {
        historyItemContent = {
          type: 'about',
          cliVersion: message.cliVersion,
          osVersion: message.osVersion,
          sandboxEnv: message.sandboxEnv,
          modelVersion: message.modelVersion,
          selectedAuthType: message.selectedAuthType,
          gcpProject: message.gcpProject,
        };
      } else if (message.type === MessageType.STATS) {
        historyItemContent = {
          type: 'stats',
          stats: message.stats,
          lastTurnStats: message.lastTurnStats,
          duration: message.duration,
        };
      } else if (message.type === MessageType.QUIT) {
        historyItemContent = {
          type: 'quit',
          stats: message.stats,
          duration: message.duration,
        };
      } else if (message.type === MessageType.COMPRESSION) {
        historyItemContent = {
          type: 'compression',
          compression: message.compression,
        };
      } else {
        historyItemContent = {
          type: message.type as
            | MessageType.INFO
            | MessageType.ERROR
            | MessageType.USER,
          text: message.content,
        };
      }
      addItem(historyItemContent, message.timestamp.getTime());
    },
    [addItem],
  );

  const showMemoryAction = useCallback(async () => {
    const actionFn = createShowMemoryAction(config, settings, addMessage);
    await actionFn();
  }, [config, settings, addMessage]);

  const addMemoryAction = useCallback(
    (
      _mainCommand: string,
      _subCommand?: string,
      args?: string,
    ): SlashCommandActionReturn | void => {
      if (!args || args.trim() === '') {
        addMessage({
          type: MessageType.ERROR,
          content: 'Usage: /memory add <text to remember>',
          timestamp: new Date(),
        });
        return;
      }
      // UI feedback for attempting to schedule
      addMessage({
        type: MessageType.INFO,
        content: `Attempting to save to memory: "${args.trim()}"`,
        timestamp: new Date(),
      });
      // Return info for scheduling the tool call
      return {
        shouldScheduleTool: true,
        toolName: 'save_memory',
        toolArgs: { fact: args.trim() },
      };
    },
    [addMessage],
  );

  const savedChatTags = useCallback(async () => {
    const geminiDir = config?.getProjectTempDir();
    if (!geminiDir) {
      return [];
    }
    try {
      const files = await fs.readdir(geminiDir);
      return files
        .filter(
          (file) => file.startsWith('checkpoint-') && file.endsWith('.json'),
        )
        .map((file) => file.replace('checkpoint-', '').replace('.json', ''));
    } catch (_err) {
      return [];
    }
  }, [config]);

  const slashCommands: SlashCommand[] = useMemo(() => {
    const commands: SlashCommand[] = [
      {
        name: 'help',
        altName: '?',
        description: 'for help on enfiy-cli',
        action: (_mainCommand, _subCommand, _args) => {
          onDebugMessage('Opening help.');
          setShowHelp(true);
        },
      },
      {
        name: 'debug',
        description: 'show debug information and logs',
        action: (_mainCommand, subCommand, _args) => {
          let debugInfo = '';
          
          if (subCommand === 'clear') {
            debugLogger.clear();
            debugInfo = 'Debug logs cleared.';
          } else if (subCommand === 'export') {
            const logs = debugLogger.exportLogs();
            debugInfo = `Debug logs exported:\n\`\`\`json\n${logs}\n\`\`\``;
          } else if (subCommand && ['api-validation', 'ui-interaction', 'validation-flow'].includes(subCommand)) {
            const logs = debugLogger.getLogs(subCommand);
            debugInfo = `Debug logs for category "${subCommand}":\n\n${logs.map(log => 
              `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${log.data ? '\nData: ' + JSON.stringify(log.data, null, 2) : ''}`
            ).join('\n\n')}`;
          } else {
            const recentLogs = debugLogger.getRecentLogs(20);
            debugInfo = `Recent debug logs (last 20):\n\n${recentLogs.map(log => 
              `[${log.timestamp}] [${log.category}] [${log.level.toUpperCase()}] ${log.message}${log.data ? '\nData: ' + JSON.stringify(log.data, null, 2) : ''}`
            ).join('\n\n')}`;
            
            debugInfo += '\n\nUsage:\n- `/debug` - Show recent logs\n- `/debug api-validation` - Show API validation logs\n- `/debug ui-interaction` - Show UI interaction logs\n- `/debug validation-flow` - Show validation flow logs\n- `/debug clear` - Clear all logs\n- `/debug export` - Export all logs as JSON';
          }

          addMessage({
            type: MessageType.INFO,
            content: debugInfo,
            timestamp: new Date(),
          });
        },
      },
      {
        name: 'docs',
        description: 'open full Enfiy Code documentation in your browser',
        action: async (_mainCommand, _subCommand, _args) => {
          const docsUrl = 'https://goo.gle/enfiy-cli-docs';
          if (process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec') {
            addMessage({
              type: MessageType.INFO,
              content: `Please open the following URL in your browser to view the documentation:\n${docsUrl}`,
              timestamp: new Date(),
            });
          } else {
            addMessage({
              type: MessageType.INFO,
              content: `Opening documentation in your browser: ${docsUrl}`,
              timestamp: new Date(),
            });
            await open(docsUrl);
          }
        },
      },
      {
        name: 'clear',
        description: 'clear the screen and conversation history',
        action: async (_mainCommand, _subCommand, _args) => {
          onDebugMessage('Clearing terminal and resetting chat.');
          clearItems();
          await config?.getEnfiyClient()?.resetChat();
          console.clear();
          refreshStatic();
        },
      },
      {
        name: 'theme',
        description: 'change the theme',
        action: (_mainCommand, _subCommand, _args) => {
          openThemeDialog();
        },
      },
      {
        name: 'auth',
        description: 'change the auth method',
        action: (_mainCommand, _subCommand, _args) => {
          openAuthDialog();
        },
      },
      {
        name: 'editor',
        description: 'set external editor preference',
        action: (_mainCommand, _subCommand, _args) => {
          openEditorDialog();
        },
      },
      {
        name: 'privacy',
        description: 'display the privacy notice',
        action: (_mainCommand, _subCommand, _args) => {
          openPrivacyNotice();
        },
      },
      {
        name: 'stats',
        altName: 'usage',
        description: 'check session stats',
        action: (_mainCommand, _subCommand, _args) => {
          const now = new Date();
          const { sessionStartTime, cumulative, currentTurn } = session.stats;
          const wallDuration = now.getTime() - sessionStartTime.getTime();

          addMessage({
            type: MessageType.STATS,
            stats: cumulative,
            lastTurnStats: currentTurn,
            duration: formatDuration(wallDuration),
            timestamp: new Date(),
          });
        },
      },
      {
        name: 'mcp',
        description: 'list configured MCP servers and tools',
        action: async (_mainCommand, _subCommand, _args) => {
          // Check if the _subCommand includes a specific flag to control description visibility
          let useShowDescriptions = showToolDescriptions;
          if (_subCommand === 'desc' || _subCommand === 'descriptions') {
            useShowDescriptions = true;
          } else if (
            _subCommand === 'nodesc' ||
            _subCommand === 'nodescriptions'
          ) {
            useShowDescriptions = false;
          } else if (_args === 'desc' || _args === 'descriptions') {
            useShowDescriptions = true;
          } else if (_args === 'nodesc' || _args === 'nodescriptions') {
            useShowDescriptions = false;
          }
          // Check if the _subCommand includes a specific flag to show detailed tool schema
          let useShowSchema = false;
          if (_subCommand === 'schema' || _args === 'schema') {
            useShowSchema = true;
          }

          const toolRegistry = await config?.getToolRegistry();
          if (!toolRegistry) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Could not retrieve tool registry.',
              timestamp: new Date(),
            });
            return;
          }

          const mcpServers = config?.getMcpServers() || {};
          const serverNames = Object.keys(mcpServers);

          if (serverNames.length === 0) {
            const docsUrl = 'https://goo.gle/enfiy-cli-docs-mcp';
            if (process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec') {
              addMessage({
                type: MessageType.INFO,
                content: `No MCP servers configured. Please open the following URL in your browser to view documentation:\n${docsUrl}`,
                timestamp: new Date(),
              });
            } else {
              addMessage({
                type: MessageType.INFO,
                content: `No MCP servers configured. Opening documentation in your browser: ${docsUrl}`,
                timestamp: new Date(),
              });
              await open(docsUrl);
            }
            return;
          }

          // Check if any servers are still connecting
          const connectingServers = serverNames.filter(
            (name) => getMCPServerStatus(name) === MCPServerStatus.CONNECTING,
          );
          const discoveryState = getMCPDiscoveryState();

          let message = '';

          // Add overall discovery status message if needed
          if (
            discoveryState === MCPDiscoveryState.IN_PROGRESS ||
            connectingServers.length > 0
          ) {
            message += `\u001b[33m⏳ MCP servers are starting up (${connectingServers.length} initializing)...\u001b[0m\n`;
            message += `\u001b[90mNote: First startup may take longer. Tool availability will update automatically.\u001b[0m\n\n`;
          }

          message += 'Configured MCP servers:\n\n';

          for (const serverName of serverNames) {
            const serverTools = toolRegistry.getToolsByServer(serverName);
            const status = getMCPServerStatus(serverName);

            // Add status indicator with descriptive text
            let statusIndicator = '';
            let statusText = '';
            switch (status) {
              case MCPServerStatus.CONNECTED:
                statusIndicator = '🟢';
                statusText = 'Ready';
                break;
              case MCPServerStatus.CONNECTING:
                statusIndicator = '🔄';
                statusText = 'Starting... (first startup may take longer)';
                break;
              case MCPServerStatus.DISCONNECTED:
              default:
                statusIndicator = '🔴';
                statusText = 'Disconnected';
                break;
            }

            // Get server description if available
            const server = mcpServers[serverName];

            // Format server header with bold formatting and status
            message += `${statusIndicator} \u001b[1m${serverName}\u001b[0m - ${statusText}`;

            // Add tool count with conditional messaging
            if (status === MCPServerStatus.CONNECTED) {
              message += ` (${serverTools.length} tools)`;
            } else if (status === MCPServerStatus.CONNECTING) {
              message += ` (tools will appear when ready)`;
            } else {
              message += ` (${serverTools.length} tools cached)`;
            }

            // Add server description with proper handling of multi-line descriptions
            if ((useShowDescriptions || useShowSchema) && server?.description) {
              const greenColor = '\u001b[32m';
              const resetColor = '\u001b[0m';

              const descLines = server.description.trim().split('\n');
              if (descLines) {
                message += ':\n';
                for (let i = 0; i < descLines.length; i++) {
                  message += `    ${greenColor}${descLines[i]}${resetColor}\n`;
                }
              } else {
                message += '\n';
              }
            } else {
              message += '\n';
            }

            // Reset formatting after server entry
            message += '\u001b[0m';

            if (serverTools.length > 0) {
              serverTools.forEach((tool) => {
                if (
                  (useShowDescriptions || useShowSchema) &&
                  tool.description
                ) {
                  // Format tool name in cyan using simple ANSI cyan color
                  message += `  - \u001b[36m${tool.name}\u001b[0m`;

                  // Apply green color to the description text
                  const greenColor = '\u001b[32m';
                  const resetColor = '\u001b[0m';

                  // Handle multi-line descriptions by properly indenting and preserving formatting
                  const descLines = tool.description.trim().split('\n');
                  if (descLines) {
                    message += ':\n';
                    for (let i = 0; i < descLines.length; i++) {
                      message += `      ${greenColor}${descLines[i]}${resetColor}\n`;
                    }
                  } else {
                    message += '\n';
                  }
                  // Reset is handled inline with each line now
                } else {
                  // Use cyan color for the tool name even when not showing descriptions
                  message += `  - \u001b[36m${tool.name}\u001b[0m\n`;
                }
                if (useShowSchema) {
                  // Prefix the parameters in cyan
                  message += `    \u001b[36mParameters:\u001b[0m\n`;
                  // Apply green color to the parameter text
                  const greenColor = '\u001b[32m';
                  const resetColor = '\u001b[0m';

                  const paramsLines = JSON.stringify(
                    tool.schema.parameters,
                    null,
                    2,
                  )
                    .trim()
                    .split('\n');
                  if (paramsLines) {
                    for (let i = 0; i < paramsLines.length; i++) {
                      message += `      ${greenColor}${paramsLines[i]}${resetColor}\n`;
                    }
                  }
                }
              });
            } else {
              message += '  No tools available\n';
            }
            message += '\n';
          }

          // Make sure to reset any ANSI formatting at the end to prevent it from affecting the terminal
          message += '\u001b[0m';

          addMessage({
            type: MessageType.INFO,
            content: message,
            timestamp: new Date(),
          });
        },
      },
      {
        name: 'memory',
        description:
          'manage memory. Usage: /memory <show|refresh|add> [text for add]',
        action: (mainCommand, subCommand, args) => {
          switch (subCommand) {
            case 'show':
              showMemoryAction();
              return;
            case 'refresh':
              performMemoryRefresh();
              return;
            case 'add':
              return addMemoryAction(mainCommand, subCommand, args); // Return the object
            case undefined:
              addMessage({
                type: MessageType.ERROR,
                content:
                  'Missing command\nUsage: /memory <show|refresh|add> [text for add]',
                timestamp: new Date(),
              });
              return;
            default:
              addMessage({
                type: MessageType.ERROR,
                content: `Unknown /memory command: ${subCommand}. Available: show, refresh, add`,
                timestamp: new Date(),
              });
              return;
          }
        },
      },
      {
        name: 'tools',
        description: 'list available Enfiy Code tools',
        action: async (_mainCommand, _subCommand, _args) => {
          // Check if the _subCommand includes a specific flag to control description visibility
          let useShowDescriptions = showToolDescriptions;
          if (_subCommand === 'desc' || _subCommand === 'descriptions') {
            useShowDescriptions = true;
          } else if (
            _subCommand === 'nodesc' ||
            _subCommand === 'nodescriptions'
          ) {
            useShowDescriptions = false;
          } else if (_args === 'desc' || _args === 'descriptions') {
            useShowDescriptions = true;
          } else if (_args === 'nodesc' || _args === 'nodescriptions') {
            useShowDescriptions = false;
          }

          const toolRegistry = await config?.getToolRegistry();
          const tools = toolRegistry?.getAllTools();
          if (!tools) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Could not retrieve tools.',
              timestamp: new Date(),
            });
            return;
          }

          // Filter out MCP tools by checking if they have a serverName property
          const geminiTools = tools.filter((tool) => !('serverName' in tool));

          let message = 'Available Enfiy Code tools:\n\n';

          if (geminiTools.length > 0) {
            geminiTools.forEach((tool) => {
              if (useShowDescriptions && tool.description) {
                // Format tool name in cyan using simple ANSI cyan color
                message += `  - \u001b[36m${tool.displayName} (${tool.name})\u001b[0m:\n`;

                // Apply green color to the description text
                const greenColor = '\u001b[32m';
                const resetColor = '\u001b[0m';

                // Handle multi-line descriptions by properly indenting and preserving formatting
                const descLines = tool.description.trim().split('\n');

                // If there are multiple lines, add proper indentation for each line
                if (descLines) {
                  for (let i = 0; i < descLines.length; i++) {
                    message += `      ${greenColor}${descLines[i]}${resetColor}\n`;
                  }
                }
              } else {
                // Use cyan color for the tool name even when not showing descriptions
                message += `  - \u001b[36m${tool.displayName}\u001b[0m\n`;
              }
            });
          } else {
            message += '  No tools available\n';
          }
          message += '\n';

          // Make sure to reset any ANSI formatting at the end to prevent it from affecting the terminal
          message += '\u001b[0m';

          addMessage({
            type: MessageType.INFO,
            content: message,
            timestamp: new Date(),
          });
        },
      },
      {
        name: 'corgi',
        action: (_mainCommand, _subCommand, _args) => {
          toggleCorgiMode();
        },
      },
      {
        name: 'about',
        description: 'show version info',
        action: async (_mainCommand, _subCommand, _args) => {
          const osVersion = process.platform;
          let sandboxEnv = 'Private work room (recommended)';
          if (process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec') {
            sandboxEnv = `Private room (${process.env.SANDBOX})`;
          } else if (process.env.SANDBOX === 'sandbox-exec') {
            sandboxEnv = `MacOS Seatbelt (${
              process.env.SEATBELT_PROFILE || 'unknown'
            })`;
          }
          const modelVersion = config?.getModel() || 'Unknown';
          const cliVersion = await getCliVersion();
          const selectedAuthType = settings.merged.selectedAuthType || '';
          const gcpProject = process.env.GOOGLE_CLOUD_PROJECT || '';
          addMessage({
            type: MessageType.ABOUT,
            timestamp: new Date(),
            cliVersion,
            osVersion,
            sandboxEnv,
            modelVersion,
            selectedAuthType,
            gcpProject,
          });
        },
      },
      {
        name: 'bug',
        description: 'submit a bug report',
        action: async (_mainCommand, _subCommand, args) => {
          let bugDescription = _subCommand || '';
          if (args) {
            bugDescription += ` ${args}`;
          }
          bugDescription = bugDescription.trim();

          const osVersion = `${process.platform} ${process.version}`;
          let sandboxEnv = 'Private work room (recommended)';
          if (process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec') {
            sandboxEnv = `Private room (${process.env.SANDBOX.replace(/^gemini-(?:code-)?/, '')})`;
          } else if (process.env.SANDBOX === 'sandbox-exec') {
            sandboxEnv = `MacOS Seatbelt (${
              process.env.SEATBELT_PROFILE || 'unknown'
            })`;
          }
          const modelVersion = config?.getModel() || 'Unknown';
          const cliVersion = await getCliVersion();
          const memoryUsage = formatMemoryUsage(process.memoryUsage().rss);

          const info = `
*   **CLI Version:** ${cliVersion}
*   **Git Commit:** ${GIT_COMMIT_INFO}
*   **Operating System:** ${osVersion}
*   **Work Environment:** ${sandboxEnv}
*   **Model Version:** ${modelVersion}
*   **Memory Usage:** ${memoryUsage}
`;

          let bugReportUrl =
            'https://github.com/enfiy/enfiy-code/issues/new?template=bug_report.yml&title={title}&info={info}';
          const bugCommand = config?.getBugCommand();
          if (bugCommand?.urlTemplate) {
            bugReportUrl = bugCommand.urlTemplate;
          }
          bugReportUrl = bugReportUrl
            .replace('{title}', encodeURIComponent(bugDescription))
            .replace('{info}', encodeURIComponent(info));

          addMessage({
            type: MessageType.INFO,
            content: `To submit your bug report, please open the following URL in your browser:\n${bugReportUrl}`,
            timestamp: new Date(),
          });
          (async () => {
            try {
              await open(bugReportUrl);
            } catch (_error) {
              const errorMessage =
                _error instanceof Error ? _error.message : String(_error);
              addMessage({
                type: MessageType.ERROR,
                content: `Could not open URL in browser: ${errorMessage}`,
                timestamp: new Date(),
              });
            }
          })();
        },
      },
      {
        name: 'chat',
        description:
          'Manage conversation history. Usage: /chat <list|save|resume> [tag]',
        action: async (_mainCommand, subCommand, args) => {
          const tag = (args || '').trim();
          const logger = new Logger(config?.getSessionId() || '');
          logger.initialize();
          const chat = await config?.getEnfiyClient()?.getChat();
          if (!chat) {
            addMessage({
              type: MessageType.ERROR,
              content: 'No chat client available for conversation status.',
              timestamp: new Date(),
            });
            return;
          }
          if (!subCommand) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Missing command\nUsage: /chat <list|save|resume> [tag]',
              timestamp: new Date(),
            });
            return;
          }
          switch (subCommand) {
            case 'save': {
              const history = chat.getHistory();
              if (history.length > 0) {
                await logger.saveCheckpoint(chat?.getHistory() || [], tag);
                addMessage({
                  type: MessageType.INFO,
                  content: `Conversation checkpoint saved${tag ? ' with tag: ' + tag : ''}.`,
                  timestamp: new Date(),
                });
              } else {
                addMessage({
                  type: MessageType.INFO,
                  content: 'No conversation found to save.',
                  timestamp: new Date(),
                });
              }
              return;
            }
            case 'resume':
            case 'restore':
            case 'load': {
              const conversation = await logger.loadCheckpoint(tag);
              if (conversation.length === 0) {
                addMessage({
                  type: MessageType.INFO,
                  content: `No saved checkpoint found${tag ? ' with tag: ' + tag : ''}.`,
                  timestamp: new Date(),
                });
                return;
              }

              clearItems();
              chat.clearHistory();
              const rolemap: { [key: string]: MessageType } = {
                user: MessageType.USER,
                model: MessageType.ENFIY,
              };
              let hasSystemPrompt = false;
              let i = 0;
              for (const item of conversation) {
                i += 1;

                // Add each item to history regardless of whether we display
                // it.
                chat.addHistory(item);

                const text =
                  item.parts
                    ?.filter((m) => !!m.text)
                    .map((m) => m.text)
                    .join('') || '';
                if (!text) {
                  // Parsing Part[] back to various non-text output not yet implemented.
                  continue;
                }
                if (i === 1 && text.match(/context for our chat/)) {
                  hasSystemPrompt = true;
                }
                if (i > 2 || !hasSystemPrompt) {
                  addItem(
                    {
                      type:
                        (item.role && rolemap[item.role]) || MessageType.ENFIY,
                      text,
                    } as HistoryItemWithoutId,
                    i,
                  );
                }
              }
              console.clear();
              refreshStatic();
              return;
            }
            case 'list':
              addMessage({
                type: MessageType.INFO,
                content:
                  'list of saved conversations: ' +
                  (await savedChatTags()).join(', '),
                timestamp: new Date(),
              });
              return;
            default:
              addMessage({
                type: MessageType.ERROR,
                content: `Unknown /chat command: ${subCommand}. Available: list, save, resume`,
                timestamp: new Date(),
              });
              return;
          }
        },
        completion: async () =>
          (await savedChatTags()).map((tag) => 'resume ' + tag),
      },
      {
        name: 'quit',
        altName: 'exit',
        description: 'exit the cli',
        action: async (mainCommand, _subCommand, _args) => {
          const now = new Date();
          const { sessionStartTime, cumulative } = session.stats;
          const wallDuration = now.getTime() - sessionStartTime.getTime();

          setQuittingMessages([
            {
              type: 'user',
              text: `/${mainCommand}`,
              id: now.getTime() - 1,
            },
            {
              type: 'quit',
              stats: cumulative,
              duration: formatDuration(wallDuration),
              id: now.getTime(),
            },
          ]);

          setTimeout(() => {
            process.exit(0);
          }, 100);
        },
      },
      {
        name: 'compress',
        altName: 'summarize',
        description: 'Compresses the context by replacing it with a summary.',
        action: async (_mainCommand, _subCommand, _args) => {
          if (pendingCompressionItemRef.current !== null) {
            addMessage({
              type: MessageType.ERROR,
              content:
                'Already compressing, wait for previous request to complete',
              timestamp: new Date(),
            });
            return;
          }
          setPendingCompressionItem({
            type: MessageType.COMPRESSION,
            compression: {
              isPending: true,
              originalTokenCount: null,
              newTokenCount: null,
            },
          });
          try {
            const compressed = await config!
              .getEnfiyClient()!
              .tryCompressChat(true);
            if (compressed) {
              addMessage({
                type: MessageType.COMPRESSION,
                compression: {
                  isPending: false,
                  originalTokenCount: compressed.originalTokenCount,
                  newTokenCount: compressed.newTokenCount,
                },
                timestamp: new Date(),
              });
            } else {
              addMessage({
                type: MessageType.ERROR,
                content: 'Failed to compress chat history.',
                timestamp: new Date(),
              });
            }
          } catch (e) {
            addMessage({
              type: MessageType.ERROR,
              content: `Failed to compress chat history: ${e instanceof Error ? e.message : String(e)}`,
              timestamp: new Date(),
            });
          }
          setPendingCompressionItem(null);
        },
      },
      {
        name: 'provider',
        altName: 'ai',
        description: 'select AI provider and model',
        action: (_mainCommand, _subCommand, _args) => {
          openProviderSelection();
        },
      },
      {
        name: 'model',
        description: 'manage model selection and usage limits. Usage: /model [list|switch|status|order|auto]',
        action: async (_mainCommand, subCommand, args) => {
          if (!config) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Configuration not available',
              timestamp: new Date(),
            });
            return;
          }

          const modelManager = new ModelManager(config);
          const currentModel = config.getModel() || 'Unknown';
          
          switch (subCommand) {
            case 'list': {
              // Display available models with usage limits and status
              const availableModels = await modelManager.getAvailableModels();
              let message = 'Available Models:\n\n';
              
              for (const model of availableModels) {
                const usage = await modelManager.getModelUsage(model.name);
                const isActive = model.name === currentModel;
                const statusIcon = isActive ? '🔵' : (model.isAvailable ? '⚪' : '🔴');
                const usagePercent = usage.limit > 0 ? Math.round((usage.used / usage.limit) * 100) : 0;
                
                message += `${statusIcon} \u001b[1m${model.name}\u001b[0m`;
                if (isActive) message += ' (current)';
                if (!model.isAvailable) message += ' (unavailable)';
                message += '\n';
                
                message += `    \u001b[32m${model.description}\u001b[0m\n`;
                message += `    Provider: \u001b[36m${model.provider}\u001b[0m | Cost: \u001b[33m${model.costTier}\u001b[0m\n`;
                
                if (usage.limit > 0) {
                  message += `    Usage: ${usage.used}/${usage.limit} (${usagePercent}%)`;
                  if (usagePercent >= 90) {
                    message += ' \u001b[31m⚠️ Nearly exhausted\u001b[0m';
                  } else if (usagePercent >= 70) {
                    message += ' \u001b[33m⚠️ High usage\u001b[0m';
                  }
                } else {
                  message += '    Usage: Unlimited';
                }
                message += '\n\n';
              }
              
              addMessage({
                type: MessageType.INFO,
                content: message,
                timestamp: new Date(),
              });
              return;
            }
              
            case 'switch': {
              if (!args?.trim()) {
                addMessage({
                  type: MessageType.ERROR,
                  content: 'Usage: /model switch <model_name>',
                  timestamp: new Date(),
                });
                return;
              }
              
              const targetModel = args.trim();
              const switched = await modelManager.switchToModel(targetModel);
              
              if (switched) {
                addMessage({
                  type: MessageType.INFO,
                  content: `✅ Model switched to: \u001b[1m${targetModel}\u001b[0m`,
                  timestamp: new Date(),
                });
              } else {
                addMessage({
                  type: MessageType.ERROR,
                  content: `❌ Failed to switch to model: ${targetModel}`,
                  timestamp: new Date(),
                });
              }
              return;
            }
              
            case 'status': {
              const usage = await modelManager.getModelUsage(currentModel);
              const usagePercent = usage.limit > 0 ? Math.round((usage.used / usage.limit) * 100) : 0;
              
              let statusMessage = `Current Model: \u001b[1m${currentModel}\u001b[0m\n\n`;
              
              if (usage.limit > 0) {
                statusMessage += `Usage: ${usage.used}/${usage.limit} requests (${usagePercent}%)\n`;
                
                if (usage.resetTime) {
                  statusMessage += `Reset time: ${usage.resetTime.toLocaleString()}\n`;
                }
                
                if (usagePercent >= 90) {
                  statusMessage += '\u001b[31m⚠️ Model nearly exhausted - consider switching\u001b[0m\n';
                } else if (usagePercent >= 70) {
                  statusMessage += '\u001b[33m⚠️ High usage - monitor carefully\u001b[0m\n';
                } else {
                  statusMessage += '\u001b[32m✅ Usage within normal limits\u001b[0m\n';
                }
              } else {
                statusMessage += 'Usage: Unlimited\n';
              }
              
              // Show fallback suggestion if needed
              const fallbackModel = await modelManager.shouldSwitchModel(currentModel);
              if (fallbackModel) {
                statusMessage += `\n\u001b[33m💡 Suggestion: Consider switching to ${fallbackModel}\u001b[0m\n`;
              }
              
              addMessage({
                type: MessageType.INFO,
                content: statusMessage,
                timestamp: new Date(),
              });
              return;
            }
              
            case 'order': {
              const fallbackConfig = modelManager.getFallbackOrder();
              if (!fallbackConfig) {
                addMessage({
                  type: MessageType.INFO,
                  content: 'No fallback order configured',
                  timestamp: new Date(),
                });
                return;
              }
              
              let orderMessage = 'Model Fallback Order:\n\n';
              orderMessage += `Primary: \u001b[1m${fallbackConfig.primary}\u001b[0m\n\n`;
              
              if (fallbackConfig.fallbacks.length > 0) {
                orderMessage += 'Fallbacks:\n';
                fallbackConfig.fallbacks
                  .sort((a, b) => a.priority - b.priority)
                  .forEach((fallback, index) => {
                    orderMessage += `${index + 1}. \u001b[36m${fallback.model}\u001b[0m`;
                    orderMessage += ` (${fallback.condition})\n`;
                  });
              }
              
              orderMessage += '\nUse: /model switch <model_name> to change primary model';
              
              addMessage({
                type: MessageType.INFO,
                content: orderMessage,
                timestamp: new Date(),
              });
              return;
            }

            case 'auto': {
              const autoArgs = args?.trim();
              if (autoArgs === 'on' || autoArgs === 'enable') {
                // Enable auto-switching (this would be saved to settings)
                addMessage({
                  type: MessageType.INFO,
                  content: '✅ Automatic model switching enabled. Models will switch automatically on errors or limits.',
                  timestamp: new Date(),
                });
              } else if (autoArgs === 'off' || autoArgs === 'disable') {
                addMessage({
                  type: MessageType.INFO,
                  content: '❌ Automatic model switching disabled.',
                  timestamp: new Date(),
                });
              } else {
                addMessage({
                  type: MessageType.INFO,
                  content: 'Automatic Model Switching Status:\n\n✅ Enabled\n\nFallback triggers:\n- Rate limits (429 errors)\n- Server errors (5xx)\n- Usage limit reached (>95%)\n\nUse: /model auto [on|off] to toggle',
                  timestamp: new Date(),
                });
              }
              return;
            }
              
            case undefined: {
              // Show current model and quick status
              const quickUsage = await modelManager.getModelUsage(currentModel);
              const quickPercent = quickUsage.limit > 0 ? Math.round((quickUsage.used / quickUsage.limit) * 100) : 0;
              
              let quickMessage = `Current Model: \u001b[1m${currentModel}\u001b[0m\n`;
              
              if (quickUsage.limit > 0) {
                quickMessage += `Usage: ${quickUsage.used}/${quickUsage.limit} (${quickPercent}%)`;
                if (quickPercent >= 90) {
                  quickMessage += ' \u001b[31m⚠️\u001b[0m';
                } else if (quickPercent >= 70) {
                  quickMessage += ' \u001b[33m⚠️\u001b[0m';
                }
              } else {
                quickMessage += 'Usage: Unlimited';
              }
              
              quickMessage += '\n\nCommands: list, switch <name>, status, order, auto [on|off]';
              
              addMessage({
                type: MessageType.INFO,
                content: quickMessage,
                timestamp: new Date(),
              });
              return;
            }
              
            default:
              addMessage({
                type: MessageType.ERROR,
                content: `Unknown /model command: ${subCommand}. Available: list, switch, status, order, auto`,
                timestamp: new Date(),
              });
              return;
          }
        },
      },
      {
        name: 'run',
        description: 'run project scripts. Usage: /run [script_name]',
        action: async (_mainCommand, _subCommand, args) => {
          const script = args?.trim();
          
          // Read package.json to get available scripts
          const fs = await import('fs/promises');
          const path = await import('path');
          
          try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            const scripts = packageJson.scripts || {};
            
            if (!script) {
              // List available scripts
              const scriptNames = Object.keys(scripts);
              if (scriptNames.length === 0) {
                addMessage({
                  type: MessageType.INFO,
                  content: 'No scripts found in package.json',
                  timestamp: new Date(),
                });
                return;
              }
              
              let message = 'Available scripts:\n\n';
              for (const [name, command] of Object.entries(scripts)) {
                message += `\u001b[36m${name}\u001b[0m: \u001b[32m${command}\u001b[0m\n`;
              }
              message += '\nUsage: /run <script_name>';
              
              addMessage({
                type: MessageType.INFO,
                content: message,
                timestamp: new Date(),
              });
              return;
            }
            
            if (!scripts[script]) {
              addMessage({
                type: MessageType.ERROR,
                content: `Script not found: ${script}\nAvailable scripts: ${Object.keys(scripts).join(', ')}`,
                timestamp: new Date(),
              });
              return;
            }
            
            addMessage({
              type: MessageType.INFO,
              content: `Running script: ${script}`,
              timestamp: new Date(),
            });
            
            // Return tool schedule for shell execution
            return {
              shouldScheduleTool: true,
              toolName: 'bash',
              toolArgs: { command: `npm run ${script}` },
            };
            
          } catch (_error) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Could not read package.json. Make sure you are in a Node.js project.',
              timestamp: new Date(),
            });
          }
        },
      },
      {
        name: 'test',
        description: 'run tests. Usage: /test [pattern]',
        action: async (_mainCommand, _subCommand, args) => {
          const pattern = args?.trim();
          
          // Detect test framework
          const fs = await import('fs/promises');
          const path = await import('path');
          
          try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            const scripts = packageJson.scripts || {};
            const devDeps = packageJson.devDependencies || {};
            const deps = packageJson.dependencies || {};
            
            let testCommand = '';
            
            // Determine test command
            if (scripts.test && scripts.test !== 'echo "Error: no test specified" && exit 1') {
              testCommand = 'npm test';
            } else if (devDeps.jest || deps.jest) {
              testCommand = 'npx jest';
            } else if (devDeps.vitest || deps.vitest) {
              testCommand = 'npx vitest run';
            } else if (devDeps.mocha || deps.mocha) {
              testCommand = 'npx mocha';
            } else {
              addMessage({
                type: MessageType.ERROR,
                content: 'No test framework detected. Please set up tests in package.json scripts.',
                timestamp: new Date(),
              });
              return;
            }
            
            if (pattern) {
              testCommand += ` ${pattern}`;
            }
            
            addMessage({
              type: MessageType.INFO,
              content: `Running tests: ${testCommand}`,
              timestamp: new Date(),
            });
            
            return {
              shouldScheduleTool: true,
              toolName: 'bash',
              toolArgs: { command: testCommand },
            };
            
          } catch (_error) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Could not read package.json.',
              timestamp: new Date(),
            });
          }
        },
      },
      {
        name: 'build',
        description: 'build the project',
        action: async (_mainCommand, _subCommand, _args) => {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            const scripts = packageJson.scripts || {};
            
            let buildCommand = '';
            
            if (scripts.build) {
              buildCommand = 'npm run build';
            } else if (scripts.compile) {
              buildCommand = 'npm run compile';
            } else {
              addMessage({
                type: MessageType.ERROR,
                content: 'No build script found in package.json. Please add a "build" script.',
                timestamp: new Date(),
              });
              return;
            }
            
            addMessage({
              type: MessageType.INFO,
              content: `Building project: ${buildCommand}`,
              timestamp: new Date(),
            });
            
            return {
              shouldScheduleTool: true,
              toolName: 'bash',
              toolArgs: { command: buildCommand },
            };
            
          } catch (_error) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Could not read package.json.',
              timestamp: new Date(),
            });
          }
        },
      },
      {
        name: 'lint',
        description: 'run linting. Usage: /lint [--fix]',
        action: async (_mainCommand, _subCommand, args) => {
          const shouldFix = args?.includes('--fix');
          
          const fs = await import('fs/promises');
          const path = await import('path');
          
          try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            const scripts = packageJson.scripts || {};
            const devDeps = packageJson.devDependencies || {};
            
            let lintCommand = '';
            
            if (scripts.lint) {
              lintCommand = shouldFix && scripts['lint:fix'] ? 'npm run lint:fix' : 'npm run lint';
            } else if (devDeps.eslint) {
              lintCommand = shouldFix ? 'npx eslint . --fix' : 'npx eslint .';
            } else {
              addMessage({
                type: MessageType.ERROR,
                content: 'No linting configured. Please set up ESLint or add lint scripts to package.json.',
                timestamp: new Date(),
              });
              return;
            }
            
            addMessage({
              type: MessageType.INFO,
              content: `Running linter: ${lintCommand}`,
              timestamp: new Date(),
            });
            
            return {
              shouldScheduleTool: true,
              toolName: 'bash',
              toolArgs: { command: lintCommand },
            };
            
          } catch (_error) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Could not read package.json.',
              timestamp: new Date(),
            });
          }
        },
      },
      {
        name: 'status',
        description: 'show git status with enhanced formatting',
        action: async (_mainCommand, _subCommand, _args) => {
          addMessage({
            type: MessageType.INFO,
            content: 'Getting git status...',
            timestamp: new Date(),
          });
          
          return {
            shouldScheduleTool: true,
            toolName: 'bash',
            toolArgs: { 
              command: 'git status --porcelain=v1 && echo "---" && git branch --show-current && echo "---" && git log --oneline -5'
            },
          };
        },
      },
      {
        name: 'diff',
        description: 'show git diff. Usage: /diff [file]',
        action: async (_mainCommand, _subCommand, args) => {
          const file = args?.trim();
          let command = 'git diff --color=always';
          
          if (file) {
            command += ` ${file}`;
          }
          
          addMessage({
            type: MessageType.INFO,
            content: `Showing git diff${file ? ` for ${file}` : ''}...`,
            timestamp: new Date(),
          });
          
          return {
            shouldScheduleTool: true,
            toolName: 'bash',
            toolArgs: { command },
          };
        },
      },
      {
        name: 'commit',
        description: 'create git commit. Usage: /commit [message]',
        action: async (_mainCommand, _subCommand, args) => {
          const message = args?.trim();
          
          if (!message) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Please provide a commit message.\nUsage: /commit <message>',
              timestamp: new Date(),
            });
            return;
          }
          
          addMessage({
            type: MessageType.INFO,
            content: `Creating commit with message: "${message}"`,
            timestamp: new Date(),
          });
          
          return {
            shouldScheduleTool: true,
            toolName: 'bash',
            toolArgs: { command: `git add -A && git commit -m "${message}"` },
          };
        },
      },
      {
        name: 'push',
        description: 'push to GitHub with optional co-author. Usage: /push [branch] [--co-author]',
        action: async (_mainCommand, _subCommand, args) => {
          const argParts = args?.trim().split(' ') || [];
          const branch = argParts[0] || '';
          const coAuthor = argParts.includes('--co-author') || argParts.includes('--enfiy');
          
          let command = 'git push';
          
          if (branch) {
            command += ` origin ${branch}`;
          }
          
          if (coAuthor) {
            addMessage({
              type: MessageType.INFO,
              content: '🤖 Adding Enfiy AI as co-author to the last commit...',
              timestamp: new Date(),
            });
            
            const coAuthorCommand = `git commit --amend --no-edit --trailer "Co-authored-by: Enfiy AI <enfiy@github.com>"`;
            command = `${coAuthorCommand} && ${command}`;
          }
          
          addMessage({
            type: MessageType.INFO,
            content: `🚀 Pushing to GitHub${branch ? ` (branch: ${branch})` : ''}${coAuthor ? ' with Enfiy AI co-authorship' : ''}...`,
            timestamp: new Date(),
          });
          
          return {
            shouldScheduleTool: true,
            toolName: 'bash',
            toolArgs: { command },
          };
        },
      },
      {
        name: 'pr',
        description: 'create GitHub pull request. Usage: /pr [title] [--draft]',
        action: async (_mainCommand, _subCommand, args) => {
          const argParts = args?.trim().split(' ') || [];
          const isDraft = argParts.includes('--draft');
          const title = argParts.filter(part => !part.startsWith('--')).join(' ') || 'Pull Request';
          
          let command = 'gh pr create --title "' + title + '"';
          
          if (isDraft) {
            command += ' --draft';
          }
          
          command += ' --body "🤖 Created with Enfiy AI\\n\\nCo-authored-by: Enfiy AI <enfiy@github.com>"';
          
          addMessage({
            type: MessageType.INFO,
            content: `📝 Creating GitHub pull request: "${title}"${isDraft ? ' (draft)' : ''}...`,
            timestamp: new Date(),
          });
          
          return {
            shouldScheduleTool: true,
            toolName: 'bash',
            toolArgs: { command },
          };
        },
      },
      {
        name: 'explain',
        description: 'explain code in detail. Usage: /explain <file>',
        action: async (_mainCommand, _subCommand, args) => {
          if (!args?.trim()) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Please provide a file path.\nUsage: /explain <file>',
              timestamp: new Date(),
            });
            return;
          }
          
          const filePath = args.trim();
          
          addMessage({
            type: MessageType.INFO,
            content: `Analyzing and explaining: ${filePath}`,
            timestamp: new Date(),
          });
          
          // Return tool to read and analyze the file
          return {
            shouldScheduleTool: true,
            toolName: 'read_file',
            toolArgs: { path: filePath },
          };
        },
      },
      {
        name: 'optimize',
        description: 'suggest performance optimizations. Usage: /optimize <file>',
        action: async (_mainCommand, _subCommand, args) => {
          if (!args?.trim()) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Please provide a file path.\nUsage: /optimize <file>',
              timestamp: new Date(),
            });
            return;
          }
          
          const filePath = args.trim();
          
          addMessage({
            type: MessageType.INFO,
            content: `Analyzing performance optimization opportunities for: ${filePath}`,
            timestamp: new Date(),
          });
          
          return {
            shouldScheduleTool: true,
            toolName: 'read_file',
            toolArgs: { path: filePath },
          };
        },
      },
      {
        name: 'review',
        description: 'perform code review analysis',
        action: async (_mainCommand, _subCommand, args) => {
          const target = args?.trim() || '.';
          
          addMessage({
            type: MessageType.INFO,
            content: `Performing code review analysis for: ${target}`,
            timestamp: new Date(),
          });
          
          // Get recent changes for review
          return {
            shouldScheduleTool: true,
            toolName: 'bash',
            toolArgs: { 
              command: 'git diff --name-only HEAD~1 HEAD | head -10'
            },
          };
        },
      },
      {
        name: 'analyze',
        description: 'analyze project structure and dependencies',
        action: async (_mainCommand, _subCommand, _args) => {
          addMessage({
            type: MessageType.INFO,
            content: 'Analyzing project structure...',
            timestamp: new Date(),
          });
          
          const fs = await import('fs/promises');
          const path = await import('path');
          
          try {
            // Check for common project files and structure
            const projectRoot = process.cwd();
            const files = await fs.readdir(projectRoot);
            
            let analysis = 'Project Analysis:\n\n';
            
            // Detect project type
            const hasPackageJson = files.includes('package.json');
            const hasCargoToml = files.includes('Cargo.toml');
            const hasPyprojectToml = files.includes('pyproject.toml');
            const hasRequirementsTxt = files.includes('requirements.txt');
            const hasGemfile = files.includes('Gemfile');
            
            if (hasPackageJson) {
              analysis += '📦 Node.js/JavaScript project detected\n';
              const packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
              analysis += `   Package: ${packageJson.name || 'unnamed'}\n`;
              analysis += `   Version: ${packageJson.version || 'unknown'}\n`;
              if (packageJson.dependencies) {
                analysis += `   Dependencies: ${Object.keys(packageJson.dependencies).length}\n`;
              }
              if (packageJson.devDependencies) {
                analysis += `   Dev Dependencies: ${Object.keys(packageJson.devDependencies).length}\n`;
              }
            } else if (hasCargoToml) {
              analysis += '🦀 Rust project detected\n';
            } else if (hasPyprojectToml || hasRequirementsTxt) {
              analysis += '🐍 Python project detected\n';
            } else if (hasGemfile) {
              analysis += '💎 Ruby project detected\n';
            } else {
              analysis += '❓ Unknown project type\n';
            }
            
            analysis += '\n';
            
            // Directory structure
            const directories = files.filter(async (file) => {
              try {
                const stat = await fs.stat(path.join(projectRoot, file));
                return stat.isDirectory() && !file.startsWith('.');
              } catch {
                return false;
              }
            });
            
            analysis += `📁 Top-level directories: ${directories.length}\n`;
            analysis += `📄 Top-level files: ${files.length - directories.length}\n\n`;
            
            // Git status
            analysis += 'Git Information:\n';
            
            addMessage({
              type: MessageType.INFO,
              content: analysis,
              timestamp: new Date(),
            });
            
            // Get git info
            return {
              shouldScheduleTool: true,
              toolName: 'bash',
              toolArgs: { 
                command: 'git branch --show-current 2>/dev/null && git log --oneline -3 2>/dev/null'
              },
            };
            
          } catch (_error) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Could not analyze project structure.',
              timestamp: new Date(),
            });
          }
        },
      },
      {
        name: 'dependencies',
        description: 'analyze and update project dependencies',
        action: async (_mainCommand, _subCommand, args) => {
          const shouldUpdate = args?.includes('--update');
          
          addMessage({
            type: MessageType.INFO,
            content: 'Analyzing dependencies...',
            timestamp: new Date(),
          });
          
          // Check for outdated packages
          return {
            shouldScheduleTool: true,
            toolName: 'bash',
            toolArgs: { 
              command: shouldUpdate ? 'npm update && npm outdated' : 'npm outdated'
            },
          };
        },
      },
      {
        name: 'structure',
        description: 'visualize project structure',
        action: async (_mainCommand, _subCommand, args) => {
          const depth = args?.trim() ? parseInt(args.trim(), 10) : 3;
          
          addMessage({
            type: MessageType.INFO,
            content: `Showing project structure (depth: ${depth})...`,
            timestamp: new Date(),
          });
          
          return {
            shouldScheduleTool: true,
            toolName: 'bash',
            toolArgs: { 
              command: `find . -type d -name node_modules -prune -o -type d -name .git -prune -o -type f -print | head -50 | sort`
            },
          };
        },
      },
      {
        name: 'isolation',
        altName: 'sandbox',
        description: 'toggle private work room (security)',
        action: (_mainCommand, subCommand, _args) => {
          const currentSandbox = process.env.SANDBOX || 'none';
          
          if (subCommand === 'on' || subCommand === 'enable') {
            addMessage({
              type: MessageType.INFO,
              content: 'Isolated environment will be enabled on next restart.\nRun with: SANDBOX=isolated pnpm start',
              timestamp: new Date(),
            });
          } else if (subCommand === 'off' || subCommand === 'disable') {
            addMessage({
              type: MessageType.INFO,
              content: 'Isolated environment will be disabled on next restart.\nRun without SANDBOX environment variable.',
              timestamp: new Date(),
            });
          } else {
            // Show current status
            let status = 'disabled';
            let recommendation = 'Enable with: /isolation on';
            
            if (currentSandbox !== 'none' && currentSandbox) {
              status = `enabled (${currentSandbox})`;
              recommendation = 'Disable with: /isolation off';
            }
            
            addMessage({
              type: MessageType.INFO,
              content: `Isolated Environment Status: ${status}\n\nIsolated environments provide enhanced security by restricting file system access and network operations.\n\n${recommendation}`,
              timestamp: new Date(),
            });
          }
        },
      },
    ];

    if (config?.getCheckpointingEnabled()) {
      commands.push({
        name: 'restore',
        description:
          'restore a tool call. This will reset the conversation and file history to the state it was in when the tool call was suggested',
        completion: async () => {
          const checkpointDir = config?.getProjectTempDir()
            ? path.join(config.getProjectTempDir(), 'checkpoints')
            : undefined;
          if (!checkpointDir) {
            return [];
          }
          try {
            const files = await fs.readdir(checkpointDir);
            return files
              .filter((file) => file.endsWith('.json'))
              .map((file) => file.replace('.json', ''));
          } catch (_err) {
            return [];
          }
        },
        action: async (_mainCommand, subCommand, _args) => {
          const checkpointDir = config?.getProjectTempDir()
            ? path.join(config.getProjectTempDir(), 'checkpoints')
            : undefined;

          if (!checkpointDir) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Could not determine the .gemini directory path.',
              timestamp: new Date(),
            });
            return;
          }

          try {
            // Ensure the directory exists before trying to read it.
            await fs.mkdir(checkpointDir, { recursive: true });
            const files = await fs.readdir(checkpointDir);
            const jsonFiles = files.filter((file) => file.endsWith('.json'));

            if (!subCommand) {
              if (jsonFiles.length === 0) {
                addMessage({
                  type: MessageType.INFO,
                  content: 'No restorable tool calls found.',
                  timestamp: new Date(),
                });
                return;
              }
              const truncatedFiles = jsonFiles.map((file) => {
                const components = file.split('.');
                if (components.length <= 1) {
                  return file;
                }
                components.pop();
                return components.join('.');
              });
              const fileList = truncatedFiles.join('\n');
              addMessage({
                type: MessageType.INFO,
                content: `Available tool calls to restore:\n\n${fileList}`,
                timestamp: new Date(),
              });
              return;
            }

            const selectedFile = subCommand.endsWith('.json')
              ? subCommand
              : `${subCommand}.json`;

            if (!jsonFiles.includes(selectedFile)) {
              addMessage({
                type: MessageType.ERROR,
                content: `File not found: ${selectedFile}`,
                timestamp: new Date(),
              });
              return;
            }

            const filePath = path.join(checkpointDir, selectedFile);
            const data = await fs.readFile(filePath, 'utf-8');
            const toolCallData = JSON.parse(data);

            if (toolCallData.history) {
              loadHistory(toolCallData.history);
            }

            if (toolCallData.clientHistory) {
              await config
                ?.getEnfiyClient()
                ?.setHistory(toolCallData.clientHistory);
            }

            if (toolCallData.commitHash) {
              await gitService?.restoreProjectFromSnapshot(
                toolCallData.commitHash,
              );
              addMessage({
                type: MessageType.INFO,
                content: `Restored project to the state before the tool call.`,
                timestamp: new Date(),
              });
            }

            return {
              shouldScheduleTool: true,
              toolName: toolCallData.toolCall.name,
              toolArgs: toolCallData.toolCall.args,
            };
          } catch (_error) {
            addMessage({
              type: MessageType.ERROR,
              content: `Could not read restorable tool calls. This is the error: ${_error}`,
              timestamp: new Date(),
            });
          }
        },
      });
    }
    return commands;
  }, [
    onDebugMessage,
    setShowHelp,
    refreshStatic,
    openThemeDialog,
    openAuthDialog,
    openEditorDialog,
    clearItems,
    performMemoryRefresh,
    showMemoryAction,
    addMemoryAction,
    addMessage,
    toggleCorgiMode,
    savedChatTags,
    config,
    settings,
    showToolDescriptions,
    session,
    gitService,
    loadHistory,
    addItem,
    setQuittingMessages,
    pendingCompressionItemRef,
    setPendingCompressionItem,
    openPrivacyNotice,
    openProviderSelection,
  ]);

  const handleSlashCommand = useCallback(
    async (
      rawQuery: PartListUnion,
    ): Promise<SlashCommandActionReturn | boolean> => {
      if (typeof rawQuery !== 'string') {
        return false;
      }
      const trimmed = rawQuery.trim();
      if (!trimmed.startsWith('/') && !trimmed.startsWith('?')) {
        return false;
      }
      const userMessageTimestamp = Date.now();
      if (trimmed !== '/quit' && trimmed !== '/exit') {
        addItem(
          { type: MessageType.USER, text: trimmed },
          userMessageTimestamp,
        );
      }

      let subCommand: string | undefined;
      let args: string | undefined;

      const commandToMatch = (() => {
        if (trimmed.startsWith('?')) {
          return 'help';
        }
        const parts = trimmed.substring(1).trim().split(/\s+/);
        if (parts.length > 1) {
          subCommand = parts[1];
        }
        if (parts.length > 2) {
          args = parts.slice(2).join(' ');
        }
        return parts[0];
      })();

      const mainCommand = commandToMatch;

      for (const cmd of slashCommands) {
        if (mainCommand === cmd.name || mainCommand === cmd.altName) {
          const actionResult = await cmd.action(mainCommand, subCommand, args);
          if (
            typeof actionResult === 'object' &&
            actionResult?.shouldScheduleTool
          ) {
            return actionResult; // Return the object for useGeminiStream
          }
          return true; // Command was handled, but no tool to schedule
        }
      }

      addMessage({
        type: MessageType.ERROR,
        content: `Unknown command: ${trimmed}`,
        timestamp: new Date(),
      });
      return true; // Indicate command was processed (even if unknown)
    },
    [addItem, slashCommands, addMessage],
  );

  return { handleSlashCommand, slashCommands, pendingHistoryItems };
};
