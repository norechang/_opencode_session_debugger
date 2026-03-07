import type { SessionLogger } from '../logger';
import { getDebugLogger } from '../debug-logger';

const debugLog = getDebugLogger();

/**
 * Hook handler for command and skill tracking
 * 
 * NOTE: OpenCode plugin API only provides 'command.execute.before' hook.
 * There is no 'command.execute.after' hook, so we cannot track command
 * completion, success, or failure. The commands table will have null
 * values for success, error, result, endTime, and duration fields.
 */
export function createCommandHooks(logger: SessionLogger) {
  return {
    /**
     * Handle command execution before hook - captures command/skill invocation
     */
    handleBefore: async (input: any, output: any) => {
      try {
        const { sessionID, messageID, command, args, source } = input;
        const commandName = typeof command === 'string' ? command : command?.name;

        // If this is a skill command, log skill usage
        if (source === 'skill' && command) {
          logger.logSkillUsage({
            sessionID,
            messageID,
            skillName: command.name || command,
            skillSource: command.source,
            skillPath: command.path,
            content: command.template || command.content,
            description: command.description,
          });

          // Also log the prompt with skill reference
          if (args) {
            logger.logPrompt({
              sessionID,
              messageID,
              rawInput: Array.isArray(args) ? args.join(' ') : String(args),
              skill: command.name || command,
              agent: input.agent,
            });
          }
        }

        // If this is a regular command
        if (command && source !== 'skill') {
          logger.logPrompt({
            sessionID,
            messageID,
            rawInput: Array.isArray(args) ? args.join(' ') : String(args || ''),
            command: commandName,
            agent: input.agent,
          });
        }

        // Log command execution start in dedicated commands table
        // NOTE: We cannot log completion as there is no 'command.execute.after' hook
        if (commandName) {
          logger.logCommandStart({
            sessionID,
            messageID,
            commandName,
            commandSource: source || 'built-in',
            args,
          });
        }

        // Also log command execution as an event for backwards compatibility
        logger.logEvent({
          sessionID,
          eventType: 'command.execute',
          eventData: {
            command: commandName,
            source,
            args,
          },
        });
      } catch (error) {
        debugLog.error('CommandHooks', 'Error handling command before', { error, input });
      }
    },
  };
}
