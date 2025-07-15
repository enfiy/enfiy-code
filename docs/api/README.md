# API Reference

Technical documentation for Enfiy Code's architecture, tools, and interfaces.

## Architecture Overview

- **[CLI Interface](./cli/README.md)** – Command-line interface documentation
- **[Core System](./core/README.md)** – Core system architecture and APIs
- **[Tools System](./tools/README.md)** – Built-in tools and capabilities

## CLI Reference

### Commands

- **[Available Commands](./cli/commands.md)** – All slash commands and their usage
- **[Configuration](./cli/configuration.md)** – CLI configuration options
- **[Authentication](./cli/authentication.md)** – Provider authentication setup
- **[Themes](./cli/themes.md)** – Visual customization options
- **[Tutorials](./cli/tutorials.md)** – CLI-specific tutorials

### Token Management

- **[Token Caching](./cli/token-caching.md)** – How authentication tokens are managed

## Core System

### APIs

- **[Tools API](./core/tools-api.md)** – Tool development and integration API

## Tools Reference

### File System Tools

- **[File System](./tools/file-system.md)** – File operations and management
- **[Multi-File](./tools/multi-file.md)** – Batch file operations

### Communication Tools

- **[Web Fetch](./tools/web-fetch.md)** – HTTP requests and web content retrieval
- **[Web Search](./tools/web-search.md)** – Search engine integration
- **[Shell](./tools/shell.md)** – Command execution

### AI Tools

- **[Memory](./tools/memory.md)** – Conversation memory and context management

### Integration Tools

- **[MCP Server](./tools/mcp-server.md)** – Model Context Protocol server integration

## Data Formats

### Configuration Files

```json
{
  "provider": "anthropic",
  "model": "claude-3-sonnet",
  "theme": "default",
  "telemetry": true
}
```

### Tool Response Format

```json
{
  "success": true,
  "data": "...",
  "metadata": {
    "tool": "file-system",
    "operation": "read",
    "timestamp": "2025-01-13T..."
  }
}
```

## Extension Points

### Custom Tools

```typescript
interface CustomTool {
  name: string;
  description: string;
  execute(params: any): Promise<ToolResult>;
}
```

### Provider Integration

```typescript
interface AIProvider {
  name: string;
  authenticate(): Promise<boolean>;
  generateResponse(prompt: string): Promise<string>;
}
```

## Error Handling

### Common Error Codes

- `AUTH_FAILED` – Authentication failure
- `TOOL_ERROR` – Tool execution error
- `NETWORK_ERROR` – Network connectivity issue
- `CONFIG_ERROR` – Configuration problem

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "TOOL_ERROR",
    "message": "File not found",
    "details": {...}
  }
}
```

## Security Considerations

### API Key Storage

- Keys encrypted with AES-256-GCM
- Stored in `~/.enfiy/keys.encrypted`
- Never transmitted in plain text

### Data Privacy

- Local processing by default
- Cloud provider data policies apply
- Telemetry is optional and anonymized

## Performance

### Optimization Tips

- Use appropriate model sizes
- Enable caching for repeated operations
- Configure timeouts appropriately
- Monitor token usage

### Metrics

- Response time tracking
- Token usage monitoring
- Error rate analysis

## Compatibility

### Node.js Versions

- Minimum: Node.js v18
- Recommended: Node.js v20+
- LTS versions preferred

### Operating Systems

- ✅ Linux (all distributions)
- ✅ macOS (Intel and Apple Silicon)
- ✅ Windows 10/11
- ✅ WSL2

### Terminal Compatibility

- Modern terminals with Unicode support
- Color support recommended
- Minimum 80x24 characters
