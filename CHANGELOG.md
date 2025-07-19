# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of Enfiy Code CLI
- Multi-provider AI support (OpenAI, Anthropic, Google, Azure OpenAI)
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
- Local AI support (Ollama, Hugging Face)
- Bundle size optimization for CLI distribution
- Comprehensive test suite with CI/CD integration

### Changed

- N/A (Initial release)

### Deprecated

- N/A (Initial release)

### Removed

- N/A (Initial release)

### Fixed

- N/A (Initial release)

### Security

- Secure API key handling and storage
- No secrets or keys committed to repository
- Comprehensive input sanitization
- ANSI escape sequence stripping
- Safe file path handling with git-aware filtering

## [0.1.0] - 2025-07-18

### Added

- Initial public release of Enfiy Code CLI
- Core functionality for AI-powered code assistance
- Multi-provider support and extensible architecture
- Interactive terminal interface with advanced features
- Comprehensive documentation and setup guides
- Docker containerization for consistent environments
- CI/CD pipeline with automated testing and security scanning
- Local AI integration capabilities
- Memory management and performance optimization
- Extensible tool system with MCP support
