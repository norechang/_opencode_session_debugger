import type { SessionLogger } from '../logger';
import { getDebugLogger } from '../debug-logger';

const debugLog = getDebugLogger();

/**
 * Safely extract agent name from various input formats
 * @param agent - Can be a string, object with name/id properties, or null/undefined
 * @returns The agent name as a string, or undefined if not available
 */
function extractAgentName(agent: any): string | undefined {
  if (!agent) {
    return undefined;
  }
  
  if (typeof agent === 'string') {
    return agent;
  }
  
  if (typeof agent === 'object') {
    // Try common property names that might contain the agent name
    return agent.name || agent.id || agent.agentName || agent.type || undefined;
  }
  
  return undefined;
}

/**
 * Hook handler for message and prompt tracking
 */
export function createMessageHooks(logger: SessionLogger) {
  return {
    /**
     * Handle chat message hook - captures prompts and system messages
     * According to OpenCode plugin API:
     *   input: { sessionID, agent?, model?, messageID?, variant? }
     *   output: { message: UserMessage, parts: Part[] }
     */
    handleMessage: async (input: any, output: any) => {
      try {
        debugLog.debug('MessageHooks', 'handleMessage called', { 
          hasInput: !!input, 
          hasSessionID: !!input?.sessionID,
          inputKeys: input ? Object.keys(input) : [],
          hasOutput: !!output,
          hasMessage: !!output?.message,
          hasParts: !!output?.parts,
          partsCount: Array.isArray(output?.parts) ? output.parts.length : 0,
          outputKeys: output ? Object.keys(output) : []
        });

        const { sessionID, agent, model, messageID, variant } = input;
        const { message, parts } = output || {};

        if (!message) {
          debugLog.warn('MessageHooks', 'No message in output', { output });
          return;
        }

        // Extract raw input text from parts
        let rawInput = '';
        if (parts && Array.isArray(parts)) {
          const textParts = parts
            .filter((part: any) => part.type === 'text')
            .map((part: any) => part.text || '');
          rawInput = textParts.join('\n');
        }

        debugLog.debug('MessageHooks', 'Processing user message', {
          messageID: message.id,
          sessionID,
          role: message.role,
          hasSystem: !!message.system,
          rawInputLength: rawInput.length,
          partsCount: parts?.length || 0
        });

        // Log the prompt with parsed parts
        if (rawInput) {
          logger.logPrompt({
            sessionID,
            rawInput,
            systemPrompt: message.system,
            agent: extractAgentName(agent) || message.agent,
            variant,
            parsedParts: parts,
          });
        } else {
          debugLog.warn('MessageHooks', 'Empty rawInput from parts');
        }

        // Log the message
        logger.logMessage({
          messageID: message.id,
          sessionID,
          role: message.role,
          content: rawInput,
          format: 'text',
        });
      } catch (error) {
        debugLog.error('MessageHooks', 'Error handling message', { error, input, output });
      }
    },

    /**
     * Handle chat params hook - captures model parameters
     */
    handleParams: async (input: any, output: any) => {
      try {
        const { sessionID, model, temperature, topP, maxTokens, stream } = input;

        logger.logChatParams({
          sessionID,
          model: typeof model === 'string' ? model : model?.id || model?.modelID,
          temperature,
          topP,
          maxTokens,
          streamMode: stream ? 'stream' : 'complete',
          params: input,
        });

        // Detect agent invocation from input
        if (input.agent) {
          // Extract agent name safely
          const agentName = extractAgentName(input.agent);
          
          // Only log if we successfully extracted an agent name
          if (agentName) {
            // Extract model information safely
            let modelProvider: string | undefined;
            let modelID: string | undefined;
            
            if (typeof model === 'string') {
              modelID = model;
            } else if (model && typeof model === 'object') {
              modelProvider = typeof model.provider === 'string' ? model.provider : 
                            typeof model.providerID === 'string' ? model.providerID : undefined;
              modelID = typeof model.id === 'string' ? model.id :
                      typeof model.modelID === 'string' ? model.modelID : undefined;
            }
            
            const agentData = {
              sessionID,
              messageID: input.messageID,
              agentName,
              agentMode: input.subagent ? 'subagent' as const : 'primary' as const,
              modelProvider,
              modelID,
              temperature: typeof temperature === 'number' ? temperature : undefined,
              topP: typeof topP === 'number' ? topP : undefined,
              maxTokens: typeof maxTokens === 'number' ? maxTokens : undefined,
              variant: typeof input.variant === 'string' ? input.variant : undefined,
            };
            
            debugLog.debug('MessageHooks', 'Logging agent invocation', agentData);
            
            logger.logAgentInvocation(agentData);
          } else {
            debugLog.warn('MessageHooks', 'Could not extract agent name from input.agent', { agent: input.agent });
          }
        }
      } catch (error) {
        debugLog.error('MessageHooks', 'Error handling params', { error, input });
      }
    },
  };
}
