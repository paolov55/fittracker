# Camada de dados

Os tipos em `types.ts` espelham `schema.sql` (as tabelas do Supabase) em snake_case,
para que a troca da implementação local pela do Supabase seja só trocar o
repositório, não o formato dos dados que a UI consome.

## Diferenças conhecidas entre o schema e o protótipo

- **Aquecimento e superset** não existem como colunas no schema. Aqui eles viram
  campos client-side em `WorkoutExercise` (`warmup`, `superset_group`) e em
  `SessionSet` (`kind: 'warm' | 'work'`). Ao persistir no Supabase de verdade,
  aquecimento vira apenas mais uma linha de `session_sets`/`workout_exercises`
  (a distinção fica só na UI) e superset vira uma convenção de `order_index`
  compartilhado entre duas linhas de `workout_exercises`.
- **Precedência de séries/reps/descanso** (`programs.sets_by`/`rest_by`) é
  resolvida em `resolveExerciseConfig()` (`lib/workout.ts`): `workout_exercises`
  (se preenchido) → `workouts` (se aplicável) → `programs` (default).
- **`programs.mode`**: `sync` usa `workouts.day_key`; `async` usa
  `workouts.sequence_order`. O builder atual só cobre o fluxo síncrono (por
  dia da semana), como o protótipo original.
- Campos como `cover_url`, `community_meta/desc/author/level` não existem no
  schema — são metadados de exibição, marcados como `extras client-side` em
  `types.ts`.

## Estrutura

- `types.ts` — tipos de tabela.
- `seed.ts` — dados de teste, no mesmo formato que viria do Supabase.
- `lib/store.ts` — store Zustand (persistido em `localStorage`) que hoje faz
  o papel de "repositório": todas as leituras/escritas da UI passam pelas
  actions dele. Trocar para Supabase depois é reimplementar essas actions
  como chamadas ao `supabase-js` (ver `supabase/README.md`).
