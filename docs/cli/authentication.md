# Authentication Setup

Enfiy Code supports multiple AI providers, each with their own authentication methods. You can configure one or more providers depending on your needs.

## Supported Providers

### OpenAI (ChatGPT)
1. **API Key Authentication:**
   - Obtain your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Set up during initial configuration or use `/provider` command
   - Supported models: GPT-4, GPT-3.5, GPT-4 Turbo, etc.

### Anthropic Claude
1. **API Key Authentication:**
   - Obtain your API key from [Anthropic Console](https://console.anthropic.com/)
   - Set up during initial configuration or use `/provider` command
   - Supported models: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku

### Google Gemini
1. **API Key Authentication:**
   - Obtain your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Set up during initial configuration or use `/provider` command
   - Supported models: Gemini 2.5 Pro, Gemini 1.5 Pro, Gemini 1.5 Flash

2. **OAuth Authentication (Gemini Code Assist):**
   - Use this option to log in with your Google account
   - During initial startup, Enfiy Code will direct you to a webpage for authentication
   - Your credentials will be cached locally for subsequent runs
   - Note: Browser must be able to communicate with the machine running Enfiy Code

### Mistral AI
1. **API Key Authentication:**
   - Obtain your API key from [Mistral AI Platform](https://console.mistral.ai/)
   - Set up during initial configuration or use `/provider` command
   - Supported models: Mistral Large, Mistral Medium, Mistral Small

### Local Models (Ollama)
1. **Local Installation:**
   - Install [Ollama](https://ollama.ai/) on your system
   - No API key required - runs completely local
   - Supported models: Llama 3.2, Code Llama, Mistral, and more
   - Enfiy Code will guide you through model installation

### HuggingFace (Experimental)
1. **Local Deployment:**
   - Set up local inference servers (TGI, vLLM, or Ollama)
   - No API key required for local deployment
   - Configure server endpoints during setup

## Initial Setup

When you first run Enfiy Code, you'll be prompted to configure a provider:

1. Run `enfiy` or `enfiy-code`
2. Select your preferred provider category (Cloud AI or Local AI)
3. Choose specific provider and follow authentication steps
4. Configure API keys or authentication as needed

## Managing Providers

You can switch between providers or add new ones using the `/provider` command:

```bash
/provider
```

This opens the provider selection interface where you can:
- Switch to a different provider
- Add new provider configurations
- Manage existing API keys
- Configure local model installations

## Security Notes

- API keys are stored securely in encrypted local storage
- Keys are never transmitted except to their respective service providers
- Local models (Ollama) don't require any external authentication
- You can delete stored credentials at any time using the provider management interface

## Environment Variables

You can also set API keys via environment variables:

```bash
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-claude-key"
export GEMINI_API_KEY="your-gemini-key"
export MISTRAL_API_KEY="your-mistral-key"
```

## Troubleshooting

If you encounter authentication issues:

1. Verify your API key is correct and has necessary permissions
2. Check your internet connection for cloud providers
3. For local models, ensure Ollama is installed and running
4. Use `/provider` to reconfigure authentication
5. Check the [troubleshooting guide](../troubleshooting.md) for common issues