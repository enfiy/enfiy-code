# Getting Started with Enfiy Code

Welcome to Enfiy Code! This section will help you get up and running quickly with your AI coding assistant.

## Quick Start

Ensure you have [Node.js v18 or higher](https://nodejs.org/en/download) installed.

**Option 1: Run without installing (Recommended for first-time users)**
```bash
npx @enfiy/enfiy-code
```

**Option 2: Install globally (Recommended for regular use)**
```bash
npm install -g @enfiy/enfiy-code
enfiy
```

On first run, you'll be guided through selecting a theme, AI provider, and authentication method. Your settings persist automatically.

## What's Next?

1. **[Installation Guide](./installation.md)** – Detailed installation instructions for different environments
2. **[API Configuration](./api-configuration.md)** – Set up API keys for AI providers
3. **[First Steps](./first-steps.md)** – Learn basic commands and workflows

## Core Concepts

### AI Providers
Enfiy Code supports both cloud and local AI providers:
- **Cloud**: Anthropic Claude, OpenAI GPT, Google Gemini, Mistral AI
- **Local**: Ollama, HuggingFace (coming: vLLM)

### Interactive Interface
- Type natural language commands
- Use slash commands for specific functions (`/help`, `/provider`, `/mcp`)
- Edit files directly through conversation

### Tool Integration
- File system operations
- Shell command execution
- Web browsing and search
- Model Context Protocol (MCP) servers

## Need Help?

- **[Troubleshooting](../troubleshooting/README.md)** – Common issues and solutions
- **[Guides](../guides/README.md)** – Step-by-step tutorials
- **[API Reference](../api/README.md)** – Technical documentation

Use `/help` within Enfiy Code for interactive assistance.