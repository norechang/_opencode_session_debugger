# Programmatic API Examples

This document shows how to use the OpenCode Session Debugger plugin programmatically in your own scripts and tools.

## Installation

```bash
npm install opencode-session-debugger
```

## Basic Usage

### Querying Session Data

```typescript
import { getDatabase } from 'opencode-session-debugger';
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';

// Get database connection
const db = getDatabase();

// Create analyzer
const analyzer = new SessionAnalyzer(db);

// Get a specific session
const session = analyzer.getSession('ses_abc123');
console.log(session);

// Get all sessions
const sessions = analyzer.querySessions({
  limit: 10,
});

// Filter sessions by agent
const exploreSessions = analyzer.querySessions({
  agent: 'explore',
  limit: 5,
});
```

### Tool Execution Analysis

```typescript
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';
import { getDatabase } from 'opencode-session-debugger';

const db = getDatabase();
const analyzer = new SessionAnalyzer(db);

// Get all tool executions for a session
const tools = analyzer.getToolExecutions('ses_abc123');

// Find slow tools (>5 seconds)
const slowTools = analyzer.queryToolExecutions({
  sessionID: 'ses_abc123',
  minDuration: 5000,
});

// Find failed tools
const failedTools = analyzer.queryToolExecutions({
  sessionID: 'ses_abc123',
  hasErrors: true,
});

// Get tool statistics
const stats = analyzer.getStats('ses_abc123');
console.log('Tool stats:', stats.tools);
console.log('Average duration:', stats.tools.avgDuration);
console.log('Success rate:', stats.tools.successful / stats.tools.total);
```

### Timeline Analysis

```typescript
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';
import { Visualizer } from 'opencode-session-debugger/analyzer/visualize';
import { getDatabase } from 'opencode-session-debugger';

const db = getDatabase();
const analyzer = new SessionAnalyzer(db);

// Get timeline of events
const timeline = analyzer.getTimeline('ses_abc123');

// Print formatted timeline
console.log(Visualizer.formatTimeline(timeline));

// Process timeline events
for (const event of timeline) {
  switch (event.type) {
    case 'prompt':
      console.log('User asked:', event.data.rawInput);
      break;
    case 'tool_call':
      console.log('Tool used:', event.data.toolName);
      break;
    case 'agent_switch':
      console.log('Agent changed to:', event.data.agentName);
      break;
  }
}
```

### Export and Process Data

```typescript
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';
import { getDatabase } from 'opencode-session-debugger';
import * as fs from 'fs';

const db = getDatabase();
const analyzer = new SessionAnalyzer(db);

// Export complete session data
const sessionData = analyzer.exportSession('ses_abc123');

// Save to file
fs.writeFileSync(
  'session-export.json',
  JSON.stringify(sessionData, null, 2)
);

// Process data
console.log('Session:', sessionData.session.title);
console.log('Prompts:', sessionData.prompts.length);
console.log('Tools called:', sessionData.tools.length);
console.log('Agents used:', Object.keys(sessionData.stats.agents.byName));
```

## Advanced Queries

### Custom Database Queries

```typescript
import { getDatabase } from 'opencode-session-debugger';
import { sessions, toolExecutions } from 'opencode-session-debugger/storage/schema';
import { eq, and, gte } from 'drizzle-orm';

const db = getDatabase();

// Raw Drizzle queries
const recentSessions = db.getDB()
  .select()
  .from(sessions)
  .where(gte(sessions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
  .all();

console.log('Sessions in last 7 days:', recentSessions.length);

// Join queries
const sessionWithTools = db.getSQLite().prepare(`
  SELECT 
    s.id,
    s.title,
    COUNT(t.id) as tool_count,
    AVG(t.duration) as avg_duration
  FROM sessions s
  LEFT JOIN tool_executions t ON s.id = t.session_id
  GROUP BY s.id
  ORDER BY tool_count DESC
  LIMIT 10
`).all();

console.log('Top sessions by tool usage:', sessionWithTools);
```

### Aggregation and Reporting

```typescript
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';
import { getDatabase } from 'opencode-session-debugger';

const db = getDatabase();
const analyzer = new SessionAnalyzer(db);

// Get all sessions
const sessions = analyzer.querySessions({});

// Calculate aggregate stats
const totalSessions = sessions.length;
const agentUsage: Record<string, number> = {};
let totalTools = 0;
let totalDuration = 0;

for (const session of sessions) {
  // Count agent usage
  agentUsage[session.agent] = (agentUsage[session.agent] || 0) + 1;
  
  // Get tool stats
  const tools = analyzer.getToolExecutions(session.id);
  totalTools += tools.length;
  totalDuration += tools.reduce((sum, t) => sum + (t.duration || 0), 0);
}

console.log('Report:');
console.log('- Total sessions:', totalSessions);
console.log('- Agent usage:', agentUsage);
console.log('- Total tools called:', totalTools);
console.log('- Average duration per tool:', Math.round(totalDuration / totalTools), 'ms');
```

### Finding Patterns

```typescript
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';
import { getDatabase } from 'opencode-session-debugger';

const db = getDatabase();
const analyzer = new SessionAnalyzer(db);

// Find sessions with errors
const sessionsWithErrors = analyzer.querySessions({}).filter(session => {
  const events = analyzer.getEvents(session.id);
  return events.some(e => e.eventType.includes('error'));
});

console.log('Sessions with errors:', sessionsWithErrors.length);

// Find most common tool chains
const toolChains: Record<string, number> = {};

for (const session of analyzer.querySessions({})) {
  const tools = analyzer.getToolExecutions(session.id);
  const chain = tools.map(t => t.toolName).join(' → ');
  toolChains[chain] = (toolChains[chain] || 0) + 1;
}

const sortedChains = Object.entries(toolChains)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('Top tool chains:');
for (const [chain, count] of sortedChains) {
  console.log(`${count}x: ${chain}`);
}
```

