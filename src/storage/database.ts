// Use bun:sqlite for Bun runtime compatibility (OpenCode runs on Bun)
import { Database as BunDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type SQLiteDatabase = BunDatabase;

/**
 * Database manager for session debugging
 */
export class DatabaseManager {
  private db: ReturnType<typeof drizzle>;
  private sqlite: SQLiteDatabase;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Default to ~/.local/share/opencode-debug/sessions.db
    this.dbPath = dbPath || this.getDefaultPath();
    
    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Initialize database
    this.sqlite = new BunDatabase(this.dbPath);
    this.sqlite.exec('PRAGMA journal_mode = WAL');
    this.db = drizzle(this.sqlite, { schema });

    // Create tables if they don't exist
    this.initializeTables();
  }

  private getDefaultPath(): string {
    const dataDir = process.env.OPENCODE_DEBUG_DIR ||
      path.join(os.homedir(), '.local', 'share', 'opencode-debug');
    return path.join(dataDir, 'sessions.db');
  }

  private initializeTables(): void {
    // Create tables using raw SQL (since we don't have migrations set up)
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        directory TEXT NOT NULL,
        agent TEXT NOT NULL,
        model_provider TEXT,
        model_id TEXT,
        parent_id TEXT,
        project_id TEXT,
        workspace_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        archived_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT,
        format TEXT,
        timestamp INTEGER NOT NULL,
        parent_id TEXT,
        error_type TEXT,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
        raw_input TEXT NOT NULL,
        parsed_parts TEXT,
        system_prompt TEXT,
        agent TEXT,
        command TEXT,
        skill TEXT,
        variant TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tool_executions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
        tool_name TEXT NOT NULL,
        tool_source TEXT,
        tool_id TEXT,
        params TEXT,
        result TEXT,
        error TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        success INTEGER
      );

      CREATE TABLE IF NOT EXISTS agent_invocations (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
        agent_name TEXT NOT NULL,
        agent_mode TEXT,
        model_provider TEXT,
        model_id TEXT,
        temperature REAL,
        top_p REAL,
        max_tokens INTEGER,
        permissions TEXT,
        variant TEXT,
        custom_prompt TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS skill_usages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
        skill_name TEXT NOT NULL,
        skill_source TEXT,
        skill_path TEXT,
        content TEXT,
        description TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_data TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_params (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
        model TEXT,
        temperature REAL,
        top_p REAL,
        max_tokens INTEGER,
        stream_mode TEXT,
        params TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS commands (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
        command_name TEXT NOT NULL,
        command_source TEXT,
        args TEXT,
        result TEXT,
        error TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        success INTEGER
      );

      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_tool_executions_session ON tool_executions(session_id, start_time);
      CREATE INDEX IF NOT EXISTS idx_tool_executions_name ON tool_executions(tool_name);
      CREATE INDEX IF NOT EXISTS idx_agent_invocations_session ON agent_invocations(session_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_skill_usages_session ON skill_usages(session_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_commands_session ON commands(session_id, start_time);
      CREATE INDEX IF NOT EXISTS idx_commands_name ON commands(command_name);
      CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type, timestamp);
      CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, timestamp);
    `);
  }

  /**
   * Get the Drizzle database instance
   */
  getDB() {
    return this.db;
  }

  /**
   * Get the raw SQLite database instance
   */
  getSQLite(): SQLiteDatabase {
    return this.sqlite;
  }

  /**
   * Get the database file path
   */
  getPath() {
    return this.dbPath;
  }

  /**
   * Close the database connection
   */
  close() {
    this.sqlite.close();
  }

  /**
   * Execute a transaction
   */
  transaction<T>(fn: () => T): T {
    // Bun sqlite transaction API
    return this.sqlite.transaction(fn)();
  }

  /**
   * Clear all trace records from the database
   * This deletes all data from all tables
   */
  clearAllData(): void {
    this.sqlite.exec(`
      DELETE FROM chat_params;
      DELETE FROM commands;
      DELETE FROM events;
      DELETE FROM skill_usages;
      DELETE FROM agent_invocations;
      DELETE FROM tool_executions;
      DELETE FROM prompts;
      DELETE FROM messages;
      DELETE FROM sessions;
    `);
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null;

/**
 * Get or create the database manager instance
 */
export function getDatabase(dbPath?: string): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager(dbPath);
  }
  return dbInstance;
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
