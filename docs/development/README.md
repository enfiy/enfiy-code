# Development Documentation

Technical documentation for contributors and developers working on Enfiy Code.

## Getting Started

### Development Setup

1. **Prerequisites**
   - Node.js v18 or higher
   - npm or yarn package manager
   - Git

2. **Environment Setup**

   ```bash
   git clone https://github.com/enfiy-ecosystem/enfiy-code.git
   cd enfiy-code
   npm install
   npm run build
   npm start
   ```

3. **Development Commands**
   ```bash
   npm run start    # Start in development mode
   npm run debug    # Start with debugging enabled
   npm run build    # Build for production
   npm run test     # Run test suite
   npm run lint     # Check code style and quality
   npm run format   # Format code automatically
   npm run typecheck # TypeScript type checking
   npm run preflight # Complete CI pipeline check
   ```

## Architecture

### System Overview

- **[Architecture](./architecture.md)** – High-level system design and component interaction
- **[Deployment](./deployment.md)** – Deployment strategies and environment setup

### Extension Development

- **[Extensions](./extension.md)** – Creating custom extensions and plugins

## Code Organization

### Package Structure

```
enfiy-code/
├── packages/
│   ├── cli/           # Command-line interface
│   └── core/          # Core system and tools
├── docs/              # Documentation
├── scripts/           # Build and utility scripts
└── integration-tests/ # Integration test suite
```

### Key Directories

- `packages/cli/src/` – CLI implementation
- `packages/core/src/` – Core system, tools, and providers
- `docs/` – User and developer documentation
- `scripts/` – Build automation and utilities

## Development Guidelines

### Code Style

- TypeScript for all new code
- ESLint configuration enforced
- Prettier for code formatting
- Conventional commits for git messages

### Testing Strategy

- Unit tests for core functionality
- Integration tests for tool workflows
- End-to-end tests for CLI interactions
- Performance benchmarks

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Run preflight checks
5. Submit pull request with description

## Tool Development

### Creating Custom Tools

```typescript
// Example tool implementation
export class CustomTool extends BaseTool {
  name = 'custom-tool';
  description = 'Description of what the tool does';

  async execute(params: ToolParams): Promise<ToolResult> {
    // Implementation
    return {
      success: true,
      data: result,
      metadata: { tool: this.name },
    };
  }
}
```

### Tool Registration

```typescript
// Register in tool registry
toolRegistry.register(new CustomTool());
```

## Provider Development

### AI Provider Interface

```typescript
interface AIProvider {
  name: string;
  models: string[];
  authenticate(config: AuthConfig): Promise<boolean>;
  generateResponse(request: GenerateRequest): Promise<GenerateResponse>;
}
```

### Provider Implementation

```typescript
export class CustomProvider implements AIProvider {
  name = 'custom-provider';
  models = ['model-1', 'model-2'];

  async authenticate(config: AuthConfig): Promise<boolean> {
    // Authentication logic
  }

  async generateResponse(request: GenerateRequest): Promise<GenerateResponse> {
    // Response generation
  }
}
```

## Testing

### Running Tests

```bash
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests
```

### Test Structure

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
└── fixtures/         # Test data and fixtures
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { CustomTool } from '../src/tools/custom-tool';

describe('CustomTool', () => {
  it('should execute successfully', async () => {
    const tool = new CustomTool();
    const result = await tool.execute({});
    expect(result.success).toBe(true);
  });
});
```

## Debugging

### Debug Mode

```bash
npm run debug           # Start with debug logging
DEBUG=enfiy:* npm start # Detailed debug output
```

### Common Debug Scenarios

- Provider authentication issues
- Tool execution failures
- Configuration problems
- Performance bottlenecks

### Debug Tools

- Built-in debug commands
- Chrome DevTools for Node.js
- Performance profiling
- Memory usage analysis

## Build System

### Build Process

1. TypeScript compilation
2. Asset bundling
3. Dependency resolution
4. Package preparation

### Build Configuration

- `tsconfig.json` – TypeScript configuration
- `esbuild.config.js` – Build tool configuration
- `package.json` – Package metadata and scripts

### Release Process

1. Version bump
2. Changelog generation
3. Build and test
4. Package publication
5. GitHub release

## Contributing

### Issue Reporting

- Use GitHub issue templates
- Provide reproduction steps
- Include system information
- Attach relevant logs

### Feature Requests

- Describe use case clearly
- Provide implementation ideas
- Consider backwards compatibility
- Discuss design implications

### Code Contributions

- Follow coding standards
- Include comprehensive tests
- Update documentation
- Consider performance impact

## Resources

### Development Tools

- VS Code with recommended extensions
- GitHub CLI for repository management
- Node.js debugging tools
- Performance monitoring

### External Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Vitest Testing Framework](https://vitest.dev/)
- [ESLint Rules](https://eslint.org/docs/rules/)

### Community

- GitHub Discussions for questions
- Issue tracker for bugs and features
- Pull requests for contributions
- Documentation improvements welcome
