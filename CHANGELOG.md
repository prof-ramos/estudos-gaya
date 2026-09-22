# Changelog

All notable changes to this project will be documented in this file.

---

## [1.0.0] - 2026-09-22

Estudos Gaya — dashboard de estudos para o concurso TCDF, derivado do template
open source **Shadcn Dashboard Free** (React 19 + Vite + Tailwind v4 + Base UI).

### Added

**Estudos**
- Visão geral: progresso no edital, tempo estudado, ritmo diário e distribuição
  dos itens por situação
- Edital verticalizado (298 itens, 16 disciplinas, 3 seções) com busca, filtros
  por seção/disciplina/situação e ações rápidas de estudo
- Revisão: fila de itens marcados para revisão, em estudo ou não iniciados
- Sessões: histórico de estudo agregado por dia
- Estatísticas: desempenho detalhado por disciplina

**Persistência**
- Função serverless (`api/state.ts`, runtime Edge) com API REST para estado,
  tópicos e sessões
- Persistência no Turso (libSQL) com schema idempotente (`api/_schema.ts`)
- Fallback offline: `localStorage` como cache e migração automática do progresso
  local na primeira carga com o banco vazio
- Selo de sincronização no cabeçalho

**Geral**
- Alternância de tema (claro/escuro/sistema)
- Sidebar e header responsivos, todos os textos em pt-BR
- Página de erro 404
