# Runtime Configs

This directory stores minimal runtime configuration templates that can be
mounted read-only into experiment or scoring containers.

Rules:
- keep these files minimal
- do not copy your everyday local agent state here
- do not commit real secrets
- prefer experiment-only configs that are safe to publish as templates

Included templates:
- `codex/`: Codex CLI config and placeholder auth file.
- `claude-code/`: Claude Code placeholder config files.

Gemini CLI, Hermes, Kilo Code, and OpenClaw are configured through the generated
YAML environment variables and their container-local runtime directories.
