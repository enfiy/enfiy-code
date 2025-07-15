# API Configuration Guide

This guide covers how to configure API keys for various AI providers in Enfiy Code.

## Environment Variables

### Cloud Providers

#### OpenAI

```bash
export OPENAI_API_KEY="sk-..."
```

#### Anthropic

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

#### Google Gemini

```bash
export GEMINI_API_KEY="AIza..."
```

#### Mistral

```bash
export MISTRAL_API_KEY="..."
```

#### HuggingFace

```bash
export HUGGINGFACE_API_KEY="hf_..."
```

### Local Providers

#### Ollama

```bash
export OLLAMA_HOST="http://localhost:11434"
```

## Secure Storage

Enfiy Code encrypts and stores API keys locally in `~/.enfiy/` using AES-256-GCM encryption.

## Provider-Specific Setup

### Obtaining API Keys

1. **OpenAI**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Anthropic**: Visit [Anthropic Console](https://console.anthropic.com/)
3. **Google Gemini**: Visit [Google AI Studio](https://aistudio.google.com/apikey)
4. **Mistral**: Visit [Mistral Console](https://console.mistral.ai/)
5. **HuggingFace**: Visit [HuggingFace Settings](https://huggingface.co/settings/tokens)

### Local Provider Setup

For local providers like Ollama, ensure the service is running before using Enfiy Code:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2:8b

# Verify it's running
ollama list
```
