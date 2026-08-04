-- ============================================================================
-- Extensões do app sobre o schema.sql original (0001_init.sql).
--
-- 0001 é o schema definitivo entregue pelo design/produto e é mantido
-- verbatim. As colunas abaixo cobrem funcionalidades da UI que não têm
-- coluna própria no schema original — ver lib/db/README.md no app para a
-- justificativa de cada uma. Nenhuma delas é usada pelas policies de RLS
-- existentes; são metadados de exibição ou convenções client-side.
-- ============================================================================

-- Capa e metadados de card exibidos em "Programas" / "Comunidade".
alter table programs
  add column cover_url text,
  add column community_meta text,
  add column community_desc text,
  add column community_author text,
  add column community_level text check (community_level in ('Iniciante', 'Intermediário', 'Avançado'));

-- Aquecimento, exercício alternativo e agrupamento de superset. O schema
-- original modela só uma faixa de séries/reps por exercício; estes campos
-- deixam a UI marcar a primeira série como aquecimento, oferecer uma
-- variante para o carrossel de execução e agrupar duas linhas como
-- superset, sem exigir uma tabela nova.
alter table workout_exercises
  add column warmup boolean not null default false,
  add column alt_exercise_id uuid references exercises (id) on delete set null,
  add column superset_group text;

-- Marca se uma série de sessão é aquecimento ou trabalho (session_sets já
-- referencia workout_exercises, então isso só espelha a marcação acima na
-- execução real, para o histórico não perder a distinção).
alter table session_sets
  add column kind text not null default 'work' check (kind in ('warm', 'work'));
