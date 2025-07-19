# Security Policy

## Supported Versions

We are committed to providing security updates for the following versions of Enfiy Code:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in Enfiy Code, please report it to us privately.

### How to Report

1. **Email**: Send details to security@enfiy.com
2. **GitHub Security Advisory**: Use GitHub's [private vulnerability reporting](https://github.com/enfiy/enfiy-code/security/advisories/new)

### What to Include

When reporting a vulnerability, please include:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes or mitigations
- Your contact information for follow-up

### Response Timeline

- **Initial Response**: Within 24 hours
- **Vulnerability Assessment**: Within 7 days
- **Fix Development**: Within 30 days (depending on complexity)
- **Public Disclosure**: After fix is deployed and users have reasonable time to update

## Security Best Practices

### For Users

1. **Keep Updated**: Always use the latest version of Enfiy Code
2. **API Keys**: Store API keys securely using environment variables
3. **Workspace Settings**: Be cautious with workspace-level configurations
4. **File Permissions**: Ensure proper file permissions for settings files
5. **Network Security**: Use secure connections when connecting to AI providers

### For Developers

1. **Dependencies**: Regularly update dependencies to patch security vulnerabilities
2. **Input Validation**: Always validate and sanitize user inputs
3. **Secret Management**: Never commit secrets or API keys to the repository
4. **Code Review**: All security-related changes require thorough review
5. **Testing**: Include security tests in the test suite

## Security Features

### Built-in Security Measures

- **Input Sanitization**: All user inputs are sanitized to prevent injection attacks
- **ANSI Escape Sequence Stripping**: Terminal output is cleaned to prevent terminal manipulation
- **Git-aware File Filtering**: Prevents accidental inclusion of sensitive files
- **Environment Variable Support**: Secure configuration through environment variables
- **Sandboxed Execution**: Docker container support for isolated environments
- **No Credential Storage**: API keys are not stored in plain text

### Data Privacy

- **Local Processing**: Core functionality works locally without sending data to external services
- **Optional Telemetry**: Telemetry is opt-in and can be disabled
- **No Persistent Logging**: Sensitive information is not logged persistently
- **Secure Communication**: All AI provider communications use HTTPS/TLS

## Vulnerability Disclosure Policy

We follow responsible disclosure practices:

1. **Private Reporting**: Security issues are reported privately first
2. **Coordinated Disclosure**: We work with reporters to understand and fix issues
3. **Public Disclosure**: Details are shared publicly only after fixes are available
4. **Credit**: We acknowledge security researchers who report vulnerabilities responsibly

## Security Contacts

- **Security Team**: security@enfiy.com
- **Maintainer**: Hayate Esaki (h.esaki@enfiy.com)
- **GitHub Issues**: For non-security bugs and feature requests only

## Legal

This security policy is subject to our terms of service and applicable law. We reserve the right to modify this policy at any time.

## Acknowledgments

We thank the security research community for their responsible disclosure of vulnerabilities and their contributions to making Enfiy Code more secure.

---

Last Updated: July 18, 2025
