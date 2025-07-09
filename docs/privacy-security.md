# Privacy & Security

## Experimental Technology Disclaimer

Enfiy Code is an experimental AI-powered development tool. Please be aware:

- **Experimental Nature**: Under active development, may contain bugs or incomplete features
- **AI Model Limitations**: AI responses may be incorrect or biased. Always review AI-generated code
- **Data Security**: Be cautious with sensitive codebases
- **Third-Party Dependencies**: External AI services have their own policies
- **Breaking Changes**: Future updates may introduce breaking changes

## Data Collection

### Local Data (Stored on Your Device)
- Configuration settings in `~/.enfiy/`
- Encrypted API keys using AES-256-GCM
- Local debugging logs
- Temporary project context

### Telemetry Data (Optional)
- Anonymized usage statistics
- Error reports via `/bug` command
- Performance metrics

### How We Use Your Data
- Improve Enfiy Code performance
- Debug reported issues
- Understand feature usage
- Enhance security

## Data Transmission

### AI Provider Communications
- Code sent to selected providers for processing
- You control which provider to use
- Subject to provider privacy policies

### MCP Server Communications
- Data shared based on your commands
- Third-party servers have own policies

## Data Rights

- **Opt-Out**: Disable telemetry with `/settings telemetry false`
- **Local Control**: All configuration stored locally
- **Data Deletion**: Remove `~/.enfiy/` directory
- **Transparency**: View data through debug commands

## Security Measures

- API keys encrypted with AES-256-GCM
- No sensitive data on our servers
- TLS encryption for all communications
- Strict access controls on telemetry

## Third-Party Policies

- [OpenAI Privacy Policy](https://openai.com/privacy)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- [Google Privacy Policy](https://policies.google.com/privacy)

## Contact

- Security issues: security@enfiy.dev
- Privacy concerns: privacy@enfiy.dev
- Bug reports: Use `/bug` command