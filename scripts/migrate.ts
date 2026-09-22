/**
 * Aplica o schema no banco Turso manualmente.
 *
 * Uso:
 *   source <(grep -v '^#' .env.local | sed 's/^/export /') && npx tsx scripts/migrate.ts
 *
 * O script não depende de loaders de .env porque a Vercel só injeta as
 * variáveis automaticamente no runtime das funções.
 */
import { createClient } from '@libsql/client/web';
import { SCHEMA_STATEMENTS } from '../api/_schema.js';

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error(
      'TURSO_DATABASE_URL ausente. Rode `vercel env pull .env.local` e carregue as variáveis.',
    );
    process.exit(1);
  }

  const db = createClient({ url, authToken });

  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement);
    console.log(`ok: ${statement.split('\n')[0]}`);
  }

  const { rows } = await db.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  console.log('\nTabelas:', rows.map((row) => row.name).join(', '));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
