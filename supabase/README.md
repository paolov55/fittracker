# Supabase

Este diretório é independente do app Next.js — nada aqui é importado pelo
código em `app/`/`lib/`. Ele existe para quando o app trocar o repositório
local (`lib/store.ts`, hoje em `localStorage`) por dados reais.

## Estrutura

- `schema.sql` — fonte única de verdade do banco: tabelas, enums, RLS,
  trigger de signup e o bucket/policies de storage para fotos de perfil.
  Inclui tanto o schema original do design quanto as colunas que a UI foi
  precisando ao longo do tempo (capa/metadados de programa,
  aquecimento/alternativa/superset em `workout_exercises`, `kind` em
  `session_sets`, `weight_unit`/`height_unit` em `student_details`) — ver
  `lib/db/README.md` no app para o porquê de cada uma.
- `seed.sql` — mesmos dados de `lib/db/seed.ts`, como INSERTs. Cria os
  usuários de demo diretamente em `auth.users` (padrão comum para seed local
  do Supabase) para que o trigger `handle_new_user` gere os `profiles`
  automaticamente; senha de todos: `demo1234`.
- `functions/` — edge functions (vazio por padrão, ver `functions/README.md`).

## Rodando localmente

```bash
supabase init          # se ainda não houver supabase/config.toml
supabase start
psql "$DATABASE_URL" -f supabase/schema.sql   # aplica o schema
psql "$DATABASE_URL" -f supabase/seed.sql     # popula com dados de demo
```

Se preferir gerenciar mudanças futuras via `supabase migration`, gere a
migration inicial a partir deste arquivo (`supabase db diff` ou copiando
`schema.sql` para `migrations/<timestamp>_init.sql`) e trate `schema.sql`
como o dump de referência a partir daí.

## Ligando o app ao Supabase

`lib/store.ts` é o "repositório": todas as leituras/escritas da UI passam
pelas actions dele. `login`/`signup`/`logout` e a hidratação inicial
(`lib/db/supabase/queries.ts#hydrateFromSupabase`) já chamam o Supabase via
`lib/db/supabase/client.ts`; as demais actions ainda operam sobre o cache em
memória persistido em `localStorage` e seguem para migração:

1. Reimplementar cada action restante do store (`createProgram`, `startRun`,
   `finishRun`, `addStudentByCode`, …) como uma chamada ao Supabase,
   mantendo a mesma assinatura — as telas não devem precisar mudar.
2. Trocar o `persist` do Zustand por um cache local mais simples (ou remover,
   deixando o Supabase Realtime/React Query cuidar da sincronização).

## Corrigindo um projeto já em produção

Se o signup estiver falhando com `"relation \"profiles\" does not exist"` +
`"current transaction is aborted"` no log do Supabase, o `handle_new_user()`
já aplicado está sem `set search_path` — rode `fix_handle_new_user.sql` no
SQL Editor (não precisa reaplicar `schema.sql` inteiro).

Se `student_details` já existir sem a coluna `height_unit` (schema aplicado
antes da unidade de altura ser adicionada), rode `add_height_unit.sql` no
SQL Editor — também não precisa reaplicar `schema.sql` inteiro.
