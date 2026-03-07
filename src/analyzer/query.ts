import { DatabaseManager } from '../storage/database';
import * as schema from '../storage/schema';
import { eq, and, gte, lte, like, desc } from 'drizzle-orm';
import type {
  SessionQueryFilter,
  ToolQueryFilter,
  AgentQueryFilter,
  SkillQueryFilter,
  TimelineEvent,
} from '../types';

/**
 * Query utilities for analyzing session data
 */
export class SessionAnalyzer {
  constructor(private db: DatabaseManager) {}

  /**
   * Get session by ID
   */
  getSession(sessionID: string) {
    return this.db.getDB()
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionID))
      .get();
  }

  /**
   * Query sessions with filters
   */
  querySessions(filter: SessionQueryFilter = {}) {
    let query = this.db.getDB().select().from(schema.sessions);

    const conditions: any[] = [];

    if (filter.agent) {
      conditions.push(eq(schema.sessions.agent, filter.agent));
    }
    if (filter.modelProvider) {
      conditions.push(eq(schema.sessions.modelProvider, filter.modelProvider));
    }
    if (filter.directory) {
      conditions.push(like(schema.sessions.directory, `%${filter.directory}%`));
    }
    if (filter.fromDate) {
      conditions.push(gte(schema.sessions.createdAt, filter.fromDate));
    }
    if (filter.toDate) {
      conditions.push(lte(schema.sessions.createdAt, filter.toDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(schema.sessions.createdAt)) as any;

    if (filter.limit) {
      query = query.limit(filter.limit) as any;
    }

    return query.all();
  }

  /**
   * Get all prompts for a session
   */
  getPrompts(sessionID: string) {
    return this.db.getDB()
      .select()
      .from(schema.prompts)
      .where(eq(schema.prompts.sessionID, sessionID))
      .orderBy(schema.prompts.timestamp)
      .all();
  }

  /**
   * Get all tool executions for a session
   */
  getToolExecutions(sessionID: string) {
    return this.db.getDB()
      .select()
      .from(schema.toolExecutions)
      .where(eq(schema.toolExecutions.sessionID, sessionID))
      .orderBy(schema.toolExecutions.startTime)
      .all();
  }

  /**
   * Query tool executions with filters
   */
  queryToolExecutions(filter: ToolQueryFilter = {}) {
    let query = this.db.getDB().select().from(schema.toolExecutions);

    const conditions: any[] = [];

    if (filter.sessionID) {
      conditions.push(eq(schema.toolExecutions.sessionID, filter.sessionID));
    }
    if (filter.toolName) {
      conditions.push(eq(schema.toolExecutions.toolName, filter.toolName));
    }
    if (filter.toolSource) {
      conditions.push(eq(schema.toolExecutions.toolSource, filter.toolSource));
    }
    if (filter.minDuration) {
      conditions.push(gte(schema.toolExecutions.duration, filter.minDuration));
    }
    if (filter.hasErrors !== undefined) {
      if (filter.hasErrors) {
        conditions.push(eq(schema.toolExecutions.success, false));
      } else {
        conditions.push(eq(schema.toolExecutions.success, true));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(schema.toolExecutions.startTime)) as any;

    if (filter.limit) {
      query = query.limit(filter.limit) as any;
    }

    return query.all();
  }

  /**
   * Get all agent invocations for a session
   */
  getAgentInvocations(sessionID: string) {
    return this.db.getDB()
      .select()
      .from(schema.agentInvocations)
      .where(eq(schema.agentInvocations.sessionID, sessionID))
      .orderBy(schema.agentInvocations.timestamp)
      .all();
  }

  /**
   * Query agent invocations with filters
   */
  queryAgentInvocations(filter: AgentQueryFilter = {}) {
    let query = this.db.getDB().select().from(schema.agentInvocations);

    const conditions: any[] = [];

    if (filter.sessionID) {
      conditions.push(eq(schema.agentInvocations.sessionID, filter.sessionID));
    }
    if (filter.agentName) {
      conditions.push(eq(schema.agentInvocations.agentName, filter.agentName));
    }
    if (filter.agentMode) {
      conditions.push(eq(schema.agentInvocations.agentMode, filter.agentMode));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(schema.agentInvocations.timestamp)) as any;

    if (filter.limit) {
      query = query.limit(filter.limit) as any;
    }

    return query.all();
  }

  /**
   * Get all skill usages for a session
   */
  getSkillUsages(sessionID: string) {
    return this.db.getDB()
      .select()
      .from(schema.skillUsages)
      .where(eq(schema.skillUsages.sessionID, sessionID))
      .orderBy(schema.skillUsages.timestamp)
      .all();
  }

  /**
   * Query skill usages with filters
   */
  querySkillUsages(filter: SkillQueryFilter = {}) {
    let query = this.db.getDB().select().from(schema.skillUsages);

    const conditions: any[] = [];

    if (filter.sessionID) {
      conditions.push(eq(schema.skillUsages.sessionID, filter.sessionID));
    }
    if (filter.skillName) {
      conditions.push(eq(schema.skillUsages.skillName, filter.skillName));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(schema.skillUsages.timestamp)) as any;

    if (filter.limit) {
      query = query.limit(filter.limit) as any;
    }

    return query.all();
  }

  /**
   * Get all events for a session
   */
  getEvents(sessionID: string) {
    return this.db.getDB()
      .select()
      .from(schema.events)
      .where(eq(schema.events.sessionID, sessionID))
      .orderBy(schema.events.timestamp)
      .all();
  }

  /**
   * Get all command executions for a session
   */
  getCommands(sessionID: string) {
    return this.db.getDB()
      .select()
      .from(schema.commands)
      .where(eq(schema.commands.sessionID, sessionID))
      .orderBy(schema.commands.startTime)
      .all();
  }

  /**
   * Query command executions with filters
   */
  queryCommands(filter: {
    sessionID?: string;
    commandName?: string;
    commandSource?: string;
    hasErrors?: boolean;
    minDuration?: number;
    limit?: number;
  } = {}) {
    let query = this.db.getDB().select().from(schema.commands);

    const conditions: any[] = [];

    if (filter.sessionID) {
      conditions.push(eq(schema.commands.sessionID, filter.sessionID));
    }
    if (filter.commandName) {
      conditions.push(eq(schema.commands.commandName, filter.commandName));
    }
    if (filter.commandSource) {
      conditions.push(eq(schema.commands.commandSource, filter.commandSource));
    }
    if (filter.hasErrors) {
      // Check for commands with errors
      const hasError = this.db.getSQLite().prepare(`
        SELECT * FROM commands WHERE error IS NOT NULL AND error != ''
      `).all();
      return hasError.slice(0, filter.limit || 100) as any[];
    }
    if (filter.minDuration !== undefined) {
      // Query commands with minimum duration
      const slowCommands = this.db.getSQLite().prepare(`
        SELECT * FROM commands WHERE duration >= ?
      `).all(filter.minDuration);
      return slowCommands.slice(0, filter.limit || 100) as any[];
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(schema.commands.startTime)) as any;

    if (filter.limit) {
      query = query.limit(filter.limit) as any;
    }

    return query.all();
  }

  /**
   * Get timeline of events for a session
   */
  getTimeline(sessionID: string): TimelineEvent[] {
    const session = this.getSession(sessionID);
    if (!session) return [];

    const prompts = this.getPrompts(sessionID);
    const tools = this.getToolExecutions(sessionID);
    const agents = this.getAgentInvocations(sessionID);
    const skills = this.getSkillUsages(sessionID);
    const commands = this.getCommands(sessionID);
    const events = this.getEvents(sessionID);

    const timeline: TimelineEvent[] = [];

    // Session start
    timeline.push({
      type: 'session_start',
      sessionID,
      timestamp: new Date(session.createdAt),
      data: session as any,
    });

    // Add prompts
    for (const prompt of prompts) {
      timeline.push({
        type: 'prompt',
        sessionID,
        timestamp: new Date(prompt.timestamp),
        data: {
          rawInput: prompt.rawInput,
          agent: prompt.agent || 'unknown',
        },
      });
    }

    // Add tool executions
    for (const tool of tools) {
      timeline.push({
        type: 'tool_call',
        sessionID,
        timestamp: new Date(tool.startTime),
        data: tool as any,
      });
    }

    // Add agent invocations
    for (const agent of agents) {
      timeline.push({
        type: 'agent_switch',
        sessionID,
        timestamp: new Date(agent.timestamp),
        data: agent as any,
      });
    }

    // Add skill usages
    for (const skill of skills) {
      timeline.push({
        type: 'skill_use',
        sessionID,
        timestamp: new Date(skill.timestamp),
        data: skill as any,
      });
    }

    // Add command executions
    for (const command of commands) {
      timeline.push({
        type: 'command_execute',
        sessionID,
        timestamp: new Date(command.startTime),
        data: command as any,
      });
    }

    // Add error events
    for (const event of events) {
      if (event.eventType.includes('error')) {
        timeline.push({
          type: 'error',
          sessionID,
          timestamp: new Date(event.timestamp),
          data: {
            message: event.eventData ? JSON.stringify(event.eventData) : 'Unknown error',
          },
        });
      }
    }

    // Sort by timestamp
    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return timeline;
  }

  /**
   * Get statistics for a session
   */
  getStats(sessionID: string) {
    const tools = this.getToolExecutions(sessionID);
    const agents = this.getAgentInvocations(sessionID);
    const skills = this.getSkillUsages(sessionID);
    const commands = this.getCommands(sessionID);
    const prompts = this.getPrompts(sessionID);

    const toolStats = {
      total: tools.length,
      successful: tools.filter(t => t.success).length,
      failed: tools.filter(t => !t.success).length,
      avgDuration: tools.length > 0
        ? tools.reduce((sum, t) => sum + (t.duration || 0), 0) / tools.length
        : 0,
      byName: tools.reduce((acc, t) => {
        acc[t.toolName] = (acc[t.toolName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    const agentStats = {
      total: agents.length,
      byName: agents.reduce((acc, a) => {
        acc[a.agentName] = (acc[a.agentName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    const skillStats = {
      total: skills.length,
      byName: skills.reduce((acc, s) => {
        acc[s.skillName] = (acc[s.skillName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    const commandStats = {
      total: commands.length,
      successful: commands.filter(c => c.success).length,
      failed: commands.filter(c => !c.success).length,
      avgDuration: commands.length > 0
        ? commands.reduce((sum, c) => sum + (c.duration || 0), 0) / commands.length
        : 0,
      byName: commands.reduce((acc, c) => {
        acc[c.commandName] = (acc[c.commandName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      prompts: prompts.length,
      tools: toolStats,
      agents: agentStats,
      skills: skillStats,
      commands: commandStats,
    };
  }

  /**
   * Export session data as JSON
   */
  exportSession(sessionID: string) {
    return {
      session: this.getSession(sessionID),
      prompts: this.getPrompts(sessionID),
      tools: this.getToolExecutions(sessionID),
      agents: this.getAgentInvocations(sessionID),
      skills: this.getSkillUsages(sessionID),
      commands: this.getCommands(sessionID),
      events: this.getEvents(sessionID),
      stats: this.getStats(sessionID),
      timeline: this.getTimeline(sessionID),
    };
  }
}
