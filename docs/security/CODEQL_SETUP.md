# CodeQL Setup Guide for Enfiy Code

This document provides instructions for repository administrators on how to enable and configure GitHub CodeQL security analysis for the Enfiy Code repository.

## Prerequisites

- Admin access to the repository
- GitHub repository with Actions enabled

## Enabling CodeQL

### Step 1: Navigate to Security Settings

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click on **Security & analysis**

### Step 2: Enable Code Scanning

1. In the "Code scanning" section, click **Enable**
2. Choose **Set up with Advanced** to customize the configuration
3. GitHub will create a `.github/workflows/codeql-analysis.yml` file

### Step 3: Configure CodeQL

The repository already includes a CodeQL workflow at `.github/workflows/codeql-analysis.yml` with the following configuration:

```yaml
name: "CodeQL"

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  schedule:
    - cron: '30 1 * * 0'

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [ 'javascript', 'typescript' ]

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: ${{ matrix.language }}

    - name: Autobuild
      uses: github/codeql-action/autobuild@v3

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3
```

### Step 4: Enable Code Scanning Alerts

1. In the repository settings, go to **Security & analysis**
2. Enable **Code scanning alerts**
3. Set up alert notifications as needed

## Configuration Options

### Language Support

The current configuration scans both JavaScript and TypeScript files. This covers all code in the Enfiy Code repository.

### Scanning Schedule

- **Push to main/master**: Scans run on every push to the main branch
- **Pull requests**: Scans run on all pull requests to main/master
- **Weekly scan**: A full scan runs every Sunday at 1:30 AM UTC

### Custom Queries

You can add custom CodeQL queries by:

1. Creating a `.github/codeql` directory
2. Adding custom query files (`.ql` files)
3. Referencing them in the workflow configuration

## Monitoring Results

### Viewing Security Alerts

1. Go to the **Security** tab in your repository
2. Click on **Code scanning alerts**
3. Review and manage alerts

### Alert States

- **Open**: Active security issues that need attention
- **Fixed**: Issues that have been resolved
- **Dismissed**: Issues marked as false positives or accepted risks

## Best Practices

1. **Regular Reviews**: Review CodeQL alerts weekly
2. **Fix Critical Issues**: Address high-severity issues immediately
3. **Document Dismissals**: When dismissing alerts, provide clear reasoning
4. **Update Configuration**: Keep the CodeQL action version updated

## Troubleshooting

### Common Issues

1. **CodeQL not running**: Ensure Actions are enabled in repository settings
2. **No alerts showing**: Check that code scanning is enabled in security settings
3. **Workflow failures**: Review the Actions tab for error logs

### Getting Help

- [GitHub CodeQL Documentation](https://docs.github.com/en/code-security/code-scanning)
- [CodeQL Query Help](https://codeql.github.com/docs/)
- Create an issue in the repository for configuration help

## Maintenance

### Updating CodeQL Action

Periodically update the CodeQL action version in the workflow:

```yaml
uses: github/codeql-action/init@v3  # Check for latest version
```

### Review Query Packs

Check for new security query packs that might benefit the project:

```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: ${{ matrix.language }}
    queries: +security-extended  # Add extended security queries
```

---

Last Updated: July 19, 2025