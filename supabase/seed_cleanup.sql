-- ============================================================================
-- Reverte exatamente os dados criados por supabase/seed.sql.
-- Rodar manualmente contra o projeto Supabase (SQL editor ou psql) depois de
-- aprovados os testes com os dados de demo.
--
-- Escopo: remove só os IDs fixos que o seed criou. Não apaga dados gerados
-- durante os testes manuais (programas, treinos, sessões etc. criados pelo
-- app com IDs aleatórios/UUIDs novos) — isso fica fora deste script.
--
-- Ordem: apagar os 6 usuários de demo em auth.users cascade-deleta profiles
-- e, em cadeia, student_details, trainer_details, trainer_students,
-- programs (inclusive os 3 de comunidade, owner_id = paolo), program_assignments,
-- workouts, workout_exercises, sessions, session_sets e body_metrics.
-- Os 25 exercícios do catálogo não são apagados em cascata (workout_exercises
-- referencia exercises com "on delete restrict", e exercises.created_by é
-- "on delete set null", não cascade) — por isso são removidos explicitamente,
-- depois que os workout_exercises que os referenciam já caíram em cascata.
-- ============================================================================

begin;

delete from auth.users where id in (
  '11111111-1111-4111-8111-111111111111', -- Sara
  '22222222-2222-4222-8222-222222222222', -- Paolo
  '33333333-3333-4333-8333-333333333333', -- Bruno
  '44444444-4444-4444-8444-444444444444', -- Camila
  '55555555-5555-4555-8555-555555555555', -- Iago
  '66666666-6666-4666-8666-666666666666'  -- Luana
);

delete from exercises where id in (
  'c0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000003',
  'c0000000-0000-4000-8000-000000000004',
  'c0000000-0000-4000-8000-000000000005',
  'c0000000-0000-4000-8000-000000000006',
  'c0000000-0000-4000-8000-000000000007',
  'c0000000-0000-4000-8000-000000000008',
  'c0000000-0000-4000-8000-000000000009',
  'c0000000-0000-4000-8000-000000000010',
  'c0000000-0000-4000-8000-000000000011',
  'c0000000-0000-4000-8000-000000000012',
  'c0000000-0000-4000-8000-000000000013',
  'c0000000-0000-4000-8000-000000000014',
  'c0000000-0000-4000-8000-000000000015',
  'c0000000-0000-4000-8000-000000000016',
  'c0000000-0000-4000-8000-000000000017',
  'c0000000-0000-4000-8000-000000000018',
  'c0000000-0000-4000-8000-000000000019',
  'c0000000-0000-4000-8000-000000000020',
  'c0000000-0000-4000-8000-000000000021',
  'c0000000-0000-4000-8000-000000000022',
  'c0000000-0000-4000-8000-000000000023',
  'c0000000-0000-4000-8000-000000000024',
  'c0000000-0000-4000-8000-000000000025'
);

commit;
