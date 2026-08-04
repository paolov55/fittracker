"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  DayKey,
} from "./db/types";
import {
  seedProfiles,
  seedStudentDetails,
  seedTrainerDetails,
  seedTrainerStudents,
  seedExercises,
  seedPrograms,
  seedWorkouts,
  seedWorkoutExercises,
  seedProgramAssignments,
  seedCommunityPrograms,
  seedSessions,
  seedBodyMetrics,
  SARA_ID,
  PAOLO_ID,
  LUANA_LOOKUP,
  LUANA_ID,
} from "./db/seed";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
function nowIso() {
  return new Date().toISOString();
}

// ── Progresso de execução (run) ─────────────────────────────────────────
export interface RunSetState {
  setIndex: number;
  kind: "warm" | "work";
  repMin: number;
  repMax: number;
  kgTarget: number;
  kg: string;
  reps: string;
  completed: boolean;
}

export interface RunSummary {
  duration: number;
  setsCompleted: number;
  volume: number;
  programName: string;
  workoutName: string;
}

export interface ActiveRun {
  sessionId: string;
  workoutId: string;
  programId: string;
  startedAt: string;
  elapsed: number;
  running: boolean;
  restLeft: number;
  restRunning: boolean;
  restTotal: number;
  variant: Record<string, 0 | 1>; // workout_exercise_id -> variant index
  sets: Record<string, RunSetState[]>; // workout_exercise_id -> sets
}

interface AppState {
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;

  currentUserId: string | null;
  login: (email: string) => boolean;
  logout: () => void;
  signup: (fullName: string, email: string, role: "student" | "trainer") => string;

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

  hasInvite: boolean;
  hasCoach: boolean;
  acceptInvite: () => void;
  declineInvite: () => void;
  leaveCoach: () => void;

  toast: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;

  completeOnboarding: (data: {
    goal: StudentDetails["goal"];
    experience_level: StudentDetails["experience_level"];
    weight_kg: number;
    goal_weight_kg: number;
    height_cm: number;
    equipment: string[];
    limitations: string[];
    isTrainer: boolean;
    cref?: string;
  }) => void;

  createExercise: (name: string, muscles: string[], equipment: string) => Exercise;

  createProgram: (input: {
    ownerId: string;
    name: string;
    goal: string;
    mode: "sync" | "async";
    setsBy: "program" | "workout" | "exercise";
    restBy: "program" | "workout" | "exercise";
    repRangeEnabled: boolean;
    weeklyProgression: boolean;
    defaultSets: number;
    defaultRepMin: number;
    defaultRepMax: number;
    defaultRestSeconds: number;
    forStudentId?: string | null;
    liveAt?: string | null;
  }) => Program;

  cloneCommunityProgram: (programId: string) => Program;

  saveWorkout: (input: {
    programId: string;
    dayKey: DayKey;
    name: string;
    restSeconds: number;
    exercises: Omit<WorkoutExercise, "id" | "workout_id">[];
  }) => void;

  startRun: (workoutId: string, programId: string, studentId: string) => string;
  tickRun: () => void;
  toggleRunPause: () => void;
  updateSetField: (weId: string, setIndex: number, field: "kg" | "reps", value: string) => void;
  toggleSetDone: (weId: string, setIndex: number, restSecondsDefault: number) => void;
  addWarmupSet: (weId: string) => void;
  addWorkSet: (weId: string) => void;
  removeRunSet: (weId: string, setIndex: number) => void;
  setRunVariant: (weId: string, variant: 0 | 1) => void;
  pauseRest: () => void;
  resumeRest: () => void;
  skipRest: () => void;
  resetRest: (seconds: number) => void;
  cancelRun: () => void;
  finishRun: (mode: "markAllDone" | "deletePending" | "clean") => RunSummary | null;
  activeRun: ActiveRun | null;
  lastSummary: RunSummary | null;
  clearSummary: () => void;

