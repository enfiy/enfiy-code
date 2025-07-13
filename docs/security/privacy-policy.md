# Privacy Policy & Terms of Service

## Experimental Technology Disclaimer

Enfiy Code is an experimental AI-powered development tool. Please be aware:

- **Experimental Nature**: Under active development, may contain bugs or incomplete features
- **AI Model Limitations**: AI responses may be incorrect or biased. Always review AI-generated code
- **Data Security**: Be cautious with sensitive codebases
- **Third-Party Dependencies**: External AI services have their own policies
- **Breaking Changes**: Future updates may introduce breaking changes

## Terms of Service

### Acceptance of Terms
By using Enfiy Code, you agree to these terms of service. If you do not agree, please do not use the software.

### License
Enfiy Code is provided under the Apache 2.0 License. You are free to:
- Use the software for any purpose
- Modify and distribute the software
- Use the software commercially
- Patent use rights are granted

### Permitted Use
You may use Enfiy Code for:
- Software development and assistance
- Educational purposes
- Research and experimentation
- Commercial development projects
- Integration with other tools and services

### Prohibited Use
You may not use Enfiy Code for:
- Illegal activities or purposes
- Generating malicious code or content
- Violating third-party rights
- Circumventing security measures
- Harassing or harmful activities

## Privacy Policy

### Data Collection

#### Local Data (Stored on Your Device)
- Configuration settings in `~/.enfiy/`
- Encrypted API keys using AES-256-GCM
- Local debugging logs
- Temporary project context

#### Telemetry Data (Optional)
- Anonymized usage statistics
- Error reports via `/bug` command
- Performance metrics
- Feature usage patterns

#### User-Provided Information
- **API Keys**: Stored locally with encryption
- **Configuration**: User settings and preferences
- **Content**: Only processed locally, never transmitted to us

### How We Use Your Data

#### Product Improvement
- Identify and fix bugs
- Improve performance and reliability
- Develop new features
- Understand usage patterns

#### Analytics
- Aggregate usage statistics
- Performance monitoring
- Error tracking and resolution
- Feature adoption analysis

### Data Transmission

#### AI Provider Communications
When using cloud AI providers, your data may be processed by:

**OpenAI:**
- Content sent to OpenAI for processing
- Subject to [OpenAI's privacy policy](https://openai.com/privacy)
- Data retention per OpenAI's terms

**Anthropic:**
- Content sent to Anthropic for processing
- Subject to [Anthropic's privacy policy](https://www.anthropic.com/privacy)
- Data retention per Anthropic's terms

**Google (Gemini):**
- Content sent to Google for processing
- Subject to [Google's privacy policy](https://policies.google.com/privacy)
- Data retention per Google's terms

**Mistral:**
- Content sent to Mistral for processing
- Subject to Mistral's privacy policy
- Data retention per Mistral's terms

#### Local Processing
When using local models (Ollama):
- No data leaves your machine
- Complete privacy and control
- No third-party processing

#### MCP Server Communications
- Data shared based on your commands
- Third-party servers have own policies

### Data Rights and Controls

#### Privacy Settings
```bash
# View current privacy settings
enfiy /settings privacy status

# Disable all data collection
enfiy /settings telemetry false

# View data through debug commands
enfiy /debug
```

#### Data Control
- **Opt-Out**: Disable telemetry completely
- **Local Control**: All configuration stored locally
- **Data Deletion**: Remove `~/.enfiy/` directory
- **Transparency**: View data through debug commands

### Security Measures

#### Technical Safeguards
- API keys encrypted with AES-256-GCM
- No sensitive data on our servers
- TLS encryption for all communications
- Strict access controls on telemetry
- Regular security updates

#### Data Storage
- **Local Storage**: User controls all personal data
- **Remote Storage**: Only anonymized usage data
- **Encryption**: Both in transit and at rest

### Data Retention

#### Local Data
- Retained until manually deleted
- User has complete control
- Can be backed up or exported

#### Telemetry Data
- Usage data: 24 months
- Error data: 12 months
- Performance data: 6 months
- Aggregated data: May be retained longer

### Contact Information

#### Privacy Questions
- **Email**: privacy@enfiy.dev
- **Response Time**: Within 5 business days

#### Security Issues
- **Email**: security@enfiy.dev
- **Bug Reports**: Use `/bug` command
- **Response**: Within 24 hours for critical issues

### Compliance

#### Standards We Follow
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- Industry security best practices

#### International Users
- Software available worldwide
- Data processing may occur in various countries
- Compliance with local privacy laws
- GDPR compliance for EU users

### Changes to This Policy

#### Notification Methods
- Documentation updates
- In-app notifications for major changes
- Version change logs

#### Effective Date
This privacy policy is effective as of the software version you are using. Check the documentation for the most current version.

---

**Last Updated**: Version 0.1.0
**Document Version**: 1.0

For the most current version of this privacy policy and terms of service, please refer to the documentation included with your version of Enfiy Code.