<div align="center">

# Enfiy Code

*A universal AI coding agent — local or cloud, your choice*

[![npm](https://img.shields.io/npm/v/@enfiy/enfiy-code?style=flat-square)](https://www.npmjs.com/package/@enfiy/enfiy-code)
[![Node.js](https://img.shields.io/node/v/@enfiy/enfiy-code?style=flat-square)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

```bash
npx @enfiy/enfiy-code
```

</div>

---

## ⚡ Quick Start

```bash
# Run immediately
npx @enfiy/enfiy-code

# Or install globally
npm install -g @enfiy/enfiy-code
enfiy
```

On first run, choose your theme, AI provider, and authentication method. Your settings persist automatically.

---

## 🤖 AI Providers

<table>
<tr>
<td align="center">

### Cloud Providers
<img src="https://openai.com/favicon.ico" width="16" height="16"> **OpenAI**  
*GPT-4, GPT-3.5 Turbo*

<img src="https://www.anthropic.com/favicon.ico" width="16" height="16"> **Anthropic**  
*Claude 3 Opus, Sonnet, Haiku*

<img src="https://www.google.com/favicon.ico" width="16" height="16"> **Google**  
*Gemini Pro, Gemini Flash*

<img src="https://mistral.ai/favicon.ico" width="16" height="16"> **Mistral**  
*Mistral Large, Medium, Small*

<img src="https://huggingface.co/favicon.ico" width="16" height="16"> **HuggingFace**  
*Open source models*

</td>
<td align="center">

### Local Providers
🦙 **Ollama**  
*Complete privacy, local inference*

🤗 **HuggingFace**  
*Local model hosting*

</td>
</tr>
</table>

---

## 📋 Core Commands

<details>
<summary><code>/provider</code> - AI Provider Management</summary>

```bash
/provider                    # List available providers
/provider anthropic          # Switch to Anthropic
/provider models            # List current provider models
/provider model claude-3-sonnet-20240229    # Switch model
/provider status            # Check connection status
/provider config            # Configure settings
```

**Features:**
- Dynamic provider switching
- Model selection and fallback
- Connection monitoring
- Configuration management

</details>

<details>
<summary><code>/mcp</code> - Model Context Protocol</summary>

```bash
/mcp list                   # List MCP servers
/mcp install <server>       # Install MCP server
/mcp start <server>         # Start server
/mcp stop <server>          # Stop server
/mcp status                 # Server status
/mcp desc                   # Show tool descriptions
```

**Integration:**
- Database connections
- API integrations
- File system access
- Git operations
- Web search capabilities

</details>

<details>
<summary><code>/tools</code> - Built-in Development Tools</summary>

```bash
/tools                      # List available tools
/tools desc                 # Show with descriptions
```

**Capabilities:**
- **File Operations**: Read, write, edit multiple files
- **Code Analysis**: Security review, performance analysis
- **Version Control**: Git operations, branch management
- **Testing**: Unit tests, debugging assistance
- **System**: Shell commands, environment setup

</details>

---

## 🎯 Why Choose Enfiy Code?

> **Universal AI Integration**  
> Switch between OpenAI, Anthropic, Google, Mistral, and local models without changing your workflow.

> **Privacy First**  
> Use local models for complete privacy or cloud models for advanced capabilities.

> **Extensible Architecture**  
> Connect any tool or service through MCP for unlimited possibilities.

> **Intelligent Context**  
> Understand large codebases and maintain context across thousands of lines.

---

## 🚀 Usage Examples

<table>
<tr>
<td width="50%">

**New Project**
```bash
cd my-new-project/
enfiy
> Create a React app with TypeScript and Tailwind
```

</td>
<td width="50%">

**Existing Project**
```bash
cd existing-project/
enfiy
> Analyze this codebase for security vulnerabilities
```

</td>
</tr>
</table>

### Advanced Workflows

```bash
# Architecture Analysis
> Describe the main components of this system

# Code Migration
> Help me migrate this codebase to the latest React version

# Automated Testing
> Write comprehensive tests for the user authentication module

# Performance Optimization
> Analyze and optimize the database queries in this API
```

---

## 🛠️ Development

<details>
<summary>Development Setup</summary>

```bash
git clone https://github.com/enfiy/enfiy-code.git
cd enfiy-code
npm install
npm run build
npm start
```

</details>

### Manual Configuration

<details>
<summary>Environment Variables</summary>

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Anthropic
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# Google Gemini
export GEMINI_API_KEY="AIza..."

# Mistral
export MISTRAL_API_KEY="..."

# HuggingFace
export HUGGINGFACE_API_KEY="hf_..."

# Ollama
export OLLAMA_HOST="http://localhost:11434"
```

</details>

---

## 🐛 Bug Reports

```bash
/bug "Description of the issue"
```

This automatically:
- Collects system information
- Captures relevant logs
- Creates a formatted report
- Provides troubleshooting steps

**Alternative:** [GitHub Issues](https://github.com/enfiy/enfiy-code/issues)

---

## 🔒 Privacy & Data

<details>
<summary>Data Handling</summary>

**Local Data:**
- Configuration settings stored in `~/.enfiy/`
- API keys encrypted with AES-256-GCM
- Usage logs remain local

**AI Provider Data:**
- Code sent to selected providers for processing
- Subject to provider privacy policies
- You control what data is shared

**Telemetry:**
- Optional anonymized usage statistics
- Disable with `/settings telemetry false`
- No sensitive data collected

</details>

**Security Issues:** Contact security@enfiy.dev

---

## ⚠️ Important Notes

> **Experimental Technology**  
> This software is under active development. Always review AI-generated code before implementation.

> **AI Model Limitations**  
> AI responses may be incorrect or biased. Use your judgment and validate suggestions.

> **Data Security**  
> Be cautious with sensitive codebases. Consider using local models for proprietary code.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

[Apache 2.0 License](./LICENSE)

---

<div align="center">

**Built with ❤️ by the Enfiy Community**

[Website](https://enfiy.dev) • [Documentation](./docs) • [Community](https://github.com/enfiy) • [Support](mailto:support@enfiy.dev)

</div>