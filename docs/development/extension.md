# Extension System

Enfiy Code provides a powerful extension system that allows you to add custom functionality, tools, providers, and integrations.

## Overview

The extension system supports:

- **Custom Tools**: Add new functionality accessible to AI models
- **Provider Extensions**: Integrate additional AI providers
- **Command Extensions**: Create new slash commands
- **Theme Extensions**: Add custom color schemes
- **MCP Integrations**: Connect Model Context Protocol servers

## Types of Extensions

### Tool Extensions

Custom tools that AI models can use to perform actions.

```typescript
// Example: Custom database tool
import { Tool } from '@enfiy/core';

export class DatabaseTool implements Tool {
  name = 'query_database';
  description = 'Execute SQL queries on the database';

  parameters = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'SQL query to execute' },
      database: { type: 'string', description: 'Database name' },
    },
    required: ['query'],
  };

  async execute(params: { query: string; database?: string }) {
    // Tool implementation
    const result = await this.executeQuery(params.query, params.database);
    return { result, rowCount: result.length };
  }
}
```

### Provider Extensions

Add support for new AI providers.

```typescript
// Example: Custom AI provider
import { ContentGenerator } from '@enfiy/core';

export class CustomProvider implements ContentGenerator {
  constructor(private apiKey: string) {}

  async generateContent(request: GenerateContentParameters) {
    // Provider implementation
    const response = await this.callCustomAPI(request);
    return this.formatResponse(response);
  }

  async generateContentStream(request: GenerateContentParameters) {
    // Streaming implementation
    const stream = await this.streamCustomAPI(request);
    yield * this.processStream(stream);
  }

  async listModels(): Promise<string[]> {
    return ['custom-model-1', 'custom-model-2'];
  }
}
```

### Command Extensions

Create new slash commands for the CLI.

```typescript
// Example: Custom command
import { Command } from '@enfiy/cli';

export class CustomCommand implements Command {
  name = 'analyze';
  description = 'Analyze code quality';

  async execute(args: string[], context: CommandContext) {
    const files = await this.getProjectFiles();
    const analysis = await this.analyzeCode(files);

    context.output(`Analysis complete: ${analysis.score}/100`);
    return analysis;
  }
}
```

## Creating Extensions

### Project Structure

```
my-enfiy-extension/
├── package.json
├── src/
│   ├── index.ts
│   ├── tools/
│   │   └── myTool.ts
│   ├── providers/
│   │   └── myProvider.ts
│   └── commands/
│       └── myCommand.ts
└── enfiy.config.js
```

### Extension Configuration

```javascript
// enfiy.config.js
module.exports = {
  name: 'my-extension',
  version: '1.0.0',
  tools: ['./src/tools/myTool.js'],
  providers: ['./src/providers/myProvider.js'],
  commands: ['./src/commands/myCommand.js'],
};
```

### Package.json Setup

```json
{
  "name": "enfiy-extension-example",
  "version": "1.0.0",
  "main": "dist/index.js",
  "enfiy": {
    "extension": true,
    "tools": ["dist/tools/*.js"],
    "providers": ["dist/providers/*.js"]
  },
  "peerDependencies": {
    "@enfiy/core": "^0.1.0",
    "@enfiy/cli": "^0.1.0"
  }
}
```

## Tool Development

### Tool Interface

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute(parameters: any, context: ToolContext): Promise<any>;
}
```

### Tool Context

```typescript
interface ToolContext {
  workingDirectory: string;
  user: string;
  session: SessionInfo;
  logger: Logger;
  fileSystem: FileSystemAPI;
}
```

### Example Tools

**File Analysis Tool:**

```typescript
export class FileAnalysisTool implements Tool {
  name = 'analyze_file';
  description = 'Analyze file complexity and quality';

  parameters = {
    type: 'object',
    properties: {
      filePath: { type: 'string' },
      language: {
        type: 'string',
        enum: ['typescript', 'javascript', 'python'],
      },
    },
    required: ['filePath'],
  };

  async execute(
    params: { filePath: string; language?: string },
    context: ToolContext,
  ) {
    const content = await context.fileSystem.readFile(params.filePath);
    const analysis = this.analyzeCode(content, params.language);

    return {
      complexity: analysis.complexity,
      issues: analysis.issues,
      suggestions: analysis.suggestions,
    };
  }
}
```

**API Integration Tool:**

```typescript
export class APITool implements Tool {
  name = 'call_api';
  description = 'Make HTTP API calls';

  parameters = {
    type: 'object',
    properties: {
      url: { type: 'string', format: 'uri' },
      method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
      headers: { type: 'object' },
      body: { type: 'string' },
    },
    required: ['url'],
  };

