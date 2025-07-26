# Release Notes - v0.1.5

## Bug Fixes

### Windows Compatibility
- Fixed "Cannot find package 'simple-git'" error during Windows installation by bundling the dependency
- Fixed "require is not defined" error in ESM environment by converting dynamic require() calls to proper ESM imports
- Resolved Windows terminal display issues where input fields would shift right in VSCode terminal

### API Key Management
- Removed debug logging that was interfering with API key functionality
- Restored original working API key validation and storage system
- Fixed secure storage loading for all providers (OpenAI, Gemini, Mistral, Anthropic, OpenRouter)

### Build System
- Fixed bundle size limit warnings by increasing threshold to 5MB for cross-platform compatibility
- Improved Windows build process by skipping sandbox commands that could cause hangs
- Enhanced platform detection for better cross-platform support

### User Interface
- Disabled automatic theme selection dialog on startup
- Fixed string width calculation for better terminal compatibility across platforms
- Improved formatting consistency in CI/CD pipeline

## Technical Improvements

- Enhanced cross-platform string width calculations with platformStringWidth function
- Improved secure storage encryption/decryption process
- Better error handling for Windows-specific build scenarios
- Streamlined build output to reduce verbose logging

## Compatibility

- Full Windows, macOS, and Linux support
- Compatible with VSCode integrated terminal
- Improved WSL compatibility
- Node.js 18+ requirement maintained

This release focuses on stability and cross-platform compatibility, ensuring reliable operation across all supported operating systems.