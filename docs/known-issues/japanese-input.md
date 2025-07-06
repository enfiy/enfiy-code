# Japanese Input Display Issue

## Problem Description

When typing Japanese characters (kanji, hiragana, katakana) in the Enfiy Code input form, the cursor position becomes misaligned. This happens because:

1. Japanese characters are "full-width" characters that take up 2 columns in terminal display
2. The current TextBuffer implementation calculates cursor position based on Unicode code points (1 character = 1 code point)
3. This creates a mismatch: 1 Japanese character = 1 code point but 2 visual columns

## Example

When typing "こんにちは" (konnichiha):
- Code points: 5 characters
- Visual width: 10 columns
- The cursor appears at position 5 instead of position 10

## Root Cause

The issue is in `/packages/cli/src/ui/components/shared/text-buffer.ts`:

- `cpLen()` counts Unicode code points, not visual width
- `calculateWrapLayout()` uses code point length for cursor positioning
- The visual cursor calculation doesn't account for East Asian Width

## Potential Solution

To fix this properly:

1. Replace all `cpLen()` calls with `stringWidth()` for cursor positioning
2. Update `calculateWrapLayout()` to use visual width calculations
3. Modify cursor movement logic to handle multi-column characters
4. Update the text slicing logic to preserve character boundaries

## Temporary Workaround

Users can:
- Type in English and translate afterwards
- Use an external editor (Ctrl+X) for Japanese text input
- Copy and paste Japanese text from another application

## References

- [East Asian Width in Unicode](https://www.unicode.org/reports/tr11/)
- [string-width npm package](https://www.npmjs.com/package/string-width)