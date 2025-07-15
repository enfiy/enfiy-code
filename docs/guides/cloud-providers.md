# Cloud AI Providers Guide

Complete setup and best practices guide for cloud AI providers in Enfiy Code.

## Overview

Cloud AI providers offer powerful, cutting-edge models with extensive capabilities. This guide covers setup, configuration, and best practices for each supported cloud provider.

## Supported Cloud Providers

### Anthropic Claude
Advanced AI assistant with strong reasoning capabilities and safety features.

**Models Available:**
- Claude 3.5 Sonnet (Recommended for coding)
- Claude 3 Opus (Most capable, higher cost)
- Claude 3 Haiku (Fast and efficient)

**Setup:**
```bash
# Start Enfiy Code and select Anthropic
enfiy
/provider

# Or set via environment variable
export ANTHROPIC_API_KEY="your-api-key-here"
```

**Best Practices:**
- Excellent for complex code analysis and refactoring
- Strong at explaining technical concepts
- Good safety measures for security-sensitive code
- Handles large codebases efficiently

### OpenAI GPT
Popular and versatile language models with strong code capabilities.

**Models Available:**
- GPT-4 Turbo (Latest, most capable)
- GPT-4 (Strong reasoning, good for complex tasks)
- GPT-3.5 Turbo (Fast and cost-effective)

**Setup:**
```bash
# Configure in Enfiy Code
/provider
# Select OpenAI and enter API key

# Or use environment variable
export OPENAI_API_KEY="your-api-key-here"
```

**Best Practices:**
- Great for creative coding solutions
- Excellent for documentation generation
- Strong at code completion and suggestions
- Good balance of capability and speed

### Google Gemini
Multimodal AI with strong reasoning and code understanding.

**Models Available:**
- Gemini 1.5 Pro (Latest, multimodal)
- Gemini 1.0 Pro (Efficient for text tasks)

**Setup with OAuth (Recommended):**
```bash
# Start Enfiy Code
enfiy
/provider
# Select Google Gemini and follow OAuth flow
```

**Setup with API Key:**
```bash
export GOOGLE_API_KEY="your-api-key-here"
```

**Custom OAuth Setup:**
```bash
export ENFIY_GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export ENFIY_GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
```

**Best Practices:**
- Excellent for multimodal tasks (can analyze images)
- Strong at understanding project structure
- Good for research and information gathering
- Integrates well with Google services

### Mistral AI
Open-source focused AI models with strong performance.

**Models Available:**
- Mistral Large (Most capable)
- Mistral Medium (Balanced performance)
- Mistral Small (Fast and efficient)

**Setup:**
```bash
# Configure via provider selection
/provider
# Select Mistral and enter API key

# Environment variable
export MISTRAL_API_KEY="your-api-key-here"
```

**Best Practices:**
- Good for privacy-conscious users
- Strong at European language support
- Efficient for standard coding tasks
- Open-source friendly approach

### HuggingFace
Access to various open-source models via API.

**Setup:**
```bash
# OAuth flow (recommended)
/provider
# Select HuggingFace and follow OAuth

# Or with access token
export HF_TOKEN="your-access-token"

# Custom OAuth client
export HF_CLIENT_ID="your-huggingface-app-id"
```

**Best Practices:**
- Great for experimenting with different models
- Support for specialized models
- Good for research and development
- Can access latest open-source models

## Provider Comparison

### Capability Comparison
| Provider | Code Quality | Speed | Cost | Multimodal | Privacy |
|----------|-------------|-------|------|------------|---------|
| Anthropic | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ |
| OpenAI | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Google | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Mistral | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ |
| HuggingFace | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Use Case Recommendations

**For Complex Code Analysis:**
- Primary: Anthropic Claude 3.5 Sonnet
- Alternative: OpenAI GPT-4 Turbo

**For Fast Development:**
- Primary: OpenAI GPT-3.5 Turbo
- Alternative: Mistral Small

**For Multimodal Tasks:**
- Primary: Google Gemini 1.5 Pro
- Alternative: OpenAI GPT-4 Vision

**For Privacy-Sensitive Projects:**
- Primary: Anthropic Claude
- Alternative: Mistral AI

**For Cost-Effective Usage:**
- Primary: HuggingFace models
- Alternative: Mistral Small

## Authentication Methods

### API Keys
Simple and direct authentication method.

