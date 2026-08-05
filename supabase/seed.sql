-- ============================================================================
-- Dados de teste do FitTracker, no mesmo formato de lib/db/seed.ts.
-- Pensado para `supabase db reset` em ambiente local (supabase start).
--
-- profiles.id referencia auth.users.id, então os usuários de demo são
-- criados diretamente em auth.users (padrão comum de seed local do
-- Supabase) — o trigger handle_new_user (schema.sql) cria a linha
-- correspondente em profiles automaticamente a partir de raw_user_meta_data,
-- e o restante deste arquivo só ajusta o invite_code para um valor fixo e
-- povoa os dados de biblioteca/execução. Senha de todos os usuários: "demo1234".
-- ============================================================================

do $$
declare
  sara_id uuid := '11111111-1111-4111-8111-111111111111';
  paolo_id uuid := '22222222-2222-4222-8222-222222222222';
  bruno_id uuid := '33333333-3333-4333-8333-333333333333';
  camila_id uuid := '44444444-4444-4444-8444-444444444444';
  iago_id uuid := '55555555-5555-4555-8555-555555555555';
  luana_id uuid := '66666666-6666-4666-8666-666666666666';

  ul_program uuid := 'a1111111-0000-4000-8000-000000000001';
  ppl_program uuid := 'a1111111-0000-4000-8000-000000000002';
  fullbody_program uuid := 'a1111111-0000-4000-8000-000000000003';
  forca_program uuid := 'a1111111-0000-4000-8000-000000000004';

  w_upper_a uuid := 'b2222222-0000-4000-8000-000000000001';
  w_lower_a uuid := 'b2222222-0000-4000-8000-000000000002';
  w_upper_b uuid := 'b2222222-0000-4000-8000-000000000003';
  w_lower_b uuid := 'b2222222-0000-4000-8000-000000000004';
