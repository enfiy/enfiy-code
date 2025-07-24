# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.4] - 2025-07-24

### Fixed
- **CRITICAL**: Fixed Windows compatibility by bundling all required dependencies (shell-quote, chalk, zod, etc.)
- Fixed "Cannot find package 'shell-quote'" error on Windows that prevented CLI from running
- Bundled OpenTelemetry packages and AI SDK dependencies for reliable cross-platform operation
- Bundle size increased from 1.24MB to 2.85MB to ensure all platforms work correctly

### Changed
- Modified esbuild configuration to bundle critical dependencies instead of marking them as external
- Improved cross-platform compatibility for Windows, macOS, and Linux

## [0.1.3] - 2025-07-24

### Fixed
- Fixed runtime error when installing package globally via npm by moving @modelcontextprotocol/sdk to production dependencies
- Fixed "Cannot find package '@modelcontextprotocol/sdk'" error on macOS by bundling the dependency into the build
- Increased bundle size from 0.97MB to 1.24MB to include MCP SDK

## [0.1.2] - 2025-07-24

### Added
- Enhanced error handling for network requests
- Improved performance for large file operations
- Better support for workspace configurations

### Changed
- Updated dependencies to latest versions
- Optimized bundle size for faster installation
- Improved CLI startup time

### Fixed
- Fixed issue with file path resolution on Windows
- Resolved memory leak in long-running sessions
- Corrected provider authentication flow

## [0.1.0] - 2025-07-21

### Added

- Initial public release of Enfiy Code CLI
- Multi-provider AI support (OpenAI, Anthropic, Google, Azure OpenAI, Mistral, Gemini)
- Interactive command-line interface with React-based UI
- File context management with `@file` syntax
- Shell command integration with `!command` syntax
- Slash commands for system operations (`/help`, `/provider`, `/tool`, etc.)
- MCP (Model Context Protocol) support for extensibility
- Git integration and branch awareness
- Comprehensive settings system with workspace and user configurations
- Docker container support for sandboxed environments
- Multiple installation methods (npm, npx, Docker)
- Telemetry and usage analytics support
- Memory usage monitoring and optimization
- Auto-completion for file paths and commands
- Syntax highlighting for code blocks
- Multi-line input support with history navigation
- Progress indicators and loading states
- Error handling with recovery suggestions
- Local AI support (Ollama)
- Bundle size optimization for CLI distribution
- Comprehensive test suite with CI/CD integration
- Theme support with multiple built-in themes
- Secure authentication methods including OAuth and API keys
- Provider-specific configuration and setup wizards
- Enhanced .gitignore patterns for development workflow

### Fixed

- Fixed 66 ESLint errors and warnings across the codebase
- Resolved unused variable warnings by implementing proper naming conventions
- Fixed React Hook dependency warnings for improved component stability
- Corrected constant condition errors in text-buffer implementation
- Resolved missing test scripts and configuration issues
- Fixed integration test failures and improved test isolation
- Updated license headers across all files with proper copyright attribution
- Improved Prettier formatting consistency across all source files
- Fixed EventTarget cleanup issues in test environment
- Enhanced vitest configuration for better test stability and reliability

### Security

- Secure API key handling and storage using system keychain
- No secrets or keys committed to repository
- Comprehensive input sanitization
- ANSI escape sequence stripping to prevent terminal injection
- Safe file path handling with git-aware filtering
- Sandbox execution environment for untrusted code
- Enhanced .gitignore patterns for better security coverage
- Comprehensive security analysis with GitHub Actions workflows
- Proper license header management with copyright attribution
