# Installation Guide

## Prerequisites

- Node.js v18 or higher
- npm or yarn package manager
- Git (for development installation)

## Quick Install

### Using npx (Recommended)

```bash
npx @enfiy/enfiy-code
```

### Global Installation

```bash
npm install -g @enfiy/enfiy-code
enfiy
```

## Development Installation

```bash
# Clone repository
git clone https://github.com/enfiy/enfiy-code.git
cd enfiy-code

# Install dependencies
npm install

# Build project
npm run build

# Run locally
npm start

# Optional: Link globally
npm link
enfiy
```

## Platform-Specific Notes

### Windows

- Use PowerShell or Windows Terminal
- May need to enable script execution policy

### macOS

- Install Node.js via Homebrew recommended
- May need to grant terminal permissions

### Linux

- Works with all major distributions
- Ensure proper permissions for global install

### WSL

- Full support for Windows Subsystem for Linux
- Browser authentication may require manual URL copying

## First Run Setup

On first run, you'll be prompted to:

1. **Choose Theme**: Select your preferred color scheme
2. **Select Provider**: Choose AI provider (local or cloud)
3. **Configure Auth**: Set up authentication for chosen provider

## Updating

### Global Installation

```bash
npm update -g @enfiy/enfiy-code
```

### Development Installation

```bash
git pull origin main
npm install
npm run build
```

## Uninstalling

### Global Installation

```bash
npm uninstall -g @enfiy/enfiy-code
```

### Remove Configuration

```bash
rm -rf ~/.enfiy
```

## Troubleshooting

### Permission Errors

```bash
# Use with sudo (not recommended)
sudo npm install -g @enfiy/enfiy-code

# Better: Configure npm prefix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Node Version Issues

```bash
# Check version
node --version

# Update Node.js
# Visit https://nodejs.org or use nvm
```

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

For more issues, see [Troubleshooting Guide](./troubleshooting.md).
