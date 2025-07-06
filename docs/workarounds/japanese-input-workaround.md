# Japanese Input Workaround for Enfiy Code

## The Problem

The Enfiy Code runs in "raw mode" which allows it to capture individual keystrokes for features like auto-completion and keyboard shortcuts. However, this interferes with Japanese IME (Input Method Editor) which needs to compose multiple keystrokes into Japanese characters.

## Recommended Workarounds

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
echo "ディレクトリ構成を表示して" | pnpm start
```

## Technical Details

The issue occurs because:
1. Terminal raw mode intercepts keystrokes before IME processing
2. Japanese IME needs to compose multiple keystrokes (romaji → hiragana → kanji)
3. The terminal only sends the final character after composition

This is a limitation of terminal-based applications and affects many CLI tools, not just Enfiy Code.

## Future Improvements

Potential solutions being considered:
- Add a toggle to temporarily disable raw mode for IME input
- Implement a Japanese input mode that buffers romaji input
- Support for IME-aware terminal protocols (when available)