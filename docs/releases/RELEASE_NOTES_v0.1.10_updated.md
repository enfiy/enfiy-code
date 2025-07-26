# Release Notes - v0.1.10 (Updated)

## Major Bug Fixes

### NPX Execution Completely Fixed

- **Resolved all dependency resolution errors** when running via `npx @enfiy/enfiy-code`
- **Fixed React DevTools Core conflicts** that caused `self is not defined` errors
- **Proper external dependency management** using dynamic configuration instead of hardcoding
- **Complete cross-platform compatibility** (Windows, macOS, Linux, all Node.js versions)

### Build System Overhaul

- **Eliminated hardcoded external dependencies** in favor of dynamic detection
- **Removed unnecessary bundle size tracking** that was polluting the repository
- **Optimized bundle size** to 5.52MB while maintaining full functionality
- **Clean and maintainable esbuild configuration** with proper external handling

### Dependency Management

- **Added all required dependencies** to main package.json for npm distribution
- **Proper UI framework externalization** (ink, react) to prevent bundle bloat
- **Intelligent dependency bundling** - critical modules bundled, optional modules external

## Technical Improvements

### Bundle Configuration
- Dynamic external dependency detection based on package.json analysis
- Proper Node.js built-in module handling
- Intelligent tree shaking and code optimization
- Reasonable size limits with proper error handling

### Reliability
- Eliminates module resolution errors across all environments
- Proper handling of browser-specific dependencies in Node.js context
- Clean separation between bundled and external dependencies

## Breaking Changes
- None - fully backward compatible

## Installation

```bash
# NPX (now works reliably across all platforms)
npx @enfiy/enfiy-code

# Global installation
npm install -g @enfiy/enfiy-code
enfiy
```

This release completely resolves the critical NPX execution issues reported in [GitHub Issue #1](https://github.com/enfiy/enfiy-code/issues/1) and provides a robust, maintainable foundation for future development.