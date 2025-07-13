# Welcome to Enfiy Code documentation

This documentation provides a comprehensive guide to installing, using, and developing Enfiy Code. This tool lets you interact with various AI models through a command-line interface.

## Overview

Enfiy Code brings the capabilities of multiple AI models to your terminal in an interactive Read-Eval-Print Loop (REPL) environment. Enfiy Code consists of a client-side application (`packages/cli`) that communicates with a local server (`packages/core`), which in turn manages requests to various AI APIs and models including Gemini, OpenAI, Claude, and more. Enfiy Code also contains a variety of tools for tasks such as performing file system operations, running shells, and web fetching, which are managed by `packages/core`.

## Navigating the documentation

This documentation is organized into the following sections:

### Getting Started
- **[Installation](./installation.md):** How to install and set up Enfiy Code
- **[Deployment Guide](./deployment.md):** Information for running Enfiy Code in different environments
- **[Architecture Overview](./architecture.md):** Understand the high-level design of Enfiy Code, including its components and how they interact

### CLI Usage
Documentation for `packages/cli`:
- **[CLI Introduction](./cli/index.md):** Overview of the command-line interface
- **[Authentication](./cli/authentication.md):** Setting up authentication with various AI providers
- **[Commands](./cli/commands.md):** Description of available CLI commands
- **[Configuration](./cli/configuration.md):** Information on configuring the CLI
- **[Themes](./cli/themes.md):** Customizing the CLI appearance
- **[Tutorials](./cli/tutorials.md):** Step-by-step guides and examples

### Advanced Features
- **[Checkpointing](./checkpointing.md):** Save and restore conversation sessions
- **[Extensions](./extension.md):** How to extend Enfiy Code with custom functionality
- **[MCP Integration](./mcp-integration.md):** Model Context Protocol server integration
- **[Telemetry](./telemetry.md):** Overview of telemetry and privacy controls

### Core System
Documentation for `packages/core`:
- **[Core Introduction](./core/index.md):** Overview of the core component
- **[Tools API](./core/tools-api.md):** Information on how the core manages and exposes tools

### Built-in Tools
- **[Tools Overview](./tools/index.md):** Overview of available tools
- **[File System Tools](./tools/file-system.md):** File reading and writing operations
- **[Multi-File Tool](./tools/multi-file.md):** Reading multiple files efficiently
- **[Shell Tool](./tools/shell.md):** Execute shell commands
- **[Web Fetch Tool](./tools/web-fetch.md):** Fetch content from web URLs
- **[Web Search Tool](./tools/web-search.md):** Search the web for information
- **[Memory Tool](./tools/memory.md):** Save and retrieve conversation memory
- **[MCP Server Tool](./tools/mcp-server.md):** Interact with MCP servers

### Support and Reference
- **[Troubleshooting Guide](./troubleshooting.md):** Find solutions to common problems and FAQs
- **[Known Issues](./known-issues/):** Documentation of known issues and workarounds
- **[Privacy & Security](./privacy-security.md):** Information about data handling and security
- **[Contributing & Development Guide](../CONTRIBUTING.md):** Information for contributors and developers
- **[Terms of Service and Privacy Notice](./tos-privacy.md):** Legal terms and privacy policy

We hope this documentation helps you make the most of the Enfiy Code!
