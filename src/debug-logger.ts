import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Debug logger for capturing all plugin errors to a file
 * This helps diagnose issues that occur during plugin execution
 */
class DebugLogger {
  private logPath: string = '';
  private enabled: boolean;

  constructor() {
    // Log to user's home directory for easy access
    const logDir = join(homedir(), '.local', 'share', 'opencode-debug');
    
    try {
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }
      this.logPath = join(logDir, 'plugin-errors.log');
      this.enabled = true;
    } catch (error) {
      // If we can't create the log directory, disable logging
      this.enabled = false;
      console.error('[SessionDebugger] Failed to initialize debug logger:', error);
    }
  }

  private write(level: string, context: string, message: string, error?: any) {
    if (!this.enabled) return;

    try {
      const timestamp = new Date().toISOString();
      let logLine = `[${timestamp}] [${level}] [${context}] ${message}`;
      
      if (error) {
        // Extract useful error information
        if (error instanceof Error) {
          logLine += `\n  Error: ${error.message}`;
          if (error.stack) {
            logLine += `\n  Stack: ${error.stack}`;
          }
        } else if (typeof error === 'object') {
          logLine += `\n  Details: ${JSON.stringify(error, null, 2)}`;
        } else {
          logLine += `\n  Details: ${error}`;
        }
      }
      
      logLine += '\n';
      appendFileSync(this.logPath, logLine);
    } catch (writeError) {
      // If writing fails, output to console as fallback
      console.error('[SessionDebugger] Failed to write to log file:', writeError);
    }
  }

  error(context: string, message: string, error?: any) {
    this.write('ERROR', context, message, error);
    // Also output to console stderr
    console.error(`[SessionDebugger] [${context}] ${message}`, error || '');
  }

  warn(context: string, message: string, details?: any) {
    this.write('WARN', context, message, details);
  }

  info(context: string, message: string, details?: any) {
    this.write('INFO', context, message, details);
  }

  debug(context: string, message: string, details?: any) {
    this.write('DEBUG', context, message, details);
  }

  getLogPath(): string {
    return this.logPath;
  }
}

// Singleton instance
let debugLogger: DebugLogger | null = null;

export function getDebugLogger(): DebugLogger {
  if (!debugLogger) {
    debugLogger = new DebugLogger();
  }
  return debugLogger;
}
