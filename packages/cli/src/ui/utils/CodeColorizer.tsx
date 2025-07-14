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
import { Text, Box } from 'ink';
import { createLowlight } from 'lowlight';
import type {
  Root,
  Element,
  Text as HastText,
  ElementContent,
  RootContent,
} from 'hast';
import { themeManager } from '../themes/theme-manager.js';
import { Theme } from '../themes/theme.js';
import {
  MaxSizedBox,
  MINIMUM_MAX_HEIGHT,
} from '../components/shared/MaxSizedBox.js';

// Lazy-loaded highlighter to reduce bundle size
let lowlight: ReturnType<typeof createLowlight> | null = null;

async function getLowlight() {
  if (!lowlight) {
    // Only load common languages when actually needed
    const { common } = await import('lowlight');
    lowlight = createLowlight(common);
  }
  return lowlight;
}

function renderHastNode(
  node: Root | Element | HastText | RootContent,
  theme: Theme,
  inheritedColor: string | undefined,
): React.ReactNode {
  if (node.type === 'text') {
    // Use the color passed down from parent element, if any
    return <Text color={inheritedColor}>{node.value}</Text>;
  }

  // Handle Element Nodes: Determine color and pass it down, don't wrap
  if (node.type === 'element') {
    const nodeClasses: string[] =
      (node.properties?.className as string[]) || [];
    let elementColor: string | undefined = undefined;

    // Find color defined specifically for this element's class
    for (let i = nodeClasses.length - 1; i >= 0; i--) {
      const color = theme.getInkColor(nodeClasses[i]);
      if (color) {
        elementColor = color;
        break;
      }
    }

    // Determine the color to pass down: Use this element's specific color
    // if found, otherwise, continue passing down the already inherited color.
    const colorToPassDown = elementColor || inheritedColor;

    // Recursively render children, passing the determined color down
    // Ensure child type matches expected HAST structure (ElementContent is common)
    const children = node.children?.map(
      (child: ElementContent, index: number) => (
        <React.Fragment key={index}>
          {renderHastNode(child, theme, colorToPassDown)}
        </React.Fragment>
      ),
    );

    // Element nodes now only group children; color is applied by Text nodes.
    // Use a React Fragment to avoid adding unnecessary elements.
    return <React.Fragment>{children}</React.Fragment>;
  }

  // Handle Root Node: Start recursion with initial inherited color
  if (node.type === 'root') {
    // Check if children array is empty - this happens when lowlight can't detect language – fallback to plain text
    if (!node.children || node.children.length === 0) {
      return null;
    }

    // Pass down the initial inheritedColor (likely undefined from the top call)
    // Ensure child type matches expected HAST structure (RootContent is common)
    return node.children?.map((child: RootContent, index: number) => (
      <React.Fragment key={index}>
        {renderHastNode(child, theme, inheritedColor)}
      </React.Fragment>
    ));
  }

  // Handle unknown or unsupported node types
  return null;
}

/**
 * Component that handles lazy-loaded syntax highlighting
 */
