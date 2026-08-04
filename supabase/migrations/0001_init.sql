-- ============================================================================
-- Fittracker — Supabase / Postgres schema
-- ============================================================================
create extension if not exists pgcrypto;

-- ── ENUMS ───────────────────────────────────────────────────────────────────
create type user_role as enum ('student', 'trainer');
create type student_goal as enum ('lose_weight', 'gain_muscle', 'maintain', 'endurance');
create type experience_level as enum ('beginner', 'intermediate', 'advanced');
create type trainer_verification_status as enum ('pending', 'verified', 'rejected');
create type coaching_status as enum ('pending', 'active', 'removed');
create type program_mode as enum ('sync', 'async');
create type config_scope as enum ('program', 'workout', 'exercise');
create type program_visibility as enum ('private', 'community');
create type day_key as enum ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom');
create type assignment_status as enum ('scheduled', 'live', 'archived');
create type session_status as enum ('active', 'completed', 'discarded');

-- ── IDENTIDADE & ACESSO ─────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  full_name text not null,
  email text not null,
  avatar_url text,
  invite_code text not null unique, -- 6 dígitos, gerado no signup
  created_at timestamptz not null default now()
);

create table student_details (
  profile_id uuid primary key references profiles (id) on delete cascade,
  weight_kg numeric(5,1),
  height_cm numeric(5,1),
  goal_weight_kg numeric(5,1),
  goal student_goal,
  experience_level experience_level,
  equipment text[] not null default '{}',
  limitations text[] not null default '{}'
);

create table trainer_details (
  profile_id uuid primary key references profiles (id) on delete cascade,
  cref_number text not null,
  cref_uf text not null,
  verification_status trainer_verification_status not null default 'pending',
  verified_at timestamptz
);

-- ── VÍNCULO & ATRIBUIÇÃO ────────────────────────────────────────────────────
create table trainer_students (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references profiles (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  status coaching_status not null default 'pending',
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (trainer_id, student_id)
);

-- ── BIBLIOTECA: EXERCÍCIOS & PROGRAMAS ──────────────────────────────────────
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment text not null,
  media_url text,
  created_by uuid references profiles (id) on delete set null -- null = catálogo padrão do app
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  goal text,
  mode program_mode not null default 'sync',
  sets_by config_scope not null default 'exercise',
  rest_by config_scope not null default 'workout',
  rep_range_enabled boolean not null default true,
  weekly_progression boolean not null default false,
  default_sets int not null default 3,
  default_rep_min int not null default 8,
  default_rep_max int not null default 12,
  default_rest_seconds int not null default 90,
  visibility program_visibility not null default 'private',
  published_at timestamptz, -- não nulo quando o dono publica no marketplace da comunidade
  created_at timestamptz not null default now()
);

create table program_assignments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  assigned_by uuid references profiles (id) on delete set null, -- null = aluno escolheu sozinho na comunidade
  live_at timestamptz not null default now(), -- data em que o programa fica visível ao aluno
  status assignment_status not null default 'live',
  created_at timestamptz not null default now()
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs (id) on delete cascade,
  day_key day_key, -- usado quando program.mode = 'sync'; nulo em 'async'
  sequence_order int, -- usado quando program.mode = 'async'; nulo em 'sync'
  name text not null,
  rest_seconds int not null,
  check (day_key is not null or sequence_order is not null)
);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts (id) on delete cascade,
  exercise_id uuid not null references exercises (id) on delete restrict,
  order_index int not null,
  sets_count int not null,
  rep_min int, -- sobrescreve o padrão do programa quando preenchido
  rep_max int,
  target_kg numeric(6,2)
);

-- ── EXECUÇÃO DE TREINO ───────────────────────────────────────────────────────
create table sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  workout_id uuid not null references workouts (id) on delete cascade,
  program_id uuid not null references programs (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int,
  total_volume_kg numeric(9,2),
  status session_status not null default 'active'
);

create table session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  workout_exercise_id uuid not null references workout_exercises (id) on delete cascade,
  set_index int not null,
  reps_done int,
  kg_done numeric(6,2),
  completed boolean not null default false,
  completed_at timestamptz
);

-- ── PROGRESSO ────────────────────────────────────────────────────────────────
create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  recorded_at date not null default current_date,
  weight_kg numeric(5,1) not null,
  unique (student_id, recorded_at)
);

-- ── ÍNDICES ──────────────────────────────────────────────────────────────────
create index on student_details (profile_id);
create index on trainer_details (profile_id);
create index on trainer_students (trainer_id);
create index on trainer_students (student_id);
create index on exercises (muscle_group);
create index on exercises (created_by);
create index on programs (owner_id);
create index on programs (visibility, published_at);
create index on program_assignments (student_id);
create index on program_assignments (program_id);
create index on workouts (program_id);
create index on workout_exercises (workout_id);
create index on workout_exercises (exercise_id);
create index on sessions (student_id, started_at desc);
create index on sessions (workout_id);
create index on session_sets (session_id);
create index on body_metrics (student_id, recorded_at desc);

-- ── AUTO-CRIAÇÃO DE PROFILE NO SIGNUP ────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, role, full_name, email, invite_code)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    lpad((floor(random() * 1000000))::text, 6, '0')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table profiles enable row level security;
alter table student_details enable row level security;
alter table trainer_details enable row level security;
alter table trainer_students enable row level security;
alter table exercises enable row level security;
alter table programs enable row level security;
alter table program_assignments enable row level security;
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table sessions enable row level security;
alter table session_sets enable row level security;
alter table body_metrics enable row level security;

