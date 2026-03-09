import { DatabaseManager, getDatabase } from './storage/database';
import * as schema from './storage/schema';
import type { PluginConfig } from './types';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { getDebugLogger } from './debug-logger';

const debugLog = getDebugLogger();

/**
 * Core logger class for tracking session events
 */
export class SessionLogger {
  private db: DatabaseManager;
  private config: Required<PluginConfig>;
  private directory: string;

  constructor(directory: string, config?: PluginConfig) {
    this.directory = directory;
    this.config = this.normalizeConfig(config);
    try {
      this.db = getDatabase(this.config.storage.path);
      debugLog.info('SessionLogger', `Initialized database at ${this.config.storage.path}`);
    } catch (error) {
      debugLog.error('SessionLogger', 'Failed to initialize database', error);
      throw error;
    }
  }

  private normalizeConfig(config?: PluginConfig): Required<PluginConfig> {
    // Get storage path, fallback to undefined to let DatabaseManager use default
    const storagePath = config?.storage?.path;
    
    // Support environment variables for configuration
    // Environment variables override config file settings
    const enabled = process.env.OPENCODE_DEBUG_ENABLED 
      ? process.env.OPENCODE_DEBUG_ENABLED === 'true' 
      : (config?.enabled ?? true);
    
    const logLevel = (process.env.OPENCODE_DEBUG_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') 
      || config?.logLevel 
      || 'info';
    
    return {
      enabled,
      logLevel,
      storage: {
        type: config?.storage?.type ?? 'sqlite',
        path: storagePath, // Can be undefined, DatabaseManager will use default
      },
      capture: {
        prompts: this.getEnvBoolean('OPENCODE_DEBUG_CAPTURE_PROMPTS', config?.capture?.prompts ?? true),
        tools: this.getEnvBoolean('OPENCODE_DEBUG_CAPTURE_TOOLS', config?.capture?.tools ?? true),
        agents: this.getEnvBoolean('OPENCODE_DEBUG_CAPTURE_AGENTS', config?.capture?.agents ?? true),
        skills: this.getEnvBoolean('OPENCODE_DEBUG_CAPTURE_SKILLS', config?.capture?.skills ?? true),
        messages: this.getEnvBoolean('OPENCODE_DEBUG_CAPTURE_MESSAGES', config?.capture?.messages ?? true),
        events: this.getEnvBoolean('OPENCODE_DEBUG_CAPTURE_EVENTS', config?.capture?.events ?? true),
      },
      redact: {
        secrets: this.getEnvBoolean('OPENCODE_DEBUG_REDACT_SECRETS', config?.redact?.secrets ?? true),
        apiKeys: this.getEnvBoolean('OPENCODE_DEBUG_REDACT_APIKEYS', config?.redact?.apiKeys ?? true),
        fileContents: this.getEnvBoolean('OPENCODE_DEBUG_REDACT_FILECONTENTS', config?.redact?.fileContents ?? false),
      },
    };
  }

  private getEnvBoolean(envVar: string, defaultValue: boolean): boolean {
    const envValue = process.env[envVar];
    if (envValue === undefined) return defaultValue;
    return envValue === 'true';
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if a specific capture type is enabled
   */
  shouldCapture(type: keyof Required<PluginConfig>['capture']): boolean {
    return this.config.enabled && (this.config.capture[type] ?? false);
  }

  /**
   * Redact sensitive information from data
   */
  private redact(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const redacted = { ...data };
    const sensitiveKeys = ['apiKey', 'api_key', 'token', 'password', 'secret', 'authorization'];

    for (const key of Object.keys(redacted)) {
      if (this.config.redact.apiKeys && sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = this.redact(redacted[key]);
      }
    }

    return redacted;
  }

  /**
   * Log session creation
   */
  logSessionCreated(data: {
    sessionID: string;
    title: string;
    agent: string;
    modelProvider?: string;
    modelID?: string;
    parentID?: string;
    projectID?: string;
    workspaceID?: string;
  }): void {
    if (!this.shouldCapture('events')) return;

    try {
      const db = this.db.getDB();
      db.insert(schema.sessions).values({
        id: data.sessionID,
        title: data.title,
        directory: this.directory,
        agent: data.agent,
        modelProvider: data.modelProvider ?? null,
        modelID: data.modelID ?? null,
        parentID: data.parentID ?? null,
        projectID: data.projectID ?? null,
        workspaceID: data.workspaceID ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing().run();
    } catch (error) {
      debugLog.error('logSessionCreated', 'Failed to log session created', error);
    }
  }

  /**
   * Log session update
   */
  logSessionUpdated(sessionID: string): void {
    if (!this.shouldCapture('events')) return;

    try {
      const db = this.db.getDB();
      db.update(schema.sessions)
        .set({ updatedAt: new Date() })
        .where(eq(schema.sessions.id, sessionID))
        .run();
    } catch (error) {
      debugLog.error('logSessionUpdated', 'Failed to log session updated', error);
    }
  }

  /**
   * Log prompt/message
   */
  logPrompt(data: {
    sessionID: string;
    messageID?: string;
    rawInput: string;
    parsedParts?: any[];
    systemPrompt?: string;
    agent?: string;
    command?: string;
    skill?: string;
    variant?: string;
  }): void {
    if (!this.shouldCapture('prompts')) return;

    try {
      const db = this.db.getDB();
      db.insert(schema.prompts).values({
        id: randomUUID(),
        sessionID: data.sessionID,
        messageID: data.messageID ?? null,
        rawInput: data.rawInput,
        parsedParts: data.parsedParts ?? null,
        systemPrompt: data.systemPrompt ?? null,
        agent: data.agent ?? null,
        command: data.command ?? null,
        skill: data.skill ?? null,
        variant: data.variant ?? null,
        timestamp: new Date(),
      }).run();
    } catch (error) {
      debugLog.error('logPrompt', 'Failed to log prompt', error);
    }
  }

  /**
   * Log message
   */
  logMessage(data: {
    messageID: string;
    sessionID: string;
    role: 'user' | 'assistant';
    content?: string;
    format?: string;
    parentID?: string;
    errorType?: string;
    errorMessage?: string;
  }): void {
    if (!this.shouldCapture('messages')) return;

    try {
      const db = this.db.getDB();
      db.insert(schema.messages).values({
        id: data.messageID,
        sessionID: data.sessionID,
        role: data.role,
        content: data.content ?? null,
        format: data.format ?? null,
        timestamp: new Date(),
        parentID: data.parentID ?? null,
        errorType: data.errorType ?? null,
        errorMessage: data.errorMessage ?? null,
      }).onConflictDoNothing().run();
    } catch (error) {
      console.error('[SessionDebugger] Failed to log message:', error);
      debugLog.error('logMessage', 'Failed to log message', error);
    }
  }

  /**
   * Log tool execution start
   */
  logToolStart(data: {
    toolExecutionID: string;
    sessionID: string;
    messageID?: string;
    toolName: string;
    toolSource?: string;
    toolID?: string;
    params: any;
  }): void {
    if (!this.shouldCapture('tools')) return;

    try {
      const db = this.db.getDB();
      db.insert(schema.toolExecutions).values({
        id: data.toolExecutionID,
        sessionID: data.sessionID,
        messageID: data.messageID ?? null,
        toolName: data.toolName,
        toolSource: data.toolSource ?? null,
        toolID: data.toolID ?? null,
        params: this.redact(data.params),
        startTime: new Date(),
        success: null,
      }).run();
    } catch (error) {
      console.error('[SessionDebugger] Failed to log tool start:', error);
      debugLog.error('logToolStart', 'Failed to log tool start', error);
    }
  }

  /**
   * Log tool execution end
   */
  logToolEnd(data: {
    toolExecutionID: string;
    result?: string;
    error?: string;
    success: boolean;
  }): void {
    if (!this.shouldCapture('tools')) return;

    try {
      const endTime = new Date();
      const db = this.db.getDB();
      
      // Get start time to calculate duration
      const execution = db
        .select()
        .from(schema.toolExecutions)
        .where(eq(schema.toolExecutions.id, data.toolExecutionID))
        .get();

      const duration = execution 
        ? endTime.getTime() - new Date(execution.startTime).getTime()
        : null;

      db.update(schema.toolExecutions)
        .set({
          result: data.result ?? null,
          error: data.error ?? null,
          success: data.success,
          endTime,
          duration,
        })
        .where(eq(schema.toolExecutions.id, data.toolExecutionID))
        .run();
    } catch (error) {
      console.error('[SessionDebugger] Failed to log tool end:', error);
      debugLog.error('logToolEnd', 'Failed to log tool end', error);
    }
  }

  /**
   * Log agent invocation
   */
  logAgentInvocation(data: {
    sessionID: string;
    messageID?: string;
    agentName: string;
    agentMode?: 'primary' | 'subagent';
    modelProvider?: string;
    modelID?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    permissions?: any;
    variant?: string;
    customPrompt?: string;
  }): void {
    if (!this.shouldCapture('agents')) return;

    try {
      const db = this.db.getDB();
      
      db.insert(schema.agentInvocations).values({
        id: randomUUID(),
        sessionID: data.sessionID,
        messageID: data.messageID ?? null,
        agentName: data.agentName,
        agentMode: data.agentMode ?? null,
        modelProvider: data.modelProvider ?? null,
        modelID: data.modelID ?? null,
        temperature: data.temperature ?? null,
        topP: data.topP ?? null,
        maxTokens: data.maxTokens ?? null,
        permissions: data.permissions ?? null,
        variant: data.variant ?? null,
        customPrompt: data.customPrompt ?? null,
        timestamp: new Date(),
      }).run();
    } catch (error) {
      console.error('[SessionDebugger] Failed to log agent invocation:', error);
      debugLog.error('logAgentInvocation', 'Failed to log agent invocation', { error, data });
    }
  }

  /**
   * Log skill usage
   */
  logSkillUsage(data: {
    sessionID: string;
    messageID?: string;
    skillName: string;
    skillSource?: string;
    skillPath?: string;
    content?: string;
    description?: string;
  }): void {
    if (!this.shouldCapture('skills')) return;

    try {
      const db = this.db.getDB();
      db.insert(schema.skillUsages).values({
        id: randomUUID(),
        sessionID: data.sessionID,
        messageID: data.messageID ?? null,
        skillName: data.skillName,
        skillSource: data.skillSource ?? null,
        skillPath: data.skillPath ?? null,
        content: data.content ?? null,
        description: data.description ?? null,
        timestamp: new Date(),
      }).run();
    } catch (error) {
      console.error('[SessionDebugger] Failed to log skill usage:', error);
      debugLog.error('logSkillUsage', 'Failed to log skill usage', error);
    }
  }

  /**
   * Log generic event
   */
  logEvent(data: {
    sessionID?: string;
    eventType: string;
    eventData?: any;
  }): void {
    if (!this.shouldCapture('events')) return;

    try {
      const db = this.db.getDB();
      db.insert(schema.events).values({
        id: randomUUID(),
        sessionID: data.sessionID ?? null,
        eventType: data.eventType,
        eventData: data.eventData ? this.redact(data.eventData) : null,
        timestamp: new Date(),
      }).run();
    } catch (error) {
      console.error('[SessionDebugger] Failed to log event:', error);
      debugLog.error('logEvent', 'Failed to log event', error);
    }
  }

  /**
   * Log chat parameters
   */
  logChatParams(data: {
    sessionID: string;
    messageID?: string;
    model?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    streamMode?: string;
    params?: any;
  }): void {
    if (!this.shouldCapture('messages')) return;

    try {
      const db = this.db.getDB();
      db.insert(schema.chatParams).values({
        id: randomUUID(),
        sessionID: data.sessionID,
        messageID: data.messageID ?? null,
        model: data.model ?? null,
        temperature: data.temperature ?? null,
        topP: data.topP ?? null,
        maxTokens: data.maxTokens ?? null,
        streamMode: data.streamMode ?? null,
        params: data.params ? this.redact(data.params) : null,
        timestamp: new Date(),
      }).run();
    } catch (error) {
      console.error('[SessionDebugger] Failed to log chat params:', error);
      debugLog.error('logChatParams', 'Failed to log chat params', error);
    }
  }

  /**
   * Log command execution start
   */
  logCommandStart(data: {
    sessionID: string;
    messageID?: string;
    commandName: string;
    commandSource?: 'built-in' | 'slash' | 'custom';
    args?: any;
  }): string {
    if (!this.shouldCapture('events')) return '';

    try {
      const commandID = randomUUID();
      const db = this.db.getDB();
      
      db.insert(schema.commands).values({
        id: commandID,
        sessionID: data.sessionID,
        messageID: data.messageID ?? null,
        commandName: data.commandName,
        commandSource: data.commandSource ?? null,
        args: data.args ? this.redact(data.args) : null,
        startTime: new Date(),
        endTime: null,
        duration: null,
        result: null,
        error: null,
        success: null,
      }).run();

      return commandID;
    } catch (error) {
      console.error('[SessionDebugger] Failed to log command start:', error);
      debugLog.error('logCommandStart', 'Failed to log command start', { error, data });
      return '';
    }
  }

  /**
   * Log command execution end
   * 
   * NOTE: This method is currently UNUSED because OpenCode plugin API does not
   * provide a 'command.execute.after' hook. Command completion cannot be tracked.
   * This method is kept for potential future use if the hook is added to OpenCode.
   * 
   * @deprecated Currently unused - no 'command.execute.after' hook in OpenCode API
   */
  logCommandEnd(data: {
    commandID: string;
    result?: string;
    error?: string;
    success: boolean;
  }): void {
    if (!this.shouldCapture('events')) return;

    try {
      const endTime = new Date();
      const db = this.db.getDB();
      
      // Get start time to calculate duration
      const execution = db
        .select()
        .from(schema.commands)
        .where(eq(schema.commands.id, data.commandID))
        .get();

      const duration = execution 
        ? endTime.getTime() - new Date(execution.startTime).getTime()
        : null;

      db.update(schema.commands)
        .set({
          result: data.result ?? null,
          error: data.error ?? null,
          success: data.success,
          endTime,
          duration,
        })
        .where(eq(schema.commands.id, data.commandID))
        .run();
    } catch (error) {
      console.error('[SessionDebugger] Failed to log command end:', error);
      debugLog.error('logCommandEnd', 'Failed to log command end', error);
    }
  }
}
