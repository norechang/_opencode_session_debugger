#!/usr/bin/env bun

/**
 * OpenCode Session Debugger CLI
 * 
 * Analyze and visualize session debugging data
 * 
 * Note: This CLI requires Bun runtime since it uses bun:sqlite
 */

import { getDatabase, closeDatabase } from '../storage/database';
import { SessionAnalyzer } from '../analyzer/query';
import { Visualizer } from '../analyzer/visualize';
import * as path from 'path';
import * as os from 'os';

const commands = {
  analyze: 'Analyze a session and show detailed report',
  list: 'List all sessions with optional filters',
  tools: 'Show tool execution statistics',
  commands: 'Show command execution statistics',
  agents: 'Show agent invocation statistics',
  skills: 'Show skill usage statistics',
  timeline: 'Show session timeline',
  export: 'Export session data as JSON',
  help: 'Show this help message',
};

function showHelp() {
  console.log('\nOpenCode Session Debugger CLI\n');
  console.log('Usage: opencode-debug <command> [options]\n');
  console.log('Commands:');
  for (const [cmd, desc] of Object.entries(commands)) {
    console.log(`  ${cmd.padEnd(12)} ${desc}`);
  }
  console.log('\nExamples:');
  console.log('  opencode-debug analyze ses_abc123');
  console.log('  opencode-debug list --agent explore');
  console.log('  opencode-debug tools ses_abc123 --min-duration 1000');
  console.log('  opencode-debug commands ses_abc123 --min-duration 500');
  console.log('  opencode-debug timeline ses_abc123');
  console.log('  opencode-debug export ses_abc123 > session.json');
  console.log('');
}