-- profiles: dono vê/edita o próprio; personal vê perfil dos alunos ativos
create policy "profiles_self" on profiles for select using (id = auth.uid());
create policy "profiles_self_update" on profiles for update using (id = auth.uid());
create policy "profiles_trainer_view_student" on profiles for select using (
  exists (select 1 from trainer_students ts where ts.student_id = profiles.id and ts.trainer_id = auth.uid() and ts.status = 'active')
);

-- student_details / trainer_details: mesmo padrão de profiles
create policy "student_details_self" on student_details for all using (profile_id = auth.uid());
create policy "student_details_trainer_view" on student_details for select using (
  exists (select 1 from trainer_students ts where ts.student_id = student_details.profile_id and ts.trainer_id = auth.uid() and ts.status = 'active')
);
create policy "trainer_details_self" on trainer_details for all using (profile_id = auth.uid());
create policy "trainer_details_public_verified" on trainer_details for select using (verification_status = 'verified');

-- trainer_students: qualquer um dos dois lados do vínculo
create policy "trainer_students_involved" on trainer_students for select using (
  trainer_id = auth.uid() or student_id = auth.uid()
);
create policy "trainer_students_trainer_writes" on trainer_students for insert with check (trainer_id = auth.uid());
create policy "trainer_students_trainer_updates" on trainer_students for update using (trainer_id = auth.uid() or student_id = auth.uid());

-- exercises: catálogo padrão é público; exercícios custom só o autor edita
create policy "exercises_read_all" on exercises for select using (true);
create policy "exercises_owner_write" on exercises for insert with check (created_by = auth.uid());
create policy "exercises_owner_update" on exercises for update using (created_by = auth.uid());

-- programs: dono tem controle total; comunidade publicada é pública; aluno vê o que lhe foi atribuído
create policy "programs_owner_all" on programs for all using (owner_id = auth.uid());
create policy "programs_community_read" on programs for select using (visibility = 'community' and published_at is not null);
create policy "programs_assigned_read" on programs for select using (
  exists (select 1 from program_assignments pa where pa.program_id = programs.id and pa.student_id = auth.uid() and pa.live_at <= now())
);

-- program_assignments: aluno e quem atribuiu (personal) enxergam e escrevem
create policy "assignments_involved_read" on program_assignments for select using (
  student_id = auth.uid() or assigned_by = auth.uid()
);
create policy "assignments_trainer_write" on program_assignments for insert with check (assigned_by = auth.uid());
create policy "assignments_trainer_update" on program_assignments for update using (assigned_by = auth.uid() or student_id = auth.uid());

-- workouts / workout_exercises: seguem a visibilidade do programa pai
create policy "workouts_visible_with_program" on workouts for select using (
  exists (select 1 from programs p where p.id = workouts.program_id and (
    p.owner_id = auth.uid()
    or (p.visibility = 'community' and p.published_at is not null)
    or exists (select 1 from program_assignments pa where pa.program_id = p.id and pa.student_id = auth.uid() and pa.live_at <= now())
  ))
);
create policy "workouts_owner_write" on workouts for insert with check (
  exists (select 1 from programs p where p.id = workouts.program_id and p.owner_id = auth.uid())
);
create policy "workouts_owner_update" on workouts for update using (
  exists (select 1 from programs p where p.id = workouts.program_id and p.owner_id = auth.uid())
);
create policy "workout_exercises_visible" on workout_exercises for select using (
  exists (select 1 from workouts w where w.id = workout_exercises.workout_id)
);
create policy "workout_exercises_owner_write" on workout_exercises for insert with check (
  exists (select 1 from workouts w join programs p on p.id = w.program_id where w.id = workout_exercises.workout_id and p.owner_id = auth.uid())
);
create policy "workout_exercises_owner_update" on workout_exercises for update using (
  exists (select 1 from workouts w join programs p on p.id = w.program_id where w.id = workout_exercises.workout_id and p.owner_id = auth.uid())
);

-- sessions / session_sets: aluno dono da sessão; personal vinculado pode ler (progresso)
create policy "sessions_owner_all" on sessions for all using (student_id = auth.uid());
create policy "sessions_trainer_read" on sessions for select using (
  exists (select 1 from trainer_students ts where ts.student_id = sessions.student_id and ts.trainer_id = auth.uid() and ts.status = 'active')
);
create policy "session_sets_owner_all" on session_sets for all using (
  exists (select 1 from sessions s where s.id = session_sets.session_id and s.student_id = auth.uid())
);
create policy "session_sets_trainer_read" on session_sets for select using (
  exists (
    select 1 from sessions s join trainer_students ts on ts.student_id = s.student_id
    where s.id = session_sets.session_id and ts.trainer_id = auth.uid() and ts.status = 'active'
  )
);

-- body_metrics: aluno dono; personal vinculado pode ler para acompanhar progresso
create policy "body_metrics_owner_all" on body_metrics for all using (student_id = auth.uid());
create policy "body_metrics_trainer_read" on body_metrics for select using (
  exists (select 1 from trainer_students ts where ts.student_id = body_metrics.student_id and ts.trainer_id = auth.uid() and ts.status = 'active')
);
