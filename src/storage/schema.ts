import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Sessions table - tracks OpenCode session metadata
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  directory: text('directory').notNull(),
  agent: text('agent').notNull(),
  modelProvider: text('model_provider'),
  modelID: text('model_id'),
  parentID: text('parent_id'),
  projectID: text('project_id'),
  workspaceID: text('workspace_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
});

/**
 * Messages table - tracks all messages in sessions
 */
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  sessionID: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content'),
  format: text('format'), // 'text' | 'markdown'
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
  parentID: text('parent_id'),
  errorType: text('error_type'),
  errorMessage: text('error_message'),
});

/**
 * Prompts table - tracks user prompts and their parsing
 */
export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  sessionID: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  messageID: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  rawInput: text('raw_input').notNull(),
  parsedParts: text('parsed_parts', { mode: 'json' }), // JSON array
  systemPrompt: text('system_prompt'),
  agent: text('agent'),
  command: text('command'),
  skill: text('skill'),
  variant: text('variant'),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
});

/**
 * Tool executions table - tracks all tool invocations
 */
export const toolExecutions = sqliteTable('tool_executions', {
  id: text('id').primaryKey(),
  sessionID: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  messageID: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  toolName: text('tool_name').notNull(),
  toolSource: text('tool_source'), // 'built-in' | 'plugin' | 'mcp' | 'custom'
  toolID: text('tool_id'),
  params: text('params', { mode: 'json' }), // JSON object
  result: text('result'),
  error: text('error'),
  startTime: integer('start_time', { mode: 'timestamp_ms' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp_ms' }),
  duration: integer('duration'), // milliseconds
  success: integer('success', { mode: 'boolean' }),
});

/**
 * Agent invocations table - tracks agent switches and subagent calls
 */
export const agentInvocations = sqliteTable('agent_invocations', {
  id: text('id').primaryKey(),
  sessionID: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  messageID: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  agentName: text('agent_name').notNull(),
  agentMode: text('agent_mode'), // 'primary' | 'subagent'
  modelProvider: text('model_provider'),
  modelID: text('model_id'),
  temperature: real('temperature'),
  topP: real('top_p'),
  maxTokens: integer('max_tokens'),
  permissions: text('permissions', { mode: 'json' }), // JSON object
  variant: text('variant'),
  customPrompt: text('custom_prompt'),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
});

/**
 * Skill usages table - tracks skill loading and invocation
 */
export const skillUsages = sqliteTable('skill_usages', {
  id: text('id').primaryKey(),
  sessionID: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  messageID: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  skillName: text('skill_name').notNull(),
  skillSource: text('skill_source'), // 'global' | 'project' | path
  skillPath: text('skill_path'),
  content: text('content'),
  description: text('description'),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
});

/**
 * Events table - tracks system events from OpenCode bus
 */
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  sessionID: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  eventData: text('event_data', { mode: 'json' }), // JSON object
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
});

/**
 * Chat params table - tracks LLM API parameters for each message
 */
export const chatParams = sqliteTable('chat_params', {
  id: text('id').primaryKey(),
  sessionID: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  messageID: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  model: text('model'),
  temperature: real('temperature'),
  topP: real('top_p'),
  maxTokens: integer('max_tokens'),
  streamMode: text('stream_mode'),
  params: text('params', { mode: 'json' }), // Additional params as JSON
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
});

/**
 * Commands table - tracks command executions (slash commands and built-in commands)
 */
export const commands = sqliteTable('commands', {
  id: text('id').primaryKey(),
  sessionID: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  messageID: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  commandName: text('command_name').notNull(),
  commandSource: text('command_source'), // 'built-in' | 'slash' | 'custom'
  args: text('args', { mode: 'json' }), // Command arguments as JSON
  result: text('result'),
  error: text('error'),
  startTime: integer('start_time', { mode: 'timestamp_ms' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp_ms' }),
  duration: integer('duration'), // milliseconds
  success: integer('success', { mode: 'boolean' }),
});

// Export all table types
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;

export type ToolExecution = typeof toolExecutions.$inferSelect;
export type NewToolExecution = typeof toolExecutions.$inferInsert;

export type AgentInvocation = typeof agentInvocations.$inferSelect;
export type NewAgentInvocation = typeof agentInvocations.$inferInsert;

export type SkillUsage = typeof skillUsages.$inferSelect;
export type NewSkillUsage = typeof skillUsages.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type ChatParam = typeof chatParams.$inferSelect;
export type NewChatParam = typeof chatParams.$inferInsert;

export type Command = typeof commands.$inferSelect;
export type NewCommand = typeof commands.$inferInsert;
