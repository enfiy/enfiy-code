/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { DiffRenderer } from './DiffRenderer.js';
import { Colors } from '../../colors.js';
import {
  ToolCallConfirmationDetails,
  ToolConfirmationOutcome,
  ToolExecuteConfirmationDetails,
  ToolMcpConfirmationDetails,
  Config,
} from '@enfiy/core';
import {
  RadioButtonSelect,
  RadioSelectItem,
} from '../shared/RadioButtonSelect.js';

export interface ToolConfirmationMessageProps {
  confirmationDetails: ToolCallConfirmationDetails;
  config?: Config;
  isFocused?: boolean;
  availableTerminalHeight?: number;
  terminalWidth: number;
}

export const ToolConfirmationMessage: React.FC<
  ToolConfirmationMessageProps
> = ({
  confirmationDetails,
  isFocused = true,
  availableTerminalHeight,
  terminalWidth,
}) => {
  const { onConfirm } = confirmationDetails;
  const childWidth = terminalWidth - 2; // 2 for padding

  useInput((_, key) => {
    if (!isFocused) return;
    if (key.escape) {
      onConfirm(ToolConfirmationOutcome.Cancel);
    }
  });

  const handleSelect = (item: ToolConfirmationOutcome) => onConfirm(item);

  let bodyContent: React.ReactNode | null = null; // Removed contextDisplay here
  let question: string;

  const options: Array<RadioSelectItem<ToolConfirmationOutcome>> = new Array<
    RadioSelectItem<ToolConfirmationOutcome>
  >();

  // Body content is now the DiffRenderer, passing filename to it
  // The bordered box is removed from here and handled within DiffRenderer

  function availableBodyContentHeight() {
    if (options.length === 0) {
      // This should not happen in practice as options are always added before this is called.
      throw new Error('Options not provided for confirmation message');
    }

    if (availableTerminalHeight === undefined) {
      return undefined;
    }

    // Calculate the vertical space (in lines) consumed by UI elements
    // surrounding the main body content.
    const PADDING_OUTER_Y = 2; // Main container has `padding={1}` (top & bottom).
    const MARGIN_BODY_BOTTOM = 1; // margin on the body container.
    const HEIGHT_QUESTION = 1; // The question text is one line.
    const MARGIN_QUESTION_BOTTOM = 1; // Margin on the question container.
    const HEIGHT_OPTIONS = options.length; // Each option in the radio select takes one line.

    const surroundingElementsHeight =
      PADDING_OUTER_Y +
      MARGIN_BODY_BOTTOM +
      HEIGHT_QUESTION +
      MARGIN_QUESTION_BOTTOM +
      HEIGHT_OPTIONS;
    return Math.max(availableTerminalHeight - surroundingElementsHeight, 1);
  }
  if (confirmationDetails.type === 'edit') {
    if (confirmationDetails.isModifying) {
      return (
        <Box
          minWidth="90%"
          borderStyle="round"
          borderColor={Colors.BorderGray}
          justifyContent="space-around"
          padding={1}
          overflow="hidden"
        >
          <Text>Modify in progress: </Text>
          <Text color={Colors.AccentGreen}>
            Save and close external editor to continue
          </Text>
        </Box>
      );
    }

    question = `File Modification Request`;
    options.push(
      {
        label: 'Yes, apply change',
        value: ToolConfirmationOutcome.ProceedOnce,
      },
      {
        label: 'Yes, always allow file edits',
        value: ToolConfirmationOutcome.ProceedAlways,
      },
      {
        label: 'Modify with external editor',
        value: ToolConfirmationOutcome.ModifyWithEditor,
      },
      { label: 'No (esc)', value: ToolConfirmationOutcome.Cancel },
    );
    bodyContent = (
      <DiffRenderer
        diffContent={confirmationDetails.fileDiff}
        filename={confirmationDetails.fileName}
        availableTerminalHeight={availableBodyContentHeight()}
        terminalWidth={childWidth}
      />
    );
  } else if (confirmationDetails.type === 'exec') {
    const executionProps =
      confirmationDetails as ToolExecuteConfirmationDetails;

    question = `Shell Command Execution Request`;
    options.push(
      {
        label: 'Yes, allow once',
        value: ToolConfirmationOutcome.ProceedOnce,
      },
      {
        label: `Yes, allow always "${executionProps.rootCommand} ..."`,
        value: ToolConfirmationOutcome.ProceedAlways,
      },
      { label: 'No (esc)', value: ToolConfirmationOutcome.Cancel },
    );

    let bodyContentHeight = availableBodyContentHeight();
    if (bodyContentHeight !== undefined) {
      bodyContentHeight -= 2; // Account for padding;
    }

    const commandParts = executionProps.command.split(' ');
    const mainCommand = commandParts[0];
    const args = commandParts.slice(1).join(' ');
    const workingDir = process.cwd();

    bodyContent = (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={Colors.BorderGray}
        padding={1}
      >
        <Box marginBottom={1}>
          <Text color={Colors.AccentYellow} bold>
            Command Details
          </Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color={Colors.Gray}>Command: </Text>
            <Text color={Colors.AccentCyan} bold>
              {mainCommand}
            </Text>
            {args && <Text color={Colors.AccentBlue}> {args}</Text>}
          </Box>
          <Box>
            <Text color={Colors.Gray}>Working Directory: </Text>
            <Text color={Colors.AccentGreen}>{workingDir}</Text>
          </Box>
          <Box>
            <Text color={Colors.Gray}>Root Command: </Text>
            <Text color={Colors.AccentPurple}>
              {executionProps.rootCommand}
            </Text>
          </Box>
        </Box>

        <Box>
          <Text color={Colors.Gray}>
            This command will be executed in your system shell with the above
            parameters.
          </Text>
        </Box>
      </Box>
    );
  } else if (confirmationDetails.type === 'info') {
    const infoProps = confirmationDetails;
    const displayUrls =
      infoProps.urls &&
      !(infoProps.urls.length === 1 && infoProps.urls[0] === infoProps.prompt);

    question = `Web Fetch Request`;
    options.push(
      {
        label: 'Yes, allow once',
        value: ToolConfirmationOutcome.ProceedOnce,
      },
      {
        label: 'Yes, always allow web requests',
        value: ToolConfirmationOutcome.ProceedAlways,
      },
      { label: 'No (esc)', value: ToolConfirmationOutcome.Cancel },
    );

    bodyContent = (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={Colors.BorderGray}
        padding={1}
      >
        <Box marginBottom={1}>
          <Text color={Colors.AccentYellow} bold>
            Web Fetch Details
          </Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color={Colors.Gray}>Request: </Text>
            <Text color={Colors.AccentCyan}>{infoProps.prompt}</Text>
          </Box>
          {displayUrls && infoProps.urls && infoProps.urls.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text color={Colors.Gray}>URLs to fetch:</Text>
              {infoProps.urls.map((url) => (
                <Box key={url} marginLeft={1}>
                  <Text color={Colors.AccentBlue}>{url}</Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box>
          <Text color={Colors.Gray}>
            This will fetch content from external web sources. Check the URLs
            above.
          </Text>
        </Box>
      </Box>
    );
  } else {
    // mcp tool confirmation
    const mcpProps = confirmationDetails as ToolMcpConfirmationDetails;

    bodyContent = (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={Colors.BorderGray}
        padding={1}
      >
        <Box marginBottom={1}>
          <Text color={Colors.AccentYellow} bold>
            MCP Tool Details
          </Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color={Colors.Gray}>Server: </Text>
            <Text color={Colors.AccentCyan} bold>
              {mcpProps.serverName}
            </Text>
          </Box>
          <Box>
            <Text color={Colors.Gray}>Tool: </Text>
            <Text color={Colors.AccentPurple} bold>
              {mcpProps.toolName}
            </Text>
          </Box>
        </Box>

        <Box>
          <Text color={Colors.Gray}>
            This will execute a tool from an external MCP server with the
            permissions shown above.
          </Text>
        </Box>
      </Box>
    );

    question = `MCP Tool Execution Request`;
    options.push(
      {
        label: 'Yes, allow once',
        value: ToolConfirmationOutcome.ProceedOnce,
      },
      {
        label: `Yes, always allow "${mcpProps.toolName}"`,
        value: ToolConfirmationOutcome.ProceedAlwaysTool, // Cast until types are updated
      },
      {
        label: `Yes, trust all tools from "${mcpProps.serverName}"`,
        value: ToolConfirmationOutcome.ProceedAlwaysServer,
      },
      { label: 'No (esc)', value: ToolConfirmationOutcome.Cancel },
    );
  }

  return (
    <Box flexDirection="column" padding={1} width={childWidth}>
      {/* Body Content (Diff Renderer or Command Info) */}
      {/* No separate context display here anymore for edits */}
      <Box flexGrow={1} flexShrink={1} overflow="hidden" marginBottom={1}>
        {bodyContent}
      </Box>

      {/* Confirmation Question */}
      <Box marginBottom={1} flexShrink={0}>
        <Text wrap="truncate">{question}</Text>
      </Box>

      {/* Select Input for Options */}
      <Box flexShrink={0}>
        <RadioButtonSelect
          items={options}
          onSelect={handleSelect}
          isFocused={isFocused}
        />
      </Box>
    </Box>
  );
};
