# Shell Tool Documentation

## Overview

The Shell tool executes shell commands in the project environment with proper process management and output handling.

## Execution Model

This tool executes a given shell command as `bash -c <command>`.

- Command can start background processes using `&`
- Command is executed as a subprocess that leads its own process group
- Command process group can be terminated as `kill -- -PGID` or signaled as `kill -s SIGNAL -- -PGID`

## Return Information

The following information is returned after command execution:

- **Command**: Executed command
- **Directory**: Directory (relative to project root) where command was executed, or `(root)`
- **Stdout**: Output on stdout stream. Can be `(empty)` or partial on error and for any unwaited background processes
- **Stderr**: Output on stderr stream. Can be `(empty)` or partial on error and for any unwaited background processes
- **Error**: Error or `(none)` if no error was reported for the subprocess
- **Exit Code**: Exit code or `(none)` if terminated by signal
- **Signal**: Signal number or `(none)` if no signal was received
- **Background PIDs**: List of background processes started or `(none)`
- **Process Group PGID**: Process group started or `(none)`

## Security Considerations

- All shell commands require user confirmation before execution
- Commands are executed in the project root directory by default
- Process isolation prevents interference with the main application
- Background processes are properly tracked and can be terminated

## Usage Examples

```bash
# Basic command execution
ls -la

# Starting background processes
npm run dev &
python server.py &

# Command with output redirection
npm test > test_results.txt 2>&1
```

## Process Management

Background processes started with `&` are tracked and can be managed:

- View active processes with their PIDs
- Terminate specific processes or entire process groups
- Monitor stdout/stderr from background processes

## Error Handling

The tool provides comprehensive error reporting:

- Exit codes for failed commands
- Stderr output for debugging
- Signal information for terminated processes
- Timeout handling for long-running commands