function parseArgs(args: string[]) {
  const options: Record<string, any> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++;
      } else {
        options[key] = true;
      }
    } else if (arg.startsWith('-')) {
      options[arg.slice(1)] = true;
    } else {
      positional.push(arg);
    }
  }

  return { options, positional };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const { options, positional } = parseArgs(args.slice(1));

  // Get database path
  const dbPath = options.db || options['db-path'] || 
    path.join(os.homedir(), '.local', 'share', 'opencode-debug', 'sessions.db');

  const db = getDatabase(dbPath);
  const analyzer = new SessionAnalyzer(db);

  try {
    switch (command) {
      case 'analyze': {
        const sessionID = positional[0];
        if (!sessionID) {
          console.error('Error: Session ID required');
          console.log('Usage: opencode-debug analyze <session-id>');
          process.exit(1);
        }

        const session = analyzer.getSession(sessionID);
        if (!session) {
          console.error(`Error: Session not found: ${sessionID}`);
          process.exit(1);
        }

        const data = analyzer.exportSession(sessionID);
        console.log(Visualizer.formatSessionSummary(data));
        break;
      }

      case 'list': {
        const filter: any = {};
        if (options.agent) filter.agent = options.agent;
        if (options.directory) filter.directory = options.directory;
        if (options.limit) filter.limit = parseInt(options.limit);

        const sessions = analyzer.querySessions(filter);
        
        console.log('\n═══ Sessions ═══\n');
        if (sessions.length === 0) {
          console.log('No sessions found.');
        } else {
          for (const session of sessions) {
            // Format timestamp consistently with debug logger: YYYY-MM-DD HH:MM:SS
            const now = new Date(session.createdAt);
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            
            console.log(`${session.id}`);
            console.log(`  Title: ${session.title}`);
            console.log(`  Agent: ${session.agent}`);
            console.log(`  Created: ${timestamp}`);
            console.log('');
          }
          console.log(`Total: ${sessions.length} sessions`);
        }
        break;
      }

      case 'tools': {
        const sessionID = positional[0];
        if (!sessionID) {
          console.error('Error: Session ID required');
          console.log('Usage: opencode-debug tools <session-id> [options]');
          process.exit(1);
        }

        const filter: any = { sessionID };
        if (options['min-duration']) {
          filter.minDuration = parseInt(options['min-duration']);
        }
        if (options['has-errors']) {
          filter.hasErrors = true;
        }

        const tools = analyzer.queryToolExecutions(filter);
        const stats = analyzer.getStats(sessionID);
        
        console.log(Visualizer.formatToolStats(stats.tools));
        
        if (tools.length > 0 && options.verbose) {
          console.log('\n═══ Tool Executions ═══\n');
          for (const tool of tools) {
            const duration = tool.duration ? `(${tool.duration}ms)` : '';
            const status = tool.success ? '✓' : '✗';
            console.log(`${tool.toolName} ${duration} ${status}`);
            if (tool.error) {
              console.log(`  Error: ${tool.error}`);
            }
          }
        }
        break;
      }

      case 'commands': {
        const sessionID = positional[0];
        if (!sessionID) {
          console.error('Error: Session ID required');
          console.log('Usage: opencode-debug commands <session-id> [options]');
          process.exit(1);
        }

        const filter: any = { sessionID };
        if (options['min-duration']) {
          filter.minDuration = parseInt(options['min-duration']);
        }
        if (options['has-errors']) {
          filter.hasErrors = true;
        }

        const commands = analyzer.queryCommands(filter);
        const stats = analyzer.getStats(sessionID);
        
        console.log(Visualizer.formatCommandStats(stats.commands));
        
        if (commands.length > 0 && options.verbose) {
          console.log('\n═══ Command Executions ═══\n');
          for (const cmd of commands) {
            const duration = cmd.duration ? `(${cmd.duration}ms)` : '';
            const status = cmd.success ? '✓' : '✗';
            console.log(`${cmd.commandName} ${duration} ${status}`);
            if (cmd.error) {
              console.log(`  Error: ${cmd.error}`);
            }
          }
        }
        break;
      }

      case 'agents': {
        const sessionID = positional[0];
        if (!sessionID) {
          console.error('Error: Session ID required');
          console.log('Usage: opencode-debug agents <session-id>');
          process.exit(1);
        }

        const stats = analyzer.getStats(sessionID);
        console.log(Visualizer.formatAgentStats(stats.agents));
        
        if (options.verbose) {
          const agents = analyzer.getAgentInvocations(sessionID);
          console.log('\n═══ Agent Invocations ═══\n');
          for (const agent of agents) {
            const time = new Date(agent.timestamp).toLocaleTimeString();
            console.log(`[${time}] ${agent.agentName} (${agent.agentMode})`);
            if (agent.modelID) {
              console.log(`  Model: ${agent.modelProvider}/${agent.modelID}`);
            }
          }
        }
        break;
      }

      case 'skills': {
        const sessionID = positional[0];
        if (!sessionID) {
          console.error('Error: Session ID required');
          console.log('Usage: opencode-debug skills <session-id>');
          process.exit(1);
        }

        const stats = analyzer.getStats(sessionID);
        console.log(Visualizer.formatSkillStats(stats.skills));
        
        if (options.verbose) {
          const skills = analyzer.getSkillUsages(sessionID);
          console.log('\n═══ Skill Usages ═══\n');
          for (const skill of skills) {
            const time = new Date(skill.timestamp).toLocaleTimeString();
            console.log(`[${time}] ${skill.skillName}`);
            if (skill.skillSource) {
              console.log(`  Source: ${skill.skillSource}`);
            }
            if (skill.description) {
              console.log(`  ${skill.description}`);
            }
          }
        }
        break;
      }

      case 'timeline': {
        const sessionID = positional[0];
        if (!sessionID) {
          console.error('Error: Session ID required');
          console.log('Usage: opencode-debug timeline <session-id>');
          process.exit(1);
        }

        const timeline = analyzer.getTimeline(sessionID);
        console.log(Visualizer.formatTimeline(timeline));
        break;
      }

      case 'export': {
        const sessionID = positional[0];
        if (!sessionID) {
          console.error('Error: Session ID required');
          console.log('Usage: opencode-debug export <session-id>');
          process.exit(1);
        }

        const data = analyzer.exportSession(sessionID);
        console.log(JSON.stringify(data, null, 2));
        break;
      }

      default:
        console.error(`Error: Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

main();
