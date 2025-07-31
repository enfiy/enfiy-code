# Release Notes - v0.1.12

## Major Improvements

### Universal Input Handling

- **Completely redesigned input system** for all languages and input methods
- **Fixed Japanese IME conversion issue** where only the last character was displayed
- **Added support for Chinese, Korean, and other multi-byte character input**
- **Simplified input buffering** with universal 30ms timeout approach

### Enhanced Text Input

- **Fixed paste functionality** with multi-byte character detection
- **Improved file path detection** to prevent Japanese text being treated as paths
- **Better error handling** for text insertion operations
- **Added Windows IME candidate window padding** to prevent display shifting

### API Improvements

- **Enhanced Anthropic API error handling** and validation
- **Added API key format validation** with user-friendly error messages
- **Improved configuration handling** across all providers
- **Better secure storage** with enhanced error handling

### Developer Experience

- **Fixed all ESLint errors** and improved code quality
- **Updated workflows** for better package publishing
- **Enhanced model management** and provider configuration
- **Improved multi-provider client handling**

## Technical Changes

- **Replaced complex IME-specific logic** with universal buffering approach
- **Added comprehensive input debugging** and logging
- **Improved terminal size calculations** for Windows
- **Enhanced error handling** throughout the codebase
- **Updated dependencies** and build processes

## Bug Fixes

- **Fixed Japanese IME conversion** showing only last character
- **Resolved paste issues** with English text showing only periods
- **Fixed Windows terminal shifting** when IME candidate windows appear
- **Corrected API key validation** and error messages
- **Fixed various linting** and code quality issues

## Breaking Changes

- None - fully backward compatible

## Installation

```bash
# NPX (recommended)
npx @enfiy/enfiy-code

# Global installation
npm install -g @enfiy/enfiy-code
enfiy
```

This release significantly improves the international user experience, particularly for Japanese, Chinese, and Korean users, while maintaining full backward compatibility and enhancing overall system reliability.
