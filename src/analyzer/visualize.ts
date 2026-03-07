import type { TimelineEvent } from '../types';

/**
 * Visualization utilities for session data
 */
export class Visualizer {
  /**
   * Format timeline as readable text
   */
  static formatTimeline(timeline: TimelineEvent[]): string {
    const lines: string[] = [];
    lines.push('\n═══ Session Timeline ═══\n');

    for (const event of timeline) {
      const time = event.timestamp.toLocaleTimeString();
      
      switch (event.type) {
        case 'session_start':
          lines.push(`[${time}] 🚀 Session Started`);
          lines.push(`           Title: ${event.data.title}`);
          lines.push(`           Agent: ${event.data.agent}`);
          break;

        case 'prompt':
          const preview = event.data.rawInput.substring(0, 50).replace(/\n/g, ' ');
          lines.push(`[${time}] 💬 Prompt: ${preview}${event.data.rawInput.length > 50 ? '...' : ''}`);
          if (event.data.agent) {
            lines.push(`           Agent: ${event.data.agent}`);
          }
          break;

        case 'agent_switch':
          lines.push(`[${time}] 🔄 Agent Switch: ${event.data.agentName} (${event.data.agentMode})`);
          if (event.data.modelID) {
            lines.push(`           Model: ${event.data.modelProvider}/${event.data.modelID}`);
          }
          break;

        case 'tool_call':
          const status = event.data.success ? '✓' : '✗';
          const duration = event.data.duration ? ` (${event.data.duration}ms)` : '';
          lines.push(`[${time}] 🔧 Tool: ${event.data.toolName}${duration} ${status}`);
          if (event.data.error) {
            lines.push(`           Error: ${event.data.error.substring(0, 60)}`);
          }
          break;

        case 'skill_use':
          lines.push(`[${time}] 📚 Skill: ${event.data.skillName}`);
          if (event.data.skillSource) {
            lines.push(`           Source: ${event.data.skillSource}`);
          }
          break;

        case 'command_execute':
          const cmdStatus = event.data.success ? '✓' : '✗';
          const cmdDuration = event.data.duration ? ` (${event.data.duration}ms)` : '';
          lines.push(`[${time}] ⚡ Command: ${event.data.commandName}${cmdDuration} ${cmdStatus}`);
          if (event.data.error) {
            lines.push(`           Error: ${event.data.error.substring(0, 60)}`);
          }
          break;

        case 'error':
          lines.push(`[${time}] ❌ Error: ${event.data.message.substring(0, 60)}`);
          break;

        case 'session_end':
          lines.push(`[${time}] 🏁 Session Ended`);
          break;
      }
      
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Format tool stats as table
   */
  static formatToolStats(stats: any): string {
    const lines: string[] = [];
    lines.push('\n═══ Tool Usage Statistics ═══\n');
    lines.push(`Total: ${stats.total} | Successful: ${stats.successful} | Failed: ${stats.failed}`);
    lines.push(`Average Duration: ${Math.round(stats.avgDuration)}ms\n`);

    if (Object.keys(stats.byName).length > 0) {
      lines.push('By Tool:');
      const sorted = Object.entries(stats.byName)
        .sort((a: any, b: any) => b[1] - a[1]);
      
      for (const [name, count] of sorted) {
        const bar = '█'.repeat(Math.min(count as number, 20));
        lines.push(`  ${name.padEnd(20)} ${bar} ${count}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format agent stats
   */
  static formatAgentStats(stats: any): string {
    const lines: string[] = [];
    lines.push('\n═══ Agent Usage Statistics ═══\n');
    lines.push(`Total Invocations: ${stats.total}\n`);

    if (Object.keys(stats.byName).length > 0) {
      lines.push('By Agent:');
      const sorted = Object.entries(stats.byName)
        .sort((a: any, b: any) => b[1] - a[1]);
      
      for (const [name, count] of sorted) {
        const bar = '█'.repeat(Math.min(count as number, 20));
        lines.push(`  ${name.padEnd(20)} ${bar} ${count}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format skill stats
   */
  static formatSkillStats(stats: any): string {
    const lines: string[] = [];
    lines.push('\n═══ Skill Usage Statistics ═══\n');
    lines.push(`Total Usages: ${stats.total}\n`);

    if (Object.keys(stats.byName).length > 0) {
      lines.push('By Skill:');
      const sorted = Object.entries(stats.byName)
        .sort((a: any, b: any) => b[1] - a[1]);
      
      for (const [name, count] of sorted) {
        const bar = '█'.repeat(Math.min(count as number, 20));
        lines.push(`  ${name.padEnd(20)} ${bar} ${count}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format command stats
   */
  static formatCommandStats(stats: any): string {
    const lines: string[] = [];
    lines.push('\n═══ Command Execution Statistics ═══\n');
    lines.push(`Total: ${stats.total} | Successful: ${stats.successful} | Failed: ${stats.failed}`);
    lines.push(`Average Duration: ${Math.round(stats.avgDuration)}ms\n`);

    if (Object.keys(stats.byName).length > 0) {
      lines.push('By Command:');
      const sorted = Object.entries(stats.byName)
        .sort((a: any, b: any) => b[1] - a[1]);
      
      for (const [name, count] of sorted) {
        const bar = '█'.repeat(Math.min(count as number, 20));
        lines.push(`  ${name.padEnd(20)} ${bar} ${count}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format complete session summary
   */
  static formatSessionSummary(sessionData: any): string {
    const { session, stats, timeline } = sessionData;
    const lines: string[] = [];

    lines.push('\n╔════════════════════════════════════════════════╗');
    lines.push('║          Session Debug Report                 ║');
    lines.push('╚════════════════════════════════════════════════╝\n');

    lines.push(`Session ID: ${session.id}`);
    lines.push(`Title: ${session.title}`);
    lines.push(`Directory: ${session.directory}`);
    lines.push(`Agent: ${session.agent}`);
    if (session.modelProvider) {
      lines.push(`Model: ${session.modelProvider}/${session.modelID}`);
    }
    lines.push(`Created: ${new Date(session.createdAt).toLocaleString()}`);
    lines.push(`Updated: ${new Date(session.updatedAt).toLocaleString()}`);
    lines.push('');

    lines.push('═══ Summary ═══');
    lines.push(`Prompts: ${stats.prompts}`);
    lines.push(`Tool Calls: ${stats.tools.total} (${stats.tools.successful} successful, ${stats.tools.failed} failed)`);
    lines.push(`Agent Invocations: ${stats.agents.total}`);
    lines.push(`Skills Used: ${stats.skills.total}`);
    lines.push(`Commands Executed: ${stats.commands.total} (${stats.commands.successful} successful, ${stats.commands.failed} failed)`);
    lines.push('');

    if (stats.tools.total > 0) {
      lines.push(this.formatToolStats(stats.tools));
      lines.push('');
    }

    if (stats.commands.total > 0) {
      lines.push(this.formatCommandStats(stats.commands));
      lines.push('');
    }

    if (stats.agents.total > 0) {
      lines.push(this.formatAgentStats(stats.agents));
      lines.push('');
    }

    if (stats.skills.total > 0) {
      lines.push(this.formatSkillStats(stats.skills));
      lines.push('');
    }

    if (timeline.length > 0) {
      lines.push(this.formatTimeline(timeline));
    }

    return lines.join('\n');
  }
}
