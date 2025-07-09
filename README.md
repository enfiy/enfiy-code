<div align="center">

# Enfiy Code

### *A universal AI coding agent — local or cloud, your choice*

<img src="https://skillicons.dev/icons?i=npm,nodejs,windows,linux,apple,ubuntu" />

<br>

<p align="center"><code>npm install -g @enfiy/enfiy-code</code></p>

</div>

![Enfiy Code Screenshot](./docs/assets/enfiy-cli-screenshot.png)

## Quickstart

Ensure you have [Node.js v18 or higher](https://nodejs.org/en/download) installed.

```bash
# Run immediately
npx @enfiy/enfiy-code

# Or install globally
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

### Cloud Providers

| Provider | Description |
|---------|-------------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="24" /> **Google Gemini** | Multimodal AI with strong reasoning capabilities |
| <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/OpenAI_Logo.svg" width="24" /> **OpenAI GPT** | Popular and versatile language models |
| <img src="https://avatars.githubusercontent.com/u/108914997?s=200&v=4" width="24" /> **Anthropic Claude** | Industry-leading AI for coding tasks |
| <img src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" width="24" /> **HuggingFace** | Access to a wide variety of open-source models |
| <img src="https://avatars.githubusercontent.com/u/139761605?s=200&v=4" width="24" /> **Mistral AI** | Open-source focused AI models |

---

### Local Providers

| Provider | Description |
|---------|-------------|
| <img src="https://ollama.com/public/ollama-mark.svg" width="24" /> **Ollama** | Local model runner with full privacy |
| <img src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" width="24" /> **HuggingFace (Local)** | Host and run models locally |
| 🦙 **llama.cpp** | Efficient local inference in C++ |
| ⚡ **vLLM** | High-performance inference engine |
| 🖥️ **Text Generation UI** | Web-based UI for local models (Oobabooga) |
| 🕹️ **KoboldCpp** | Local model runner with advanced sampling for storytelling |


## Core Commands

- `/provider` - Manage AI providers and models
- `/mcp` - Manage MCP servers and integrations
- `/tools` - List available development tools
- `/bug` - Report issues with automatic diagnostics

For detailed command documentation, see [CLI Commands](./docs/cli/commands.md).

## Examples

```bash
# Start a new project
cd my-project/
enfiy
> Create a React app with TypeScript and authentication

# Analyze existing code
> Review this codebase for security vulnerabilities

# Automate workflows
> Write comprehensive tests for the API endpoints
```

## Documentation

- [Installation Guide](./docs/installation.md)
- [CLI Commands](./docs/cli/commands.md)
- [API Key Configuration](./docs/api-configuration.md)
- [MCP Integration](./docs/mcp-integration.md)
- [Privacy & Security](./docs/privacy-security.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Development

```bash
git clone https://github.com/enfiy/enfiy-code.git
cd enfiy-code
npm install
npm run build
npm start
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

[Apache 2.0 License](./LICENSE)