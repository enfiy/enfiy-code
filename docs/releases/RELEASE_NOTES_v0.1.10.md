# Release Notes - v0.1.10

## Bug Fixes

### NPX Execution Fix

- **Fixed critical NPX execution error**: Resolved "Cannot find package 'read-package-up'" error when running via `npx @enfiy/enfiy-code`
- **Bundling Configuration**: Removed `read-package-up` from external dependencies in esbuild config to ensure proper bundling
- **Cross-platform Compatibility**: Improved module resolution for Windows, macOS, and Linux environments

### Bundle Optimization

- Updated bundle to include all required dependencies for standalone execution
- Maintained bundle size optimization while ensuring all critical modules are included
- Enhanced error handling for missing module dependencies

## Technical Details

### Root Cause

The issue was caused by `read-package-up` being marked as external in the esbuild configuration, preventing it from being bundled with the CLI application. This caused module resolution failures when users tried to run the tool via npx.

### Resolution

- Removed `read-package-up` from the `external` array in `esbuild.config.js`
- Rebuilt bundle to include the dependency
- Verified fix through local testing and bundle analysis

## Installation

```bash
# NPX (recommended for one-time use)
npx @enfiy/enfiy-code

# Global installation
npm install -g @enfiy/enfiy-code
enfiy
```

This release resolves the critical execution issue reported in [GitHub Issue #1](https://github.com/enfiy/enfiy-code/issues/1).
