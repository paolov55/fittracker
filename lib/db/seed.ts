import type {
  Profile,
  StudentDetails,
  TrainerDetails,
  TrainerStudent,
  Exercise,
  Program,
  Workout,
  WorkoutExercise,
  ProgramAssignment,
  Session,
  BodyMetric,
} from "./types";

// ── IDs fixos (dados de demo — não são UUIDs reais, mas o formato de string
//    é o mesmo que o Supabase devolveria) ──────────────────────────────────
export const SARA_ID = "profile-sara";
export const PAOLO_ID = "profile-paolo";
export const BRUNO_ID = "profile-bruno";
export const CAMILA_ID = "profile-camila";
export const IAGO_ID = "profile-iago";
export const LUANA_ID = "profile-luana";

export const seedProfiles: Profile[] = [
  {
    id: SARA_ID,
    role: "student",
    full_name: "Sara Souza",
    email: "sara.souza@email.com",
    avatar_url: null,
    invite_code: "382914",
    created_at: "2026-05-02T12:00:00.000Z",
  },
  {
    id: PAOLO_ID,
    role: "trainer",
    full_name: "Paolo Vinícios",
    email: "paolo.vinicios@email.com",
    avatar_url: null,
    invite_code: "701244",
    created_at: "2025-11-10T12:00:00.000Z",
  },
  {
    id: BRUNO_ID,
    role: "student",
    full_name: "Bruno Tavares",
    email: "bruno.tavares@email.com",
    avatar_url: null,
    invite_code: "118824",
    created_at: "2026-03-01T12:00:00.000Z",
  },
  {
    id: CAMILA_ID,
    role: "student",
    full_name: "Camila Reis",
    email: "camila.reis@email.com",
    avatar_url: null,
    invite_code: "552390",
    created_at: "2026-07-01T12:00:00.000Z",
  },
  {
    id: IAGO_ID,
    role: "student",
    full_name: "Iago Prado",
    email: "iago.prado@email.com",
    avatar_url: null,
    invite_code: "904411",
    created_at: "2026-08-03T09:00:00.000Z",
  },
  {
    id: LUANA_ID,
    role: "student",
    full_name: "Luana Prado",
    email: "luana.prado@email.com",
    avatar_url: null,
    invite_code: "551803",
    created_at: "2026-06-15T12:00:00.000Z",
  },
];

export const seedStudentDetails: StudentDetails[] = [
  {
    profile_id: SARA_ID,
    weight_kg: 68.4,
    height_cm: 168,
    goal_weight_kg: 65,
    goal: "lose_weight",
    experience_level: "intermediate",
    equipment: ["Academia completa"],
    limitations: [],
  },
  {
    profile_id: BRUNO_ID,
    weight_kg: 82,
    height_cm: 179,
    goal_weight_kg: 85,
    goal: "gain_muscle",
    experience_level: "advanced",
    equipment: ["Academia completa"],
    limitations: [],
  },
  {
    profile_id: CAMILA_ID,
    weight_kg: 61,
    height_cm: 162,
    goal_weight_kg: 60,
    goal: "maintain",
    experience_level: "beginner",
    equipment: ["Halteres", "Elásticos"],
    limitations: [],
  },
  {
    profile_id: IAGO_ID,
    weight_kg: 75,
    height_cm: 174,
    goal_weight_kg: 78,
    goal: "gain_muscle",
    experience_level: "beginner",
    equipment: ["Nenhum equipamento"],
    limitations: [],
  },
  {
    profile_id: LUANA_ID,
    weight_kg: 58,
    height_cm: 165,
    goal_weight_kg: 58,
    goal: "endurance",
    experience_level: "beginner",
    equipment: ["Academia completa"],
    limitations: [],
  },
];

export const seedTrainerDetails: TrainerDetails[] = [
  {
    profile_id: PAOLO_ID,
    cref_number: "019283-G",
    cref_uf: "SP",
    verification_status: "verified",
    verified_at: "2025-11-12T12:00:00.000Z",
  },
];

export const seedTrainerStudents: TrainerStudent[] = [
  {
    id: "ts-sara",
    trainer_id: PAOLO_ID,
    student_id: SARA_ID,
    status: "active",
    invited_at: "2026-05-01T12:00:00.000Z",
    joined_at: "2026-05-02T12:00:00.000Z",
  },
  {
    id: "ts-bruno",
    trainer_id: PAOLO_ID,
    student_id: BRUNO_ID,
    status: "active",
    invited_at: "2026-03-01T12:00:00.000Z",
    joined_at: "2026-03-02T12:00:00.000Z",
  },
  {
    id: "ts-camila",
    trainer_id: PAOLO_ID,
    student_id: CAMILA_ID,
    status: "active",
    invited_at: "2026-07-01T12:00:00.000Z",
    joined_at: "2026-07-02T12:00:00.000Z",
  },
  {
    id: "ts-iago",
    trainer_id: PAOLO_ID,
    student_id: IAGO_ID,
    status: "pending",
    invited_at: "2026-08-03T09:00:00.000Z",
    joined_at: null,
  },
];

