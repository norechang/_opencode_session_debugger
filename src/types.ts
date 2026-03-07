/**
 * Type definitions for OpenCode Session Debugger plugin
 */

/**
 * Plugin configuration options
 */
export interface PluginConfig {
  enabled?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  storage?: {
    type?: 'sqlite';
    path?: string;
  };
  capture?: {
    prompts?: boolean;
    tools?: boolean;
    agents?: boolean;
    skills?: boolean;
    messages?: boolean;
    events?: boolean;
  };
  redact?: {
    secrets?: boolean;
    apiKeys?: boolean;
    fileContents?: boolean;
  };
}

/**
 * Session metadata
 */
export interface SessionInfo {
  id: string;
  title: string;
  directory: string;
  agent: string;
  modelProvider?: string;
  modelID?: string;
  parentID?: string;
  projectID?: string;
  workspaceID?: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

/**
 * Parsed prompt parts
 */
export type PromptPart = 
  | { type: 'text'; content: string }
  | { type: 'file'; path: string }
  | { type: 'command'; name: string; args: string[] }
  | { type: 'agent'; name: string }
  | { type: 'subtask'; prompt: string };

/**
 * Tool execution metadata
 */
export interface ToolExecutionInfo {
  id: string;
  sessionID: string;
  messageID?: string;
  toolName: string;
  toolSource?: 'built-in' | 'plugin' | 'mcp' | 'custom';
  toolID?: string;
  params: Record<string, any>;
  result?: string;
  error?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  success?: boolean;
}

/**
 * Agent invocation metadata
 */
export interface AgentInvocationInfo {
  id: string;
  sessionID: string;
  messageID?: string;
  agentName: string;
  agentMode?: 'primary' | 'subagent';
  modelProvider?: string;
  modelID?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  permissions?: Record<string, any>;
  variant?: string;
  customPrompt?: string;
  timestamp: Date;
}

/**
 * Skill usage metadata
 */
export interface SkillUsageInfo {
  id: string;
  sessionID: string;
  messageID?: string;
  skillName: string;
  skillSource?: string;
  skillPath?: string;
  content?: string;
  description?: string;
  timestamp: Date;
}

/**
 * Command execution metadata
 */
export interface CommandExecutionInfo {
  id: string;
  sessionID: string;
  messageID?: string;
  commandName: string;
  commandSource?: 'built-in' | 'slash' | 'custom';
  args?: Record<string, any>;
  result?: string;
  error?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  success?: boolean;
}

/**
 * Event metadata
 */
export interface EventInfo {
  id: string;
  sessionID?: string;
  eventType: string;
  eventData?: Record<string, any>;
  timestamp: Date;
}

/**
 * Timeline event for visualization
 */
export type TimelineEvent = 
  | { type: 'session_start'; sessionID: string; timestamp: Date; data: SessionInfo }
  | { type: 'prompt'; sessionID: string; timestamp: Date; data: { rawInput: string; agent: string } }
  | { type: 'agent_switch'; sessionID: string; timestamp: Date; data: AgentInvocationInfo }
  | { type: 'tool_call'; sessionID: string; timestamp: Date; data: ToolExecutionInfo }
  | { type: 'skill_use'; sessionID: string; timestamp: Date; data: SkillUsageInfo }
  | { type: 'command_execute'; sessionID: string; timestamp: Date; data: CommandExecutionInfo }
  | { type: 'error'; sessionID: string; timestamp: Date; data: { message: string } }
  | { type: 'session_end'; sessionID: string; timestamp: Date };

/**
 * Query filters for analysis
 */
export interface SessionQueryFilter {
  agent?: string;
  modelProvider?: string;
  directory?: string;
  hasErrors?: boolean;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

export interface ToolQueryFilter {
  toolName?: string;
  toolSource?: string;
  sessionID?: string;
  minDuration?: number;
  hasErrors?: boolean;
  limit?: number;
}

export interface AgentQueryFilter {
  agentName?: string;
  agentMode?: 'primary' | 'subagent';
  sessionID?: string;
  limit?: number;
}

export interface SkillQueryFilter {
  skillName?: string;
  sessionID?: string;
  limit?: number;
}

export interface CommandQueryFilter {
  commandName?: string;
  commandSource?: string;
  sessionID?: string;
  minDuration?: number;
  hasErrors?: boolean;
  limit?: number;
}
