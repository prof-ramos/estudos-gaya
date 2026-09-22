# Estudos Gaya — Admin dashboard de estudos

Dashboard para acompanhar o plano de estudos do concurso **TCDF** (Analista
Administrativo de Controle Externo), construído sobre o
template open source [shadcn dashboard](https://github.com/shadcndashboard/shadcndashboard)
(React 19 + Vite + Tailwind v4 + shadcn/ui + Base UI).

## Funcionalidades

- **Visão geral** — progresso no edital, tempo estudado, ritmo diário e
  distribuição dos itens por situação.
- **Edital verticalizado** — árvore completa do edital (298 itens, 16
  disciplinas, 3 seções) com busca, filtros por seção/disciplina/situação e
  ações rápidas de estudo.
- **Revisão** — fila de itens marcados para revisão, em estudo ou não iniciados.
- **Sessões** — histórico de estudo agregado por dia.
- **Estatísticas** — desempenho detalhado por disciplina.

Os dados do edital vêm de [`data/edital.json`](data/edital.json), achatados em
tempo de build por [`src/lib/edital.ts`](src/lib/edital.ts).

## Persistência com Turso

O progresso é gravado no [Turso](https://turso.tech) (libSQL), conectado pela
integração nativa do Marketplace da Vercel, que injeta automaticamente as
variáveis `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`.

- `api/state.ts` — função serverless (runtime Edge) com a API REST.
- `api/_db.ts` — cliente compartilhado, aplica o schema de forma idempotente.
- `api/_schema.ts` — schema como fonte única de verdade.
- `src/lib/api.ts` — cliente de sincronização no front.

O app **funciona offline**: o `localStorage` é usado como cache e, se a API
estiver indisponível, o selo no cabeçalho indica “Só neste navegador”. Na
primeira carga com o banco vazio, o progresso local é migrado automaticamente
para o Turso.

### API

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/state` | Estado completo (tópicos + sessões) |
| `POST` | `/api/state` | Importa o estado em massa (migração) |
| `DELETE` | `/api/state` | Zera todo o progresso |
| `PATCH` | `/api/topic` | Grava um tópico |
| `POST` | `/api/session` | Registra uma sessão de estudo |

### Provisionamento

```bash
# 1. Linkar o projeto na Vercel
vercel link

# 2. Instalar a integração Turso (exige aceitar os termos do Marketplace)
vercel integration add tursocloud --name estudos-gaya-db

# 3. Trazer as credenciais para o ambiente local
vercel env pull .env.local

# 4. Aplicar o schema
npm run db:migrate

# 5. (Opcional) validar o schema e as queries num banco em memória
npm run db:smoke
```

> `vercel env pull` e os scripts Node não carregam `.env.local`
> automaticamente. Para rodar o script com as variáveis:
> `source <(grep -v '^#' .env.local | sed 's/^/export /') && npm run db:migrate`

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

> A API em `api/` só roda no ambiente da Vercel. Em `npm run dev` o app opera
> em modo local (localStorage). Para testar a API completa, use `vercel dev`.

## Scripts

| Comando | Ação |
| --- | --- |
| `dev` | Servidor de desenvolvimento com hot-reload |
| `build` | Build de produção (TypeScript + Vite) |
| `preview` | Pré-visualiza o build de produção |
| `db:migrate` | Aplica o schema no banco Turso |
| `db:smoke` | Testa o schema e as queries em memória |

## Licença

Baseado no template shadcn dashboard (MIT). O edital e o plano de estudos são
de uso pessoal.
