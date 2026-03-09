# Configuration Issue Fix Summary

## Problem

When adding plugin configuration to `opencode.jsonc`:

```jsonc
{
  "plugin": ["opencode-session-debugger"],
  "opencode-session-debugger": {
    "enabled": true,
    ...
  }
}
```

OpenCode's JSON schema validation rejects it with:
```
↳ Unrecognized key: "opencode-session-debugger"
```

## Root Cause

OpenCode's configuration schema (`$schema: "https://opencode.ai/config.json"`) does not allow arbitrary top-level keys. The schema only recognizes predefined keys and does not have a mechanism for plugins to register their own configuration namespaces.

## Solution

The plugin now supports **environment variable configuration** which bypasses the OpenCode schema validation entirely.

## Implementation Changes

### 1. Enhanced SessionLogger (`src/logger.ts`)

Added environment variable support with priority: **environment variables override config file settings**.

**New methods:**
- `getEnvBoolean(envVar, defaultValue)` - Parse boolean environment variables

**Updated method:**
- `normalizeConfig()` - Now reads from environment variables first, then falls back to config

### 2. Supported Environment Variables

#### Core Settings
- `OPENCODE_DEBUG_ENABLED` - Enable/disable plugin (default: true)
- `OPENCODE_DEBUG_LOG_LEVEL` - Log level: debug, info, warn, error (default: info)
- `OPENCODE_DEBUG_DIR` - Custom database directory (default: ~/.local/share/opencode-debug)

#### Capture Settings
- `OPENCODE_DEBUG_CAPTURE_PROMPTS` (default: true)
- `OPENCODE_DEBUG_CAPTURE_TOOLS` (default: true)
- `OPENCODE_DEBUG_CAPTURE_AGENTS` (default: true)
- `OPENCODE_DEBUG_CAPTURE_SKILLS` (default: true)
- `OPENCODE_DEBUG_CAPTURE_MESSAGES` (default: true)
- `OPENCODE_DEBUG_CAPTURE_EVENTS` (default: true)

#### Redaction Settings
- `OPENCODE_DEBUG_REDACT_SECRETS` (default: true)
- `OPENCODE_DEBUG_REDACT_APIKEYS` (default: true)
- `OPENCODE_DEBUG_REDACT_FILECONTENTS` (default: false)

### 3. Documentation

Created comprehensive documentation:

**CONFIGURATION.md** - Complete configuration guide with:
- Problem explanation
- All available environment variables
- Usage examples (disable, selective capture, debug mode)
- Persistent configuration setup (bashrc/zshrc)
- Project-specific configuration (.env files, direnv)
- Configuration priority
- Troubleshooting

**README.md** - Updated with:
- Configuration section explaining the schema issue
- Environment variable examples
- Reference to CONFIGURATION.md
- Updated Configuration Options section

**opencode.example.jsonc** - Updated with:
- Minimal working configuration (just the plugin array)
- Comments explaining why the extended config doesn't work
- Reference to environment variable configuration
- Commented-out reference config for documentation

### 4. Testing

Created `test-env-config.ts` with comprehensive tests:
- ✓ Default configuration (no env vars)
- ✓ Disable via environment variable
- ✓ Environment variable overrides config file
- ✓ Selective capture via environment variables
- ✓ Log level via environment variable

All tests pass successfully.

## Usage

### Minimal opencode.jsonc

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-session-debugger"]
}
```

### Configuration Examples

**Disable the plugin:**
```bash
export OPENCODE_DEBUG_ENABLED=false
opencode
```

**Enable only tool tracking:**
```bash
export OPENCODE_DEBUG_CAPTURE_TOOLS=true
export OPENCODE_DEBUG_CAPTURE_PROMPTS=false
export OPENCODE_DEBUG_CAPTURE_AGENTS=false
opencode
```

**Debug mode with custom database:**
```bash
export OPENCODE_DEBUG_LOG_LEVEL=debug
export OPENCODE_DEBUG_DIR=/tmp/opencode-debug
opencode
```

### Persistent Configuration

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# OpenCode Session Debugger
export OPENCODE_DEBUG_ENABLED=true
export OPENCODE_DEBUG_LOG_LEVEL=info
export OPENCODE_DEBUG_CAPTURE_TOOLS=true
```

Then reload:
```bash
source ~/.bashrc  # or ~/.zshrc
```

## Benefits

1. **No schema conflicts** - Bypasses OpenCode's strict schema validation
2. **Easy toggling** - Quick enable/disable without editing config files
3. **Environment-specific** - Different settings for dev/prod environments
4. **CI/CD friendly** - Easy to configure in automated environments
5. **Backward compatible** - Plugin still works with default settings if no env vars set
6. **Override hierarchy** - Environment variables override config file settings

## Files Changed

- `src/logger.ts` - Added environment variable support
- `CONFIGURATION.md` - New comprehensive configuration guide
- `README.md` - Updated configuration sections
- `opencode.example.jsonc` - Updated with explanation
- `test-env-config.ts` - New test file

## Migration Guide

**Before (doesn't work):**
```jsonc
{
  "plugin": ["opencode-session-debugger"],
  "opencode-session-debugger": { "enabled": false }
}
```

**After (works):**
```jsonc
{
  "plugin": ["opencode-session-debugger"]
}
```
```bash
export OPENCODE_DEBUG_ENABLED=false
```

## Future Considerations

If OpenCode adds support for plugin configuration namespaces in the future, the plugin can be updated to:
1. Continue supporting environment variables (for backward compatibility)
2. Also support config file settings
3. Maintain priority: environment variables > config file > defaults
