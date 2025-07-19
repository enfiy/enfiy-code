# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Theme selection dialog now properly responds to keyboard input (Escape key to close)
- Resolved input character dropping issue in Japanese text input
- Tool error messages now wrap correctly within terminal width constraints
- Test isolation improved to prevent interference from user settings

### Added

- Integration tests for UI component interactions
- Test isolation script to run tests in clean environment

### Changed

- Improved error display formatting for better readability

## [0.1.0] - 2025-07-19

### Added

- Initial public release of Enfiy Code CLI
- Multi-provider AI support (OpenAI, Anthropic, Google, Azure OpenAI, Gemini)
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

### Security

- Secure API key handling and storage using system keychain
- No secrets or keys committed to repository
- Comprehensive input sanitization
- ANSI escape sequence stripping to prevent terminal injection
- Safe file path handling with git-aware filtering
- Sandbox execution environment for untrusted code
