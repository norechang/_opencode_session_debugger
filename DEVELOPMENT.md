# Development Guide

## Project Structure

```
opencode-session-debugger/
├── src/
│   ├── index.ts                   # Plugin entry point and exports
│   ├── types.ts                   # TypeScript type definitions
│   ├── logger.ts                  # Core logging functionality
│   ├── storage/
│   │   ├── schema.ts             # Drizzle ORM database schema
│   │   └── database.ts           # Database connection and management
│   ├── hooks/
│   │   ├── session.ts            # Session lifecycle event handlers
│   │   ├── message.ts            # Message and prompt tracking
│   │   ├── tool.ts               # Tool execution tracking
│   │   └── command.ts            # Command and skill tracking
│   └── analyzer/
│       ├── query.ts              # Database query utilities
│       └── visualize.ts          # Data visualization helpers
├── cli/
│   └── analyze.ts                # CLI tool for analysis
├── package.json
├── tsconfig.json
├── README.md
└── opencode.example.jsonc        # Example configuration

## Architecture

### Plugin Lifecycle

1. **Initialization**: Plugin loaded by OpenCode, `SessionLogger` created
2. **Hook Registration**: All hook handlers registered with OpenCode
3. **Event Capture**: Hooks intercept OpenCode events and log to database
4. **Analysis**: CLI tool queries database for analysis and visualization

### Data Flow

```
OpenCode Event → Plugin Hook → SessionLogger → Database (SQLite)
                                                      ↓
                                        CLI Analyzer ← Database Query
                                                      ↓
                                          Visualizer → Console Output
```

### Hook System

The plugin uses OpenCode's hook system to intercept key events:

- **event**: System-wide events (session.created, session.updated, etc.)
- **chat.message**: User prompts and LLM responses
- **chat.params**: Model parameters (temperature, topP, etc.)
- **tool.execute.before**: Tool invocation start
- **tool.execute.after**: Tool execution completion
- **command.execute.before**: Command/skill invocation

### Database Design

SQLite database with 8 tables:

1. **sessions**: Session metadata
2. **messages**: Full message history
3. **prompts**: Parsed prompt data
4. **tool_executions**: Tool call details with timing
5. **agent_invocations**: Agent switches
6. **skill_usages**: Skill usage
7. **events**: System events
8. **chat_params**: LLM API parameters

All tables use timestamps for temporal queries and are indexed for performance.

## Building

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev
```

## Testing

### Manual Testing

1. Link the plugin locally:
```bash
npm link
```

2. Create a test project:
```bash
mkdir test-project
cd test-project
echo '{"plugin": ["opencode-session-debugger"]}' > opencode.jsonc
```

3. Start OpenCode:
```bash
opencode
```

4. Interact with OpenCode to generate session data

5. Analyze with CLI:
```bash
opencode-debug list
opencode-debug analyze <session-id>
```

### Database Inspection

```bash
# View database directly
sqlite3 ~/.local/share/opencode-debug/sessions.db

# List tables
.tables

# Query sessions
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 10;

# Tool execution stats
SELECT tool_name, COUNT(*) as count, AVG(duration) as avg_duration
FROM tool_executions
GROUP BY tool_name
ORDER BY count DESC;
```

## Key Implementation Details

### SessionLogger Class

Central logging class that:
- Manages database connection
- Handles configuration
- Provides logging methods for each event type
- Automatically redacts sensitive data

Methods:
- `logSessionCreated()`: Log new session
- `logPrompt()`: Log user prompt
- `logMessage()`: Log message
- `logToolStart()`: Log tool invocation
- `logToolEnd()`: Log tool completion
- `logAgentInvocation()`: Log agent switch
- `logSkillUsage()`: Log skill usage
- `logEvent()`: Log generic event

### Hook Implementations

Each hook file exports factory functions that create handlers:

```typescript
export function createSessionHooks(logger: SessionLogger) {
  return {
    handleEvent: async (input: { event: any }) => {
      // Process event and log
    }
  };
}
```

### Query System

`SessionAnalyzer` class provides high-level query methods:

```typescript
class SessionAnalyzer {
  querySessions(filter: SessionQueryFilter): Session[]
  queryToolExecutions(filter: ToolQueryFilter): ToolExecution[]
  getTimeline(sessionID: string): TimelineEvent[]
  getStats(sessionID: string): SessionStats
  exportSession(sessionID: string): CompleteSessionData
}
```

### Visualization

`Visualizer` class provides formatting utilities:

```typescript
class Visualizer {
  static formatTimeline(timeline: TimelineEvent[]): string
  static formatToolStats(stats: ToolStats): string
  static formatSessionSummary(data: SessionData): string
}
```

## Adding New Features

### Adding a New Captured Event

1. Add database table to `src/storage/schema.ts`:
```typescript
export const newTable = sqliteTable('new_table', {
  id: text('id').primaryKey(),
  // ... fields
});
```

