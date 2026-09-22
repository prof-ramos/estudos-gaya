import { getDb, isConfigured } from './_db.js';

/**
 * API de progresso de estudos, apoiada no Turso (libSQL).
 *
 * Rotas:
 *   GET    /api/state            → estado completo (tópicos + sessões)
 *   POST   /api/state            → importa em massa (migração do localStorage)
 *   PATCH  /api/topic            → grava um tópico
 *   POST   /api/session          → registra uma sessão de estudo
 *   DELETE /api/state            → zera todo o progresso
 */

const STATUS_VALIDOS = ['nao_iniciado', 'estudando', 'revisar', 'dominado'];

interface TopicPayload {
  topicId: string;
  status: string;
  minutes: number;
  notes?: string | null;
  updatedAt: string;
}

interface SessionPayload {
  topicId?: string | null;
  date: string;
  minutes: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

/** Valida e normaliza um tópico recebido do cliente. */
function parseTopic(input: unknown): TopicPayload | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;

  if (typeof raw.topicId !== 'string' || raw.topicId.length === 0) return null;

  const status =
    typeof raw.status === 'string' && STATUS_VALIDOS.includes(raw.status)
      ? raw.status
      : 'nao_iniciado';

  const minutes = Number(raw.minutes);
  const updatedAt =
    typeof raw.updatedAt === 'string' && raw.updatedAt.length > 0
      ? raw.updatedAt
      : new Date().toISOString().slice(0, 10);

  return {
    topicId: raw.topicId,
    status,
    minutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0,
    notes: typeof raw.notes === 'string' ? raw.notes : null,
    updatedAt,
  };
}

/** Valida e normaliza uma sessão de estudo. */
function parseSession(input: unknown): SessionPayload | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;

  const minutes = Number(raw.minutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;

  const date =
    typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)
      ? raw.date
      : new Date().toISOString().slice(0, 10);

  return {
    topicId: typeof raw.topicId === 'string' ? raw.topicId : null,
    date,
    minutes: Math.round(minutes),
  };
}

async function readState(): Promise<Response> {
  const db = await getDb();

  const [topics, sessions] = await Promise.all([
    db.execute('SELECT topic_id, status, minutes, notes, updated_at FROM topic_progress'),
    db.execute('SELECT topic_id, date, minutes FROM study_sessions ORDER BY date ASC, id ASC'),
  ]);

  return json({
    topics: topics.rows.map((row) => ({
      topicId: row.topic_id,
      status: row.status,
      minutes: row.minutes,
      notes: row.notes,
      updatedAt: row.updated_at,
    })),
    sessions: sessions.rows.map((row) => ({
      topicId: row.topic_id,
      date: row.date,
      minutes: row.minutes,
    })),
  });
}

async function upsertTopic(payload: TopicPayload): Promise<void> {
  const db = await getDb();

  await db.execute({
    sql: `INSERT INTO topic_progress (topic_id, status, minutes, notes, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(topic_id) DO UPDATE SET
            status     = excluded.status,
            minutes    = excluded.minutes,
            notes      = excluded.notes,
            updated_at = excluded.updated_at`,
    args: [
      payload.topicId,
      payload.status,
      payload.minutes,
      payload.notes ?? null,
      payload.updatedAt,
    ],
  });
}

async function insertSession(payload: SessionPayload): Promise<void> {
  const db = await getDb();

  await db.execute({
    sql: `INSERT INTO study_sessions (topic_id, date, minutes, created_at)
          VALUES (?, ?, ?, ?)`,
    args: [
      payload.topicId ?? null,
      payload.date,
      payload.minutes,
      new Date().toISOString(),
    ],
  });
}

/** Importa o estado inteiro em uma transação (usado na migração). */
async function importState(body: Record<string, unknown>): Promise<Response> {
  const topics = Array.isArray(body.topics)
    ? body.topics.map(parseTopic).filter((t): t is TopicPayload => t !== null)
    : [];
  const sessions = Array.isArray(body.sessions)
    ? body.sessions.map(parseSession).filter((s): s is SessionPayload => s !== null)
    : [];

  const db = await getDb();
  const statements = [
    { sql: 'DELETE FROM topic_progress', args: [] as (string | number | null)[] },
    { sql: 'DELETE FROM study_sessions', args: [] as (string | number | null)[] },
    ...topics.map((topic) => ({
      sql: `INSERT INTO topic_progress (topic_id, status, minutes, notes, updated_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        topic.topicId,
        topic.status,
        topic.minutes,
        topic.notes ?? null,
        topic.updatedAt,
      ] as (string | number | null)[],
    })),
    ...sessions.map((session) => ({
      sql: `INSERT INTO study_sessions (topic_id, date, minutes, created_at)
            VALUES (?, ?, ?, ?)`,
      args: [
        session.topicId ?? null,
        session.date,
        session.minutes,
        new Date().toISOString(),
      ] as (string | number | null)[],
    })),
  ];

  await db.batch(statements, 'write');

  return json({ imported: { topics: topics.length, sessions: sessions.length } });
}

async function resetState(): Promise<Response> {
  const db = await getDb();
  await db.batch(
    [
      { sql: 'DELETE FROM topic_progress', args: [] },
      { sql: 'DELETE FROM study_sessions', args: [] },
    ],
    'write',
  );

  return json({ ok: true });
}

/** Runtime Edge: a assinatura Web (Request/Response) é suportada nativamente. */
export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (!isConfigured()) {
    return json(
      {
        error: 'database_not_configured',
        message:
          'Turso não configurado. Conecte a integração Turso ao projeto na Vercel e rode `vercel env pull`.',
      },
      503,
    );
  }

  const { pathname } = new URL(request.url);

  try {
    if (pathname.endsWith('/state')) {
      if (request.method === 'GET') return await readState();
      if (request.method === 'DELETE') return await resetState();

      if (request.method === 'POST') {
        const body = (await request.json()) as Record<string, unknown>;
        return await importState(body);
      }

      return json({ error: 'method_not_allowed' }, 405);
    }

    if (pathname.endsWith('/topic') && request.method === 'PATCH') {
      const topic = parseTopic(await request.json());
      if (!topic) return json({ error: 'invalid_payload' }, 400);

      await upsertTopic(topic);
      return json({ ok: true, topic });
    }

    if (pathname.endsWith('/session') && request.method === 'POST') {
      const session = parseSession(await request.json());
      if (!session) return json({ error: 'invalid_payload' }, 400);

      await insertSession(session);
      return json({ ok: true, session }, 201);
    }

    return json({ error: 'not_found' }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    return json({ error: 'internal_error', message }, 500);
  }
}
