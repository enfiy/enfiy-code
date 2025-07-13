# Telemetry

Enfiy Code includes telemetry functionality to collect usage data and performance metrics to help improve the product. This document explains what data is collected, how it's used, and how to control telemetry settings.

## Overview

Telemetry helps us:
- Understand how features are used
- Identify performance issues
- Improve user experience
- Prioritize development efforts
- Fix bugs and reliability issues

## Data Collection

### What We Collect

**Usage Metrics:**
- Command usage frequency
- Feature adoption rates
- Session duration
- Provider selection patterns
- Tool usage statistics

**Performance Data:**
- Response times
- Error rates
- Memory usage
- Token consumption
- Network latency

**Configuration Data:**
- Provider preferences (anonymized)
- Theme selections
- Feature flag states
- Version information

**Error Information:**
- Stack traces (sanitized)
- Error frequencies
- Failure contexts
- Recovery success rates

### What We Don't Collect

**Personal Information:**
- User content or messages
- API keys or credentials
- Personal files or data
- User names or emails
- IP addresses (beyond aggregated analytics)

**Sensitive Data:**
- Code content
- File contents
- Tool execution results
- Private configurations
- Local file paths

## Privacy and Security

### Data Anonymization
- All user identifiers are hashed
- Personally identifiable information is stripped
- Location data is aggregated to region level
- Timestamps are rounded to protect privacy

### Data Retention
- Usage data: 24 months
- Error data: 12 months
- Performance data: 6 months
- Aggregated analytics: Indefinite

### Data Protection
- All data transmitted over HTTPS
- Data stored in secure, encrypted databases
- Access restricted to authorized personnel
- Regular security audits conducted

## Telemetry Configuration

### Default Settings
Telemetry is **enabled by default** with privacy-first settings:

```json
{
  "telemetry": {
    "enabled": true,
    "level": "basic",
    "errorReporting": true,
    "performanceMetrics": true,
    "usageAnalytics": true,
    "anonymousId": "generated-hash"
  }
}
```

### Telemetry Levels

**Basic (Default):**
- Usage frequency
- Error rates
- Performance metrics
- Feature adoption

**Detailed:**
- Command sequences
- Session patterns
- Detailed error context
- Performance profiling

**Minimal:**
- Critical errors only
- Basic performance data
- No usage tracking

**Off:**
- No data collection
- Local error logging only

### Controlling Telemetry

#### Via Settings UI
```bash
/settings telemetry
```

Interactive menu to:
- Enable/disable telemetry
- Change collection level
- View current settings
- Export collected data

#### Via Configuration File
Edit `~/.enfiy/settings.json`:

```json
{
  "telemetry": {
    "enabled": false,
    "level": "minimal",
    "errorReporting": false
  }
}
```

#### Via Environment Variables
```bash
# Disable all telemetry
export ENFIY_TELEMETRY=false

# Set telemetry level
export ENFIY_TELEMETRY_LEVEL=minimal

# Disable error reporting
export ENFIY_ERROR_REPORTING=false
```

#### Via Command Line
```bash
# Disable for single session
enfiy --no-telemetry

# Set level for session
enfiy --telemetry-level minimal

# View telemetry status
enfiy --telemetry-status
```

## Data Types and Examples

### Usage Events
```json
{
  "event": "command_executed",
  "timestamp": "2024-01-15T10:30:00Z",
  "command": "provider",
  "duration_ms": 250,
  "success": true,
  "session_id": "hashed-session-id"
}
```

### Performance Metrics
```json
{
  "event": "response_time",
  "timestamp": "2024-01-15T10:30:00Z",
  "provider": "openai",
  "model": "gpt-4",
  "response_time_ms": 1500,
  "token_count": 150,
  "streaming": true
}
```

### Error Reports
```json
{
  "event": "error_occurred",
  "timestamp": "2024-01-15T10:30:00Z",
  "error_type": "ApiError",
  "error_code": "rate_limit",
  "provider": "openai",
  "context": "request_processing",
  "session_id": "hashed-session-id"
}
```

