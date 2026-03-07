# Command Tracking Feature

## Overview

Added comprehensive command execution tracking to the OpenCode Session Debugger plugin. Commands (slash commands, built-in commands, etc.) are now tracked in a dedicated database table with detailed execution information.

## Changes Made

### 1. Database Schema (`src/storage/schema.ts`)

Added new `commands` table with the following fields:
- `id` - Unique command execution ID
- `session_id` - Reference to session
- `message_id` - Reference to message (optional)
- `command_name` - Name of the command executed
- `command_source` - Source type: 'built-in', 'slash', or 'custom'
- `args` - Command arguments (stored as JSON)
- `result` - Command execution result
- `error` - Error message if command failed
- `start_time` - When command execution started
- `end_time` - When command execution completed
- `duration` - Execution duration in milliseconds
- `success` - Boolean indicating success/failure

Added corresponding TypeScript types:
- `Command` - Type for command records
- `NewCommand` - Type for inserting new commands
- `CommandExecutionInfo` - Type for command execution metadata
- `CommandQueryFilter` - Type for querying commands

### 2. Database Initialization (`src/storage/database.ts`)

- Added `commands` table creation in `initializeTables()`
- Added indexes:
  - `idx_commands_session` - For querying by session and time
  - `idx_commands_name` - For querying by command name

### 3. Logger (`src/logger.ts`)

Added two new methods:
- `logCommandStart()` - Logs command execution start, returns command ID
- `logCommandEnd()` - Logs command completion with result/error

### 4. Command Hooks (`src/hooks/command.ts`)

Enhanced command hooks to track execution:
- `handleBefore` - Logs command start in dedicated table
- `handleAfter` - NEW hook to log command completion
- Maintains a map to correlate before/after events
- Backwards compatible - still logs events for compatibility

### 5. Plugin Hook Registration (`src/index.ts`)

- Added `'command.execute.after'` hook to the Hooks interface
- Registered the new after hook in the plugin

### 6. Query Analyzer (`src/analyzer/query.ts`)

Added command query methods:
- `getCommands(sessionID)` - Get all commands for a session
- `queryCommands(filter)` - Query commands with filters (name, source, errors, duration, etc.)
- Updated `getStats()` to include command statistics
- Updated `getTimeline()` to include command execution events
- Updated `exportSession()` to include commands data

### 7. Visualizer (`src/analyzer/visualize.ts`)

Added command visualization:
- `formatCommandStats()` - Format command statistics with bar charts
- Updated `formatTimeline()` to display command executions with ⚡ emoji
- Updated `formatSessionSummary()` to include command stats

### 8. CLI Tool (`src/cli/analyze.ts`)

Added new command:
- `commands <session-id>` - Show command execution statistics
- Supports `--min-duration` flag to filter slow commands
- Supports `--has-errors` flag to show failed commands
- Supports `--verbose` flag for detailed command list

Updated help text and examples.

## Usage Examples

### Querying Commands Programmatically

```typescript
import { getDatabase } from 'opencode-session-debugger';
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';

const db = getDatabase();
const analyzer = new SessionAnalyzer(db);

// Get all commands for a session
const commands = analyzer.getCommands('ses_abc123');

// Find slow commands (>500ms)
const slowCommands = analyzer.queryCommands({
  sessionID: 'ses_abc123',
  minDuration: 500,
});

// Find failed commands
const failedCommands = analyzer.queryCommands({
  sessionID: 'ses_abc123',
  hasErrors: true,
});

// Get command statistics
const stats = analyzer.getStats('ses_abc123');
console.log('Commands executed:', stats.commands.total);
console.log('Success rate:', stats.commands.successful / stats.commands.total);
console.log('Average duration:', stats.commands.avgDuration, 'ms');
```

### Using the CLI

```bash
# Show command statistics for a session
bun dist/cli/analyze.js commands ses_abc123

# Show slow commands (>500ms)
bun dist/cli/analyze.js commands ses_abc123 --min-duration 500

# Show failed commands with details
bun dist/cli/analyze.js commands ses_abc123 --has-errors --verbose

# Analyze complete session (includes command stats)
bun dist/cli/analyze.js analyze ses_abc123
```

## Timeline Integration

Commands now appear in session timelines:

```
[1:33:12 AM] ⚡ Command: build (250ms) ✓
[1:33:15 AM] ⚡ Command: test (1.2s) ✗
           Error: Test failed
```

## Statistics Output

Session analysis now includes command statistics:

```
═══ Summary ═══
Prompts: 5
Tool Calls: 12 (12 successful, 0 failed)
Commands Executed: 3 (2 successful, 1 failed)

═══ Command Execution Statistics ═══

Total: 3 | Successful: 2 | Failed: 1
Average Duration: 450ms

By Command:
  build                ██ 2
  test                 █ 1
```

## Migration Notes

The `commands` table is automatically created when the plugin initializes. For existing databases:

1. The table is created using `CREATE TABLE IF NOT EXISTS`
2. No data migration is needed
3. Existing sessions will have 0 commands (which is correct)
4. New commands will be tracked going forward

## Backwards Compatibility

- Still logs command events in the `events` table for backwards compatibility
- All existing functionality remains unchanged
- New features are additive only

## Testing

Comprehensive tests verify:
- ✅ Command start logging
- ✅ Command end logging with timing
- ✅ Command queries and filters
- ✅ Statistics calculation
- ✅ Timeline integration
- ✅ CLI display

## Files Modified

1. `src/storage/schema.ts` - Added commands table definition
2. `src/storage/database.ts` - Added table creation and indexes
3. `src/logger.ts` - Added command logging methods
4. `src/hooks/command.ts` - Enhanced with after hook
5. `src/index.ts` - Registered new hook
6. `src/analyzer/query.ts` - Added command queries
7. `src/analyzer/visualize.ts` - Added command visualization
8. `src/cli/analyze.ts` - Added commands CLI command
9. `src/types.ts` - Added command-related types

## Next Steps

The command tracking feature is complete and ready for use. Future enhancements could include:
- Command argument analysis
- Command dependency tracking
- Command performance trending over time
- Command recommendation based on patterns
