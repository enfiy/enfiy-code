# First Steps with Enfiy Code

After installing Enfiy Code, this guide will walk you through your first interactions and essential commands.

## Starting Enfiy Code

```bash
# If installed globally
enfiy

# If using npx
npx @enfiy/enfiy-code
```

## Initial Setup

On first run, you'll be prompted to:

1. **Choose a theme** – Select from various color schemes
2. **Select an AI provider** – Choose between cloud and local options
3. **Configure authentication** – Set up API keys or OAuth

Your preferences are automatically saved to `~/.enfiy/config.json`.

## Essential Commands

### Slash Commands

```bash
/help               # Show available commands
/provider           # Switch AI provider or model
/settings           # View and modify settings
/theme              # Change visual theme
/mcp                # Connect to MCP servers
/bug                # Report bugs or issues
/exit               # Exit Enfiy Code
```

### Basic Interactions

#### Ask Questions
```
> What does this function do?
> How can I optimize this code?
> Explain the architecture of this project
```

#### Request Code Changes
```
> Add error handling to the login function
> Refactor this component to use hooks
> Create a new REST API endpoint for users
```

#### File Operations
```
> Read the package.json file
> Create a new React component called UserProfile
> Update the README with installation instructions
```

## Working with Files

### Direct File References
```
> Review the code in src/components/Header.tsx
> What's wrong with the function in utils/helpers.js?
> Add TypeScript types to the API functions
```

### Project-Wide Operations
```
> Find all TODO comments in this project
> List all React components
> Show me the project structure
```

## Using AI Providers

### Switching Providers
```bash
/provider
# Follow the interactive menu to select:
# - Provider (OpenAI, Anthropic, Google, etc.)
# - Model (GPT-4, Claude, Gemini, etc.)
# - Settings (temperature, max tokens)
```

### Local vs Cloud
- **Cloud providers**: More powerful but require API keys
- **Local providers**: Privacy-focused but require local setup

## Advanced Features

### MCP Integration
Connect external tools and services:
```bash
/mcp connect filesystem-server
/mcp connect database-server
/mcp list                    # Show connected servers
```

### Shell Integration
```
> Run the test suite
> Install the axios package
> Check the git status
```

### Multi-File Operations
```
> Refactor all components to use the new theme system
> Add logging to all API endpoints
> Update all imports to use absolute paths
```

## Configuration

### Settings File Location
```
~/.enfiy/
├── config.json          # Main configuration
├── keys.encrypted        # Encrypted API keys
└── logs/                # Debug logs
```

### Key Settings
```bash
/settings show            # View current settings
/settings theme dark      # Change theme
/settings telemetry false # Disable telemetry
```

## Tips for Effective Use

### Be Specific
```
# Good
> Add TypeScript interfaces for the User and Post models in types.ts

# Better
> Create TypeScript interfaces in src/types/models.ts for User (id, name, email) and Post (id, title, content, authorId)
```

### Use Context
```
> Looking at the current authentication flow, add password validation
> Based on the existing API structure, create an endpoint for user profiles
```

### Iterate and Refine
```
> Create a login form
> Add validation to the login form
> Style the login form to match the design system
> Add loading states to the login form
```

## Common Workflows

### Starting a New Project
```
1. > Create a new React TypeScript project structure
2. > Set up ESLint and Prettier configuration
3. > Add a basic routing setup with React Router
4. > Create a simple authentication system
```

### Code Review
```
1. > Review this file for potential security issues
2. > Check for performance bottlenecks in the API handlers
3. > Suggest improvements for code readability
4. > Identify any TypeScript type issues
```

### Debugging
```
1. > Help me debug this error: [paste error message]
2. > What could cause this API call to fail?
3. > Check the logic in this function step by step
4. > Trace the data flow from frontend to backend
```

## Next Steps

- **[MCP Integration Guide](../guides/mcp-integration.md)** – Connect external tools
- **[API Reference](../api/README.md)** – Explore all available tools
- **[Troubleshooting](../troubleshooting/README.md)** – Solve common issues

## Getting Help

- Use `/help` for interactive assistance
- Check the troubleshooting guide for common issues
- Use `/bug` to report problems
- Review the documentation for detailed explanations