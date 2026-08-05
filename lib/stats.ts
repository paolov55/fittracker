// Estatísticas derivadas para a tela inicial (e reutilizáveis por
// /historico e /alunos/[studentId] depois). Funções puras sobre os arrays
// do store — nada aqui lê o Zustand diretamente, os componentes passam os
// dados já selecionados.

import type { Session, SessionSet, WorkoutExercise, Exercise } from "./db/types";
import { startOfWeek } from "./workout";

export interface StatsInput {
  sessions: Session[];
  sessionSets: SessionSet[];
  workoutExercises: WorkoutExercise[];
  exercises: Exercise[];
  studentId: string;
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function completedSessions({ sessions, studentId }: StatsInput): Session[] {
  return sessions.filter((s) => s.student_id === studentId && s.status === "completed");
}

export function sessionsInMonth(input: StatsInput, ref = new Date()): Session[] {
  return completedSessions(input).filter((s) => {
    const d = new Date(s.started_at);
    return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
  });
}

export function sessionsSince(input: StatsInput, since: Date): Session[] {
  return completedSessions(input).filter((s) => new Date(s.started_at) >= since);
}

function weekVolumeKg(input: StatsInput, weekStart: Date): number {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return completedSessions(input)
    .filter((s) => {
      const d = new Date(s.started_at);
      return d >= weekStart && d < weekEnd;
    })
    .reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0);
}

export interface VolumeTrend {
  thisWeekKg: number;
  lastWeekKg: number;
  /** null quando não há semana anterior para comparar */
  changePct: number | null;
}

export function volumeTrend(input: StatsInput): VolumeTrend {
  const thisWeekStart = startOfWeek();
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const thisWeekKg = weekVolumeKg(input, thisWeekStart);
  const lastWeekKg = weekVolumeKg(input, lastWeekStart);
  const changePct = lastWeekKg > 0 ? ((thisWeekKg - lastWeekKg) / lastWeekKg) * 100 : null;
  return { thisWeekKg, lastWeekKg, changePct };
}

/** Volume semanal das últimas `weeks` semanas, mais antiga primeiro. */
export function weeklyVolumeSeries(input: StatsInput, weeks = 6): number[] {
  const start = startOfWeek();
  const series: number[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = new Date(start);
    ws.setDate(ws.getDate() - i * 7);
    series.push(weekVolumeKg(input, ws));
  }
  return series;
}

/**
 * Semanas consecutivas em que o aluno bateu `targetPerWeek` treinos
 * concluídos, contando de trás para frente a partir da semana atual. A
 * semana corrente conta se já bateu a meta, mas nunca quebra a sequência
 * por ainda estar em andamento.
 */
export function weeklyStreak(input: StatsInput, targetPerWeek: number): number {
  if (targetPerWeek <= 0) return 0;
  const sessions = completedSessions(input);

  function weekCount(weekStart: Date): number {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return sessions.filter((s) => {
      const d = new Date(s.started_at);
      return d >= weekStart && d < weekEnd;
    }).length;
  }

  const currentWeekStart = startOfWeek();
  let streak = weekCount(currentWeekStart) >= targetPerWeek ? 1 : 0;

  const weekStart = new Date(currentWeekStart);
  weekStart.setDate(weekStart.getDate() - 7);
  for (let i = 0; i < 104; i++) {
    if (weekCount(weekStart) >= targetPerWeek) {
      streak++;
      weekStart.setDate(weekStart.getDate() - 7);
    } else {
      break;
    }
  }
  return streak;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  kg: number;
  previousKg: number;
  deltaKg: number;
  achievedAt: string;
}

/**
 * Sets que bateram o recorde anterior daquele exercício (maior `kg_done`
 * de toda a série histórica) e aconteceram nos últimos `days` dias. O
 * primeiro lançamento de um exercício nunca conta como recorde — precisa
 * ter um máximo anterior para superar.
 */
