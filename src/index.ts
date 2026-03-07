/**
 * OpenCode Session Debugger Plugin
 * 
 * Tracks and logs session execution, prompt parsing, agent invocations,
 * tool usage, and skill loading for debugging and analysis.
 */

import { SessionLogger } from './logger';
import { createSessionHooks } from './hooks/session';
import { createMessageHooks } from './hooks/message';
import { createToolHooks } from './hooks/tool';
import { createCommandHooks } from './hooks/command';
import type { PluginConfig } from './types';
import { getDebugLogger } from './debug-logger';

const debugLog = getDebugLogger();

// Re-export types for consumers
export * from './types';
export { SessionLogger } from './logger';
export { getDatabase, closeDatabase } from './storage/database';

/**
 * Plugin type definition (matching OpenCode's Plugin interface)
 */
type Plugin = (input: PluginInput) => Promise<Hooks>;

interface PluginInput {
  client: any;
  project: any;
  directory: string;
  worktree: string;
  serverUrl: URL;
  $: any;
}

interface Hooks {
  event?: (input: { event: any }) => Promise<void>;
  'chat.message'?: (input: any, output: any) => Promise<void>;
  'chat.params'?: (input: any, output: any) => Promise<void>;
  'tool.execute.before'?: (input: any, output: any) => Promise<void>;
  'tool.execute.after'?: (input: any, output: any) => Promise<void>;
  'command.execute.before'?: (input: any, output: any) => Promise<void>;
  // NOTE: 'command.execute.after' does not exist in OpenCode plugin API
}

/**
 * Main plugin export
 * 
 * Usage:
 * ```json
 * {
 *   "plugin": ["opencode-session-debugger"]
 * }
 * ```
 * 
 * Or with configuration:
 * ```json
 * {
 *   "plugin": ["opencode-session-debugger"],
 *   "opencode-session-debugger": {
 *     "enabled": true,
 *     "logLevel": "debug",
 *     "storage": {
 *       "path": ".opencode/debug/sessions.db"
 *     },
 *     "capture": {
 *       "prompts": true,
 *       "tools": true,
 *       "agents": true,
 *       "skills": true,
 *       "messages": true,
 *       "events": true
 *     }
 *   }
 * }
 * ```
 */
const SessionDebuggerPlugin: Plugin = async (input: PluginInput) => {
  const { directory, project } = input;

  debugLog.info('Plugin', 'SessionDebuggerPlugin called', { directory });

  // Load configuration from project config if available
  let config: PluginConfig | undefined;
  try {
    // Try to access config if available
    if (project?.config && typeof project.config === 'object') {
      config = (project.config as any)['opencode-session-debugger'];
      debugLog.info('Plugin', 'Loaded configuration', { config });
    }
  } catch (error) {
    debugLog.error('Plugin', 'Failed to load configuration', error);
  }

  // Initialize logger
  let logger: SessionLogger;
  try {
    logger = new SessionLogger(directory, config);
  } catch (error) {
    debugLog.error('Plugin', 'Failed to initialize SessionLogger', error);
    return {};
  }

  // Check if plugin is enabled
  if (!logger.isEnabled()) {
    console.log('[SessionDebugger] Plugin is disabled');
    debugLog.info('Plugin', 'Plugin is disabled');
    return {};
  }

  console.log('[SessionDebugger] Plugin initialized');
  debugLog.info('Plugin', 'Plugin initialized successfully');
  if (config?.storage?.path) {
    console.log(`[SessionDebugger] Database: ${config.storage.path}`);
    debugLog.info('Plugin', `Database path: ${config.storage.path}`);
  }
  debugLog.info('Plugin', `Log file: ${debugLog.getLogPath()}`);


  // Create hook handlers
  const sessionHooks = createSessionHooks(logger);
  const messageHooks = createMessageHooks(logger);
  const toolHooks = createToolHooks(logger);
  const commandHooks = createCommandHooks(logger);

  // Return hook implementations
  return {
    // System events
    event: sessionHooks.handleEvent,

    // Message and prompt tracking
    'chat.message': messageHooks.handleMessage,
    'chat.params': messageHooks.handleParams,

    // Tool execution tracking
    'tool.execute.before': toolHooks.handleBefore,
    'tool.execute.after': toolHooks.handleAfter,

    // Command tracking (only 'before' hook exists in OpenCode API)
    'command.execute.before': commandHooks.handleBefore,
  };
};

// Default export for ES module
export default SessionDebuggerPlugin;

// Named export for CommonJS compatibility
export { SessionDebuggerPlugin };

// CRITICAL: For CommonJS compatibility with Bun's ESM import
// Bun expects module.exports to be the function itself when importing CommonJS as ESM
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionDebuggerPlugin;
  module.exports.default = SessionDebuggerPlugin;
  module.exports.SessionDebuggerPlugin = SessionDebuggerPlugin;
}
