# Deployment Guide

This guide covers different ways to deploy and run Enfiy Code in various environments.

## Installation Methods

### NPM Installation (Recommended)
```bash
npm install -g @enfiy/enfiy-code
```

### From Source
```bash
git clone https://github.com/your-org/enfiy-code.git
cd enfiy-code
pnpm install
pnpm run build
npm link
```

## System Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **RAM**: 2GB available memory
- **Storage**: 1GB free space
- **Platform**: Windows, macOS, Linux

### Recommended Requirements
- **Node.js**: 20.0.0 or higher
- **RAM**: 4GB available memory
- **Storage**: 5GB free space (for local models)
- **Platform**: Linux or macOS for best performance

## Deployment Scenarios

### Local Development Environment
```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run locally
pnpm start
```

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
name: Enfiy Code CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm run lint:ci
      - run: pnpm run build
      - run: pnpm run test:ci
```

### Docker Deployment
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Server Deployment
For server environments without interactive terminal:

```bash
# Set environment variables
export ENFIY_MODE=non-interactive
export OPENAI_API_KEY=your-key
export ANTHROPIC_API_KEY=your-key

# Run with piped input
echo "Help me write a function" | enfiy-code
```

## Configuration

### Environment Variables
```bash
# API Keys
export OPENAI_API_KEY=your-openai-key
export ANTHROPIC_API_KEY=your-anthropic-key
export GEMINI_API_KEY=your-gemini-key
export MISTRAL_API_KEY=your-mistral-key

# Behavior Configuration
export ENFIY_CONFIG_DIR=/custom/config/path
export ENFIY_THEME=default-dark
export ENFIY_PROVIDER=openai
export ENFIY_MODEL=gpt-4

# Debug and Logging
export ENFIY_DEBUG=true
export ENFIY_LOG_LEVEL=info
```

### Configuration Files
Create `.enfiy/settings.json` in your home directory:

```json
{
  "theme": "default-dark",
  "selectedProvider": "openai",
  "selectedModel": "gpt-4",
  "selectedAuthType": "api-key"
}
```

## Production Considerations

### Security
- Store API keys securely using environment variables or secret managers
- Use encrypted storage for credentials
- Regularly rotate API keys
- Limit API key permissions where possible

### Performance
- Use local models (Ollama) for better latency and privacy
- Configure appropriate token limits
- Monitor API usage and costs
- Use caching where appropriate

### Monitoring
- Enable telemetry for usage tracking
- Monitor API response times
- Set up alerts for API failures
- Track resource usage

### Scaling
- Use load balancers for multiple instances
- Configure rate limiting
- Implement request queuing for high volume
- Consider regional deployments

## Troubleshooting

### Common Issues

**Installation fails:**
```bash
# Clear npm cache
npm cache clean --force

# Try different Node version
nvm use 20
npm install -g @enfiy/enfiy-code
```

**Build errors:**
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm run build
```

**Runtime errors:**
```bash
# Check logs
enfiy-code --debug

# Verify configuration
enfiy-code --check-config
```

### Platform-Specific Issues

**Windows:**
- Use PowerShell or WSL2 for best experience
- May need to enable long path support
- Consider using Windows Terminal

**macOS:**
- May need to allow unsigned software in Security settings
- Ensure Xcode Command Line Tools are installed

**Linux:**
- Some distributions may need additional dependencies
- Check locale settings for Unicode support

## Health Checks

```bash
# Basic functionality check
echo "test" | enfiy-code --non-interactive

# Configuration validation
enfiy-code --validate-config

# Provider connectivity test
enfiy-code --test-providers
```

## Backup and Recovery

### Important Files to Backup
- `~/.enfiy/settings.json` - User configuration
- `~/.enfiy/secure.json` - Encrypted credentials
- `~/.enfiy/.key` - Encryption key
- Project-specific `.enfiy/` directories

### Recovery Process
1. Restore configuration files
2. Verify API key access
3. Test provider connectivity
4. Reconfigure if necessary