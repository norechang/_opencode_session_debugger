#!/usr/bin/env bun
/**
 * Integration test for OpenCode Session Debugger Plugin
 * Simulates OpenCode events and verifies they are captured correctly
 */

import { SessionLogger } from './src/logger';
import { createSessionHooks } from './src/hooks/session';
import { createMessageHooks } from './src/hooks/message';
import { createToolHooks } from './src/hooks/tool';
import { Database } from 'bun:sqlite';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { homedir } from 'os';

// Test database path
const testDbPath = join(homedir(), '.local/share/opencode-debug/test-sessions.db');

// Clean up old test database
if (existsSync(testDbPath)) {
  unlinkSync(testDbPath);
}

console.log('🧪 OpenCode Session Debugger Integration Test\n');

// Initialize logger with test database
const logger = new SessionLogger('/test/directory', {
  enabled: true,
  logLevel: 'debug',
  storage: {
    type: 'sqlite',
    path: testDbPath,
  },
  capture: {
    prompts: true,
    tools: true,
    agents: true,
    skills: true,
    messages: true,
    events: true,
  },
});

// Create hooks
const sessionHooks = createSessionHooks(logger);
const messageHooks = createMessageHooks(logger);
const toolHooks = createToolHooks(logger);

const testSessionId = 'test-session-' + Date.now();

console.log('Testing session creation...');
await sessionHooks.handleEvent({
  event: {
    type: 'session.created',
    properties: {
      info: {
        id: testSessionId,
        title: 'Test Session',
        agent: 'build',
        model: {
          provider: 'anthropic',
          id: 'claude-sonnet-4.5',
        },
      },
    },
  },
});
console.log('✓ Session created');

console.log('\nTesting agent invocation...');
await sessionHooks.handleEvent({
  event: {
    type: 'agent.invoked',
    properties: {
      sessionID: testSessionId,
      agentType: 'explore',
      prompt: 'Find all TypeScript files',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
});
console.log('✓ Agent invocation logged');

console.log('\nTesting tool execution...');
const output = {};
await toolHooks.handleBefore({
  sessionID: testSessionId,
  messageID: 'msg-123',
  tool: 'read',
  args: { filePath: '/test/file.ts' },
}, output);

await toolHooks.handleAfter({
  sessionID: testSessionId,
  messageID: 'msg-123',
  tool: 'read',
  result: 'File contents here',
}, output);
console.log('✓ Tool execution logged');

console.log('\nTesting message logging...');
await messageHooks.handleMessage({
  sessionID: testSessionId,
  messages: [
    {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: 'Test message',
    },
  ],
}, {});
console.log('✓ Message logged');

// Verify data in database
console.log('\n📊 Verifying database contents...');
const db = new Database(testDbPath);

const sessions = db.query('SELECT COUNT(*) as count FROM sessions').get() as { count: number };
console.log(`  Sessions: ${sessions.count} ${sessions.count === 1 ? '✓' : '✗'}`);

const agents = db.query('SELECT COUNT(*) as count FROM agent_invocations').get() as { count: number };
console.log(`  Agent invocations: ${agents.count} ${agents.count === 1 ? '✓' : '✗'}`);

const tools = db.query('SELECT COUNT(*) as count FROM tool_executions').get() as { count: number };
console.log(`  Tool executions: ${tools.count} ${tools.count === 1 ? '✓' : '✗'}`);

const messages = db.query('SELECT COUNT(*) as count FROM messages').get() as { count: number };
console.log(`  Messages: ${messages.count} ${messages.count === 1 ? '✓' : '✗'}`);

// Check agent invocation details
const agentData = db.query('SELECT * FROM agent_invocations LIMIT 1').get() as any;
if (agentData) {
  console.log('\n📋 Agent Invocation Details:');
  console.log(`  Agent: ${agentData.agent_name}`);
  console.log(`  Temperature: ${agentData.temperature}`);
  console.log(`  Max Tokens: ${agentData.max_tokens}`);
  console.log(`  Custom Prompt: ${agentData.custom_prompt}`);
}

// Check tool execution details
const toolData = db.query('SELECT * FROM tool_executions LIMIT 1').get() as any;
if (toolData) {
  console.log('\n🔧 Tool Execution Details:');
  console.log(`  Tool: ${toolData.tool_name}`);
  console.log(`  Success: ${toolData.success ? 'Yes' : 'No'}`);
  console.log(`  Duration: ${toolData.duration}ms`);
}

db.close();

const allTestsPassed = sessions.count === 1 && agents.count === 1 && tools.count === 1 && messages.count === 1;

if (allTestsPassed) {
  console.log('\n✅ All tests passed!');
  console.log(`\nTest database: ${testDbPath}`);
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}
