# Release Notes - v0.1.7

## Bug Fixes

### Windows Compatibility

- Fixed "Cannot find package 'simple-git'" error on Windows by ensuring proper bundling
- Resolved module resolution issues for all Windows environments
- Enhanced cross-platform dependency management

### Build System

- Fixed workspace package publishing workflow
- Updated prepublish script to support all workspace packages
- Improved NPM publishing process for multi-package repository

### Node.js Compatibility

- Ensured compatibility with latest Node.js versions (v18+)
- Fixed ESM module resolution for modern Node.js environments
- Enhanced cross-platform module loading

## Technical Improvements

- Cleaned project structure by removing redundant files from workspace packages
- Organized release notes in dedicated docs/releases directory
- Improved bundle analysis and size management
- Enhanced development workflow with better error handling

## Compatibility

- Full Windows, macOS, and Linux support
- Compatible with Node.js 18+ (including latest v22.x)
- Enhanced WSL and native Windows compatibility
- Improved package installation reliability

This release focuses on Windows compatibility and modern Node.js support, ensuring reliable operation across all platforms and Node.js versions.