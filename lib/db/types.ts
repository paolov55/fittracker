// Tipos espelhando schema.sql (Supabase/Postgres). Nomes de coluna em snake_case
// para que a troca do repositório local pelo Supabase seja direta.

export type UserRole = "student" | "trainer";
export type StudentGoal = "lose_weight" | "gain_muscle" | "maintain" | "endurance";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type TrainerVerificationStatus = "pending" | "verified" | "rejected";
export type CoachingStatus = "pending" | "active" | "removed";
export type ProgramMode = "sync" | "async";
export type ConfigScope = "program" | "workout" | "exercise";
export type ProgramVisibility = "private" | "community";
export type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
export type AssignmentStatus = "scheduled" | "live" | "archived";
export type SessionStatus = "active" | "completed" | "discarded";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url: string | null;
  invite_code: string;
  created_at: string;
}

export interface StudentDetails {
  profile_id: string;
  weight_kg: number | null;
  height_cm: number | null;
  goal_weight_kg: number | null;
  goal: StudentGoal | null;
  experience_level: ExperienceLevel | null;
  equipment: string[];
  limitations: string[];
  // Só apresentação; peso sempre persiste em kg (ver supabase/schema.sql).
  weight_unit?: "kg" | "lb";
  // Só apresentação; altura sempre persiste em cm (ver supabase/schema.sql).
  height_unit?: "cm" | "ft";
}

export interface TrainerDetails {
  profile_id: string;
  cref_number: string;
  cref_uf: string;
  verification_status: TrainerVerificationStatus;
  verified_at: string | null;
}

export interface TrainerStudent {
  id: string;
  trainer_id: string;
  student_id: string;
  status: CoachingStatus;
  invited_at: string;
  joined_at: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  media_url: string | null;
  created_by: string | null;
}

export interface Program {
  id: string;
  owner_id: string;
  name: string;
  goal: string | null;
  mode: ProgramMode;
  sets_by: ConfigScope;
  rest_by: ConfigScope;
  rep_range_enabled: boolean;
  weekly_progression: boolean;
  default_sets: number;
  default_rep_min: number;
  default_rep_max: number;
  default_rest_seconds: number;
  visibility: ProgramVisibility;
  published_at: string | null;
  created_at: string;
  // colunas de metadados de exibição, sem uso nas policies de RLS
  cover_url?: string | null;
  community_meta?: string;
  community_desc?: string;
  community_author?: string;
  community_level?: "Iniciante" | "Intermediário" | "Avançado";
}

export interface ProgramAssignment {
  id: string;
  program_id: string;
  student_id: string;
  assigned_by: string | null;
  live_at: string;
  status: AssignmentStatus;
  created_at: string;
}

export interface Workout {
  id: string;
  program_id: string;
  day_key: DayKey | null;
  sequence_order: number | null;
  name: string;
  rest_seconds: number;
}

/**
 * `warmup`, `alt_exercise_id` e `superset_group` não existiam no schema
 * original do design — foram adicionados depois (ver supabase/schema.sql).
 */
export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  sets_count: number;
  rep_min: number | null;
  rep_max: number | null;
  target_kg: number | null;
  alt_exercise_id?: string | null;
  superset_group?: string | null;
  warmup?: boolean;
}

export interface Session {
  id: string;
  student_id: string;
  workout_id: string;
  program_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  status: SessionStatus;
}

export interface SessionSet {
  id: string;
  session_id: string;
  workout_exercise_id: string;
  set_index: number;
  reps_done: number | null;
  kg_done: number | null;
  completed: boolean;
  completed_at: string | null;
  // não existia no schema original do design (ver supabase/schema.sql)
  kind?: "warm" | "work";
}

export interface BodyMetric {
  id: string;
  student_id: string;
  recorded_at: string;
  weight_kg: number;
}
