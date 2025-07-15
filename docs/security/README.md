# Security Documentation

Security policies, privacy information, and best practices for Enfiy Code.

## Security Overview

Enfiy Code is designed with security and privacy as core principles. This section covers our security measures, data handling practices, and recommendations for secure usage.

## Documents

### Privacy & Legal

- **[Privacy Policy & Terms of Service](./privacy-policy.md)** – Comprehensive privacy policy and terms of use
- **[Telemetry](./telemetry.md)** – Data collection practices and opt-out options

### Security Measures

#### Data Protection

- **API Key Encryption**: All API keys stored with AES-256-GCM encryption
- **Local Storage**: Sensitive data never leaves your device without explicit consent
- **Secure Communication**: TLS encryption for all external communications
- **Access Controls**: Strict access controls on any collected telemetry data

#### Authentication Security

- **OAuth 2.0**: Secure authentication flow for supported providers
- **Token Management**: Automatic token refresh and secure storage
- **Provider Isolation**: Each provider's credentials are isolated
- **Revocation Support**: Easy credential revocation and rotation

## Security Best Practices

### For Users

#### API Key Management

```bash
# View stored credentials (shows providers only, not keys)
enfiy /settings auth status

# Remove specific provider credentials
enfiy /settings auth remove openai

# Remove all credentials
enfiy /settings auth clear
```

#### Sensitive Code Handling

- Review AI responses before applying to production code
- Use local providers for highly sensitive codebases
- Avoid sharing API keys in team settings
- Regularly rotate API credentials

#### Network Security

- Use VPN when working with sensitive projects
- Verify TLS connections for cloud providers
- Monitor network traffic if required by policy
- Configure firewall rules for local providers

### For Administrators

#### Environment Setup

```bash
# Disable telemetry organization-wide
export ENFIY_TELEMETRY_DISABLED=true

# Use custom OAuth clients for branding
export ENFIY_GOOGLE_OAUTH_CLIENT_ID="your-client-id"
export ENFIY_GOOGLE_OAUTH_CLIENT_SECRET="your-secret"
```

#### Access Controls

- Restrict access to `~/.enfiy/` directory
- Monitor API usage across team accounts
- Implement API key rotation policies
- Use centralized credential management if needed

#### Compliance

- Review AI provider terms for compliance requirements
- Implement data retention policies
- Configure audit logging where required
- Establish incident response procedures

## Threat Model

### Identified Risks

1. **API Key Exposure** – Mitigation: Local encryption, secure storage
2. **Code Exposure** – Mitigation: Local processing option, provider selection
3. **Network Interception** – Mitigation: TLS encryption, certificate validation
4. **Local File Access** – Mitigation: File permission controls, user awareness

### Risk Assessment

- **High**: Unauthorized access to API keys
- **Medium**: Sensitive code sent to cloud providers
- **Low**: Local configuration file exposure
- **Very Low**: Network traffic interception

## Incident Response

### Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public issue
2. Email: security@enfiy.dev
3. Include detailed description
4. Provide reproduction steps if possible
5. Allow 24 hours for initial response

### Response Process

1. **Acknowledgment** – Within 24 hours
2. **Investigation** – Within 48 hours
3. **Fix Development** – Priority based on severity
4. **Testing** – Comprehensive security testing
5. **Release** – Coordinated disclosure timeline
6. **Post-mortem** – Process improvement review

## Compliance

### Standards Adherence

- **GDPR** – European data protection compliance
- **CCPA** – California consumer privacy compliance
- **SOC 2** – Security and availability controls
- **NIST** – Cybersecurity framework alignment

### Certifications

- Regular security audits
- Penetration testing
- Vulnerability assessments
- Compliance reviews

## Privacy Controls

### Data Minimization

- Collect only necessary telemetry data
- Anonymize all collected information
- Provide granular control options
- Default to privacy-preserving settings

### User Rights

```bash
# View privacy settings
enfiy /settings privacy status

# Disable all data collection
enfiy /settings privacy disable-all

# Export your data
enfiy /settings privacy export

# Delete your data
enfiy /settings privacy delete
```

### Transparency

- Open source codebase for inspection
- Clear documentation of data practices
- Regular privacy policy updates
- User notification of changes

## Security Features

### Built-in Security

- Automatic security updates
- Secure default configurations
- Input validation and sanitization
- Error handling without data leakage

### Optional Security

- Local-only processing mode
- Custom OAuth applications
- Network isolation options
- Audit logging capabilities

## Monitoring

### Security Monitoring

- Failed authentication attempts
- Unusual API usage patterns
- Configuration changes
- Error rate monitoring

### User Monitoring

```bash
# View security logs
enfiy /debug security

# Check authentication status
enfiy /settings auth status

# Monitor API usage
enfiy /settings usage
```

## Updates

### Security Updates

- Automatic notification of critical updates
- Streamlined update process
- Rollback capabilities
- Testing in isolated environments

### Communication

- Security advisories via documentation
- Critical issues via in-app notifications
- Version change logs with security notes
- Community security discussions

## Resources

### External Security

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Provider Security Documentation](#)

### Internal Security

- Security code review guidelines
- Penetration testing reports
- Vulnerability disclosure policy
- Security training materials

## Contact

### Security Team

- **Email**: security@enfiy.dev
- **Response Time**: 24 hours for critical issues
- **Escalation**: Available for urgent security matters

### Privacy Team

- **Email**: privacy@enfiy.dev
- **Response Time**: 5 business days for general inquiries
- **Subject Line**: Include "Privacy Request" for faster routing
