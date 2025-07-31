# Release Notes - v0.1.13

## Ollama Integration Improvements

### Major Fixes

- **Fixed Ollama model detection** - All installed Ollama models are now properly recognized and usable
- **Fixed provider categorization** - Ollama models with `:latest` tag are now correctly identified as local models
- **Improved model selection** - System now dynamically detects and allows selection of all installed Ollama models

### Enhanced Model Support

- **Universal Ollama model support** - Any model installed via `ollama pull` is now automatically available
- **Better model descriptions** - Added support for newer models like DeepSeek R1, Qwen3, Phi4, and many others
- **Improved model metadata** - Shows model size, capabilities, and context length for better selection

### UI/UX Improvements

- **Fixed "Cloud" vs "Local" categorization** - Ollama models now correctly show as "[Local]" instead of "[Cloud]"
- **Fixed connection status** - Ollama now properly shows "Connection: Local AI (private, secure)"
- **Better model prioritization** - Commonly used models are prioritized but all models remain accessible

## Technical Changes

- **Improved model detection logic** in `modelUtils.ts` to properly handle `:latest` tags
- **Enhanced model information** in `ModelManager` with detailed descriptions and capabilities
- **Fixed provider detection order** to prevent Mistral cloud provider from capturing Ollama's mistral models
- **Dynamic model loading** from Ollama's API instead of hardcoded lists

## Bug Fixes

- Fixed issue where only `qwen` and `llama` models were selectable
- Fixed incorrect "No API Key" status for Ollama models
- Fixed model not found errors when using installed Ollama models
- Fixed connection status showing as "Not configured" for local Ollama

## Installation

```bash
# NPX (recommended)
npx @enfiy/enfiy-code

# Global installation
npm install -g @enfiy/enfiy-code
enfiy
```

This release ensures full compatibility with all Ollama models, making local AI usage more flexible and reliable.
