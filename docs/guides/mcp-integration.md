# MCP Integration Guide

Model Context Protocol (MCP) allows Enfiy Code to connect with external tools and services.

## Overview

MCP servers extend Enfiy Code's capabilities by providing:
- Database connections
- API integrations
- File system access
- Git operations
- Web search capabilities

## Commands

### List MCP Servers
```bash
/mcp list
```

### Install Server
```bash
/mcp install <server-name>
```

### Start/Stop Servers
```bash
/mcp start <server-name>
/mcp stop <server-name>
```

### Configure Server
```bash
/mcp config <server-name>
```

### Check Status
```bash
/mcp status
```

### Tool Descriptions
```bash
/mcp desc     # Enable descriptions
/mcp nodesc   # Disable descriptions
```

## Popular MCP Servers

### File System
- Read/write files
- Directory operations
- File search capabilities

### Git
- Repository operations
- Commit history
- Branch management

### Database
- SQL queries
- Schema management
- Data manipulation

### Web Search
- Search engines integration
- Content fetching
- API access

## Creating Custom MCP Servers

MCP servers communicate via JSON-RPC protocol. Basic structure:

```javascript
{
  "name": "my-server",
  "version": "1.0.0",
  "tools": [
    {
      "name": "my-tool",
      "description": "Tool description",
      "parameters": {
        "type": "object",
        "properties": {
          "input": { "type": "string" }
        }
      }
    }
  ]
}
```

## Security Considerations

- MCP servers run with system permissions
- Review server code before installation
- Use trusted sources only
- Monitor server activities

## Troubleshooting

### Server Won't Start
- Check port availability
- Verify dependencies installed
- Review server logs

### Connection Issues
- Confirm server is running
- Check firewall settings
- Verify configuration

For more details, see the [MCP specification](https://github.com/modelcontextprotocol/specification).