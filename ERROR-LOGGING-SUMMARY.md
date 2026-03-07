# Error Logging Implementation Summary

## Overview

Added comprehensive error logging to the OpenCode Session Debugger plugin to help diagnose issues that appear on stderr.

## Implementation

### 1. Debug Logger Module (`src/debug-logger.ts`)

Created a dedicated debug logger that:
- Writes to `~/.local/share/opencode-debug/plugin-errors.log`
- Captures errors with full context (timestamps, stack traces, error details)
- Also outputs to console stderr for immediate visibility
- Handles logging failures gracefully
- Provides singleton pattern for consistent logging across the plugin

**Features:**
- `error()` - Logs errors with stack traces
- `warn()` - Logs warnings
- `info()` - Logs informational messages
- `debug()` - Logs debug-level details
- `getLogPath()` - Returns the log file path

### 2. Integration Points

Updated all major components to use the debug logger:

#### `src/logger.ts` (SessionLogger)
- Database initialization errors
- All 9 logging method errors:
  - `logSessionCreated`
  - `logSessionUpdated`
  - `logPrompt`
  - `logMessage`
  - `logToolStart`
  - `logToolEnd`
  - `logAgentInvocation`
  - `logSkillUsage`
  - `logEvent`
  - `logChatParams`

#### `src/hooks/session.ts`
- Event handling errors
- Session lifecycle errors

#### `src/hooks/tool.ts`
- Tool execution before/after errors
- Tool correlation errors

#### `src/hooks/message.ts`
- Message handling errors
- Chat params processing errors

#### `src/hooks/command.ts`
- Command execution errors
- Skill tracking errors

#### `src/index.ts` (Main Plugin)
- Plugin initialization errors
- Configuration loading errors
- Database setup errors

### 3. Log Format

Each log entry includes:
```
[ISO_TIMESTAMP] [LEVEL] [CONTEXT] MESSAGE
  Error: error_message
  Stack: stack_trace
  Details: additional_context (JSON)
```

Example:
```
[2026-03-06T17:30:46.694Z] [ERROR] [logAgentInvocation] Failed to log agent invocation
  Error: NOT NULL constraint failed: agent_invocations.agent_name
  Stack: SQLiteError: NOT NULL constraint failed
      at #run (bun:sqlite:185:20)
      at logAgentInvocation (/path/to/logger.ts:226:10)
  Details: {"sessionID": "ses_abc123", "agentName": null}
```

### 4. Error Preservation

All errors are:
1. **Logged to file** - Persistent record at `~/.local/share/opencode-debug/plugin-errors.log`
2. **Printed to stderr** - Immediate visibility with `console.error()`
3. **Not thrown** - Plugin continues gracefully after logging errors

## Usage

### Viewing Logs

```bash
# View all logs
cat ~/.local/share/opencode-debug/plugin-errors.log

# Follow in real-time
tail -f ~/.local/share/opencode-debug/plugin-errors.log

# Search for errors
grep ERROR ~/.local/share/opencode-debug/plugin-errors.log

# Recent errors
tail -50 ~/.local/share/opencode-debug/plugin-errors.log
```

### Log Levels

Set in configuration:
```json
{
  "opencode-session-debugger": {
    "logLevel": "debug"  // "debug" | "info" | "warn" | "error"
  }
}
```

## Testing

Tested with integration test:
```bash
bun test-integration.ts
```

Results:
- ✅ All database operations logged
- ✅ Errors captured with full context
- ✅ Console and file logging both working
- ✅ Log file created automatically
- ✅ No performance impact on success path

## Benefits

1. **Better Debugging**: Every error is logged with full context
2. **Persistent Records**: Errors survive session restarts
3. **Real-time Visibility**: Errors still appear on stderr
4. **Root Cause Analysis**: Stack traces and context help identify issues
5. **Production Ready**: Graceful error handling without crashes
6. **User-Friendly**: Clear log location and format

## Files Modified

- `src/debug-logger.ts` (new)
- `src/logger.ts` (enhanced error logging)
- `src/hooks/session.ts` (enhanced error logging)
- `src/hooks/tool.ts` (enhanced error logging)
- `src/hooks/message.ts` (enhanced error logging)
- `src/hooks/command.ts` (enhanced error logging)
- `src/index.ts` (enhanced error logging)
- `README.md` (added "Error Logging & Debugging" section)

## Documentation

Added comprehensive documentation in README.md:
- Log file location
- How to view logs
- Common errors and solutions
- Debug mode configuration
- Issue reporting guidelines
- Log management (clearing/truncating)

## Next Steps

To use in production:
1. Rebuild: `npm run build`
2. Reinstall: `cd .opencode && npm install`
3. Run OpenCode normally
4. Check logs if issues occur: `cat ~/.local/share/opencode-debug/plugin-errors.log`
