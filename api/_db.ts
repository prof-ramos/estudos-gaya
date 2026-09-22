import { createClient, type Client } from '@libsql/client/web';
import { SCHEMA_STATEMENTS } from './_schema.js';

/**
 * Cliente Turso compartilhado entre invocações "quentes" da função.
 * Usa o cliente web (HTTP puro) para funcionar em ambiente serverless.
 */
let ready: Promise<Client> | null = null;

function createTursoClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL não configurada. Conecte a integração Turso ao projeto e rode `vercel env pull`.',
    );
  }

  return createClient({ url, authToken });
}

/** Aplica o schema (idempotente) uma única vez por instância da função. */
async function initialize(db: Client): Promise<Client> {
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement);
  }

  return db;
}

/**
 * Retorna o cliente já com o schema aplicado.
 * Em caso de falha a promise é descartada para permitir nova tentativa.
 */
export function getDb(): Promise<Client> {
  if (!ready) {
    ready = initialize(createTursoClient()).catch((error) => {
      ready = null;
      throw error;
    });
  }

  return ready;
}

/** Indica se as credenciais do Turso estão presentes no ambiente. */
export function isConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL);
}
