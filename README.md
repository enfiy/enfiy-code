<h1 align="center">Enfiy Code</h1>
<p align="center">A universal AI coding agent — local or cloud, your choice</p>

<p align="center"><code>npm install @enfiy/enfiy-code</code></p>

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
   npx https://github.com/enfiy-ecosystem/enfiy-cli
   ```

   Or install it with:

   ```bash
   npm install -g @enfiy/enfiy-code
   enfiy
   ```

3. **Pick a color theme**
4. **Authenticate:** When prompted, sign in with your AI provider account. This will grant you access to various AI models depending on your provider configuration.

You are now ready to use Enfiy Code!

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

### For advanced use or increased limits:

If you need to use a specific model or require a higher request capacity, you can configure API keys for various AI providers:

1. **For Gemini**: Generate a key from [Google AI Studio](https://aistudio.google.com/apikey).
   ```bash
   export GEMINI_API_KEY="YOUR_API_KEY"
   ```

   **For Ollama**: Set up your local Ollama server.
   ```bash
   export OLLAMA_HOST="http://localhost:11434"
   ```

2. **For other providers**: See the [authentication](./docs/cli/authentication.md) guide for configuration details.

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

## Contributing

We welcome contributions to Enfiy Code! Please see our [contributing guidelines](./CONTRIBUTING.md) for more information on how to get started.

## License

Enfiy Code is licensed under the [Apache 2.0 License](./LICENSE).
