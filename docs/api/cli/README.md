# Enfiy Code

Within Enfiy Code, `packages/cli` is the frontend for users to interact with multiple AI models including OpenAI, Anthropic Claude, Google Gemini, Mistral, and local models via Ollama. For a general overview of Enfiy Code, see the [main documentation page](../README.md).

## Navigating this section

- **[Authentication](./authentication.md):** A guide to setting up authentication with various AI service providers.
- **[Commands](./commands.md):** A reference for Enfiy Code commands (e.g., `/help`, `/tools`, `/theme`).
- **[Configuration](./configuration.md):** A guide to tailoring Enfiy Code behavior using configuration files.
- **[Token Caching](./token-caching.md):** Optimize API costs through token caching.
- **[Themes](./themes.md)**: A guide to customizing the CLI's appearance with different themes.
- **[Tutorials](tutorials.md)**: A tutorial showing how to use Enfiy Code to automate a development task.

## Non-interactive mode

Enfiy Code can be run in a non-interactive mode, which is useful for scripting and automation. In this mode, you pipe input to the CLI, it executes the command, and then it exits.

The following example pipes a command to Enfiy Code from your terminal:

```bash
echo "What is fine tuning?" | enfiy
```

Enfiy Code executes the command and prints the output to your terminal. Note that you can achieve the same behavior by using the `--prompt` or `-p` flag. For example:

```bash
enfiy -p "What is fine tuning?"
```
