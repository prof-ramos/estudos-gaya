/**
 * Schema do banco Turso (libSQL), como fonte única de verdade.
 * Fica em TypeScript para ser importado tanto pela função serverless
 * quanto por scripts de migração, sem depender de loaders especiais.
 *
 * Todas as instruções são idempotentes.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS topic_progress (
     topic_id   TEXT PRIMARY KEY,
     status     TEXT    NOT NULL DEFAULT 'nao_iniciado',
     minutes    INTEGER NOT NULL DEFAULT 0,
     notes      TEXT,
     updated_at TEXT    NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_topic_progress_status
     ON topic_progress (status)`,
  `CREATE TABLE IF NOT EXISTS study_sessions (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     topic_id   TEXT,
     date       TEXT    NOT NULL,
     minutes    INTEGER NOT NULL,
     created_at TEXT    NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_study_sessions_date
     ON study_sessions (date)`,
  `CREATE TABLE IF NOT EXISTS app_meta (
     key   TEXT PRIMARY KEY,
     value TEXT NOT NULL
   )`,
];
