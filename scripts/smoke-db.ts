/**
 * Smoke test do schema e das consultas usadas pela API, contra um banco
 * libSQL local (arquivo temporário). Não precisa de credenciais do Turso.
 *
 * Uso: npx tsx scripts/smoke-db.ts
 */
import { createClient } from '@libsql/client';
import { SCHEMA_STATEMENTS } from '../api/_schema.js';

const db = createClient({ url: ':memory:' });

async function run() {
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement);
  }

  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  console.log('tabelas:', tables.rows.map((r) => r.name).join(', '));

  // upsert (mesma query da API)
  const upsert = `INSERT INTO topic_progress (topic_id, status, minutes, notes, updated_at)
                  VALUES (?, ?, ?, ?, ?)
                  ON CONFLICT(topic_id) DO UPDATE SET
                    status     = excluded.status,
                    minutes    = excluded.minutes,
                    notes      = excluded.notes,
                    updated_at = excluded.updated_at`;

  await db.execute({
    sql: upsert,
    args: ['sec/disc/1', 'estudando', 30, null, '2026-09-22'],
  });
  await db.execute({
    sql: upsert,
    args: ['sec/disc/1', 'dominado', 90, 'revisar lei', '2026-09-23'],
  });

  const afterUpsert = await db.execute(
    'SELECT topic_id, status, minutes, notes, updated_at FROM topic_progress',
  );
  console.log('apos upsert (esperado 1 linha, dominado/90):', JSON.stringify(afterUpsert.rows));

  // sessões + batch de importação
  await db.execute({
    sql: 'INSERT INTO study_sessions (topic_id, date, minutes, created_at) VALUES (?, ?, ?, ?)',
    args: ['sec/disc/1', '2026-09-22', 30, new Date().toISOString()],
  });

  await db.batch(
    [
      { sql: 'DELETE FROM topic_progress', args: [] },
      { sql: 'DELETE FROM study_sessions', args: [] },
      {
        sql: upsert,
        args: ['sec/disc/2', 'revisar', 45, null, '2026-09-23'],
      },
      {
        sql: 'INSERT INTO study_sessions (topic_id, date, minutes, created_at) VALUES (?, ?, ?, ?)',
        args: ['sec/disc/2', '2026-09-23', 45, new Date().toISOString()],
      },
    ],
    'write',
  );

  const topics = await db.execute(
    'SELECT topic_id, status, minutes, notes, updated_at FROM topic_progress',
  );
  const sessions = await db.execute(
    'SELECT topic_id, date, minutes FROM study_sessions ORDER BY date ASC, id ASC',
  );

  console.log('apos import (esperado 1 topico revisar/45):', JSON.stringify(topics.rows));
  console.log('apos import (esperado 1 sessao 45):', JSON.stringify(sessions.rows));
}

run()
  .then(() => console.log('\nSMOKE OK'))
  .catch((error) => {
    console.error('\nSMOKE FALHOU:', error);
    process.exit(1);
  });