function LazyCodeColorizer({
  code,
  language,
  availableHeight,
  maxWidth,
}: {
  code: string;
  language: string | null;
  availableHeight?: number;
  maxWidth?: number;
}) {
  const [highlighter, setHighlighter] = React.useState<ReturnType<typeof createLowlight> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    getLowlight().then(hl => {
      setHighlighter(hl);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !highlighter) {
    // Fallback to plain text while loading
    return renderPlainText(code, availableHeight, maxWidth);
  }

  return renderHighlightedCode(code, language, highlighter, availableHeight, maxWidth);
}

function renderPlainText(code: string, availableHeight?: number, maxWidth?: number): React.ReactNode {
  const activeTheme = themeManager.getActiveTheme();
  const lines = code.replace(/\n$/, '').split('\n');
  const padWidth = String(lines.length).length;

  return (
    <MaxSizedBox
      maxHeight={availableHeight}
      maxWidth={maxWidth}
      overflowDirection="top"
    >
      {lines.map((line, index) => (
        <Box key={index}>
          <Text color={activeTheme.colors.Gray}>
            {`${String(index + 1).padStart(padWidth, ' ')} `}
          </Text>
          <Text color={activeTheme.defaultColor}>{line}</Text>
        </Box>
      ))}
    </MaxSizedBox>
  );
}

function renderHighlightedCode(
  code: string,
  language: string | null,
  lowlight: ReturnType<typeof createLowlight>,
  availableHeight?: number,
  maxWidth?: number,
): React.ReactNode {
  const codeToHighlight = code.replace(/\n$/, '');
  const activeTheme = themeManager.getActiveTheme();

  try {
    // Render the HAST tree using the adapted theme
    // Apply the theme's default foreground color to the top-level Text element
    let lines = codeToHighlight.split('\n');
    const padWidth = String(lines.length).length; // Calculate padding width based on number of lines

    let hiddenLinesCount = 0;

    // Optimization to avoid highlighting lines that cannot possibly be displayed.
    if (availableHeight !== undefined) {
      availableHeight = Math.max(availableHeight, MINIMUM_MAX_HEIGHT);
      if (lines.length > availableHeight) {
        const sliceIndex = lines.length - availableHeight;
        hiddenLinesCount = sliceIndex;
        lines = lines.slice(sliceIndex);
      }
    }

    const getHighlightedLines = (line: string) =>
      !language || !lowlight.registered(language)
        ? lowlight.highlightAuto(line)
        : lowlight.highlight(language, line);

    return (
      <MaxSizedBox
        maxHeight={availableHeight}
        maxWidth={maxWidth}
        additionalHiddenLinesCount={hiddenLinesCount}
        overflowDirection="top"
      >
        {lines.map((line, index) => {
          const renderedNode = renderHastNode(
            getHighlightedLines(line),
            activeTheme,
            undefined,
          );

          const contentToRender = renderedNode !== null ? renderedNode : line;
          return (
            <Box key={index}>
              <Text color={activeTheme.colors.Gray}>
                {`${String(index + 1 + hiddenLinesCount).padStart(padWidth, ' ')} `}
              </Text>
              <Text color={activeTheme.defaultColor} wrap="wrap">
                {contentToRender}
              </Text>
            </Box>
          );
        })}
      </MaxSizedBox>
    );
  } catch (error) {
    console.error(
      `[colorizeCode] Error highlighting code for language "${language}":`,
      error,
    );
    // Fallback to plain text with default color on error
    // Also display line numbers in fallback
    const lines = codeToHighlight.split('\n');
    const padWidth = String(lines.length).length; // Calculate padding width based on number of lines
    return (
      <MaxSizedBox
        maxHeight={availableHeight}
        maxWidth={maxWidth}
        overflowDirection="top"
      >
        {lines.map((line, index) => (
          <Box key={index}>
            <Text color={activeTheme.defaultColor}>
              {`${String(index + 1).padStart(padWidth, ' ')} `}
            </Text>
            <Text color={activeTheme.colors.Gray}>{line}</Text>
          </Box>
        ))}
      </MaxSizedBox>
    );
  }
}

/**
 * Renders syntax-highlighted code for Ink applications using a selected theme.
 * Now with lazy loading to reduce bundle size.
 *
 * @param code The code string to highlight.
 * @param language The language identifier (e.g., 'javascript', 'css', 'html')
 * @returns A React.ReactNode containing Ink <Text> elements for the highlighted code.
 */
export function colorizeCode(
  code: string,
  language: string | null,
  availableHeight?: number,
  maxWidth?: number,
): React.ReactNode {
  return (
    <LazyCodeColorizer
      code={code}
      language={language}
      availableHeight={availableHeight}
      maxWidth={maxWidth}
    />
  );
}