### Building a Dashboard

```typescript
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';
import { getDatabase, closeDatabase } from 'opencode-session-debugger';

class SessionDashboard {
  private analyzer: SessionAnalyzer;

  constructor() {
    const db = getDatabase();
    this.analyzer = new SessionAnalyzer(db);
  }

  getOverview() {
    const sessions = this.analyzer.querySessions({ limit: 100 });
    
    return {
      totalSessions: sessions.length,
      lastSession: sessions[0],
      agentBreakdown: this.getAgentBreakdown(sessions),
      recentActivity: this.getRecentActivity(sessions),
    };
  }

  private getAgentBreakdown(sessions: any[]) {
    const breakdown: Record<string, number> = {};
    for (const session of sessions) {
      breakdown[session.agent] = (breakdown[session.agent] || 0) + 1;
    }
    return breakdown;
  }

  private getRecentActivity(sessions: any[]) {
    return sessions.slice(0, 5).map(session => ({
      id: session.id,
      title: session.title,
      agent: session.agent,
      timestamp: new Date(session.createdAt),
    }));
  }

  getSessionSummary(sessionID: string) {
    const session = this.analyzer.getSession(sessionID);
    const stats = this.analyzer.getStats(sessionID);
    const timeline = this.analyzer.getTimeline(sessionID);

    return {
      session,
      stats,
      timeline,
      duration: this.calculateDuration(timeline),
    };
  }

  private calculateDuration(timeline: any[]) {
    if (timeline.length < 2) return 0;
    const start = timeline[0].timestamp.getTime();
    const end = timeline[timeline.length - 1].timestamp.getTime();
    return end - start;
  }

  cleanup() {
    closeDatabase();
  }
}

// Usage
const dashboard = new SessionDashboard();
console.log(dashboard.getOverview());
console.log(dashboard.getSessionSummary('ses_abc123'));
dashboard.cleanup();
```

### Monitoring Script

```typescript
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';
import { getDatabase } from 'opencode-session-debugger';

// Run every minute to check for issues
setInterval(async () => {
  const db = getDatabase();
  const analyzer = new SessionAnalyzer(db);

  // Get recent sessions
  const recentSessions = analyzer.querySessions({
    fromDate: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
  });

  for (const session of recentSessions) {
    // Check for slow tools
    const slowTools = analyzer.queryToolExecutions({
      sessionID: session.id,
      minDuration: 10000, // >10 seconds
    });

    if (slowTools.length > 0) {
      console.warn(`⚠️ Slow tools in session ${session.id}:`);
      for (const tool of slowTools) {
        console.warn(`   ${tool.toolName}: ${tool.duration}ms`);
      }
    }

    // Check for errors
    const failedTools = analyzer.queryToolExecutions({
      sessionID: session.id,
      hasErrors: true,
    });

    if (failedTools.length > 0) {
      console.error(`❌ Failed tools in session ${session.id}:`);
      for (const tool of failedTools) {
        console.error(`   ${tool.toolName}: ${tool.error}`);
      }
    }
  }
}, 60000); // Every minute
```

### Export for External Analysis

```typescript
import { SessionAnalyzer } from 'opencode-session-debugger/analyzer/query';
import { getDatabase } from 'opencode-session-debugger';
import * as fs from 'fs';

const db = getDatabase();
const analyzer = new SessionAnalyzer(db);

// Export all sessions to CSV
const sessions = analyzer.querySessions({});

const csvHeader = 'id,title,agent,model,created_at,tool_count,avg_duration\n';
const csvRows = sessions.map(session => {
  const stats = analyzer.getStats(session.id);
  return [
    session.id,
    `"${session.title}"`,
    session.agent,
    session.modelID || '',
    new Date(session.createdAt).toISOString(),
    stats.tools.total,
    Math.round(stats.tools.avgDuration),
  ].join(',');
});

fs.writeFileSync('sessions.csv', csvHeader + csvRows.join('\n'));

console.log('Exported', sessions.length, 'sessions to sessions.csv');
```

## Type Safety

All APIs are fully typed for TypeScript:

```typescript
import type {
  SessionInfo,
  ToolExecutionInfo,
  AgentInvocationInfo,
  TimelineEvent,
  SessionQueryFilter,
} from 'opencode-session-debugger/types';

function processSession(session: SessionInfo) {
  console.log(`Processing: ${session.title}`);
}

function analyzeTool(tool: ToolExecutionInfo) {
  if (tool.success) {
    console.log(`✓ ${tool.toolName} completed in ${tool.duration}ms`);
  } else {
    console.error(`✗ ${tool.toolName} failed: ${tool.error}`);
  }
}
```

## Cleanup

Always close the database when done:

```typescript
import { closeDatabase } from 'opencode-session-debugger';

// At the end of your script
closeDatabase();
```

## Custom Database Path

```typescript
import { getDatabase } from 'opencode-session-debugger';

// Use custom database
const db = getDatabase('/custom/path/sessions.db');
```

Or set environment variable:

```bash
export OPENCODE_DEBUG_DIR=/custom/path
node my-script.js
```
