# OAuth Application Setup Guide

This guide explains how to set up OAuth applications for each service provider to enable secure authentication in Enfiy Code.

## Supported OAuth Providers

- Google (Gemini API)
- Anthropic (Claude API)
- HuggingFace (future support)

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

## Anthropic OAuth Setup

### Claude Subscription Authentication

Enfiy Code supports Claude Pro/Max subscription authentication:

1. Ensure you have an active Claude Pro or Max subscription
2. Use the OAuth flow in Enfiy Code's provider setup
3. No additional OAuth application setup required

### API Key Alternative

```bash
export ANTHROPIC_API_KEY="your_anthropic_api_key_here"
```

Get your API key from [Anthropic Console](https://console.anthropic.com/settings/keys).

## HuggingFace Setup (API Key)

Currently, HuggingFace uses API key authentication:

```bash
export HUGGINGFACE_API_KEY="hf_your_token_here"
```

Get your token from [HuggingFace Settings](https://huggingface.co/settings/tokens).

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

### Test Google OAuth

```bash
# Set environment variables
export ENFIY_GOOGLE_OAUTH_CLIENT_ID="your_id"
export ENFIY_GOOGLE_OAUTH_CLIENT_SECRET="your_secret"

# Start Enfiy Code and test authentication
npx @enfiy/enfiy-code
# Select provider setup and choose Google with OAuth
```

### Test Claude Authentication

```bash
# Start Enfiy Code
npx @enfiy/enfiy-code

# Use provider setup to test Claude subscription auth
# or set API key: export ANTHROPIC_API_KEY="your_key"
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

4. **"Claude subscription not found"**
   - Ensure you have an active Claude Pro or Max subscription
   - Try the API key method instead

### Debug Mode

```bash
# Enable debug logging for OAuth issues
export DEBUG=oauth:*
npx @enfiy/enfiy-code --debug
```

## Production Deployment

### Environment Configuration

```bash
# Production environment variables
export NODE_ENV=production
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

1. Check the [API Configuration Guide](./api-configuration.md) for basic setup
2. Review the provider's OAuth documentation
3. File an issue at [GitHub Issues](https://github.com/enfiy/enfiy-code/issues)

---

For simpler setup without OAuth, see the [API Configuration Guide](./api-configuration.md) for direct API key configuration.