// ── Catálogo de exercícios (25) ─────────────────────────────────────────
function ex(id: string, name: string, muscle_group: string, equipment: string): Exercise {
  return { id, name, muscle_group, equipment, media_url: null, created_by: null };
}

export const seedExercises: Exercise[] = [
  ex("ex-supino-reto-barra", "Supino reto com barra", "Peito", "Barra"),
  ex("ex-supino-inclinado-halteres", "Supino inclinado com halteres", "Peito", "Halteres"),
  ex("ex-crucifixo-polia", "Crucifixo na polia", "Peito", "Polia"),
  ex("ex-flexao", "Flexão de braço", "Peito", "Peso corporal"),
  ex("ex-barra-fixa", "Barra fixa", "Costas", "Peso corporal"),
  ex("ex-remada-curvada", "Remada curvada", "Costas", "Barra"),
  ex("ex-remada-baixa-polia", "Remada baixa na polia", "Costas", "Polia"),
  ex("ex-puxada-frontal", "Puxada frontal", "Costas", "Polia"),
  ex("ex-agachamento-livre", "Agachamento livre", "Pernas", "Barra"),
  ex("ex-leg-press", "Leg press", "Pernas", "Máquina"),
  ex("ex-cadeira-extensora", "Cadeira extensora", "Pernas", "Máquina"),
  ex("ex-mesa-flexora", "Mesa flexora", "Pernas", "Máquina"),
  ex("ex-stiff-barra", "Stiff com barra", "Pernas", "Barra"),
  ex("ex-panturrilha-pe", "Panturrilha em pé", "Pernas", "Máquina"),
  ex("ex-desenvolvimento-halteres", "Desenvolvimento com halteres", "Ombros", "Halteres"),
  ex("ex-elevacao-lateral", "Elevação lateral", "Ombros", "Halteres"),
  ex("ex-face-pull", "Face pull", "Ombros", "Polia"),
  ex("ex-rosca-direta", "Rosca direta", "Bíceps", "Barra"),
  ex("ex-rosca-alternada", "Rosca alternada", "Bíceps", "Halteres"),
  ex("ex-rosca-martelo", "Rosca martelo", "Bíceps", "Halteres"),
  ex("ex-triceps-polia", "Tríceps na polia", "Tríceps", "Polia"),
  ex("ex-triceps-testa", "Tríceps testa", "Tríceps", "Barra"),
  ex("ex-mergulho-banco", "Mergulho no banco", "Tríceps", "Peso corporal"),
  ex("ex-prancha", "Prancha", "Core", "Peso corporal"),
  ex("ex-abdominal-polia", "Abdominal na polia", "Core", "Polia"),
];

export const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Core",
];

export const EQUIPMENT_OPTIONS = ["Peso corporal", "Halteres", "Polia", "Barra"];

// ── Programa Upper/Lower (do personal Paolo) ────────────────────────────
export const UPPER_LOWER_PROGRAM_ID = "program-upper-lower";
export const WORKOUT_UPPER_A_ID = "workout-upper-a";
export const WORKOUT_LOWER_A_ID = "workout-lower-a";
export const WORKOUT_UPPER_B_ID = "workout-upper-b";
export const WORKOUT_LOWER_B_ID = "workout-lower-b";

export const seedPrograms: Program[] = [
  {
    id: UPPER_LOWER_PROGRAM_ID,
    owner_id: PAOLO_ID,
    name: "Upper/Lower",
    goal: "Hipertrofia",
    mode: "sync",
    sets_by: "exercise",
    rest_by: "workout",
    rep_range_enabled: true,
    weekly_progression: false,
    default_sets: 3,
    default_rep_min: 8,
    default_rep_max: 12,
    default_rest_seconds: 90,
    visibility: "private",
    published_at: null,
    created_at: "2026-05-01T12:00:00.000Z",
    cover_url: "/covers/upper-lower.jpg",
  },
];

