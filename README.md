<div style="max-width: 720px; margin: 0 auto;">
<div align="center">

# Enfiy Code

### _Universal AI Coding Agent for you_

<img src="https://skillicons.dev/icons?i=npm,nodejs,typescript,windows,linux,apple" />

<p align="center"><code>npm install -g @enfiy/enfiy-code</code></p>

</div>

## Quickstart

Ensure you have [Node.js v20 or higher](https://nodejs.org/en/download) installed.

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

<h3>Cloud AI (Powerful)</h3>

<table style="width: 100%;">
  <thead>
    <tr>
      <th style="width: 64px;">Provider</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <div style="text-align: center;">
          <img src="./docs/assets/provider/provider-anthropic-claude.png" width="42" />
        </div>
      </td>
      <td><strong>Anthropic Claude</strong><br>Industry-leading AI for coding tasks</td>
    </tr>
    <tr>
      <td>
        <div style="text-align: center;">
          <img src="./docs/assets/provider/provider-openai-gpt.png" width="42" />
        </div>
      </td>
      <td><strong>OpenAI GPT</strong><br>Popular and versatile language models</td>
    </tr>
    <tr>
      <td>
        <div style="text-align: center;">
          <img src="./docs/assets/provider/provider-google-gemini.png" width="42" />
        </div>
      </td>
      <td><strong>Google Gemini</strong><br>Multimodal AI with strong reasoning capabilities</td>
    </tr>
    <tr>
      <td>
        <div style="text-align: center;">
          <img src="./docs/assets/provider/provider-mistral-ai.png" width="42" />
        </div>
      </td>
      <td><strong>Mistral AI</strong><br>Open-source focused AI models</td>
    </tr>
  </tbody>
</table>

<h3>Local AI (Private)</h3>

<table style="width: 100%;">
  <thead>
    <tr>
      <th style="width: 64px;">Provider</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <div style="text-align: center;">
          <img src="./docs/assets/provider/provider-ollama.png" width="42" />
        </div>
      </td>
      <td><strong>Ollama</strong><br>Run models locally with full privacy</td>
    </tr>
  </tbody>
</table>

## Authentication

### OAuth Configuration (Optional)

For production use, you may want to set up custom OAuth applications:

#### Google Gemini OAuth

```bash
# Set custom Google OAuth credentials (optional)
export ENFIY_GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export ENFIY_GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
```

**To create your own Google OAuth client:**

1. Visit [Google Cloud Console](https://console.developers.google.com/auth/clients)
2. Create new OAuth 2.0 Client ID
3. Select "Desktop application"
4. Name it "Enfiy Code"
5. Use the credentials in environment variables above

#### HuggingFace OAuth

```bash
# Set custom HuggingFace OAuth client ID (optional)
export HF_CLIENT_ID="your-huggingface-app-id"
```

> **Note**: By default, Enfiy Code uses temporary OAuth clients for compatibility. Custom OAuth setup ensures proper branding in consent screens.

## Command Line Options

Enfiy Code supports various command-line options to customize your experience:

### Basic Options

- `-m, --model <model>` - Specify AI model to use
- `-p, --prompt <text>` - Start with an initial prompt

### Workflow Options

- `-y, --auto` - Automatically approve all AI actions
- `-a, --all-files` - Include all project files in context
- `-c, --checkpointing` - Enable file edit checkpointing

### Development Options

- `-d, --debug` - Enable debug mode with verbose logging
- `--show-memory-usage` - Display memory usage in status bar

### Sandbox Options

- `-s, --sandbox` - Run in isolated sandbox environment
- `--sandbox-image <image>` - Use custom sandbox container image

### Examples

```bash
# Start interactive mode
enfiy

# Use specific model
enfiy -m "gpt-4"

# Start with a prompt
enfiy -p "Review my code for security issues"

# Auto-approve all actions
enfiy --auto

# Enable debug mode
enfiy --debug
```

## Interactive Commands

Once Enfiy Code is running, use these commands to interact with the AI:

- `/provider` - Select AI provider and model
- `/mcp` - Connect to MCP servers for enhanced capabilities
- `/tool` - Access specialized tools and integrations
- `/help` - Show available commands and usage information
- `/bug` - Report bugs or issues to the development team
- Code with confidence, create without limits, command with ease

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

- **[Quick Start Guide](./docs/getting-started/README.md)** – Get up and running in minutes
- **[Installation](./docs/getting-started/installation.md)** – Detailed installation instructions
- **[First Steps](./docs/getting-started/first-steps.md)** – Essential commands and workflows
- **[API Configuration](./docs/getting-started/api-configuration.md)** – Set up AI provider authentication

### User Guides

- **[All Guides](./docs/guides/README.md)** – Complete guide collection
- **[MCP Integration](./docs/guides/mcp-integration.md)** – Connect external tools and services
- **[Checkpointing](./docs/guides/checkpointing.md)** – Save and restore conversation sessions

### API Reference

- **[API Documentation](./docs/api/README.md)** – Technical reference
- **[CLI Commands](./docs/api/cli/commands.md)** – Complete command reference
- **[Tools Reference](./docs/api/tools/README.md)** – Built-in tools and capabilities

### Development

- **[Development Guide](./docs/development/README.md)** – Contributing and development setup
- **[Architecture](./docs/development/architecture.md)** – System design and components
- **[Extensions](./docs/development/extension.md)** – Creating custom extensions

### Security

- **[Security Overview](./docs/security/README.md)** – Security policies and best practices
- **[Privacy Policy](./docs/security/privacy-policy.md)** – Data handling and privacy rights
- **[Telemetry](./docs/security/telemetry.md)** – Data collection and opt-out options

## Development

### Prerequisites for Development

- Node.js v20 or higher
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
    Thank you for using Enfiy Code!
  </p>
  <p style="color: #6b7280; font-size: 0.9em;">
    Built with ❤️ by the Enfiy Community
  </p>
  <br>
</div>

</div>
