# Architecture Overview

This document provides a comprehensive overview of Enfiy Code's architecture, including its components, design patterns, and how they interact.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   packages/cli  │───▶│  packages/core  │───▶│  AI Providers   │
│                 │    │                 │    │                 │
│ • User Interface│    │ • Provider Mgmt │    │ • OpenAI        │
│ • Commands      │    │ • Tool System   │    │ • Anthropic     │
│ • Themes        │    │ • Request Logic │    │ • Google Gemini │
│ • Settings      │    │ • File System   │    │ • Mistral       │
└─────────────────┘    └─────────────────┘    │ • Ollama (Local)│
                                              └─────────────────┘
```

## Package Structure

### packages/cli
The command-line interface and user-facing components.

**Key Components:**
- **UI Framework**: Ink-based React components for terminal UI
- **Command Processor**: Handles slash commands (`/help`, `/provider`, etc.)
- **Theme System**: Customizable color schemes and styling
- **Settings Management**: User preferences and configuration
- **Session Management**: Chat history and context

**Main Files:**
- `src/enfiy.tsx` - Entry point and main application
- `src/ui/App.tsx` - Core UI application component
- `src/ui/components/` - Reusable UI components
- `src/ui/hooks/` - Custom React hooks
- `src/config/` - Configuration management

### packages/core
The backend logic and AI provider integration.

**Key Components:**
- **Provider System**: Multi-provider AI model management
- **Tool Registry**: File system, web, and custom tools
- **Content Generation**: Request/response handling
- **Security**: API key encryption and secure storage
- **Telemetry**: Usage tracking and analytics

**Main Files:**
- `src/core/` - Core chat and request logic
- `src/providers/` - AI provider implementations
- `src/tools/` - Built-in tool implementations
- `src/telemetry/` - Usage tracking
- `src/utils/` - Shared utilities

## Design Patterns

### Provider Pattern
Each AI provider implements a common interface:

```typescript
interface ContentGenerator {
  generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse>;
  generateContentStream(request: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>>;
  listModels(): Promise<string[]>;
}
```

**Benefits:**
- Easy to add new providers
- Consistent behavior across providers
- Seamless provider switching

### Plugin Architecture
Tools are implemented as plugins:

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: any;
  execute(parameters: any): Promise<any>;
}
```

**Built-in Tools:**
- File system operations (read, write, edit)
- Shell command execution
- Web fetching and searching
- Memory management
- MCP (Model Context Protocol) integration

### Streaming Pattern
Real-time response streaming for better UX:

```typescript
async function* generateContentStream(): AsyncGenerator<GenerateContentResponse> {
  // Yield incremental responses
  for await (const chunk of streamingResponse) {
    yield { parts: [{ text: chunk }] };
  }
}
```

## Data Flow

### Request Flow
1. **User Input** → CLI captures input
2. **Command Processing** → Parse commands and content
3. **Provider Selection** → Route to appropriate AI provider
4. **Tool Integration** → Attach available tools
5. **API Request** → Send to AI service
6. **Response Streaming** → Stream response back to user
7. **Post-processing** → Handle tool calls, format output

### Configuration Flow
1. **Settings Discovery** → Look for config files
2. **Environment Variables** → Load from environment
3. **User Preferences** → Apply user customizations
4. **Provider Setup** → Initialize selected providers
5. **Tool Registration** → Register available tools

## Security Architecture

### API Key Management
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│   Encryption    │───▶│ Secure Storage  │
│                 │    │                 │    │                 │
│ • API Keys      │    │ • AES-256-GCM   │    │ • ~/.enfiy/     │
│ • Credentials   │    │ • Hardware RNG  │    │ • File perms    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Security Features:**
- AES-256-GCM encryption for API keys
- Hardware random key generation
- Restricted file permissions (0600)
- No credential logging
- Secure memory handling

### Network Security
- HTTPS-only communication
- Certificate validation
- Timeout handling
- Rate limiting
- Error sanitization

## State Management

### CLI State
React-based state management using Context API:

```typescript
const AppContext = createContext({
  messages: [],
  currentProvider: null,
  streamingState: 'idle',
  // ...
});
```

### Core State
Immutable state patterns:

```typescript
interface EnfiyState {
  providers: Map<string, Provider>;
  tools: Map<string, Tool>;
  config: Configuration;
  session: SessionState;
}
```

## Extensibility

### Adding New Providers
1. Implement `ContentGenerator` interface
2. Register in `provider-factory.ts`
3. Add authentication flow
4. Update UI components

### Adding New Tools
1. Implement `Tool` interface
2. Register in `tool-registry.ts`
3. Add parameter schemas
4. Handle permissions

### Custom Themes
1. Create theme definition
2. Add to theme registry
3. Implement color mappings
4. Test across terminals

## Performance Considerations

### Memory Management
- Streaming to avoid large buffers
- Garbage collection optimization
- Resource cleanup
- Memory leak prevention

### Network Optimization
- Connection pooling
- Request batching
- Timeout management
- Retry logic with backoff

### UI Performance
- Virtual scrolling for long outputs
- Efficient re-rendering
- Debounced input handling
- Lazy component loading

## Testing Architecture

### Unit Tests
- Jest/Vitest for core logic
- React Testing Library for UI
- Mock providers and tools
- Isolated component testing

### Integration Tests
- End-to-end workflows
- Provider integration
- File system operations
- Configuration loading

### Testing Patterns
```typescript
// Provider mocking
const mockProvider = {
  generateContent: jest.fn(),
  listModels: jest.fn()
};

// Tool testing
describe('FileReadTool', () => {
  it('should read file contents', async () => {
    const result = await fileReadTool.execute({ path: 'test.txt' });
    expect(result).toEqual(expectedContent);
  });
});
```

## Error Handling

### Error Categories
- **Network Errors**: API failures, timeouts
- **Authentication Errors**: Invalid keys, expired tokens
- **Configuration Errors**: Missing settings, invalid values
- **Tool Errors**: File not found, permission denied
- **User Errors**: Invalid commands, syntax errors

### Error Recovery
- Graceful degradation
- Automatic retries
- Fallback providers
- User-friendly messages
- Debug information

## Monitoring and Observability

### Telemetry
- Usage metrics
- Performance data
- Error tracking
- Feature adoption

### Logging
- Structured logging
- Log levels (debug, info, warn, error)
- Sensitive data filtering
- Configurable outputs

### Health Checks
- Provider connectivity
- Tool availability
- Configuration validity
- System resources