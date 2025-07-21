# Shell Command Tool

Execute bash commands in the project environment. This tool allows you to run shell commands with proper sandboxing and security controls.

## Security Features

- Commands are executed with appropriate sandboxing
- File system access is restricted to the project directory
- Network access can be controlled
- Command output is captured and returned safely

## Usage

Use this tool to:

- Run build commands (npm, make, etc.)
- Execute tests
- Interact with git
- Manage files and directories
- Install dependencies
- Run development servers

## Important Notes

- Commands are executed as `bash -c <command>`
- Working directory defaults to project root unless specified
- Long-running commands may timeout
- Interactive commands are not supported
