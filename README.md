<h1 align="center">Enfiy Code</h1>
<p align="center">A universal AI coding agent — local or cloud, your choice</p>

<p align="center"><code>npm install @enfiy/enfiy-code</code></p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=npm,nodejs,windows,linux,apple,ubuntu" />
</p>

![Enfiy Code Screenshot](./docs/assets/enfiy-cli-screenshot.png)

This repository contains the Enfiy Code, a command-line AI workflow tool that connects to your
tools, understands your code and accelerates your workflows.

With Enfiy Code you can:

- Query and edit large codebases with powerful AI models including support for large context windows.
- Generate new apps from PDFs or sketches, using multimodal AI capabilities.
- Automate operational tasks, like querying pull requests or handling complex rebases.
- Use tools and MCP servers to connect new capabilities, including [media generation with Imagen,
  Veo or Lyria](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)
- Ground your queries with web search capabilities when using supported AI providers.

## Quickstart

1. **Prerequisites:** Ensure you have [Node.js version 18](https://nodejs.org/en/download) or higher installed.
2. **Run the CLI:** Execute the following command in your terminal:

   ```bash
   npx @enfiy/enfiy-code
   ```

   Or install it globally with:

   ```bash
   npm install -g @enfiy/enfiy-code
   enfiy
   ```

3. **First-time setup:** When you run Enfiy Code for the first time, you'll be guided through:
   - Picking a color theme
   - Selecting an AI provider (local or cloud)
   - Configuring authentication for your chosen provider

4. **Smart configuration:** Once configured, Enfiy Code will remember your settings and automatically use your last selected model on subsequent runs.

You are now ready to use Enfiy Code!

## Supported AI Providers

Enfiy Code supports both local and cloud AI providers:

### Cloud Providers
- **Anthropic Claude** - Industry-leading AI for coding tasks
- **OpenAI GPT** - Popular and versatile language models
- **Google Gemini** - Multimodal AI with excellent reasoning capabilities
- **Mistral AI** - Open-source focused AI models
- **HuggingFace** - Access to a wide variety of open-source models

### Local Providers
- **Ollama** - Run models locally with full privacy
- **LM Studio** - User-friendly local model hosting
- **llama.cpp** - Efficient C++ implementation for local inference
- **vLLM** - High-performance inference engine
- **Text Generation UI** - Web-based interface for local models

## Development Installation

For development or to use the latest features:

```bash
# Clone the repository
git clone https://github.com/enfiy-ecosystem/enfiy-code.git
cd enfiy-code

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm start

# Or link for global development use
npm link
enfiy
```

### Manual API Key Configuration

If you prefer to configure API keys manually or need advanced configuration:

1. **For Gemini**: Generate a key from [Google AI Studio](https://aistudio.google.com/apikey).
   ```bash
   export GEMINI_API_KEY="YOUR_API_KEY"
   ```

2. **For Anthropic**: Get your API key from [Anthropic Console](https://console.anthropic.com/).
   ```bash
   export ANTHROPIC_API_KEY="YOUR_API_KEY"
   ```

3. **For OpenAI**: Generate a key from [OpenAI Platform](https://platform.openai.com/api-keys).
   ```bash
   export OPENAI_API_KEY="YOUR_API_KEY"
   ```

4. **For Ollama**: Set up your local Ollama server.
   ```bash
   export OLLAMA_HOST="http://localhost:11434"
   ```

5. **For other providers**: See the [authentication](./docs/cli/authentication.md) guide for configuration details.

## Examples

Once the CLI is running, you can start interacting with AI models from your shell.

You can start a project from a new directory:

```sh
cd new-project/
enfiy
> Write me a Discord bot that answers questions using a FAQ.md file I will provide
```

Or work with an existing project:

```sh
git clone https://github.com/enfiy-ecosystem/enfiy-cli
cd enfiy-cli
enfiy
> Give me a summary of all of the changes that went in yesterday
```

### Next steps

- Explore the available **[CLI Commands](./docs/cli/commands.md)**.
- If you encounter any issues, review the **[Troubleshooting guide](./docs/troubleshooting.md)**.
- For more comprehensive documentation, see the [full documentation](./docs/index.md).
- Take a look at some [popular tasks](#popular-tasks) for more inspiration.

## Popular tasks

### Explore a new codebase

Start by `cd`ing into an existing or newly-cloned repository and running `enfiy`.

```text
> Describe the main pieces of this system's architecture.
```

```text
> What security mechanisms are in place?
```

### Work with your existing code

```text
> Implement a first draft for GitHub issue #123.
```

```text
> Help me migrate this codebase to the latest version of Java. Start with a plan.
```

### Automate your workflows

Use MCP servers to integrate your local system tools with your enterprise collaboration suite.

```text
> Make me a slide deck showing the git history from the last 7 days, grouped by feature and team member.
```

```text
> Make a full-screen web app for a wall display to show our most interacted-with GitHub issues.
```

### Interact with your system

```text
> Convert all the images in this directory to png, and rename them to use dates from the exif data.
```

```text
> Organise my PDF invoices by month of expenditure.
```

## Features

### Smart Provider Management
- **Automatic configuration detection** - Skip setup dialogs when already configured
- **Last model restoration** - Automatically restore your previously used model
- **Secure credential storage** - API keys are encrypted and stored securely
- **Multi-provider support** - Easily switch between different AI providers

### Enhanced User Experience
- **Streamlined startup** - Get to coding faster with intelligent configuration checks
- **Persistent settings** - Your preferences are remembered across sessions
- **Intuitive setup flow** - Clear guidance for first-time users
- **Flexible authentication** - Support for API keys, OAuth, and subscription plans

### Development Tools
- **Large codebase support** - Handle projects of any size with intelligent context management
- **Multi-file editing** - Make changes across multiple files simultaneously
- **Code analysis** - Understand complex codebases with AI-powered insights
- **Workflow automation** - Automate repetitive coding tasks

## Contributing

We welcome contributions to Enfiy Code! Please see our [contributing guidelines](./CONTRIBUTING.md) for more information on how to get started.

## License

Enfiy Code is licensed under the [Apache 2.0 License](./LICENSE).