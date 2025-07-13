# Japanese Input Issues

## Problem Description

Japanese character input in Enfiy Code has two related issues:

### 1. Cursor Position Misalignment

When typing Japanese characters (kanji, hiragana, katakana), the cursor position becomes misaligned because:

- Japanese characters are "full-width" characters that take up 2 columns in terminal display
- The current TextBuffer implementation calculates cursor position based on Unicode code points (1 character = 1 code point)
- This creates a mismatch: 1 Japanese character = 1 code point but 2 visual columns

**Example**: When typing "こんにちは" (konnichiha):
- Code points: 5 characters
- Visual width: 10 columns
- The cursor appears at position 5 instead of position 10

### 2. IME Composition Issues

Enfiy Code runs in "raw mode" which captures individual keystrokes for features like auto-completion and keyboard shortcuts. This interferes with Japanese IME (Input Method Editor) which needs to compose multiple keystrokes into Japanese characters.

## Workarounds

### 1. Use External Editor (Recommended)
Press `Ctrl+X` to open your default text editor ($EDITOR or vi). You can type Japanese normally there, save, and the text will be inserted into Enfiy Code.

### 2. Copy and Paste
Type your Japanese text in another application and paste it into Enfiy Code:
- On most terminals: `Ctrl+Shift+V` or right-click paste
- On macOS Terminal: `Cmd+V`

### 3. Use English Commands
Since Enfiy Code is primarily for development tasks, consider using English for commands and comments, which avoids the IME issue entirely.

### 4. Use Non-Interactive Mode
For Japanese input, you can use Enfiy Code in non-interactive mode:
```bash
echo "ディレクトリ構成を表示して" | enfiy
```

## Technical Details

### Root Cause - Cursor Positioning
The issue is in `/packages/cli/src/ui/components/shared/text-buffer.ts`:
- `cpLen()` counts Unicode code points, not visual width
- `calculateWrapLayout()` uses code point length for cursor positioning
- The visual cursor calculation doesn't account for East Asian Width

### Root Cause - IME Issues
The IME issue occurs because:
1. Terminal raw mode intercepts keystrokes before IME processing
2. Japanese IME needs to compose multiple keystrokes (romaji → hiragana → kanji)
3. The terminal only sends the final character after composition

This is a limitation of terminal-based applications and affects many CLI tools, not just Enfiy Code.

## Potential Solutions

### For Cursor Positioning
To fix this properly:
1. Replace all `cpLen()` calls with `stringWidth()` for cursor positioning
2. Update `calculateWrapLayout()` to use visual width calculations
3. Modify cursor movement logic to handle multi-column characters
4. Update the text slicing logic to preserve character boundaries

### For IME Support
Potential solutions being considered:
- Add a toggle to temporarily disable raw mode for IME input
- Implement a Japanese input mode that buffers romaji input
- Support for IME-aware terminal protocols (when available)

## References

- [East Asian Width in Unicode](https://www.unicode.org/reports/tr11/)
- [string-width npm package](https://www.npmjs.com/package/string-width)