begin

  -- ── usuários (auth.users -> trigger cria profiles) ────────────────────────
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) values
    ('00000000-0000-0000-0000-000000000000', sara_id, 'authenticated', 'authenticated',
     'sara.souza@email.com', crypt('demo1234', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"student","full_name":"Sara Souza"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', paolo_id, 'authenticated', 'authenticated',
     'paolo.vinicios@email.com', crypt('demo1234', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"trainer","full_name":"Paolo Vinícios"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', bruno_id, 'authenticated', 'authenticated',
     'bruno.tavares@email.com', crypt('demo1234', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"student","full_name":"Bruno Tavares"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', camila_id, 'authenticated', 'authenticated',
     'camila.reis@email.com', crypt('demo1234', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"student","full_name":"Camila Reis"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', iago_id, 'authenticated', 'authenticated',
     'iago.prado@email.com', crypt('demo1234', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"student","full_name":"Iago Prado"}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', luana_id, 'authenticated', 'authenticated',
     'luana.prado@email.com', crypt('demo1234', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"role":"student","full_name":"Luana Prado"}',
     now(), now(), '', '', '', '');

  -- códigos de convite fixos, para bater com o app de demo
  update profiles set invite_code = '382914' where id = sara_id;
  update profiles set invite_code = '701244' where id = paolo_id;
  update profiles set invite_code = '118824' where id = bruno_id;
  update profiles set invite_code = '552390' where id = camila_id;
  update profiles set invite_code = '904411' where id = iago_id;
  update profiles set invite_code = '551803' where id = luana_id;

  -- ── detalhes de aluno/personal ─────────────────────────────────────────────
  insert into student_details (profile_id, weight_kg, height_cm, goal_weight_kg, goal, experience_level, equipment) values
    (sara_id, 68.4, 168, 65, 'lose_weight', 'intermediate', '{"Academia completa"}'),
    (bruno_id, 82, 179, 85, 'gain_muscle', 'advanced', '{"Academia completa"}'),
    (camila_id, 61, 162, 60, 'maintain', 'beginner', '{"Halteres","Elásticos"}'),
    (iago_id, 75, 174, 78, 'gain_muscle', 'beginner', '{"Nenhum equipamento"}'),
    (luana_id, 58, 165, 58, 'endurance', 'beginner', '{"Academia completa"}');

  insert into trainer_details (profile_id, cref_number, cref_uf, verification_status, verified_at) values
    (paolo_id, '019283-G', 'SP', 'verified', now());

  insert into trainer_students (trainer_id, student_id, status, joined_at) values
    (paolo_id, sara_id, 'active', now()),
    (paolo_id, bruno_id, 'active', now()),
    (paolo_id, camila_id, 'active', now()),
    (paolo_id, iago_id, 'pending', null);

  -- ── catálogo de exercícios ──────────────────────────────────────────────────
  insert into exercises (id, name, muscle_group, equipment) values
    ('c0000000-0000-4000-8000-000000000001', 'Supino reto com barra', 'Peito', 'Barra'),
    ('c0000000-0000-4000-8000-000000000002', 'Supino inclinado com halteres', 'Peito', 'Halteres'),
    ('c0000000-0000-4000-8000-000000000003', 'Crucifixo na polia', 'Peito', 'Polia'),
    ('c0000000-0000-4000-8000-000000000004', 'Flexão de braço', 'Peito', 'Peso corporal'),
    ('c0000000-0000-4000-8000-000000000005', 'Barra fixa', 'Costas', 'Peso corporal'),
    ('c0000000-0000-4000-8000-000000000006', 'Remada curvada', 'Costas', 'Barra'),
    ('c0000000-0000-4000-8000-000000000007', 'Remada baixa na polia', 'Costas', 'Polia'),
    ('c0000000-0000-4000-8000-000000000008', 'Puxada frontal', 'Costas', 'Polia'),
    ('c0000000-0000-4000-8000-000000000009', 'Agachamento livre', 'Pernas', 'Barra'),
    ('c0000000-0000-4000-8000-000000000010', 'Leg press', 'Pernas', 'Máquina'),
    ('c0000000-0000-4000-8000-000000000011', 'Cadeira extensora', 'Pernas', 'Máquina'),
    ('c0000000-0000-4000-8000-000000000012', 'Mesa flexora', 'Pernas', 'Máquina'),
    ('c0000000-0000-4000-8000-000000000013', 'Stiff com barra', 'Pernas', 'Barra'),
    ('c0000000-0000-4000-8000-000000000014', 'Panturrilha em pé', 'Pernas', 'Máquina'),
    ('c0000000-0000-4000-8000-000000000015', 'Desenvolvimento com halteres', 'Ombros', 'Halteres'),
    ('c0000000-0000-4000-8000-000000000016', 'Elevação lateral', 'Ombros', 'Halteres'),
    ('c0000000-0000-4000-8000-000000000017', 'Face pull', 'Ombros', 'Polia'),
    ('c0000000-0000-4000-8000-000000000018', 'Rosca direta', 'Bíceps', 'Barra'),
    ('c0000000-0000-4000-8000-000000000019', 'Rosca alternada', 'Bíceps', 'Halteres'),
    ('c0000000-0000-4000-8000-000000000020', 'Rosca martelo', 'Bíceps', 'Halteres'),
    ('c0000000-0000-4000-8000-000000000021', 'Tríceps na polia', 'Tríceps', 'Polia'),
    ('c0000000-0000-4000-8000-000000000022', 'Tríceps testa', 'Tríceps', 'Barra'),
    ('c0000000-0000-4000-8000-000000000023', 'Mergulho no banco', 'Tríceps', 'Peso corporal'),
    ('c0000000-0000-4000-8000-000000000024', 'Prancha', 'Core', 'Peso corporal'),
    ('c0000000-0000-4000-8000-000000000025', 'Abdominal na polia', 'Core', 'Polia');

  -- ── programa Upper/Lower (Paolo -> Sara) ────────────────────────────────────
  insert into programs (id, owner_id, name, goal, mode, sets_by, rest_by, default_sets, default_rep_min, default_rep_max, default_rest_seconds, visibility, cover_url) values
    (ul_program, paolo_id, 'Upper/Lower', 'Hipertrofia', 'sync', 'exercise', 'workout', 3, 8, 12, 90, 'private', '/covers/upper-lower.jpg');

  insert into workouts (id, program_id, day_key, name, rest_seconds) values
    (w_upper_a, ul_program, 'seg', 'Upper A', 90),
    (w_lower_a, ul_program, 'ter', 'Lower A', 120),
    (w_upper_b, ul_program, 'qui', 'Upper B', 90),
    (w_lower_b, ul_program, 'sex', 'Lower B', 120);

  insert into workout_exercises (workout_id, exercise_id, order_index, sets_count, rep_min, rep_max, target_kg, warmup, alt_exercise_id) values
    (w_upper_a, 'c0000000-0000-4000-8000-000000000001', 0, 3, 8, 10, 40, true, null),
    (w_upper_a, 'c0000000-0000-4000-8000-000000000008', 1, 3, 10, 12, 45, false, 'c0000000-0000-4000-8000-000000000005'),
    (w_upper_a, 'c0000000-0000-4000-8000-000000000015', 2, 3, 8, 10, 16, false, null),
    (w_upper_a, 'c0000000-0000-4000-8000-000000000007', 3, 3, 10, 12, 40, false, null),
    (w_upper_a, 'c0000000-0000-4000-8000-000000000018', 4, 3, 12, 15, 20, false, null),
    (w_upper_a, 'c0000000-0000-4000-8000-000000000021', 5, 3, 12, 15, 30, false, null),
    (w_lower_a, 'c0000000-0000-4000-8000-000000000009', 0, 4, 6, 8, 50, true, null),
    (w_lower_a, 'c0000000-0000-4000-8000-000000000013', 1, 3, 8, 10, 40, false, null),
    (w_lower_a, 'c0000000-0000-4000-8000-000000000011', 2, 3, 12, 15, 35, false, null),
    (w_lower_a, 'c0000000-0000-4000-8000-000000000014', 3, 4, 12, 15, 60, false, null),
    (w_upper_b, 'c0000000-0000-4000-8000-000000000005', 0, 4, 6, 8, 0, true, null),
    (w_upper_b, 'c0000000-0000-4000-8000-000000000002', 1, 3, 8, 10, 18, false, null),
    (w_upper_b, 'c0000000-0000-4000-8000-000000000016', 2, 3, 12, 15, 8, false, null),
    (w_upper_b, 'c0000000-0000-4000-8000-000000000020', 3, 3, 10, 12, 12, false, null),
    (w_lower_b, 'c0000000-0000-4000-8000-000000000010', 0, 4, 10, 12, 80, true, null),
    (w_lower_b, 'c0000000-0000-4000-8000-000000000012', 1, 3, 10, 12, 30, false, null),
    (w_lower_b, 'c0000000-0000-4000-8000-000000000025', 2, 3, 12, 15, 20, false, null);

  insert into program_assignments (program_id, student_id, assigned_by, live_at, status) values
    (ul_program, sara_id, paolo_id, now() - interval '90 days', 'live');

  -- ── programas da comunidade ──────────────────────────────────────────────
  insert into programs (id, owner_id, name, goal, mode, sets_by, rest_by, default_sets, default_rep_min, default_rep_max, default_rest_seconds, visibility, published_at, cover_url, community_meta, community_desc, community_author, community_level) values
    (ppl_program, paolo_id, 'Push / Pull / Legs 6x', 'Hipertrofia', 'sync', 'exercise', 'workout', 3, 8, 12, 90, 'community', now(), '/covers/ppl.jpg',
     '6 dias/semana · hipertrofia · 8 semanas', 'Divisão clássica de empurrar, puxar e pernas, com duas passagens por semana.', 'Por Renata Lopes · 4,2 mil usando', 'Intermediário'),
    (fullbody_program, paolo_id, 'Full Body 3x', 'Condicionamento', 'sync', 'program', 'program', 3, 10, 12, 75, 'community', now(), '/covers/fullbody.jpg',
     '3 dias/semana · condicionamento · 6 semanas', 'Corpo inteiro em cada sessão, ideal para quem está voltando a treinar.', 'Por Diego Martins · 9,8 mil usando', 'Iniciante'),
    (forca_program, paolo_id, 'Força 5x5', 'Força', 'sync', 'program', 'program', 5, 5, 5, 150, 'community', now(), '/covers/forca.jpg',
     '3 dias/semana · força · 12 semanas', 'Cinco séries de cinco nos básicos, com progressão de carga semanal.', 'Por Paolo Vinícios · 2,1 mil usando', 'Intermediário');

  -- ── histórico de sessões (Sara) ───────────────────────────────────────────
  insert into sessions (student_id, workout_id, program_id, started_at, ended_at, duration_seconds, total_volume_kg, status) values
    (sara_id, w_upper_a, ul_program, now() - interval '7 days', now() - interval '7 days' + interval '47 minutes', 2820, 4860, 'completed'),
    (sara_id, w_lower_a, ul_program, now() - interval '6 days', now() - interval '6 days' + interval '55 minutes', 3300, 7020, 'completed'),
    (sara_id, w_upper_b, ul_program, now() - interval '4 days', now() - interval '4 days' + interval '52 minutes', 3120, 5180, 'completed'),
    (sara_id, w_lower_b, ul_program, now() - interval '2 days', now() - interval '2 days' + interval '48 minutes', 2880, 6240, 'completed');

  -- ── peso corporal (Sara) ──────────────────────────────────────────────────
  insert into body_metrics (student_id, recorded_at, weight_kg) values
    (sara_id, current_date - 28, 70.0),
    (sara_id, current_date - 21, 69.6),
    (sara_id, current_date - 14, 69.0),
    (sara_id, current_date - 7, 68.7),
    (sara_id, current_date, 68.4);

end $$;