  addStudentByCode: (code: string) => { ok: boolean; message: string };
  removeStudentFromTeam: (studentId: string) => void;
  scheduleAssignment: (assignmentId: string, liveAt: string | null, status: "live" | "scheduled") => void;
  cancelAssignment: (assignmentId: string) => void;

  resetDemo: () => void;
}

function baseTables() {
  return {
    profiles: [...seedProfiles],
    studentDetails: [...seedStudentDetails],
    trainerDetails: [...seedTrainerDetails],
    trainerStudents: [...seedTrainerStudents],
    exercises: [...seedExercises],
    programs: [...seedPrograms, ...seedCommunityPrograms],
    workouts: [...seedWorkouts],
    workoutExercises: [...seedWorkoutExercises],
    programAssignments: [...seedProgramAssignments],
    sessions: [...seedSessions],
    sessionSets: [] as SessionSet[],
    bodyMetrics: [...seedBodyMetrics],
  };
}

function buildRunSets(
  workoutExercises: WorkoutExercise[],
  workoutId: string
): Record<string, RunSetState[]> {
  const list = workoutExercises
    .filter((we) => we.workout_id === workoutId)
    .sort((a, b) => a.order_index - b.order_index);
  const result: Record<string, RunSetState[]> = {};
  for (const we of list) {
    const sets: RunSetState[] = [];
    const repMin = we.rep_min ?? 8;
    const repMax = we.rep_max ?? 12;
    const kg = we.target_kg ?? 0;
    if (we.warmup) {
      sets.push({
        setIndex: 0,
        kind: "warm",
        repMin: 12,
        repMax: 15,
        kgTarget: Math.round(kg * 0.5),
        kg: String(Math.round(kg * 0.5)),
        reps: "",
        completed: false,
      });
    }
    for (let i = 0; i < we.sets_count; i++) {
      sets.push({
        setIndex: sets.length,
        kind: "work",
        repMin,
        repMax,
        kgTarget: kg,
        kg: String(kg),
        reps: "",
        completed: false,
      });
    }
    result[we.id] = sets;
  }
  return result;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      theme: "light",
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

      currentUserId: null,
      login: (email) => {
        const profile = get().profiles.find(
          (p) => p.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (!profile) return false;
        set({ currentUserId: profile.id });
        return true;
      },
      logout: () => set({ currentUserId: null }),
      signup: (fullName, email, role) => {
        const id = uid("profile");
        const code = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
        const profile: Profile = {
          id,
          role,
          full_name: fullName,
          email,
          avatar_url: null,
          invite_code: code,
          created_at: nowIso(),
        };
        set((s) => ({ profiles: [...s.profiles, profile], currentUserId: id }));
        return id;
      },

      ...baseTables(),

      hasInvite: true,
      hasCoach: true,
      acceptInvite: () =>
        set((s) => ({
          hasCoach: true,
          hasInvite: false,
          trainerStudents: s.trainerStudents.map((ts) =>
            ts.student_id === s.currentUserId ? { ...ts, status: "active", joined_at: nowIso() } : ts
          ),
        })),
      declineInvite: () => set({ hasInvite: false }),
      leaveCoach: () => set({ hasCoach: false }),

      toast: null,
      showToast: (msg) => set({ toast: msg }),
      clearToast: () => set({ toast: null }),

      completeOnboarding: (data) => {
        const userId = get().currentUserId;
        if (!userId) return;
        set((s) => {
          const exists = s.studentDetails.some((d) => d.profile_id === userId);
          const details: StudentDetails = {
            profile_id: userId,
            weight_kg: data.weight_kg,
            height_cm: data.height_cm,
            goal_weight_kg: data.goal_weight_kg,
            goal: data.goal,
            experience_level: data.experience_level,
            equipment: data.equipment,
            limitations: data.limitations,
          };
          const studentDetails = exists
            ? s.studentDetails.map((d) => (d.profile_id === userId ? details : d))
            : [...s.studentDetails, details];

          let profiles = s.profiles;
          let trainerDetails = s.trainerDetails;
          if (data.isTrainer) {
            profiles = profiles.map((p) => (p.id === userId ? { ...p, role: "trainer" } : p));
            trainerDetails = [
              ...trainerDetails.filter((t) => t.profile_id !== userId),
              {
                profile_id: userId,
                cref_number: data.cref ?? "",
                cref_uf: "SP",
                verification_status: "verified",
                verified_at: nowIso(),
              },
            ];
          }
          return { studentDetails, profiles, trainerDetails };
        });
      },

      createExercise: (name, muscles, equipment) => {
        const exercise: Exercise = {
          id: uid("ex"),
          name,
          muscle_group: muscles[0] ?? "Peito",
          equipment,
          media_url: null,
          created_by: get().currentUserId,
        };
        set((s) => ({ exercises: [...s.exercises, exercise] }));
        return exercise;
      },

      createProgram: (input) => {
        const program: Program = {
          id: uid("program"),
          owner_id: input.ownerId,
          name: input.name,
          goal: input.goal,
          mode: input.mode,
          sets_by: input.setsBy,
          rest_by: input.restBy,
          rep_range_enabled: input.repRangeEnabled,
          weekly_progression: input.weeklyProgression,
          default_sets: input.defaultSets,
          default_rep_min: input.defaultRepMin,
          default_rep_max: input.defaultRepMax,
          default_rest_seconds: input.defaultRestSeconds,
          visibility: "private",
          published_at: null,
          created_at: nowIso(),
          cover_url: "/covers/novo.jpg",
        };
        set((s) => ({ programs: [...s.programs, program] }));
        if (input.forStudentId) {
          const assignment: ProgramAssignment = {
            id: uid("assign"),
            program_id: program.id,
            student_id: input.forStudentId,
            assigned_by: input.ownerId,
            live_at: input.liveAt ?? nowIso(),
            status: input.liveAt && new Date(input.liveAt) > new Date() ? "scheduled" : "live",
            created_at: nowIso(),
          };
          set((s) => ({ programAssignments: [...s.programAssignments, assignment] }));
        }
        return program;
      },

      cloneCommunityProgram: (programId) => {
        const src = get().programs.find((p) => p.id === programId);
        const userId = get().currentUserId;
        if (!src || !userId) throw new Error("Programa ou usuário não encontrado");
        const newProgram: Program = {
          ...src,
          id: uid("program"),
          owner_id: userId,
          visibility: "private",
          published_at: null,
          created_at: nowIso(),
        };
        set((s) => ({ programs: [...s.programs, newProgram] }));

        // clona os treinos de referência do Upper/Lower (templates existentes)
        // em seg/qua/sex, como no protótipo original.
        const templateWorkoutIds = get()
          .workouts.filter((w) => w.program_id === "program-upper-lower")
          .sort((a, b) => (a.day_key ?? "").localeCompare(b.day_key ?? ""));
        const dayMap: DayKey[] = ["seg", "qua", "sex"];
        const newWorkouts: Workout[] = [];
        const newWEs: WorkoutExercise[] = [];
        templateWorkoutIds.slice(0, 3).forEach((tw, i) => {
          const nw: Workout = {
            id: uid("workout"),
            program_id: newProgram.id,
            day_key: dayMap[i],
            sequence_order: null,
            name: tw.name,
            rest_seconds: tw.rest_seconds,
          };
          newWorkouts.push(nw);
          get()
            .workoutExercises.filter((we) => we.workout_id === tw.id)
            .forEach((we) => {
              newWEs.push({ ...we, id: uid("we"), workout_id: nw.id });
            });
        });
        set((s) => ({
          workouts: [...s.workouts, ...newWorkouts],
          workoutExercises: [...s.workoutExercises, ...newWEs],
        }));
        return newProgram;
      },

      saveWorkout: ({ programId, dayKey, name, restSeconds, exercises }) => {
        set((s) => {
          let workout = s.workouts.find((w) => w.program_id === programId && w.day_key === dayKey);
          let workouts = s.workouts;
          if (!workout) {
            workout = {
              id: uid("workout"),
              program_id: programId,
              day_key: dayKey,
              sequence_order: null,
              name,
              rest_seconds: restSeconds,
            };
            workouts = [...workouts, workout];
          } else {
            const wId = workout.id;
            workouts = workouts.map((w) => (w.id === wId ? { ...w, name, rest_seconds: restSeconds } : w));
          }
          const otherWEs = s.workoutExercises.filter((we) => we.workout_id !== workout!.id);
          const newWEs = exercises.map((we, i) => ({
            ...we,
            id: uid("we"),
            workout_id: workout!.id,
            order_index: i,
          }));
          return { workouts, workoutExercises: [...otherWEs, ...newWEs] };
        });
      },

      activeRun: null,
      lastSummary: null,
      clearSummary: () => set({ lastSummary: null }),

      startRun: (workoutId, programId, studentId) => {
        const sessionId = uid("session");
        const session: Session = {
          id: sessionId,
          student_id: studentId,
          workout_id: workoutId,
          program_id: programId,
          started_at: nowIso(),
          ended_at: null,
          duration_seconds: null,
          total_volume_kg: null,
          status: "active",
        };
        const sets = buildRunSets(get().workoutExercises, workoutId);
        set((s) => ({
          sessions: [...s.sessions, session],
          activeRun: {
            sessionId,
            workoutId,
            programId,
            startedAt: session.started_at,
            elapsed: 0,
            running: true,
            restLeft: 0,
            restRunning: false,
            restTotal: 0,
            variant: {},
            sets,
          },
        }));
        return sessionId;
      },

      tickRun: () => {
        const run = get().activeRun;
        if (!run) return;
        set({
          activeRun: {
            ...run,
            elapsed: run.running ? run.elapsed + 1 : run.elapsed,
            restLeft: run.restRunning && run.restLeft > 0 ? run.restLeft - 1 : run.restLeft,
            restRunning: run.restRunning && run.restLeft - 1 > 0,
          },
        });
      },

      toggleRunPause: () => {
        const run = get().activeRun;
        if (!run) return;
        set({ activeRun: { ...run, running: !run.running } });
      },

      updateSetField: (weId, setIndex, field, value) => {
        const run = get().activeRun;
        if (!run) return;
        const sanitized =
          field === "kg" ? value.replace(/[^\d.,]/g, "") : value.replace(/\D/g, "");
        const sets = run.sets[weId]?.map((st) =>
          st.setIndex === setIndex ? { ...st, [field]: sanitized } : st
        );
        set({ activeRun: { ...run, sets: { ...run.sets, [weId]: sets ?? [] } } });
      },

      toggleSetDone: (weId, setIndex, restSecondsDefault) => {
        const run = get().activeRun;
        if (!run) return;
        let willComplete = false;
        const sets = run.sets[weId]?.map((st) => {
          if (st.setIndex !== setIndex) return st;
          willComplete = !st.completed;
          return {
            ...st,
            completed: !st.completed,
            reps: !st.completed && !st.reps ? String(st.repMin) : st.reps,
          };
        });
        const next: ActiveRun = { ...run, sets: { ...run.sets, [weId]: sets ?? [] } };
        if (willComplete) {
          next.restLeft = restSecondsDefault;
          next.restTotal = restSecondsDefault;
          next.restRunning = true;
        }
        set({ activeRun: next });
      },

      addWarmupSet: (weId) => {
        const run = get().activeRun;
        if (!run) return;
        const list = run.sets[weId] ?? [];
        if (list.some((s) => s.kind === "warm")) return;
        const firstWork = list.find((s) => s.kind === "work");
        const warm: RunSetState = {
          setIndex: -1,
          kind: "warm",
          repMin: 12,
          repMax: 15,
          kgTarget: Math.round((firstWork?.kgTarget ?? 0) * 0.5),
          kg: String(Math.round((firstWork?.kgTarget ?? 0) * 0.5)),
          reps: "",
          completed: false,
        };
        const reindexed = [warm, ...list].map((s, i) => ({ ...s, setIndex: i }));
        set({ activeRun: { ...run, sets: { ...run.sets, [weId]: reindexed } } });
      },

      addWorkSet: (weId) => {
        const run = get().activeRun;
        if (!run) return;
        const list = run.sets[weId] ?? [];
        const last = [...list].reverse().find((s) => s.kind === "work") ?? list[list.length - 1];
        const added: RunSetState = {
          setIndex: list.length,
          kind: "work",
          repMin: last?.repMin ?? 8,
          repMax: last?.repMax ?? 12,
          kgTarget: last?.kgTarget ?? 0,
          kg: last?.kg ?? "0",
          reps: "",
          completed: false,
        };
        set({ activeRun: { ...run, sets: { ...run.sets, [weId]: [...list, added] } } });
      },

      removeRunSet: (weId, setIndex) => {
        const run = get().activeRun;
        if (!run) return;
        const list = (run.sets[weId] ?? [])
          .filter((s) => s.setIndex !== setIndex)
          .map((s, i) => ({ ...s, setIndex: i }));
        set({ activeRun: { ...run, sets: { ...run.sets, [weId]: list } } });
      },

      setRunVariant: (weId, variant) => {
        const run = get().activeRun;
        if (!run) return;
        set({ activeRun: { ...run, variant: { ...run.variant, [weId]: variant } } });
      },

      pauseRest: () => {
        const run = get().activeRun;
        if (!run) return;
        set({ activeRun: { ...run, restRunning: false } });
      },
      resumeRest: () => {
        const run = get().activeRun;
        if (!run || run.restLeft <= 0) return;
        set({ activeRun: { ...run, restRunning: true } });
      },
      skipRest: () => {
        const run = get().activeRun;
        if (!run) return;
        set({ activeRun: { ...run, restLeft: 0, restRunning: false } });
      },
      resetRest: (seconds) => {
        const run = get().activeRun;
        if (!run) return;
        set({ activeRun: { ...run, restLeft: seconds, restTotal: seconds, restRunning: true } });
      },

      cancelRun: () => {
        const run = get().activeRun;
        if (!run) return;
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === run.sessionId ? { ...sess, status: "discarded", ended_at: nowIso() } : sess
          ),
          activeRun: null,
        }));
      },

      finishRun: (mode) => {
        const run = get().activeRun;
        if (!run) return null;
        const workout = get().workouts.find((w) => w.id === run.workoutId);
        const program = get().programs.find((p) => p.id === run.programId);
        const wes = get().workoutExercises.filter((we) => we.workout_id === run.workoutId);

        const flatSets: { weId: string; st: RunSetState }[] = [];
        for (const we of wes) {
          for (const st of run.sets[we.id] ?? []) flatSets.push({ weId: we.id, st });
        }

        let finalSets = flatSets;
        if (mode === "markAllDone") {
          finalSets = flatSets.map(({ weId, st }) => ({
            weId,
            st: st.completed ? st : { ...st, completed: true, reps: st.reps || String(st.repMin) },
          }));
        } else if (mode === "deletePending") {
          finalSets = flatSets.filter(({ st }) => st.completed);
        }

        const done = finalSets.filter(({ st }) => st.completed);
        const volume = done.reduce((sum, { st }) => {
          const kg = parseFloat(st.kg.replace(",", ".")) || 0;
          const reps = parseInt(st.reps, 10) || st.repMin;
          return sum + kg * reps;
        }, 0);

        const sessionSets: SessionSet[] = done.map(({ weId, st }) => ({
          id: uid("sset"),
          session_id: run.sessionId,
          workout_exercise_id: weId,
          set_index: st.setIndex,
          reps_done: parseInt(st.reps, 10) || null,
          kg_done: parseFloat(st.kg.replace(",", ".")) || null,
          completed: true,
          completed_at: nowIso(),
          kind: st.kind,
        }));

        set((s) => ({
          sessionSets: [...s.sessionSets, ...sessionSets],
          sessions: s.sessions.map((sess) =>
            sess.id === run.sessionId
              ? {
                  ...sess,
                  status: "completed",
                  ended_at: nowIso(),
                  duration_seconds: run.elapsed,
                  total_volume_kg: Math.round(volume * 10) / 10,
                }
              : sess
          ),
          activeRun: null,
        }));

        const summary: RunSummary = {
          duration: run.elapsed,
          setsCompleted: done.length,
          volume: Math.round(volume * 10) / 10,
          programName: program?.name ?? "",
          workoutName: workout?.name ?? "",
        };
        set({ lastSummary: summary });
        return summary;
      },

      addStudentByCode: (code) => {
        if (code.length !== 6) return { ok: false, message: "Digite os 6 dígitos do código" };
        const trainerId = get().currentUserId;
        if (!trainerId) return { ok: false, message: "Código não encontrado" };
        if (code === LUANA_LOOKUP.code) {
          const exists = get().trainerStudents.some(
            (ts) => ts.trainer_id === trainerId && ts.student_id === LUANA_ID
          );
          if (!exists) {
            const link: TrainerStudent = {
              id: uid("ts"),
              trainer_id: trainerId,
              student_id: LUANA_ID,
              status: "pending",
              invited_at: nowIso(),
              joined_at: null,
            };
            set((s) => ({ trainerStudents: [...s.trainerStudents, link] }));
          }
          return { ok: true, message: `Convite enviado para ${LUANA_LOOKUP.name}` };
        }
        return { ok: false, message: "Código não encontrado" };
      },

      removeStudentFromTeam: (studentId) => {
        const trainerId = get().currentUserId;
        set((s) => ({
          trainerStudents: s.trainerStudents.filter(
            (ts) => !(ts.trainer_id === trainerId && ts.student_id === studentId)
          ),
        }));
      },

      scheduleAssignment: (assignmentId, liveAt, status) => {
        set((s) => ({
          programAssignments: s.programAssignments.map((a) =>
            a.id === assignmentId ? { ...a, live_at: liveAt ?? a.live_at, status } : a
          ),
        }));
      },
      cancelAssignment: (assignmentId) => {
        set((s) => ({
          programAssignments: s.programAssignments.filter((a) => a.id !== assignmentId),
        }));
      },

      resetDemo: () => {
        set({
          ...baseTables(),
          currentUserId: SARA_ID,
          hasCoach: true,
          hasInvite: false,
          activeRun: null,
          toast: null,
        });
      },
    }),
    {
      name: "fittracker-store",
      partialize: (s) => ({
        theme: s.theme,
        currentUserId: s.currentUserId,
        profiles: s.profiles,
        studentDetails: s.studentDetails,
        trainerDetails: s.trainerDetails,
        trainerStudents: s.trainerStudents,
        exercises: s.exercises,
        programs: s.programs,
        workouts: s.workouts,
        workoutExercises: s.workoutExercises,
        programAssignments: s.programAssignments,
        sessions: s.sessions,
        sessionSets: s.sessionSets,
        bodyMetrics: s.bodyMetrics,
        hasInvite: s.hasInvite,
        hasCoach: s.hasCoach,
        activeRun: s.activeRun,
        lastSummary: s.lastSummary,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const DEMO_TRAINER_ID = PAOLO_ID;
export const DEMO_STUDENT_ID = SARA_ID;