export const seedWorkouts: Workout[] = [
  { id: WORKOUT_UPPER_A_ID, program_id: UPPER_LOWER_PROGRAM_ID, day_key: "seg", sequence_order: null, name: "Upper A", rest_seconds: 90 },
  { id: WORKOUT_LOWER_A_ID, program_id: UPPER_LOWER_PROGRAM_ID, day_key: "ter", sequence_order: null, name: "Lower A", rest_seconds: 120 },
  { id: WORKOUT_UPPER_B_ID, program_id: UPPER_LOWER_PROGRAM_ID, day_key: "qui", sequence_order: null, name: "Upper B", rest_seconds: 90 },
  { id: WORKOUT_LOWER_B_ID, program_id: UPPER_LOWER_PROGRAM_ID, day_key: "sex", sequence_order: null, name: "Lower B", rest_seconds: 120 },
];

let weCounter = 0;
function we(
  workout_id: string,
  exercise_id: string,
  order_index: number,
  sets_count: number,
  rep_min: number,
  rep_max: number,
  target_kg: number,
  opts: { warmup?: boolean; alt_exercise_id?: string | null; superset_group?: string | null } = {}
): WorkoutExercise {
  weCounter += 1;
  return {
    id: `we-${weCounter}`,
    workout_id,
    exercise_id,
    order_index,
    sets_count,
    rep_min,
    rep_max,
    target_kg,
    alt_exercise_id: opts.alt_exercise_id ?? null,
    superset_group: opts.superset_group ?? null,
    warmup: opts.warmup ?? false,
  };
}

export const seedWorkoutExercises: WorkoutExercise[] = [
  // Upper A
  we(WORKOUT_UPPER_A_ID, "ex-supino-reto-barra", 0, 3, 8, 10, 40, { warmup: true }),
  we(WORKOUT_UPPER_A_ID, "ex-puxada-frontal", 1, 3, 10, 12, 45, { alt_exercise_id: "ex-barra-fixa" }),
  we(WORKOUT_UPPER_A_ID, "ex-desenvolvimento-halteres", 2, 3, 8, 10, 16),
  we(WORKOUT_UPPER_A_ID, "ex-remada-baixa-polia", 3, 3, 10, 12, 40),
  we(WORKOUT_UPPER_A_ID, "ex-rosca-direta", 4, 3, 12, 15, 20),
  we(WORKOUT_UPPER_A_ID, "ex-triceps-polia", 5, 3, 12, 15, 30),
  // Lower A
  we(WORKOUT_LOWER_A_ID, "ex-agachamento-livre", 0, 4, 6, 8, 50, { warmup: true }),
  we(WORKOUT_LOWER_A_ID, "ex-stiff-barra", 1, 3, 8, 10, 40),
  we(WORKOUT_LOWER_A_ID, "ex-cadeira-extensora", 2, 3, 12, 15, 35),
  we(WORKOUT_LOWER_A_ID, "ex-panturrilha-pe", 3, 4, 12, 15, 60),
  // Upper B
  we(WORKOUT_UPPER_B_ID, "ex-barra-fixa", 0, 4, 6, 8, 0, { warmup: true }),
  we(WORKOUT_UPPER_B_ID, "ex-supino-inclinado-halteres", 1, 3, 8, 10, 18),
  we(WORKOUT_UPPER_B_ID, "ex-elevacao-lateral", 2, 3, 12, 15, 8),
  we(WORKOUT_UPPER_B_ID, "ex-rosca-martelo", 3, 3, 10, 12, 12),
  // Lower B
  we(WORKOUT_LOWER_B_ID, "ex-leg-press", 0, 4, 10, 12, 80, { warmup: true }),
  we(WORKOUT_LOWER_B_ID, "ex-mesa-flexora", 1, 3, 10, 12, 30),
  we(WORKOUT_LOWER_B_ID, "ex-abdominal-polia", 2, 3, 12, 15, 20),
];

export const seedProgramAssignments: ProgramAssignment[] = [
  {
    id: "assign-sara-ul",
    program_id: UPPER_LOWER_PROGRAM_ID,
    student_id: SARA_ID,
    assigned_by: PAOLO_ID,
    live_at: "2026-05-02T12:00:00.000Z",
    status: "live",
    created_at: "2026-05-02T12:00:00.000Z",
  },
];

