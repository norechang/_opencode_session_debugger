import type { SessionLogger } from '../logger';
import { randomUUID } from 'crypto';
import { getDebugLogger } from '../debug-logger';

const debugLog = getDebugLogger();

/**
 * Hook handler for tool execution tracking
 */
export function createToolHooks(logger: SessionLogger) {
  // Store tool execution IDs for correlating start/end
  const toolExecutionMap = new Map<string, string>();

  return {
    /**
     * Handle tool execution before hook - captures tool invocation
     */
    handleBefore: async (input: any, output: any) => {
      try {
        const { sessionID, messageID, tool, args, context } = input;
        
        const toolExecutionID = randomUUID();
        const toolKey = `${sessionID}:${messageID}:${tool}:${Date.now()}`;
        toolExecutionMap.set(toolKey, toolExecutionID);

        // Determine tool source
        let toolSource: string | undefined;
        if (context?.source) {
          toolSource = context.source;
        } else {
          // Try to infer from tool name
          const builtInTools = ['read', 'write', 'edit', 'bash', 'glob', 'grep', 'task', 'todowrite', 'webfetch', 'question', 'skill'];
          if (builtInTools.includes(tool)) {
            toolSource = 'built-in';
          }
        }

        logger.logToolStart({
          toolExecutionID,
          sessionID,
          messageID,
          toolName: tool,
          toolSource,
          toolID: context?.toolID,
          params: args || {},
        });

        // Store the ID in output for use in handleAfter
        output.toolExecutionID = toolExecutionID;
        output.toolKey = toolKey;
      } catch (error) {
        debugLog.error('ToolHooks', 'Error handling tool before', { error, input });
      }
    },

    /**
     * Handle tool execution after hook - captures results and timing
     */
    handleAfter: async (input: any, output: any) => {
      try {
        const { sessionID, messageID, tool, result, error, args } = input;
        
        // If this is the skill tool, log skill usage
        if (tool === 'skill' && args?.name) {
          logger.logSkillUsage({
            sessionID,
            messageID,
            skillName: args.name,
            skillSource: 'built-in',
            skillPath: undefined,
            content: undefined,
            description: undefined,
          });
        }
        
        // Try to get toolExecutionID from output or reconstruct key
        let toolExecutionID = output?.toolExecutionID;
        
        if (!toolExecutionID) {
          // Try to find by reconstructing key (approximate)
          const possibleKeys = Array.from(toolExecutionMap.keys()).filter(
            k => k.startsWith(`${sessionID}:${messageID}:${tool}:`)
          );
          
          if (possibleKeys.length > 0) {
            // Get the most recent one
            const key = possibleKeys[possibleKeys.length - 1];
            toolExecutionID = toolExecutionMap.get(key);
            toolExecutionMap.delete(key);
          }
        } else if (output?.toolKey) {
          toolExecutionMap.delete(output.toolKey);
        }

        if (toolExecutionID) {
          logger.logToolEnd({
            toolExecutionID,
            result: result ? (typeof result === 'string' ? result : JSON.stringify(result)) : undefined,
            error: error ? (typeof error === 'string' ? error : JSON.stringify(error)) : undefined,
            success: !error,
          });
        }
      } catch (err) {
        debugLog.error('ToolHooks', 'Error handling tool after', { error: err, input });
      }
    },
  };
}
