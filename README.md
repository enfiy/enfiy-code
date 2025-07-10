<div align="center">

# Enfiy Code

### *Your Universal AI Coding Agent*

<img src="https://skillicons.dev/icons?i=npm,nodejs,windows,linux,apple,ubuntu" />

<p align="center"><code>npm install -g @enfiy/enfiy-code</code></p>

</div>

![Enfiy Code Screenshot](./docs/assets/enfiy-cli-screenshot.png)

## Quickstart

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

## About

Enfiy Code is a command-line AI workflow tool that integrates with your development environment. It understands your code and helps you work more efficiently, whether you're working locally or in the cloud.

### Key Features

- Query and edit large codebases using advanced AI models with extended context support
- Generate applications from PDFs or sketches using multimodal AI
- Automate tasks like querying pull requests or handling complex rebases
- Connect external tools through MCP (Model Context Protocol)
- Support for multiple AI providers - both cloud and local

## AI Providers

### Cloud AI (Powerful)

| Provider | Description |
|---------|-------------|
| <img src="./docs/assets/provider/provider-anthropic-claude.png" width="32" /> | **Anthropic Claude**<br>Industry-leading AI for coding tasks |
| <img src="./docs/assets/provider/provider-openai-gpt.png" width="32" /> | **OpenAI GPT**<br>Popular and versatile language models |
| <img src="./docs/assets/provider/provider-google-gemini.png" width="32" /> | **Google Gemini**<br>Multimodal AI with strong reasoning capabilities |
| <img src="./docs/assets/provider/provider-mistral-ai.png" width="32" /> | **Mistral AI**<br>Open-source focused AI models |
| <img src="./docs/assets/provider/provider-huggingface.png" width="32" /> | **HuggingFace**<br>Supports both API and local modes |

---

### Local AI (Private)

| Provider | Description |
|---------|-------------|
| <img src="./docs/assets/provider/provider-ollama.png" width="32" /> | **Ollama**<br>Run models locally with full privacy |
| <img src="./docs/assets/provider/provider-vllm.png" width="32" /> | **vLLM**<br>High-performance inference engine *(coming soon)* |


## Core Commands

Once Enfiy Code is running, use these commands to interact with the AI:

- `/provider` - Select AI provider and model
- `/mcp` - Connect to MCP servers for enhanced capabilities  
- `/tool` - Access specialized tools and integrations
- `/help` - Show available commands and usage information
- `/bug` - Report bugs or issues to the development team
- Ask questions, edit files, run commands

## Usage Examples

### Basic Usage
```bash
# Start Enfiy Code
enfiy

# Ask questions about your code
> What does this function do?
> How can I optimize this database query?

# Request code changes
> Add error handling to the user authentication
> Refactor this component to use React hooks
```

### Project Development
```bash
# Start a new project
cd my-project/
enfiy
> Create a React app with TypeScript and authentication
> Add a responsive navigation component
> Set up Jest testing framework
```

### Code Analysis
```bash
# Analyze existing codebase
enfiy
> Review this codebase for security vulnerabilities
> Identify performance bottlenecks
> Suggest architectural improvements
```

### Automation Tasks
```bash
# Automate development workflows
enfiy
> Write comprehensive tests for the API endpoints
> Generate documentation for these functions
> Create deployment scripts for production
```

## Documentation

### Getting Started
- [Installation Guide](./docs/installation.md) – How to install Enfiy Code and get started quickly.
- [API Key Configuration](./docs/api-configuration.md) – Set up and manage keys for OpenAI, Anthropic, etc.

### Using the CLI
- [CLI Commands](./docs/cli/commands.md) – Full reference for available commands.
- [MCP Integration](./docs/mcp-integration.md) – Extend Enfiy Code with Model Context Protocol.

### Security & Support
- [Privacy & Security](./docs/privacy-security.md) – Learn how your data is protected.
- [Troubleshooting](./docs/troubleshooting.md) – Common issues and how to resolve them.

## Development

### Prerequisites for Development
- Node.js v18 or higher
- npm or yarn package manager
- Git

### Setting Up Development Environment

1. **Clone the repository**
```bash
git clone https://github.com/enfiy-ecosystem/enfiy-code.git
cd enfiy-code
```

2. **Install dependencies**
```bash
npm install
```
This will install all required packages listed in `package.json`.

3. **Build the project**
```bash
npm run build
```
This compiles TypeScript and prepares the application for execution.

4. **Start the development version**
```bash
npm start
```
This launches Enfiy Code in development mode.

### Development Commands

- `npm run start` - Start in development mode
- `npm run debug` - Start with debugging enabled
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Check code style and quality
- `npm run format` - Format code automatically
- `npm run typecheck` - TypeScript type checking
- `npm run preflight` - Complete CI pipeline check

## Contributing

We welcome contributions to Enfiy Code! Please see our [contributing guidelines](./CONTRIBUTING.md) for more information on how to get started.

## License

Enfiy Code is licensed under the [Apache 2.0 License](./LICENSE).

---

<div align="center">
  <br>
  <p style="color: #fb923c; font-size: 1.1em; font-weight: 600;">
    Thank you for using Enfiy Code! 🧡
  </p>
  <p style="color: #6b7280; font-size: 0.9em;">
    Built with ❤️ by the Enfiy Community
  </p>
  <br>
</div>