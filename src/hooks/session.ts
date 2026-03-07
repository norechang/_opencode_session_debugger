import type { SessionLogger } from '../logger';
import { getDebugLogger } from '../debug-logger';

const debugLog = getDebugLogger();

/**
 * Hook handler for session-related events
 */
export function createSessionHooks(logger: SessionLogger) {
  return {
    /**
     * Handle system events from OpenCode bus
     */
    handleEvent: async (input: { event: any }) => {
      const { event } = input;

      try {
        // Session created event
        if (event.type === 'session.created' && event.properties?.info) {
          const info = event.properties.info;
          logger.logSessionCreated({
            sessionID: info.id,
            title: info.title || 'Untitled',
            agent: info.agent || 'build',
            modelProvider: info.model?.provider,
            modelID: info.model?.id,
            parentID: info.parentID,
            projectID: info.projectID,
            workspaceID: info.workspaceID,
          });
        }

        // Session updated event
        if (event.type === 'session.updated' && event.properties?.info) {
          const info = event.properties.info;
          logger.logSessionUpdated(info.id);
        }

        // Session error event
        if (event.type === 'session.error') {
          logger.logEvent({
            sessionID: event.properties?.sessionID,
            eventType: 'session.error',
            eventData: {
              error: event.properties?.error,
            },
          });
        }

        // Session diff event
        if (event.type === 'session.diff' && event.properties) {
          logger.logEvent({
            sessionID: event.properties.sessionID,
            eventType: 'session.diff',
            eventData: {
              diff: event.properties.diff,
            },
          });
        }

        // Agent invocation event
        if (event.type === 'agent.invoked' && event.properties) {
          logger.logAgentInvocation({
            sessionID: event.properties.sessionID,
            messageID: event.properties.messageID,
            agentName: event.properties.agentType || event.properties.agentName,
            agentMode: event.properties.agentMode,
            modelProvider: event.properties.modelProvider,
            modelID: event.properties.modelID,
            temperature: event.properties.temperature,
            topP: event.properties.topP,
            maxTokens: event.properties.maxTokens,
            permissions: event.properties.permissions,
            variant: event.properties.variant,
            customPrompt: event.properties.prompt || event.properties.customPrompt,
          });
        }

        // Generic event logging for other event types
        logger.logEvent({
          sessionID: event.properties?.sessionID,
          eventType: event.type,
          eventData: event.properties,
        });
      } catch (error) {
        debugLog.error('SessionHooks', 'Error handling event', { error, eventType: event?.type });
      }
    },
  };
}
