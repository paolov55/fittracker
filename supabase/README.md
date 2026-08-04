# Supabase

Este diretório é independente do app Next.js — nada aqui é importado pelo
código em `app/`/`lib/`. Ele existe para quando o app trocar o repositório
local (`lib/store.ts`, hoje em `localStorage`) por dados reais.

## Estrutura

- `migrations/0001_init.sql` — `schema.sql` do design, verbatim (tabelas,
  enums, RLS, trigger de signup).
- `migrations/0002_app_extensions.sql` — colunas adicionais que a UI usa e
  que não existiam no schema original (capa/metadados de programa,
  aquecimento/alternativa/superset em `workout_exercises`, `kind` em
  `session_sets`). Ver `lib/db/README.md` no app para o porquê de cada uma.
- `seed.sql` — mesmos dados de `lib/db/seed.ts`, como INSERTs. Cria os
  usuários de demo diretamente em `auth.users` (padrão comum para seed local
  do Supabase) para que o trigger `handle_new_user` gere os `profiles`
  automaticamente; senha de todos: `demo1234`.
- `functions/` — edge functions (vazio por padrão, ver `functions/README.md`).

## Rodando localmente

```bash
supabase init          # se ainda não houver supabase/config.toml
supabase start
supabase db reset       # aplica migrations + seed.sql
```

## Ligando o app ao Supabase

Hoje `lib/store.ts` é o "repositório": todas as leituras/escritas da UI
passam pelas actions dele, sobre dados em memória persistidos em
`localStorage`. Para trocar por dados reais:

1. Adicionar `@supabase/supabase-js` e criar `lib/db/supabase/client.ts`.
2. Reimplementar cada action do store (`createProgram`, `startRun`,
   `finishRun`, `addStudentByCode`, …) como uma chamada ao Supabase,
   mantendo a mesma assinatura — as telas não devem precisar mudar.
3. Trocar o `persist` do Zustand por um cache local mais simples (ou remover,
   deixando o Supabase Realtime/React Query cuidar da sincronização).
