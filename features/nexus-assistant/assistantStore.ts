import * as SQLite from 'expo-sqlite';

export type ChatMessage = {
  id: number;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
};

const dbPromise = SQLite.openDatabaseAsync('nexus-assistant.db');

export async function initAssistantStore(): Promise<void> {
  const db = await dbPromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL DEFAULT 'New chat',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
      ON chat_messages(session_id, created_at);
  `);
}

export async function ensureSession(sessionId: string, title = 'New chat'): Promise<void> {
  const db = await dbPromise;
  await db.runAsync(
    'INSERT OR IGNORE INTO chat_sessions (id, title, created_at) VALUES (?, ?, ?)',
    sessionId,
    title,
    Date.now(),
  );
}

export async function addMessage(
  sessionId: string,
  role: ChatMessage['role'],
  content: string,
): Promise<void> {
  const db = await dbPromise;
  await db.runAsync(
    'INSERT INTO chat_messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)',
    sessionId,
    role,
    content,
    Date.now(),
  );
}

export async function listMessages(sessionId: string): Promise<ChatMessage[]> {
  const db = await dbPromise;
  return db.getAllAsync<ChatMessage>(
    'SELECT id, session_id as sessionId, role, content, created_at as createdAt FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC, id ASC',
    sessionId,
  );
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM chat_messages WHERE session_id = ?', sessionId);
  await db.runAsync('DELETE FROM chat_sessions WHERE id = ?', sessionId);
}

export async function clearAllAssistantData(): Promise<void> {
  const db = await dbPromise;
  await db.execAsync('DELETE FROM chat_messages; DELETE FROM chat_sessions;');
}