## Local Analytics

### Viewing Your Data
```bash
# Show telemetry summary
enfiy telemetry show

# Export your data
enfiy telemetry export --format json --output my-data.json

# View usage statistics
enfiy telemetry stats --timeframe 7d
```

### Data Dashboard
Access local analytics dashboard:
```bash
enfiy telemetry dashboard
```

Shows:
- Command usage patterns
- Performance trends
- Error frequencies
- Provider usage statistics

## Compliance and Regulations

### GDPR Compliance
- Right to access your data
- Right to data portability
- Right to erasure
- Lawful basis: Legitimate interest

### Data Subject Rights
```bash
# Request your data
enfiy telemetry export --complete

# Delete your data
enfiy telemetry delete --confirm

# Opt out permanently
enfiy telemetry opt-out --permanent
```

## Developer Integration

### Custom Telemetry
Extensions can integrate with telemetry:

```typescript
import { telemetry } from '@enfiy/core';

// Track custom events
telemetry.track('custom_tool_used', {
  tool_name: 'my_tool',
  execution_time: 500,
  success: true
});

// Track performance
const timer = telemetry.startTimer('operation_duration');
await performOperation();
timer.end();

// Track errors
telemetry.trackError('custom_error', error, {
  context: 'tool_execution',
  tool_name: 'my_tool'
});
```

### Telemetry API
```typescript
interface TelemetryService {
  track(event: string, properties?: any): void;
  trackError(name: string, error: Error, context?: any): void;
  startTimer(name: string): Timer;
  setUser(id: string): void;
  setSession(id: string): void;
}
```

## Data Processing

### Aggregation Pipeline
1. **Collection**: Raw events collected locally
2. **Sanitization**: Remove sensitive information
3. **Anonymization**: Hash identifiers
4. **Batching**: Group events for transmission
5. **Transmission**: Send to analytics servers
6. **Processing**: Aggregate and analyze data
7. **Insights**: Generate product insights

### Data Flow
```
Local Events → Sanitization → Anonymization → Batching → Transmission → Analytics
```

## Opt-Out Instructions

### Complete Opt-Out
```bash
# Disable all telemetry
enfiy telemetry disable --all

# Verify opt-out status
enfiy telemetry status
```

### Selective Opt-Out
```bash
# Disable usage tracking only
enfiy telemetry disable --usage

# Disable error reporting only
enfiy telemetry disable --errors

# Keep performance metrics only
enfiy telemetry enable --performance-only
```

### Organizational Opt-Out
For enterprise deployments:

```bash
# Set organization-wide policy
export ENFIY_TELEMETRY_POLICY=disabled

# Distribute configuration
echo '{"telemetry": {"enabled": false}}' > /etc/enfiy/settings.json
```

## Transparency Report

### Data Usage Summary
- **Purpose**: Product improvement and bug fixing
- **Recipients**: Development team only
- **Location**: Secure cloud infrastructure
- **Retention**: As specified in retention policy
- **Third Parties**: None (data not shared)

### Your Rights
- View collected data at any time
- Export data in machine-readable format
- Request data deletion
- Opt out of collection
- Update preferences

## Contact Information

For telemetry-related questions:
- **Data Protection**: privacy@enfiy.com
- **Technical Support**: support@enfiy.com
- **Documentation**: [Privacy Policy](./tos-privacy.md)

## Troubleshooting

### Common Issues

**Telemetry not working:**
```bash
# Check telemetry status
enfiy telemetry status

# Test telemetry connection
enfiy telemetry test

# Check logs
enfiy --debug --log-level debug
```

**High data usage:**
```bash
# Reduce telemetry level
enfiy telemetry level minimal

# Check data usage
enfiy telemetry usage --last-month
```

**Configuration issues:**
```bash
# Reset telemetry settings
enfiy telemetry reset

# Validate configuration
enfiy telemetry validate-config
```