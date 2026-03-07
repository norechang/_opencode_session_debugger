# OpenCode Session Debugger

A powerful OpenCode plugin for tracking and debugging session execution, prompt parsing, agent invocations, command execution, tool usage, and skill loading.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
  - [From NPM (Production)](#from-npm-production)
  - [From Source (Development)](#from-source-development)
- [Usage](#usage)
- [CLI Commands](#cli-commands)
- [Configuration](#configuration)
- [Known Limitations](#known-limitations)
- [Development](#development)
- [Updating the Plugin](#updating-the-plugin)
- [Troubleshooting](#troubleshooting)
- [Privacy & Security](#privacy--security)

## Features

- **Comprehensive Session Tracking**: Log all session lifecycle events, including creation, updates, and errors
- **Prompt Analysis**: Capture user prompts, parsed parts, system prompts, and template resolution
- **Agent Monitoring**: Track agent switches, subagent calls, and model configurations
- **Command Execution Tracking**: Monitor command invocations (slash commands, built-in commands) with arguments and timing *
- **Tool Execution Tracking**: Full tracking of tool calls with parameters, results, timing, and errors
- **Skill Usage Logging**: Record skill loading and invocation
- **Powerful Analysis CLI**: Query and visualize session data with built-in commands
- **Privacy-Aware**: Automatic redaction of sensitive data (API keys, tokens, secrets)
- **Zero-Overhead**: Minimal performance impact when disabled

\* *Note: Command tracking is limited to start events only. See [Known Limitations](#known-limitations) for details.*

## Prerequisites

Before installing this plugin, you need:

1. **OpenCode CLI installed** on your system:
   ```bash
   npm install -g @opencode-ai/cli
   # or
   bun install -g @opencode-ai/cli
   ```

2. **A project with OpenCode configuration** - The plugin must be installed in your project's `.opencode/` directory.

## Quick Start

### Easy Installation (Recommended)

Use the installation script to automatically set up everything:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/norechang/_opencode_session_debugger/main/install-plugin.sh | bash

# Or if you've cloned the repo:
# bash /path/to/opencode-session-debugger/install-plugin.sh

# Start OpenCode
opencode

# View logged sessions (use npx from .opencode directory)
cd .opencode
npx opencode-debug list
npx opencode-debug analyze ses_abc123
```

### Manual Installation - Existing OpenCode Projects

```bash
# Navigate to your project's .opencode directory
cd /path/to/your/project/.opencode

# Install the plugin
npm install opencode-session-debugger

# Enable in your OpenCode config
echo '{"plugin": ["opencode-session-debugger"]}' > opencode.jsonc

# Go back to project root and start OpenCode
cd ..
opencode

# View logged sessions (use npx from .opencode directory)
cd .opencode
npx opencode-debug list
npx opencode-debug analyze ses_abc123
```

### Manual Installation - New Projects (Starting from Scratch)

```bash
# Create your project directory
mkdir my-project
cd my-project

# Create and set up .opencode directory
mkdir -p .opencode
cd .opencode

# Create package.json (npm init -y fails because of dot in directory name)
cat > package.json << 'EOF'
{
  "name": "opencode-config",
  "version": "1.0.0",
  "private": true
}
EOF

# Install the plugin
npm install opencode-session-debugger

# Create OpenCode configuration
cat > opencode.jsonc << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-session-debugger"]
}
EOF

# Go back to project root and start OpenCode
cd ..
opencode

# View logged sessions (use npx from .opencode directory)
cd .opencode
npx opencode-debug list
```

## Installation

### From NPM (Production)

> **Note**: This package is not yet published to NPM. Use the "From Source" method below.

**Step 1: Navigate to your project's `.opencode/` directory**

```bash
cd /path/to/your/project/.opencode

# If .opencode doesn't exist, create it first and set up package.json:
# mkdir -p .opencode && cd .opencode
# echo '{"name":"opencode-config","version":"1.0.0","private":true}' > package.json
```

**Step 2: Install the plugin**

```bash
npm install opencode-session-debugger
```

**Step 3: Enable the plugin**

Add to `.opencode/opencode.jsonc` (or create it):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-session-debugger"]
}
```

### From Source (Development)

#### Step 1: Configure npm for User-Level Global Packages (One-time setup)

If you haven't already configured npm to use a user-level directory (to avoid needing `sudo` for `npm link`), follow these one-time setup steps:

```bash
# Create user-level npm directory
mkdir -p ~/.npm-global

# Configure npm to use it
echo "prefix=~/.npm-global" > ~/.npmrc

# Add to PATH (for bash)
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For zsh users, use ~/.zshrc instead:
# echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
# source ~/.zshrc
```

Verify the configuration:
```bash
npm config get prefix
# Should output: /home/yourusername/.npm-global
```

#### Step 2: Build and Install

```bash
# Clone or download the plugin source
cd opencode-session-debugger

# Install dependencies
npm install

# Build the plugin
npm run build

# Link globally (makes CLI available)
npm link

# Verify CLI installation
opencode-debug --help
```

#### Step 3: Install in Your OpenCode Project

```bash
cd /path/to/your/project/.opencode

# Install from local path
npm install /path/to/opencode-session-debugger

# Or use npm link if you ran 'npm link' above
npm link opencode-session-debugger
```

## Usage

### 1. Enable the Plugin

Add to your `.opencode/opencode.jsonc` (or `.opencode/opencode.json`) in your project directory:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-session-debugger"]
}
```

> **Note**: The configuration file should be at `.opencode/opencode.jsonc` (or `.opencode/opencode.json`) relative to your project root.

### 2. Start OpenCode

The plugin will automatically start logging session data:

```bash
opencode
```

### 3. Using the CLI Tool

The `opencode-debug` CLI command is installed when you install the plugin. Depending on how you installed it, there are different ways to access it:

#### Option 1: Using npx (Recommended for local installations)

```bash
# From your project's .opencode directory
cd /path/to/your/project/.opencode
npx opencode-debug list
npx opencode-debug analyze ses_abc123
```

#### Option 2: Direct path (from project root)

```bash
# From your project root
.opencode/node_modules/.bin/opencode-debug list
.opencode/node_modules/.bin/opencode-debug analyze ses_abc123
```

#### Option 3: Global installation (if installed globally)

If you installed the plugin globally with `npm install -g opencode-session-debugger`:

```bash
# From anywhere
opencode-debug list
opencode-debug analyze ses_abc123
```

#### Option 4: Add npm scripts to your .opencode/package.json

```json
{
  "name": "opencode-config",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "debug": "opencode-debug",
    "debug:list": "opencode-debug list",
    "debug:analyze": "opencode-debug analyze"
  }
}
```

Then use:
```bash
cd .opencode
npm run debug list
npm run debug:analyze ses_abc123
```

### 4. Configure the Plugin (Optional)

Customize plugin behavior in `.opencode/opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-session-debugger"],
  "opencode-session-debugger": {
    "enabled": true,
    "logLevel": "info",
    "storage": {
      "type": "sqlite",
      "path": ".opencode/debug/sessions.db"
    },
    "capture": {
      "prompts": true,
      "tools": true,
      "agents": true,
      "skills": true,
      "messages": true,
      "events": true
    },
    "redact": {
      "secrets": true,
      "apiKeys": true,
      "fileContents": false
    }
  }
}
```

### 3. Start OpenCode

The plugin will automatically start logging session data:

```bash
opencode
```

### 4. Analyze Sessions

Use the CLI tool to analyze logged data:

```bash
# Show detailed session report
opencode-debug analyze ses_abc123

# List all sessions
opencode-debug list

# List sessions by agent
opencode-debug list --agent explore

# Show tool usage statistics
opencode-debug tools ses_abc123

# Show command execution statistics
opencode-debug commands ses_abc123

# Show timeline of events
opencode-debug timeline ses_abc123

# Export session data as JSON
opencode-debug export ses_abc123 > session.json
```

## CLI Commands

> **Note**: All examples below assume you're running from your project's `.opencode` directory using `npx opencode-debug`. 
> 
> Alternatively, you can:
> - Use the full path: `.opencode/node_modules/.bin/opencode-debug` (from project root)
> - Install globally: `npm install -g opencode-session-debugger` and use `opencode-debug` from anywhere

### `analyze <session-id>`

Show comprehensive analysis of a session including:
- Session metadata
- Summary statistics
- Tool usage breakdown
- Agent invocations
- Skill usage
- Complete timeline

```bash
cd .opencode
npx opencode-debug analyze ses_abc123
```

### `list [options]`

List sessions with optional filters:

```bash
cd .opencode

# List all sessions
npx opencode-debug list

# Filter by agent
npx opencode-debug list --agent build

# Filter by directory
npx opencode-debug list --directory my-project

# Limit results
npx opencode-debug list --limit 10
```

### `tools <session-id> [options]`

Show tool execution statistics:

```bash
cd .opencode

# Basic tool stats
npx opencode-debug tools ses_abc123

# Show only slow tools (>5 seconds)
npx opencode-debug tools ses_abc123 --min-duration 5000

# Show only failed tools
npx opencode-debug tools ses_abc123 --has-errors

# Verbose output with individual tool calls
npx opencode-debug tools ses_abc123 --verbose
```

### `agents <session-id> [options]`

Show agent invocation statistics:

```bash
# Basic agent stats
opencode-debug agents ses_abc123

# Verbose output with timestamps
opencode-debug agents ses_abc123 --verbose
```

### `skills <session-id> [options]`

Show skill usage statistics:

```bash
# Basic skill stats
opencode-debug skills ses_abc123

# Verbose output with descriptions
opencode-debug skills ses_abc123 --verbose
```

### `commands <session-id> [options]`

Show command execution statistics:

```bash
# Basic command stats
opencode-debug commands ses_abc123

# Show only slow commands (>500ms)
opencode-debug commands ses_abc123 --min-duration 500

# Show only failed commands
opencode-debug commands ses_abc123 --has-errors

# Verbose output with individual command executions
opencode-debug commands ses_abc123 --verbose
```

### `timeline <session-id>`

Show chronological timeline of all events:

```bash
opencode-debug timeline ses_abc123
```

Output includes:
- Session start
- User prompts
- Agent switches
- Command executions (with duration and status)
- Tool executions (with duration and status)
- Skill usage
- Errors
- Session end

### `export <session-id>`

Export complete session data as JSON:

```bash
# Write to file
opencode-debug export ses_abc123 > session.json

# Pipe to jq for processing
opencode-debug export ses_abc123 | jq '.stats'
```

## Configuration Options

All configuration options are set in `.opencode/opencode.jsonc` under the `"opencode-session-debugger"` key.

### `enabled` (boolean, default: `true`)

Enable or disable the plugin.

### `logLevel` (string, default: `"info"`)

Logging verbosity: `"debug"`, `"info"`, `"warn"`, `"error"`

### `storage.type` (string, default: `"sqlite"`)

Database type (currently only SQLite is supported).

### `storage.path` (string, optional)

Custom database file path. Defaults to `~/.local/share/opencode-debug/sessions.db`

Set via environment variable:
```bash
export OPENCODE_DEBUG_DIR=/custom/path
```

### `capture.*` (boolean, default: `true`)

Fine-grained control over what to capture:
- `prompts`: User prompts and parsed parts
- `tools`: Tool executions with params and results
- `agents`: Agent invocations and switches
- `skills`: Skill loading and usage
- `messages`: Full message history
- `events`: System events from OpenCode

### `redact.*` (boolean)

Privacy settings:
- `secrets`: Redact secret values (default: `true`)
- `apiKeys`: Redact API keys and tokens (default: `true`)
- `fileContents`: Redact file contents in tool results (default: `false`)

## Database Schema

The plugin uses SQLite with the following tables:

- **sessions**: Session metadata (ID, title, agent, model, timestamps)
- **messages**: User and assistant messages
- **prompts**: Parsed prompt data with system prompts
- **commands**: Command executions (slash commands, built-in commands) with timing and results
- **tool_executions**: Tool calls with parameters, results, and timing
- **agent_invocations**: Agent switches and model configurations
- **skill_usages**: Skill loading and invocation
- **events**: System events from OpenCode bus
- **chat_params**: LLM API parameters for each request

## Use Cases

### Debugging Session Issues

Track down why a session behaved unexpectedly:

```bash
# Get complete timeline
opencode-debug timeline ses_abc123

# Check for errors
opencode-debug analyze ses_abc123 | grep -i error

# Find slow tool calls
opencode-debug tools ses_abc123 --min-duration 10000
```

### Analyzing Agent Behavior

Understand which agents were used and when:

```bash
# See all agent switches
opencode-debug agents ses_abc123 --verbose

# Find sessions using specific agent
opencode-debug list --agent explore
```

### Tool Usage Analysis

Identify which tools are used most frequently:

```bash
# Tool statistics for session
opencode-debug tools ses_abc123

# Export for further analysis
opencode-debug export ses_abc123 | jq '.stats.tools'
```

### Skill Tracking

Monitor skill usage across sessions:

```bash
# Check skill usage in session
opencode-debug skills ses_abc123 --verbose

# Export skill data
opencode-debug export ses_abc123 | jq '.skills'
```

### Command Analysis

Track command executions and identify issues:

```bash
# View all commands in session
opencode-debug commands ses_abc123

# Find slow commands (>500ms)
opencode-debug commands ses_abc123 --min-duration 500

# Find failed commands
opencode-debug commands ses_abc123 --has-errors

# Export command data for analysis
opencode-debug export ses_abc123 | jq '.commands'
```

### Performance Analysis

Find performance bottlenecks:

```bash
# Find slowest tool calls
opencode-debug export ses_abc123 | jq '.tools | sort_by(.duration) | reverse | .[0:10]'

# Calculate average tool duration
opencode-debug export ses_abc123 | jq '.stats.tools.avgDuration'

# Find slowest commands
opencode-debug export ses_abc123 | jq '.commands | sort_by(.duration) | reverse | .[0:10]'

# Compare command vs tool execution times
opencode-debug export ses_abc123 | jq '{commandAvg: .stats.commands.avgDuration, toolAvg: .stats.tools.avgDuration}'
```

## Programmatic Usage

You can also use the plugin API directly in your code:

```typescript
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';
import { getDatabase } from 'opencode-session-debugger/storage/database';

const db = getDatabase();
const analyzer = new SessionAnalyzer(db);

// Get session data
const session = analyzer.getSession('ses_abc123');

// Query tool executions
const tools = analyzer.queryToolExecutions({
  sessionID: 'ses_abc123',
  minDuration: 5000,
});

// Query command executions
const commands = analyzer.getCommands('ses_abc123');

// Query slow commands
const slowCommands = analyzer.queryCommands({
  sessionID: 'ses_abc123',
  minDuration: 500,
});

// Query failed commands
const failedCommands = analyzer.queryCommands({
  sessionID: 'ses_abc123',
  hasErrors: true,
});

// Get comprehensive statistics
const stats = analyzer.getStats('ses_abc123');
console.log('Tools:', stats.tools.total);
console.log('Commands:', stats.commands.total);
console.log('Command success rate:', stats.commands.successful / stats.commands.total);

// Get timeline
const timeline = analyzer.getTimeline('ses_abc123');

// Export complete session
const data = analyzer.exportSession('ses_abc123');
console.log(JSON.stringify(data, null, 2));
```

## Known Limitations

### Command Completion Tracking

**Issue**: Command execution records show `null` values for `success`, `error`, `result`, `endTime`, and `duration` fields.

**Root Cause**: The OpenCode plugin API provides a `command.execute.before` hook but does not provide a `command.execute.after` hook. This means the plugin can track when commands START but cannot track when they complete or whether they succeed or fail.

**Current Behavior**:
- ✅ Command start is logged correctly (command name, source, arguments, start time)
- ❌ Command completion cannot be tracked (success/failure status, result, errors, duration)

**Workaround**: None available at this time. This is a limitation of the OpenCode plugin API.

**Future**: If OpenCode adds a `command.execute.after` hook in the future, the plugin can be updated to track command completion. The necessary code structure is already in place (marked as deprecated).

### Data in Commands Table

When querying the `commands` table, you will see:
- `command_name`: ✅ Available
- `command_source`: ✅ Available  
- `args`: ✅ Available
- `start_time`: ✅ Available
- `end_time`: ❌ Always `null`
- `duration`: ❌ Always `null`
- `success`: ❌ Always `null`
- `error`: ❌ Always `null`
- `result`: ❌ Always `null`

**Note**: Tool execution tracking works fully (including completion) because the API provides both `tool.execute.before` and `tool.execute.after` hooks.

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Link for local testing (requires npm configured for user directory - see Installation section)
npm link
cd /path/to/your/project
npm link opencode-session-debugger
```

> **Note**: If `npm link` requires sudo, you need to configure npm for user-level global packages. See the [Installation](#installation) section for setup instructions.

## Updating the Plugin

If you're using a local `file:` dependency and the plugin has been updated, you need to force npm to reinstall it since npm caches file dependencies.

### Method 1: Remove and Reinstall (Recommended)

```bash
cd /path/to/your/project/.opencode
rm -rf node_modules/opencode-session-debugger
npm install
```

### Method 2: Rebuild Source and Force Reinstall

```bash
# Step 1: Rebuild the plugin source
cd /path/to/opencode-session-debugger
npm run build

# Step 2: Force reinstall in your project
cd /path/to/your/project/.opencode
rm -rf node_modules/opencode-session-debugger
npm install
```

### Method 3: Clear npm Cache

```bash
cd /path/to/your/project/.opencode
npm cache clean --force
npm install
```

### Verify Installation

After updating, verify the plugin was installed correctly:

```bash
# Check file timestamps (should be recent)
ls -la /path/to/your/project/.opencode/node_modules/opencode-session-debugger/dist/

# Check plugin loads without errors
opencode --verbose

# Check debug log for any errors
tail -f ~/.local/share/opencode-debug/plugin-errors.log
```

> **Note**: Simply running `npm install` without removing the plugin first may not update it due to npm's file dependency caching.

## Troubleshooting

### npm init -y fails with "Invalid name: .opencode"

**Problem**: Running `npm init -y` inside `.opencode/` directory fails because npm doesn't allow package names starting with a dot.

**Solution**: Manually create `package.json` instead:

```bash
cd .opencode
cat > package.json << 'EOF'
{
  "name": "opencode-config",
  "version": "1.0.0",
  "private": true
}
EOF
```

Then proceed with `npm install opencode-session-debugger`.

### Plugin not logging anything

1. Check if plugin is enabled in config
2. Verify database path is writable
3. Check OpenCode console for errors

### Database file location

Default locations:
- Linux: `~/.local/share/opencode-debug/sessions.db`
- macOS: `~/.local/share/opencode-debug/sessions.db`
- Windows: `%LOCALAPPDATA%\opencode-debug\sessions.db`

Custom location:
```bash
export OPENCODE_DEBUG_DIR=/custom/path
```

### CLI command not found

If the `opencode-debug` command is not found, try these solutions:

**Option 1: Use the full path**
```bash
~/.npm-global/bin/opencode-debug list
```

**Option 2: Install globally** (if npm is configured for user directory)
```bash
npm install -g opencode-session-debugger
```

**Option 3: Use npx**
```bash
npx opencode-debug analyze ses_abc123
```

**Option 4: Check your PATH**
```bash
# Verify npm global bin is in PATH
echo $PATH | grep npm-global

# If not, add to your shell config file (~/.bashrc or ~/.zshrc)
export PATH="$HOME/.npm-global/bin:$PATH"
```

See the [Installation](#installation) section for configuring npm for user-level global packages.

### Plugin not updating / showing old behavior

If you've updated the plugin source but still see old behavior:

**Cause**: npm caches `file:` dependencies and won't automatically reinstall them.

**Solution**:
```bash
cd /path/to/your/project/.opencode
rm -rf node_modules/opencode-session-debugger
npm install
```

See the [Updating the Plugin](#updating-the-plugin) section for more details.

### Plugin showing "[object Object]" for agent names

**Fixed in latest version**. If you see agent names showing as `"[object Object]"` in the database:

1. Update to the latest plugin version (see [Updating the Plugin](#updating-the-plugin))
2. Restart your OpenCode session
3. New sessions will have correct agent names

**Note**: Old sessions in the database will still show `"[object Object]"` - only new sessions will be fixed.

## Privacy & Security

The plugin automatically redacts sensitive information:
- API keys (keys containing "api", "key", "token")
- Passwords and secrets
- Authorization headers

To disable redaction:
```json
{
  "opencode-session-debugger": {
    "redact": {
      "secrets": false,
      "apiKeys": false
    }
  }
}
```

**Warning**: Disabling redaction may expose sensitive data in logs.

## Performance

The plugin is designed for minimal performance impact:
- Asynchronous logging (non-blocking)
- SQLite with WAL mode for concurrent access
- Indexed queries for fast lookups
- Optional selective capture to reduce overhead

Typical overhead: < 1% additional latency per operation

## Error Logging & Debugging

The plugin includes comprehensive error logging to help diagnose issues. All errors are logged to both **stderr** (console) and a **dedicated log file** for persistent debugging.

### Debug Log Location

**Default path**: `~/.local/share/opencode-debug/plugin-errors.log`

This log captures:
- Plugin initialization errors
- Database connection issues
- Hook execution errors
- Data binding/constraint errors
- Configuration loading problems

### Viewing the Debug Log

```bash
# View the entire log
cat ~/.local/share/opencode-debug/plugin-errors.log

# Follow the log in real-time
tail -f ~/.local/share/opencode-debug/plugin-errors.log

# Search for errors
grep ERROR ~/.local/share/opencode-debug/plugin-errors.log

# View recent errors
tail -50 ~/.local/share/opencode-debug/plugin-errors.log
```

### Log Format

Each log entry includes:
- **Timestamp**: ISO 8601 format
- **Level**: ERROR, WARN, INFO, or DEBUG
- **Context**: Which component generated the log (e.g., SessionLogger, ToolHooks)
- **Message**: Human-readable description
- **Details**: Error stack traces, objects, or additional context

Example log entry:
```
[2026-03-06T17:30:46.694Z] [ERROR] [logAgentInvocation] Failed to log agent invocation
  Error: NOT NULL constraint failed: agent_invocations.agent_name
  Stack: SQLiteError: NOT NULL constraint failed: agent_invocations.agent_name
      at #run (bun:sqlite:185:20)
      at logAgentInvocation (/path/to/logger.ts:226:10)
```

### Common Errors

#### 1. SQLite Constraint Errors

**Symptom**: `NOT NULL constraint failed` or `UNIQUE constraint failed`

**Cause**: Invalid data or missing required fields

**Solution**: The plugin now handles these gracefully. Check the debug log to see which fields are causing issues.

#### 2. Database Lock Errors

**Symptom**: `database is locked`

**Cause**: Multiple processes accessing the database simultaneously

**Solution**: The plugin uses WAL mode to minimize locks. If persistent, check for other processes using the database:
```bash
lsof ~/.local/share/opencode-debug/sessions.db
```

#### 3. Plugin Not Loading

**Symptom**: No logs in `plugin-errors.log`, plugin doesn't appear to run

**Causes**:
- Plugin path incorrect in `.opencode/opencode.jsonc`
- Build errors during compilation
- Bun runtime incompatibility

**Solution**:
```bash
# Check plugin is installed
ls -la .opencode/node_modules/opencode-session-debugger

# Verify plugin symlink
ls -la .opencode/plugin/

# Check OpenCode console output for errors
opencode --verbose
```

#### 4. Data Binding Errors

**Symptom**: `Binding expected string, TypedArray, boolean, number, bigint or null`

**Cause**: Passing `undefined` instead of `null` to SQLite (fixed in current version)

**Solution**: Update to the latest version of the plugin:
```bash
cd .opencode
npm update opencode-session-debugger
```

### Enabling Debug Mode

To get more verbose logging, set the `logLevel` in your configuration:

```json
{
  "opencode-session-debugger": {
    "logLevel": "debug"
  }
}
```

This will log additional information about:
- Plugin initialization steps
- Database operations
- Hook invocations
- Configuration loading

### Reporting Issues

When reporting bugs, please include:
1. The relevant section from `plugin-errors.log`
2. Your configuration from `.opencode/opencode.jsonc`
3. OpenCode version (`opencode --version`)
4. Bun version (`bun --version`)
5. Steps to reproduce the issue

**Attach your debug log**:
```bash
# Copy last 100 lines to clipboard
tail -100 ~/.local/share/opencode-debug/plugin-errors.log | pbcopy   # macOS
tail -100 ~/.local/share/opencode-debug/plugin-errors.log | xclip    # Linux
```

### Clearing Debug Logs

If your debug log gets too large, you can safely truncate it:

```bash
# Clear the log
> ~/.local/share/opencode-debug/plugin-errors.log

# Or delete and let it recreate
rm ~/.local/share/opencode-debug/plugin-errors.log
```

The plugin will automatically recreate the log file on the next error.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT

## Support

For issues, questions, or feature requests:
- GitHub Issues: [Create an issue](https://github.com/your-repo/opencode-session-debugger/issues)
- Documentation: [Full docs](https://github.com/your-repo/opencode-session-debugger)

## Acknowledgments

Built for [OpenCode](https://opencode.ai) - The AI-powered coding assistant.