// ── Programas da comunidade (cards, sem grade de treino própria) ───────
export const seedCommunityPrograms: Program[] = [
  {
    id: "program-ppl",
    owner_id: PAOLO_ID,
    name: "Push / Pull / Legs 6x",
    goal: "Hipertrofia",
    mode: "sync",
    sets_by: "exercise",
    rest_by: "workout",
    rep_range_enabled: true,
    weekly_progression: false,
    default_sets: 3,
    default_rep_min: 8,
    default_rep_max: 12,
    default_rest_seconds: 90,
    visibility: "community",
    published_at: "2026-01-10T12:00:00.000Z",
    created_at: "2026-01-01T12:00:00.000Z",
    cover_url: "/covers/ppl.jpg",
    community_meta: "6 dias/semana · hipertrofia · 8 semanas",
    community_desc:
      "Divisão clássica de empurrar, puxar e pernas, com duas passagens por semana.",
    community_author: "Por Renata Lopes · 4,2 mil usando",
    community_level: "Intermediário",
  },
  {
    id: "program-fullbody",
    owner_id: PAOLO_ID,
    name: "Full Body 3x",
    goal: "Condicionamento",
    mode: "sync",
    sets_by: "program",
    rest_by: "program",
    rep_range_enabled: true,
    weekly_progression: false,
    default_sets: 3,
    default_rep_min: 10,
    default_rep_max: 12,
    default_rest_seconds: 75,
    visibility: "community",
    published_at: "2026-02-15T12:00:00.000Z",
    created_at: "2026-02-01T12:00:00.000Z",
    cover_url: "/covers/fullbody.jpg",
    community_meta: "3 dias/semana · condicionamento · 6 semanas",
    community_desc:
      "Corpo inteiro em cada sessão, ideal para quem está voltando a treinar.",
    community_author: "Por Diego Martins · 9,8 mil usando",
    community_level: "Iniciante",
  },
  {
    id: "program-forca-5x5",
    owner_id: PAOLO_ID,
    name: "Força 5x5",
    goal: "Força",
    mode: "sync",
    sets_by: "program",
    rest_by: "program",
    rep_range_enabled: false,
    weekly_progression: true,
    default_sets: 5,
    default_rep_min: 5,
    default_rep_max: 5,
    default_rest_seconds: 150,
    visibility: "community",
    published_at: "2026-03-20T12:00:00.000Z",
    created_at: "2026-03-01T12:00:00.000Z",
    cover_url: "/covers/forca.jpg",
    community_meta: "3 dias/semana · força · 12 semanas",
    community_desc:
      "Cinco séries de cinco nos básicos, com progressão de carga semanal.",
    community_author: "Por Paolo Vinícios · 2,1 mil usando",
    community_level: "Intermediário",
  },
];

// ── Histórico (Sara) ─────────────────────────────────────────────────
export const seedSessions: Session[] = [
  {
    id: "session-1",
    student_id: SARA_ID,
    workout_id: WORKOUT_UPPER_A_ID,
    program_id: UPPER_LOWER_PROGRAM_ID,
    started_at: "2026-07-27T13:00:00.000Z",
    ended_at: "2026-07-27T13:47:00.000Z",
    duration_seconds: 47 * 60,
    total_volume_kg: 4860,
    status: "completed",
  },
  {
    id: "session-2",
    student_id: SARA_ID,
    workout_id: WORKOUT_LOWER_A_ID,
    program_id: UPPER_LOWER_PROGRAM_ID,
    started_at: "2026-07-28T13:00:00.000Z",
    ended_at: "2026-07-28T13:55:00.000Z",
    duration_seconds: 55 * 60,
    total_volume_kg: 7020,
    status: "completed",
  },
  {
    id: "session-3",
    student_id: SARA_ID,
    workout_id: WORKOUT_UPPER_B_ID,
    program_id: UPPER_LOWER_PROGRAM_ID,
    started_at: "2026-07-30T13:00:00.000Z",
    ended_at: "2026-07-30T13:52:00.000Z",
    duration_seconds: 52 * 60,
    total_volume_kg: 5180,
    status: "completed",
  },
  {
    id: "session-4",
    student_id: SARA_ID,
    workout_id: WORKOUT_LOWER_B_ID,
    program_id: UPPER_LOWER_PROGRAM_ID,
    started_at: "2026-08-01T13:00:00.000Z",
    ended_at: "2026-08-01T13:48:00.000Z",
    duration_seconds: 48 * 60,
    total_volume_kg: 6240,
    status: "completed",
  },
];

export const seedBodyMetrics: BodyMetric[] = [
  { id: "bm-1", student_id: SARA_ID, recorded_at: "2026-07-06", weight_kg: 70.0 },
  { id: "bm-2", student_id: SARA_ID, recorded_at: "2026-07-13", weight_kg: 69.6 },
  { id: "bm-3", student_id: SARA_ID, recorded_at: "2026-07-20", weight_kg: 69.0 },
  { id: "bm-4", student_id: SARA_ID, recorded_at: "2026-07-27", weight_kg: 68.7 },
  { id: "bm-5", student_id: SARA_ID, recorded_at: "2026-08-03", weight_kg: 68.4 },
];

export const LUANA_LOOKUP = {
  code: "551803",
  name: "Luana Prado",
  initials: "LP",
  sub: "27 anos · São Paulo · sem personal",
};