2. Add SQL to `src/storage/database.ts` `initializeTables()`:
```typescript
CREATE TABLE IF NOT EXISTS new_table (
  id TEXT PRIMARY KEY,
  // ... fields
);
```

3. Add logging method to `src/logger.ts`:
```typescript
logNewEvent(data: NewEventData): void {
  // Implementation
}
```

4. Create or update hook in `src/hooks/`:
```typescript
export function createNewHook(logger: SessionLogger) {
  return {
    handleNew: async (input: any, output: any) => {
      logger.logNewEvent({ ... });
    }
  };
}
```

5. Register hook in `src/index.ts`:
```typescript
const hooks = createNewHook(logger);
return {
  // ... other hooks
  'new.hook': hooks.handleNew,
};
```

6. Add query method to `src/analyzer/query.ts`:
```typescript
getNewEvents(sessionID: string) {
  return this.db.getDB()
    .select()
    .from(schema.newTable)
    .where(eq(schema.newTable.sessionID, sessionID))
    .all();
}
```

7. Add visualization to `src/analyzer/visualize.ts`:
```typescript
static formatNewEvents(events: NewEvent[]): string {
  // Implementation
}
```

8. Add CLI command to `cli/analyze.ts`:
```typescript
case 'new-command': {
  const data = analyzer.getNewEvents(sessionID);
  console.log(Visualizer.formatNewEvents(data));
  break;
}
```

### Adding a New CLI Command

1. Add command to `commands` object in `cli/analyze.ts`
2. Add case to switch statement in `main()`
3. Implement command logic using `SessionAnalyzer` and `Visualizer`
4. Update README.md with command documentation

## Performance Considerations

### Database Optimization

- Use indexed queries for common access patterns
- WAL mode enabled for concurrent access
- Batch inserts where possible
- Lazy connection initialization

### Hook Overhead

- All logging is asynchronous
- Errors are caught and logged, never throw
- Selective capture via configuration
- Minimal data transformation in hooks

### Memory Management

- Database connection is singleton
- No in-memory caching (rely on SQLite)
- Streaming for large exports
- Dispose pattern for cleanup

## Security & Privacy

### Automatic Redaction

The plugin automatically redacts:
- API keys (fields containing "apiKey", "api_key", "token")
- Passwords (fields containing "password", "secret")
- Authorization headers

Implemented in `SessionLogger.redact()`:
```typescript
private redact(data: any): any {
  // Recursively redact sensitive fields
}
```

### Configuration

Users can control redaction:
```json
{
  "redact": {
    "secrets": true,      // Redact secret values
    "apiKeys": true,      // Redact API keys
    "fileContents": false // Redact file contents
  }
}
```

## Debugging the Plugin

### Enable Verbose Logging

```typescript
// In src/logger.ts, add console.log statements:
logPrompt(data) {
  console.log('[SessionDebugger] Logging prompt:', data.rawInput);
  // ... rest of method
}
```

### Inspect Database

```bash
sqlite3 ~/.local/share/opencode-debug/sessions.db ".dump"
```

### Check Hook Invocation

Add logging to hook handlers:
```typescript
handleEvent: async (input: { event: any }) => {
  console.log('[Hook] Event received:', input.event.type);
  // ... rest of handler
}
```

## Common Issues

### Plugin not loading

- Check `opencode.jsonc` syntax
- Verify plugin is installed: `npm list opencode-session-debugger`
- Check OpenCode version compatibility

### Database not created

- Check directory permissions
- Verify `OPENCODE_DEBUG_DIR` if set
- Check for SQLite errors in console

### Missing data

- Verify capture configuration
- Check if specific event type is supported
- Add logging to relevant hook

### Performance impact

- Disable unnecessary capture types
- Use selective session logging
- Check database size and vacuum if needed

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Build: `npm run build`
4. Test: Manual testing with OpenCode
5. Commit and tag: `git tag v1.0.0`
6. Publish: `npm publish`

## Contributing Guidelines

- Follow existing code style (TypeScript strict mode)
- Add types for all public APIs
- Document new features in README.md
- Test with real OpenCode sessions
- Keep dependencies minimal
- Maintain backward compatibility

## Future Enhancements

Potential improvements:

- [ ] Real-time session monitoring dashboard
- [ ] Export to other formats (CSV, HTML)
- [ ] Session comparison tool
- [ ] Performance regression detection
- [ ] Integration with CI/CD for automated analysis
- [ ] Web UI for visualization
- [ ] Remote database support (PostgreSQL)
- [ ] Session replay functionality
- [ ] Diff tool for session changes
- [ ] Statistical analysis and reporting

## Support

For development questions:
- Review OpenCode plugin documentation
- Check OpenCode source code: `/home/norechang/work/opencode`
- Refer to Drizzle ORM docs for database queries
- SQLite documentation for schema design