**Obtaining API Keys:**
1. **Anthropic**: Visit [console.anthropic.com](https://console.anthropic.com)
2. **OpenAI**: Visit [platform.openai.com](https://platform.openai.com)
3. **Google**: Visit [makersuite.google.com](https://makersuite.google.com)
4. **Mistral**: Visit [console.mistral.ai](https://console.mistral.ai)
5. **HuggingFace**: Visit [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

**Setting API Keys:**
```bash
# Through Enfiy Code UI
/provider
# Follow the prompts to enter your API key

# Through environment variables
export ANTHROPIC_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
export GOOGLE_API_KEY="your-key"
export MISTRAL_API_KEY="your-key"
export HF_TOKEN="your-token"
```

### OAuth 2.0
More secure authentication with better user experience.

**Supported Providers:**
- Google Gemini (Recommended)
- HuggingFace (Recommended)

**Setting Up Custom OAuth:**

**Google Gemini:**
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable the Generative Language API
4. Create OAuth 2.0 Client ID (Desktop application)
5. Set environment variables:
```bash
export ENFIY_GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export ENFIY_GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
```

**HuggingFace:**
1. Visit [HuggingFace Applications](https://huggingface.co/settings/applications)
2. Create a new OAuth application
3. Set redirect URI to `http://localhost:8080/callback`
4. Set environment variable:
```bash
export HF_CLIENT_ID="your-huggingface-app-id"
```

## Model Selection Guidelines

### Task-Specific Recommendations

**Code Generation:**
- Complex algorithms: Claude 3.5 Sonnet, GPT-4 Turbo
- Quick scripts: GPT-3.5 Turbo, Mistral Small
- Documentation: Any provider works well

**Code Review:**
- Security analysis: Claude 3.5 Sonnet
- Performance review: GPT-4 Turbo
- Style consistency: GPT-3.5 Turbo

**Debugging:**
- Complex issues: Claude 3.5 Sonnet, GPT-4 Turbo
- Quick fixes: GPT-3.5 Turbo, Mistral Medium
- System architecture: Claude 3 Opus

**Learning and Explanation:**
- Concept explanation: Any provider
- Tutorial creation: GPT-4, Claude 3.5 Sonnet
- Code commenting: GPT-3.5 Turbo, Mistral Small

### Performance Considerations

**Response Time:**
- Fastest: GPT-3.5 Turbo, Mistral Small
- Balanced: GPT-4 Turbo, Claude 3.5 Sonnet
- Slower but powerful: Claude 3 Opus, GPT-4

**Token Efficiency:**
- Most efficient: Claude models
- Balanced: GPT models
- Variable: HuggingFace models

**Cost Optimization:**
- Most economical: HuggingFace, Mistral Small
- Balanced: GPT-3.5 Turbo, Mistral Medium
- Premium: GPT-4, Claude 3 Opus

## Best Practices

### Security and Privacy

**API Key Management:**
```bash
# Check stored credentials (shows providers only)
/settings auth status

# Remove specific provider
/settings auth remove openai

# Clear all credentials
/settings auth clear
```

**Data Handling:**
- Review provider privacy policies
- Avoid sending sensitive code to cloud providers when possible
- Use local providers for highly sensitive projects
- Regularly rotate API keys

### Usage Optimization

**Context Management:**
- Keep conversations focused on specific tasks
- Start new sessions for unrelated topics
- Use checkpointing for long development sessions

**Prompt Engineering:**
- Be specific about requirements
- Provide relevant context and examples
- Ask for explanations when learning
- Request multiple approaches for complex problems

**Cost Management:**
- Monitor API usage regularly
- Use efficient models for simple tasks
- Implement request caching where appropriate
- Set usage limits and alerts

### Provider Switching

**When to Switch Providers:**
- Different models excel at different tasks
- Cost considerations for large projects
- Specific feature requirements (e.g., multimodal)
- Regional availability or compliance needs

**Switching Process:**
```bash
# Quick provider switch
/provider

# Check current provider
/settings provider

# Switch for specific tasks
> Switch to GPT-4 for this complex analysis
> Use Claude for this security review
```

## Troubleshooting

### Common Issues

**Authentication Problems:**
```bash
# Check authentication status
/settings auth status

# Re-authenticate
/provider
# Select provider and re-enter credentials

# Clear and re-set credentials
/settings auth clear
```

**Rate Limiting:**
- Reduce request frequency
- Switch to different provider temporarily
- Check provider dashboard for limits
- Implement request queuing

**Model Availability:**
- Some models may be temporarily unavailable
- Check provider status pages
- Try alternative models
- Contact provider support if needed

### Error Messages

**Common Error Types:**
- `401 Unauthorized`: Check API key validity
- `429 Too Many Requests`: Rate limit exceeded
- `503 Service Unavailable`: Provider service issues
- `400 Bad Request`: Invalid request format

**Getting Help:**
```bash
# Report issues in Enfiy Code
/bug

# Check troubleshooting guide
# See: docs/troubleshooting/README.md
```

## Future Considerations

### Emerging Providers
- New providers may be added regularly
- Check documentation for latest updates
- Provide feedback on desired providers

### Model Updates
- Providers frequently update models
- Enfiy Code will support new models as available
- Monitor provider announcements for new capabilities

### Feature Enhancements
- Multimodal support expansion
- Improved context management
- Better cost optimization tools
- Enhanced provider switching

This guide should help you make informed decisions about cloud provider selection and optimize your AI-assisted development workflow.