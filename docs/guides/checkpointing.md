# Checkpointing

Enfiy Code provides checkpointing functionality to save and restore chat sessions, allowing you to preserve conversation context and resume work later.

## Overview

Checkpointing enables you to:

- Save current chat session state
- Restore previous conversations
- Share conversation contexts
- Resume work across different sessions
- Create snapshots before major changes

## Basic Usage

### Creating a Checkpoint

```bash
/checkpoint save my-session
```

This saves the current conversation, including:

- Message history
- Tool call results
- Provider settings
- Session context

### Loading a Checkpoint

```bash
/checkpoint load my-session
```

This restores:

- Previous conversation state
- Message history
- Context and memory

### Listing Checkpoints

```bash
/checkpoint list
```

Shows all available checkpoints with:

- Checkpoint names
- Creation dates
- Message counts
- Provider used

## Advanced Features

### Automatic Checkpointing

Enable automatic checkpointing for important sessions:

```bash
/checkpoint auto-save on
```

Auto-save triggers:

- Every 10 messages
- Before provider changes
- Before major operations
- On session end

### Checkpoint Metadata

Add descriptions and tags:

```bash
/checkpoint save project-analysis --description "Working on code review" --tags "work,review"
```

### Checkpoint Filtering

Find specific checkpoints:

```bash
/checkpoint list --tag work
/checkpoint list --provider openai
/checkpoint list --since "2024-01-01"
```

## Storage Locations

### Default Storage

Checkpoints are stored in:

- **Linux/macOS**: `~/.enfiy/checkpoints/`
- **Windows**: `%USERPROFILE%\.enfiy\checkpoints\`

### Custom Storage

Configure custom checkpoint directory:

```bash
export ENFIY_CHECKPOINT_DIR="/path/to/checkpoints"
```

Or in settings.json:

```json
{
  "checkpointDirectory": "/custom/path/checkpoints"
}
```

## File Format

Checkpoints are stored as JSON files with the following structure:

```json
{
  "metadata": {
    "name": "my-session",
    "description": "Project analysis session",
    "createdAt": "2024-01-15T10:30:00Z",
    "tags": ["work", "review"],
    "provider": "openai",
    "model": "gpt-4",
    "version": "1.0"
  },
  "session": {
    "messages": [...],
    "context": {...},
    "toolResults": [...],
    "memory": {...}
  },
  "config": {
    "provider": "openai",
    "model": "gpt-4",
    "settings": {...}
  }
}
```

## Checkpoint Management

### Deleting Checkpoints

```bash
/checkpoint delete my-session
```

### Renaming Checkpoints

```bash
/checkpoint rename old-name new-name
```

### Exporting Checkpoints

```bash
/checkpoint export my-session --format json
/checkpoint export my-session --format markdown --output report.md
```

### Importing Checkpoints

```bash
/checkpoint import /path/to/checkpoint.json
```

## Sharing Checkpoints

### Export for Sharing

```bash
/checkpoint export my-session --sanitize --output shared-session.json
```

The `--sanitize` flag removes:

- API keys
- Personal information
- Sensitive file paths
- Private data

### Team Collaboration

Store checkpoints in shared locations:

```bash
# Set team checkpoint directory
export ENFIY_TEAM_CHECKPOINTS="/shared/team/checkpoints"

# Save to team location
/checkpoint save team-review --team
```

## Security and Privacy

### Encryption

Checkpoints can be encrypted for sensitive sessions:

```bash
/checkpoint save sensitive-work --encrypt
```

Enter encryption password when prompted.

### Data Sanitization

Remove sensitive information before sharing:

```bash
/checkpoint sanitize my-session --remove-paths --remove-keys
```

### Access Control

Set checkpoint permissions:

```bash
chmod 600 ~/.enfiy/checkpoints/*.json  # Owner read/write only
```

## Configuration

### Settings

Configure checkpointing behavior in settings.json:

```json
{
  "checkpointing": {
    "autoSave": true,
    "autoSaveInterval": 10,
    "maxCheckpoints": 100,
    "compression": true,
    "encryption": false,
    "sanitizeByDefault": false
  }
}
```

### Environment Variables

```bash
# Storage location
export ENFIY_CHECKPOINT_DIR="/custom/checkpoints"

# Maximum number of checkpoints
export ENFIY_MAX_CHECKPOINTS=50

# Enable compression
export ENFIY_CHECKPOINT_COMPRESS=true
```

## Troubleshooting

### Common Issues

**Checkpoint not found:**

```bash
# List all checkpoints
/checkpoint list

# Check checkpoint directory
ls ~/.enfiy/checkpoints/
```

**Corrupted checkpoint:**

```bash
# Validate checkpoint
/checkpoint validate my-session

# Repair if possible
/checkpoint repair my-session
```

**Large checkpoint files:**

```bash
# Enable compression
/checkpoint compress my-session

# Clean old data
/checkpoint cleanup --older-than 30d
```

### Recovery

**Restore from backup:**

```bash
# List backup checkpoints
/checkpoint list --backup

# Restore from backup
/checkpoint restore my-session --from-backup
```

**Manual recovery:**

```bash
# Check file integrity
file ~/.enfiy/checkpoints/my-session.json

# Validate JSON
jq '.' ~/.enfiy/checkpoints/my-session.json
```

## Best Practices

### Naming Conventions

- Use descriptive names: `code-review-2024-01`
- Include dates for time-sensitive work
- Use tags for categorization
- Avoid spaces and special characters

### Regular Maintenance

```bash
# Clean old checkpoints monthly
/checkpoint cleanup --older-than 30d

# Compress large checkpoints
/checkpoint compress --all --threshold 1MB

# Backup important checkpoints
/checkpoint backup --tag important
```

### Workflow Integration

```bash
# Start new project
/checkpoint save project-start --auto-save

# Before major changes
/checkpoint save before-refactor

# After completion
/checkpoint save project-complete --description "Final review completed"
```

## API Reference

### Checkpoint Commands

- `/checkpoint save <name>` - Save current session
- `/checkpoint load <name>` - Load saved session
- `/checkpoint list` - List all checkpoints
- `/checkpoint delete <name>` - Delete checkpoint
- `/checkpoint export <name>` - Export checkpoint
- `/checkpoint import <file>` - Import checkpoint

### Options

- `--description` - Add description
- `--tags` - Add tags
- `--encrypt` - Encrypt checkpoint
- `--sanitize` - Remove sensitive data
- `--compress` - Compress checkpoint
- `--auto-save` - Enable auto-save
