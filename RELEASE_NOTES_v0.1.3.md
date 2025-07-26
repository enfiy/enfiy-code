# Release v0.1.3

## Critical Bug Fixes

This release addresses critical installation issues that prevented the CLI from running properly when installed via npm.

### Fixed

- **macOS Installation Error**: Fixed "Cannot find package '@modelcontextprotocol/sdk'" error that occurred when running `enfiy` command after global npm installation
  - Root cause: The MCP SDK was incorrectly marked as external in the build configuration
  - Solution: Bundle the MCP SDK directly into the distribution file
  - Impact: Bundle size increased from 0.97MB to 1.24MB

- **v0.1.2 Runtime Error**: Previous version (v0.1.2) had a critical error where the MCP SDK was moved to production dependencies but still excluded from the bundle, causing runtime failures

### Technical Details

- Modified `esbuild.config.js` to remove `@modelcontextprotocol/sdk` from the external dependencies list
- All required dependencies are now properly bundled for standalone execution
- No changes to functionality or features

### Installation

```bash
npm install -g @enfiy/enfiy-code@latest
```

### Verification

After installation, verify the fix by running:

```bash
enfiy --version
```

The command should execute without errors and display version 0.1.3.
