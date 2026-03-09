# Configuration Guide

## OpenCode Schema Compatibility Issue

OpenCode's JSON schema validation does not allow custom plugin configuration keys in `opencode.jsonc`. If you try to add a configuration like this:

```jsonc
{
  "plugin": ["opencode-session-debugger"],
  "opencode-session-debugger": {
    "enabled": true,
    ...
  }
}
```

You will get this error:
```
↳ Unrecognized key: "opencode-session-debugger"
```

## Solution: Use Environment Variables

The plugin supports configuration via environment variables, which override any configuration file settings.

### Available Environment Variables

#### Core Settings

```bash
# Enable/disable the plugin (default: true)
export OPENCODE_DEBUG_ENABLED=true

# Set log level: debug, info, warn, error (default: info)
export OPENCODE_DEBUG_LOG_LEVEL=info

# Set custom database directory (default: ~/.local/share/opencode-debug)
export OPENCODE_DEBUG_DIR=/path/to/debug/dir
```

#### Capture Settings

Control what data to capture:

```bash
# Capture prompts (default: true)
export OPENCODE_DEBUG_CAPTURE_PROMPTS=true

# Capture tool executions (default: true)
export OPENCODE_DEBUG_CAPTURE_TOOLS=true

# Capture agent invocations (default: true)
export OPENCODE_DEBUG_CAPTURE_AGENTS=true

# Capture skill usage (default: true)
export OPENCODE_DEBUG_CAPTURE_SKILLS=true

# Capture messages (default: true)
export OPENCODE_DEBUG_CAPTURE_MESSAGES=true

# Capture events (default: true)
export OPENCODE_DEBUG_CAPTURE_EVENTS=true
```

#### Redaction Settings

Control what sensitive data to redact:

```bash
# Redact secrets (default: true)
export OPENCODE_DEBUG_REDACT_SECRETS=true

# Redact API keys and tokens (default: true)
export OPENCODE_DEBUG_REDACT_APIKEYS=true

# Redact file contents (default: false)
export OPENCODE_DEBUG_REDACT_FILECONTENTS=false
```

## Usage Examples

### Example 1: Disable the Plugin

```bash
export OPENCODE_DEBUG_ENABLED=false
opencode
```

### Example 2: Enable Only Tool Tracking

```bash
export OPENCODE_DEBUG_CAPTURE_PROMPTS=false
export OPENCODE_DEBUG_CAPTURE_TOOLS=true
export OPENCODE_DEBUG_CAPTURE_AGENTS=false
export OPENCODE_DEBUG_CAPTURE_SKILLS=false
export OPENCODE_DEBUG_CAPTURE_MESSAGES=false
export OPENCODE_DEBUG_CAPTURE_EVENTS=false
opencode
```

### Example 3: Debug Mode with Custom Database Path

```bash
export OPENCODE_DEBUG_LOG_LEVEL=debug
export OPENCODE_DEBUG_DIR=/tmp/opencode-debug
opencode
```

### Example 4: Disable Redaction (for debugging)

```bash
export OPENCODE_DEBUG_REDACT_SECRETS=false
export OPENCODE_DEBUG_REDACT_APIKEYS=false
opencode
```

**Warning**: Disabling redaction may expose sensitive data in logs!

## Persistent Configuration

To make environment variables persistent, add them to your shell profile:

### Bash (~/.bashrc or ~/.bash_profile)

```bash
# OpenCode Session Debugger Configuration
export OPENCODE_DEBUG_ENABLED=true
export OPENCODE_DEBUG_LOG_LEVEL=info
export OPENCODE_DEBUG_CAPTURE_TOOLS=true
export OPENCODE_DEBUG_CAPTURE_AGENTS=true
```

### Zsh (~/.zshrc)

```bash
# OpenCode Session Debugger Configuration
export OPENCODE_DEBUG_ENABLED=true
export OPENCODE_DEBUG_LOG_LEVEL=info
export OPENCODE_DEBUG_CAPTURE_TOOLS=true
export OPENCODE_DEBUG_CAPTURE_AGENTS=true
```

Then reload your shell:
```bash
source ~/.bashrc  # or ~/.zshrc
```

## Project-Specific Configuration

For project-specific settings, create a `.env` file in your project directory:

```bash
# .env
OPENCODE_DEBUG_ENABLED=true
OPENCODE_DEBUG_LOG_LEVEL=debug
OPENCODE_DEBUG_DIR=.opencode/debug
```

Then source it before running OpenCode:

```bash
source .env
opencode
```

Or use a tool like `direnv` to automatically load environment variables:

```bash
# Install direnv
# Ubuntu/Debian: sudo apt install direnv
# macOS: brew install direnv

# Create .envrc
cat > .envrc << 'EOF'
export OPENCODE_DEBUG_ENABLED=true
export OPENCODE_DEBUG_LOG_LEVEL=debug
EOF

# Allow direnv
direnv allow

# Now opencode will use these settings automatically
opencode
```

## Configuration Priority

Settings are applied in this order (later overrides earlier):

1. **Default values** (hardcoded in the plugin)
2. **Config file** (`.opencode/opencode.jsonc`) - currently unsupported due to OpenCode schema
3. **Environment variables** (highest priority)

## Checking Current Configuration

The plugin logs its configuration at startup. Check the debug log:

```bash
tail -f ~/.local/share/opencode-debug/plugin-errors.log
```

Or look for console output when starting OpenCode:

```
[SessionDebugger] Plugin initialized
[SessionDebugger] Database: /path/to/sessions.db
```

If the plugin is disabled:

```
[SessionDebugger] Plugin is disabled
```

## Minimal opencode.jsonc

Your `.opencode/opencode.jsonc` only needs this:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-session-debugger"]
}
```

All configuration is done via environment variables!

## Troubleshooting

### Plugin not respecting environment variables

1. Verify environment variables are set:
   ```bash
   env | grep OPENCODE_DEBUG
   ```

2. Restart OpenCode completely (don't just reload)

3. Check the debug log for configuration:
   ```bash
   grep "Loaded configuration" ~/.local/share/opencode-debug/plugin-errors.log
   ```

### Environment variables not persisting

Make sure you:
1. Added them to your shell profile (~/.bashrc or ~/.zshrc)
2. Reloaded the shell with `source ~/.bashrc`
3. Opened a new terminal window

### Values not working as expected

- Ensure boolean values are lowercase: `true` or `false` (not `True` or `FALSE`)
- Ensure log level is lowercase: `debug`, `info`, `warn`, `error`
- Check for typos in environment variable names