  async execute(params: any) {
    const response = await fetch(params.url, {
      method: params.method || 'GET',
      headers: params.headers,
      body: params.body,
    });

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    };
  }
}
```

## Provider Development

### Provider Interface

```typescript
interface ContentGenerator {
  generateContent(
    request: GenerateContentParameters,
  ): Promise<GenerateContentResponse>;
  generateContentStream(
    request: GenerateContentParameters,
  ): AsyncGenerator<GenerateContentResponse>;
  listModels(): Promise<string[]>;
  supportsStreaming: boolean;
}
```

### Custom Provider Example

```typescript
export class LocalLLMProvider implements ContentGenerator {
  supportsStreaming = true;
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async generateContent(request: GenerateContentParameters) {
    const response = await fetch(`${this.endpoint}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  async *generateContentStream(request: GenerateContentParameters) {
    const response = await fetch(`${this.endpoint}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      yield { parts: [{ text: chunk }] };
    }
  }

  async listModels() {
    const response = await fetch(`${this.endpoint}/models`);
    const data = await response.json();
    return data.models;
  }
}
```

## Installation and Management

### Installing Extensions

```bash
# Install from npm
npm install -g enfiy-extension-example

# Install locally
enfiy extension install ./my-extension

# Install from git
enfiy extension install https://github.com/user/enfiy-extension.git
```

### Managing Extensions

```bash
# List installed extensions
enfiy extension list

# Enable/disable extensions
enfiy extension enable my-extension
enfiy extension disable my-extension

# Update extensions
enfiy extension update my-extension

# Remove extensions
enfiy extension remove my-extension
```

### Extension Registry

```bash
# Search extensions
enfiy extension search database

# Show extension info
enfiy extension info my-extension

# Publish extension (requires authentication)
enfiy extension publish
```

## MCP Integration

### MCP Server Connection

```typescript
// Connect to MCP server
import { MCPClient } from '@enfiy/core';

const mcpClient = new MCPClient();
await mcpClient.connect('stdio', {
  command: 'python',
  args: ['-m', 'my_mcp_server'],
});

// List available tools
const tools = await mcpClient.listTools();

// Use MCP tools
const result = await mcpClient.callTool('server_tool', { param: 'value' });
```

### MCP Tool Wrapper

```typescript
export class MCPToolWrapper implements Tool {
  constructor(
    private mcpClient: MCPClient,
    private toolName: string,
    private toolInfo: any,
  ) {}

  get name() {
    return this.toolName;
  }
  get description() {
    return this.toolInfo.description;
  }
  get parameters() {
    return this.toolInfo.inputSchema;
  }

  async execute(parameters: any) {
    return await this.mcpClient.callTool(this.toolName, parameters);
  }
}
```

## Best Practices

### Security

- Validate all input parameters
- Sanitize file paths and system commands
- Use least privilege principles
- Avoid exposing sensitive data

### Performance

- Implement async operations properly
- Use streaming for large responses
- Cache expensive operations
- Handle timeouts gracefully

### Error Handling

```typescript
export class RobustTool implements Tool {
  async execute(parameters: any, context: ToolContext) {
    try {
      // Tool logic
      return await this.performOperation(parameters);
    } catch (error) {
      context.logger.error('Tool execution failed', { error, parameters });

      if (error instanceof ValidationError) {
        throw new ToolError('Invalid parameters', { cause: error });
      }

      throw new ToolError('Operation failed', { cause: error });
    }
  }
}
```

### Testing Extensions

```typescript
// Test setup
import { createMockToolContext } from '@enfiy/core/testing';

describe('MyTool', () => {
  let tool: MyTool;
  let context: ToolContext;

  beforeEach(() => {
    tool = new MyTool();
    context = createMockToolContext();
  });

  it('should execute successfully', async () => {
    const result = await tool.execute({ param: 'value' }, context);
    expect(result).toEqual(expectedResult);
  });
});
```

## Publishing Extensions

### Preparation

1. Write comprehensive documentation
2. Add unit tests
3. Follow naming conventions
4. Include examples and tutorials

### Publishing Process

```bash
# Build extension
npm run build

# Run tests
npm test

# Publish to npm
npm publish

# Register with Enfiy
enfiy extension register my-extension
```

### Extension Metadata

```json
{
  "enfiy": {
    "extension": true,
    "minVersion": "0.1.0",
    "category": "development",
    "tags": ["database", "sql", "analysis"],
    "author": "Your Name",
    "license": "MIT",
    "homepage": "https://github.com/user/extension"
  }
}
```