export function recentPersonalRecords(input: StatsInput, days = 14): PersonalRecord[] {
  const { sessionSets, workoutExercises, exercises, sessions, studentId } = input;
  const sessionById = new Map(
    sessions
      .filter((s) => s.student_id === studentId && s.status === "completed")
      .map((s) => [s.id, s]),
  );
  const weById = new Map(workoutExercises.map((we) => [we.id, we]));
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const cutoff = daysAgo(days);

  const relevant = sessionSets
    .filter((st) => st.completed && st.kind !== "warm" && st.kg_done)
    .map((st) => ({ st, session: sessionById.get(st.session_id) }))
    .filter((x): x is { st: SessionSet; session: Session } => !!x.session)
    .sort((a, b) => a.session.started_at.localeCompare(b.session.started_at));

  const bestByExercise = new Map<string, number>();
  const records: PersonalRecord[] = [];

  for (const { st, session } of relevant) {
    const we = weById.get(st.workout_exercise_id);
    if (!we) continue;
    const exerciseId = we.exercise_id;
    const kg = st.kg_done ?? 0;
    const prevBest = bestByExercise.get(exerciseId) ?? 0;
    if (kg > prevBest) {
      if (prevBest > 0 && new Date(session.started_at) >= cutoff) {
        records.push({
          exerciseId,
          exerciseName: exerciseById.get(exerciseId)?.name ?? "Exercício",
          kg,
          previousKg: prevBest,
          deltaKg: kg - prevBest,
          achievedAt: session.started_at,
        });
      }
      bestByExercise.set(exerciseId, kg);
    }
  }

  return records.sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
}

export interface MuscleGroupVolume {
  group: string;
  volumeKg: number;
  percent: number;
  daysSinceLast: number | null;
}

/**
 * Volume (reps × kg) dos últimos `days` dias, por grupo muscular, com o
 * percentual de participação e há quantos dias o grupo não é treinado
 * (considerando todo o histórico, não só a janela — senão um grupo nunca
 * treinado na janela apareceria como "nunca treinado" mesmo tendo sessão
 * recente logo antes do corte).
 */
export function muscleBalance(input: StatsInput, days = 30): MuscleGroupVolume[] {
  const { sessionSets, workoutExercises, exercises, sessions, studentId } = input;
  const sessionById = new Map(
    sessions
      .filter((s) => s.student_id === studentId && s.status === "completed")
      .map((s) => [s.id, s]),
  );
  const weById = new Map(workoutExercises.map((we) => [we.id, we]));
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const cutoff = daysAgo(days);

  const volumeByGroup = new Map<string, number>();
  const lastDateByGroup = new Map<string, string>();

  for (const st of sessionSets) {
    if (!st.completed || st.kind === "warm") continue;
    const session = sessionById.get(st.session_id);
    if (!session) continue;
    const we = weById.get(st.workout_exercise_id);
    if (!we) continue;
    const group = exerciseById.get(we.exercise_id)?.muscle_group ?? "Outro";

    const prevLast = lastDateByGroup.get(group);
    if (!prevLast || session.started_at > prevLast) {
      lastDateByGroup.set(group, session.started_at);
    }

    if (new Date(session.started_at) < cutoff) continue;
    const vol = (st.reps_done ?? 0) * (st.kg_done ?? 0);
    volumeByGroup.set(group, (volumeByGroup.get(group) ?? 0) + vol);
  }

  const totalVolume = Array.from(volumeByGroup.values()).reduce((a, b) => a + b, 0);
  const now = new Date();

  return Array.from(volumeByGroup.entries())
    .map(([group, volumeKg]) => {
      const last = lastDateByGroup.get(group);
      const daysSinceLast = last
        ? Math.floor((now.getTime() - new Date(last).getTime()) / 86400000)
        : null;
      return {
        group,
        volumeKg,
        percent: totalVolume > 0 ? (volumeKg / totalVolume) * 100 : 0,
        daysSinceLast,
      };
    })
    .sort((a, b) => b.volumeKg - a.volumeKg);
}
