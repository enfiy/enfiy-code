# API Key Setup Guide

Enfiy Code supports multiple AI providers. Here are the ways to configure API keys:

## Method 1: Environment Variables (.env file)

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

## Method 2: Use the Application's Provider Command

1. Start the application: `pnpm start`
2. Select "Cloud AI" when prompted
3. Choose your provider and enter your API key
4. The key will be encrypted and stored securely

## Method 3: Use Local AI (No API Key Required)

1. Install Ollama: https://ollama.ai/
2. Start Ollama: `ollama serve`
3. Pull a model: `ollama pull llama3.2:3b`
4. Start Enfiy Code and select "Local AI"

## Getting API Keys

- **Gemini**: https://makersuite.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **Mistral**: https://console.mistral.ai/
- **HuggingFace**: https://huggingface.co/settings/tokens

## Troubleshooting

If you see "Missing API key" errors:

1. Make sure your `.env` file is in the project root
2. Check that the API key variable names match exactly
3. Restart the application after adding keys
4. Try using the `/provider` command in the app to set keys
