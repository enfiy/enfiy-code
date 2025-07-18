# OAuth Application Setup Guide

This guide explains how to set up OAuth applications for each service provider to enable secure authentication in Enfiy Code.

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the required APIs:
   - Google AI Platform API
   - Google Cloud Platform API

### 2. Create OAuth Client

1. Go to [Google Cloud Console APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Desktop application" as the application type
4. Name it "Enfiy Code CLI"
5. Download the client configuration

### 3. Configure Environment Variables

```bash
export ENFIY_GOOGLE_OAUTH_CLIENT_ID="your_client_id_here"
export ENFIY_GOOGLE_OAUTH_CLIENT_SECRET="your_client_secret_here"
```

## HuggingFace OAuth Setup

### 1. Create HuggingFace Application

1. Go to [HuggingFace Settings](https://huggingface.co/settings/applications)
2. Click "New Application"
3. Fill in the details:
   - Name: "Enfiy Code CLI"
   - Description: "AI Code Assistant CLI Tool"
   - Homepage URL: "https://github.com/enfiy/enfiy-code"
   - Redirect URI: "http://localhost:8080/oauth/callback"

### 2. Configure Environment Variables

```bash
export ENFIY_HUGGINGFACE_OAUTH_CLIENT_ID="your_hf_client_id_here"
export ENFIY_HUGGINGFACE_OAUTH_CLIENT_SECRET="your_hf_client_secret_here"
```

## Claude/Anthropic OAuth Setup

### 1. Create Anthropic Application

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to API Keys section
3. Create a new API key for your application
4. Note: Currently uses API key authentication, OAuth may be added in future

### 2. Configure Environment Variables

```bash
export ANTHROPIC_API_KEY="your_anthropic_api_key_here"
```

## Security Best Practices

### Environment Variables

- Never commit OAuth secrets to version control
- Use environment variables or secure secret management
- Rotate secrets regularly
- Use different credentials for development and production

### OAuth Flow Security

- Use PKCE (Proof Key for Code Exchange) when available
- Implement proper state validation
- Use secure redirect URIs (HTTPS in production)
- Implement token refresh mechanisms

## Testing OAuth Setup

### 1. Test Google OAuth

```bash
# Set environment variables
export ENFIY_GOOGLE_OAUTH_CLIENT_ID="your_id"
export ENFIY_GOOGLE_OAUTH_CLIENT_SECRET="your_secret"

# Test authentication
enfiy-code auth --provider google
```

### 2. Test HuggingFace OAuth

```bash
# Set environment variables
export ENFIY_HUGGINGFACE_OAUTH_CLIENT_ID="your_id"
export ENFIY_HUGGINGFACE_OAUTH_CLIENT_SECRET="your_secret"

# Test authentication
enfiy-code auth --provider huggingface
```

## Troubleshooting

### Common Issues

1. **"OAuth client not found"**
   - Verify client ID and secret are correctly set
   - Check that the OAuth application is active

2. **"Redirect URI mismatch"**
   - Ensure redirect URI matches exactly in your OAuth app settings
   - Default: `http://localhost:8080/oauth/callback`

3. **"Invalid scope"**
   - Verify your OAuth app has the required scopes enabled
   - Check API permissions in the provider console

### Debug Mode

```bash
# Enable debug logging
export DEBUG=oauth:*
enfiy-code auth --provider google --debug
```

## Production Deployment

### Environment Configuration

```bash
# Production environment variables
export NODE_ENV=production
export CODE_ASSIST_ENDPOINT=https://generativelanguage.googleapis.com
export ENFIY_GOOGLE_OAUTH_CLIENT_ID="prod_client_id"
export ENFIY_GOOGLE_OAUTH_CLIENT_SECRET="prod_client_secret"
```

### Security Considerations

- Use HTTPS for all OAuth callbacks in production
- Implement rate limiting for OAuth endpoints
- Monitor OAuth usage and detect anomalies
- Keep OAuth libraries updated

## Support

If you encounter issues with OAuth setup:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the provider's OAuth documentation
3. File an issue at [GitHub Issues](https://github.com/enfiy/enfiy-code/issues)
