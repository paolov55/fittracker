import { supabase } from "./client";
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
  SessionSet,
  BodyMetric,
} from "../types";

export interface HydratedTables {
  profiles: Profile[];
  studentDetails: StudentDetails[];
  trainerDetails: TrainerDetails[];
  trainerStudents: TrainerStudent[];
  exercises: Exercise[];
  programs: Program[];
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  programAssignments: ProgramAssignment[];
  sessions: Session[];
  sessionSets: SessionSet[];
  bodyMetrics: BodyMetric[];
}

// Busca tudo que as políticas de RLS deixam o usuário logado enxergar. Não
// filtramos por papel aqui — o Postgres já restringe as linhas por usuário.
export async function hydrateFromSupabase(): Promise<HydratedTables> {
  const [
    profiles,
    studentDetails,
    trainerDetails,
    trainerStudents,
    exercises,
    programs,
    workouts,
    workoutExercises,
    programAssignments,
    sessions,
    sessionSets,
    bodyMetrics,
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("student_details").select("*"),
    supabase.from("trainer_details").select("*"),
    supabase.from("trainer_students").select("*"),
    supabase.from("exercises").select("*"),
    supabase.from("programs").select("*"),
    supabase.from("workouts").select("*"),
    supabase.from("workout_exercises").select("*"),
    supabase.from("program_assignments").select("*"),
    supabase.from("sessions").select("*"),
    supabase.from("session_sets").select("*"),
    supabase.from("body_metrics").select("*"),
  ]);

  for (const result of [
    profiles,
    studentDetails,
    trainerDetails,
    trainerStudents,
    exercises,
    programs,
    workouts,
    workoutExercises,
    programAssignments,
    sessions,
    sessionSets,
    bodyMetrics,
  ]) {
    if (result.error) throw result.error;
  }

  return {
    profiles: (profiles.data ?? []) as Profile[],
    studentDetails: (studentDetails.data ?? []) as StudentDetails[],
    trainerDetails: (trainerDetails.data ?? []) as TrainerDetails[],
    trainerStudents: (trainerStudents.data ?? []) as TrainerStudent[],
    exercises: (exercises.data ?? []) as Exercise[],
    programs: (programs.data ?? []) as Program[],
    workouts: (workouts.data ?? []) as Workout[],
    workoutExercises: (workoutExercises.data ?? []) as WorkoutExercise[],
    programAssignments: (programAssignments.data ?? []) as ProgramAssignment[],
    sessions: (sessions.data ?? []) as Session[],
    sessionSets: (sessionSets.data ?? []) as SessionSet[],
    bodyMetrics: (bodyMetrics.data ?? []) as BodyMetric[],
  };
}
