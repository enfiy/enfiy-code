# API Configuration Guide

This guide covers how to configure API keys for various AI providers in Enfiy Code.

## Configuration Methods

### Method 1: Environment Variables (.env file)

Create a `.env` file in the project root directory:

```bash
# Gemini API Key (Google AI Studio)
GEMINI_API_KEY=your-gemini-api-key-here

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Anthropic API Key
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Mistral API Key
MISTRAL_API_KEY=your-mistral-api-key-here

# HuggingFace API Key
HUGGINGFACE_API_KEY=your-huggingface-api-key-here
```

### Method 2: Interactive Provider Setup

1. Start the application: `pnpm start` or `npx @enfiy/enfiy-code`
2. Select "Cloud AI" when prompted
3. Choose your provider and enter your API key
4. The key will be encrypted and stored securely

### Method 3: Use Local AI (No API Key Required)

1. Install Ollama: https://ollama.ai/
2. Start Ollama: `ollama serve`
3. Pull a model: `ollama pull llama3.2:3b`
4. Start Enfiy Code and select "Local AI"

## Provider-Specific Setup

### Cloud Providers

#### OpenAI

- **API Key Format**: `sk-...`
- **Get Key**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Environment Variable**: `OPENAI_API_KEY`

#### Anthropic (Claude)

- **API Key Format**: `sk-ant-api03-...`
- **Get Key**: [Anthropic Console](https://console.anthropic.com/settings/keys)
- **Environment Variable**: `ANTHROPIC_API_KEY`

#### Google Gemini

- **API Key Format**: `AIza...`
- **Get Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Environment Variable**: `GEMINI_API_KEY`

#### Mistral

- **Get Key**: [Mistral Console](https://console.mistral.ai/)
- **Environment Variable**: `MISTRAL_API_KEY`

#### HuggingFace

- **API Key Format**: `hf_...`
- **Get Key**: [HuggingFace Settings](https://huggingface.co/settings/tokens)
- **Environment Variable**: `HUGGINGFACE_API_KEY`

### Local Providers

#### Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2:8b

# Verify it's running
ollama list

# Optional: Set custom host
export OLLAMA_HOST="http://localhost:11434"
```

## Secure Storage

Enfiy Code encrypts and stores API keys locally in `~/.enfiy/` using system keychain (keytar) for maximum security.

## Troubleshooting

If you see "Missing API key" errors:

1. Make sure your `.env` file is in the project root
2. Check that the API key variable names match exactly
3. Restart the application after adding keys
4. Try using the `/provider` command in the app to set keys
5. Verify your API key is valid by testing it directly with the provider
