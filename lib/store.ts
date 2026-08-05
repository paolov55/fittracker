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
import { supabase } from "./db/supabase/client";
import { hydrateFromSupabase, type HydratedTables } from "./db/supabase/queries";

function uid() {
  return crypto.randomUUID();
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

function emptyTables(): HydratedTables {
  return {
    profiles: [],
    studentDetails: [],
    trainerDetails: [],
    trainerStudents: [],
    exercises: [],
    programs: [],
    workouts: [],
    workoutExercises: [],
    programAssignments: [],
    sessions: [],
    sessionSets: [],
    bodyMetrics: [],
  };
}

function deriveCoachFlags(tables: HydratedTables, userId: string) {
  const hasCoach = tables.trainerStudents.some(
    (ts) => ts.student_id === userId && ts.status === "active"
  );
  const hasInvite = tables.trainerStudents.some(
    (ts) => ts.student_id === userId && ts.status === "pending"
  );
  return { hasCoach, hasInvite };
}

interface AppState {
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  initAuth: () => Promise<void>;

  theme: "light" | "dark";
  toggleTheme: () => void;

  currentUserId: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (
    fullName: string,
    email: string,
    password: string,
    role: "student" | "trainer"
  ) => Promise<string | null>;

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

  addStudentByCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  removeStudentFromTeam: (studentId: string) => void;
  scheduleAssignment: (assignmentId: string, liveAt: string | null, status: "live" | "scheduled") => void;
  cancelAssignment: (assignmentId: string) => void;

  resetDemo: () => void;
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

      initAuth: async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            const tables = await hydrateFromSupabase();
            const { hasCoach, hasInvite } = deriveCoachFlags(tables, data.session.user.id);
            set({ ...tables, currentUserId: data.session.user.id, hasCoach, hasInvite });
          }
        } catch {
          // sessão inválida/expirada — segue para a tela de login
        } finally {
          set({ hasHydrated: true });
        }
      },

      theme: "light",
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

      currentUserId: null,
      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.session) return false;
        const tables = await hydrateFromSupabase();
        const { hasCoach, hasInvite } = deriveCoachFlags(tables, data.session.user.id);
        set({ ...tables, currentUserId: data.session.user.id, hasCoach, hasInvite });
        return true;
      },
      logout: () => {
        set({ ...emptyTables(), currentUserId: null, hasCoach: false, hasInvite: false, activeRun: null });
        supabase.auth.signOut().catch(() => {});
      },
      signup: async (fullName, email, password, role) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role } },
        });
        if (error || !data.user) {
          get().showToast(error?.message ?? "Não foi possível criar a conta");
          return null;
        }
        if (data.session) {
          const tables = await hydrateFromSupabase();
          const { hasCoach, hasInvite } = deriveCoachFlags(tables, data.user.id);
          set({ ...tables, currentUserId: data.user.id, hasCoach, hasInvite });
        } else {
          // confirmação de e-mail pendente: segue com um perfil local otimista
          get().showToast("Confirme seu e-mail para concluir o cadastro");
          set((s) => ({
            currentUserId: data.user!.id,
            profiles: [
              ...s.profiles,
              {
                id: data.user!.id,
                role,
                full_name: fullName,
                email,
                avatar_url: null,
                invite_code: String(Math.floor(Math.random() * 1000000)).padStart(6, "0"),
                created_at: nowIso(),
              },
            ],
          }));
        }
        return data.user.id;
      },

      ...emptyTables(),

      hasInvite: false,
      hasCoach: false,
      acceptInvite: () => {
        const userId = get().currentUserId;
        if (!userId) return;
        const link = get().trainerStudents.find(
          (ts) => ts.student_id === userId && ts.status === "pending"
        );
        if (!link) return;
        const joined_at = nowIso();
        set((s) => ({
          hasCoach: true,
          hasInvite: false,
          trainerStudents: s.trainerStudents.map((ts) =>
            ts.id === link.id ? { ...ts, status: "active", joined_at } : ts
          ),
        }));
        supabase
          .from("trainer_students")
          .update({ status: "active", joined_at })
          .eq("id", link.id)
          .then(({ error }) => {
            if (error) get().showToast("Não foi possível confirmar a equipe");
          });
      },
      declineInvite: () => {
        const userId = get().currentUserId;
        if (!userId) return;
        const link = get().trainerStudents.find(
          (ts) => ts.student_id === userId && ts.status === "pending"
        );
        set({ hasInvite: false });
        if (!link) return;
        set((s) => ({ trainerStudents: s.trainerStudents.filter((ts) => ts.id !== link.id) }));
        supabase
          .from("trainer_students")
          .update({ status: "removed" })
          .eq("id", link.id)
          .then(() => {});
      },
      leaveCoach: () => {
        const userId = get().currentUserId;
        if (!userId) return;
        const link = get().trainerStudents.find(
          (ts) => ts.student_id === userId && ts.status === "active"
        );
        set({ hasCoach: false });
        if (!link) return;
        set((s) => ({ trainerStudents: s.trainerStudents.filter((ts) => ts.id !== link.id) }));
        supabase
          .from("trainer_students")
          .update({ status: "removed" })
          .eq("id", link.id)
          .then(() => {});
      },

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

        (async () => {
          const { error } = await supabase.from("student_details").upsert({
            profile_id: userId,
            weight_kg: data.weight_kg,
            height_cm: data.height_cm,
            goal_weight_kg: data.goal_weight_kg,
            goal: data.goal,
            experience_level: data.experience_level,
            equipment: data.equipment,
            limitations: data.limitations,
          });
          if (error) get().showToast("Não foi possível salvar seu perfil");

          if (data.isTrainer) {
            await supabase.from("profiles").update({ role: "trainer" }).eq("id", userId);
            const { error: trainerError } = await supabase.from("trainer_details").upsert({
              profile_id: userId,
              cref_number: data.cref ?? "",
              cref_uf: "SP",
              verification_status: "verified",
              verified_at: nowIso(),
            });
            if (trainerError) get().showToast("Não foi possível salvar seu CREF");
          }
        })();
      },

      createExercise: (name, muscles, equipment) => {
        const exercise: Exercise = {
          id: uid(),
          name,
          muscle_group: muscles[0] ?? "Peito",
          equipment,
          media_url: null,
          created_by: get().currentUserId,
        };
        set((s) => ({ exercises: [...s.exercises, exercise] }));
        supabase
          .from("exercises")
          .insert(exercise)
          .then(({ error }) => {
            if (error) get().showToast("Não foi possível salvar o exercício");
          });
        return exercise;
      },

      createProgram: (input) => {
        const program: Program = {
          id: uid(),
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

        let assignment: ProgramAssignment | null = null;
        if (input.forStudentId) {
          assignment = {
            id: uid(),
            program_id: program.id,
            student_id: input.forStudentId,
            assigned_by: input.ownerId,
            live_at: input.liveAt ?? nowIso(),
            status: input.liveAt && new Date(input.liveAt) > new Date() ? "scheduled" : "live",
            created_at: nowIso(),
          };
          set((s) => ({ programAssignments: [...s.programAssignments, assignment!] }));
        }

        (async () => {
          const { cover_url, community_meta, community_desc, community_author, community_level, ...rest } =
            program;
          const { error } = await supabase
            .from("programs")
            .insert({ ...rest, cover_url, community_meta, community_desc, community_author, community_level });
          if (error) {
            get().showToast("Não foi possível salvar o programa");
            return;
          }
          if (assignment) {
            const { error: assignError } = await supabase.from("program_assignments").insert(assignment);
            if (assignError) get().showToast("Não foi possível atribuir o programa");
          }
        })();

        return program;
      },

      cloneCommunityProgram: (programId) => {
        const src = get().programs.find((p) => p.id === programId);
        const userId = get().currentUserId;
        if (!src || !userId) throw new Error("Programa ou usuário não encontrado");
        const newProgram: Program = {
          ...src,
          id: uid(),
          owner_id: userId,
          visibility: "private",
          published_at: null,
          created_at: nowIso(),
        };
        set((s) => ({ programs: [...s.programs, newProgram] }));

        // clona os treinos do programa de origem (mesma grade seg/qua/sex do template)
        const templateWorkouts = get()
          .workouts.filter((w) => w.program_id === src.id)
          .sort((a, b) => (a.day_key ?? "").localeCompare(b.day_key ?? ""));
        const dayMap: DayKey[] = ["seg", "qua", "sex"];
        const newWorkouts: Workout[] = [];
        const newWEs: WorkoutExercise[] = [];
        templateWorkouts.slice(0, 3).forEach((tw, i) => {
          const nw: Workout = {
            id: uid(),
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
              newWEs.push({ ...we, id: uid(), workout_id: nw.id });
            });
        });
        set((s) => ({
          workouts: [...s.workouts, ...newWorkouts],
          workoutExercises: [...s.workoutExercises, ...newWEs],
        }));

        (async () => {
          const { community_meta, community_desc, community_author, community_level, ...rest } = newProgram;
          void community_meta;
          void community_desc;
          void community_author;
          void community_level;
          const { error } = await supabase.from("programs").insert({
            ...rest,
            community_meta: null,
            community_desc: null,
            community_author: null,
            community_level: null,
          });
          if (error) {
            get().showToast("Não foi possível clonar o programa");
            return;
          }
          if (newWorkouts.length) {
            const { error: workoutsError } = await supabase.from("workouts").insert(newWorkouts);
            if (workoutsError) get().showToast("Não foi possível clonar os treinos");
          }
          if (newWEs.length) {
            const { error: wesError } = await supabase.from("workout_exercises").insert(
              newWEs.map(({ alt_exercise_id, superset_group, warmup, ...we }) => ({
                ...we,
                alt_exercise_id,
                superset_group,
                warmup,
              }))
            );
            if (wesError) get().showToast("Não foi possível clonar os exercícios");
          }
        })();

        return newProgram;
      },

      saveWorkout: ({ programId, dayKey, name, restSeconds, exercises }) => {
        let workoutId = "";
        set((s) => {
          let workout = s.workouts.find((w) => w.program_id === programId && w.day_key === dayKey);
          let workouts = s.workouts;
          if (!workout) {
            workout = {
              id: uid(),
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
          workoutId = workout.id;
          const otherWEs = s.workoutExercises.filter((we) => we.workout_id !== workout!.id);
          const newWEs = exercises.map((we, i) => ({
            ...we,
            id: uid(),
            workout_id: workout!.id,
            order_index: i,
          }));
          return { workouts, workoutExercises: [...otherWEs, ...newWEs] };
        });

        (async () => {
          const workout = get().workouts.find((w) => w.id === workoutId)!;
          const { error: workoutError } = await supabase.from("workouts").upsert(workout);
          if (workoutError) {
            get().showToast("Não foi possível salvar o treino");
            return;
          }
          await supabase.from("workout_exercises").delete().eq("workout_id", workoutId);
          const wes = get().workoutExercises.filter((we) => we.workout_id === workoutId);
          if (wes.length) {
            const { error: wesError } = await supabase.from("workout_exercises").insert(wes);
            if (wesError) get().showToast("Não foi possível salvar os exercícios do treino");
          }
        })();
      },

      activeRun: null,
      lastSummary: null,
      clearSummary: () => set({ lastSummary: null }),

      startRun: (workoutId, programId, studentId) => {
        const sessionId = uid();
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
        supabase
          .from("sessions")
          .insert(session)
          .then(({ error }) => {
            if (error) get().showToast("Não foi possível iniciar a sessão no servidor");
          });
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
        supabase
          .from("sessions")
          .update({ status: "discarded", ended_at: nowIso() })
          .eq("id", run.sessionId)
          .then(() => {});
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
          id: uid(),
          session_id: run.sessionId,
          workout_exercise_id: weId,
          set_index: st.setIndex,
          reps_done: parseInt(st.reps, 10) || null,
          kg_done: parseFloat(st.kg.replace(",", ".")) || null,
          completed: true,
          completed_at: nowIso(),
          kind: st.kind,
        }));

        const totalVolume = Math.round(volume * 10) / 10;
        const endedAt = nowIso();

        set((s) => ({
          sessionSets: [...s.sessionSets, ...sessionSets],
          sessions: s.sessions.map((sess) =>
            sess.id === run.sessionId
              ? {
                  ...sess,
                  status: "completed",
                  ended_at: endedAt,
                  duration_seconds: run.elapsed,
                  total_volume_kg: totalVolume,
                }
              : sess
          ),
          activeRun: null,
        }));

        (async () => {
          if (sessionSets.length) {
            const { error } = await supabase.from("session_sets").insert(sessionSets);
            if (error) get().showToast("Não foi possível salvar as séries do treino");
          }
          const { error: sessionError } = await supabase
            .from("sessions")
            .update({
              status: "completed",
              ended_at: endedAt,
              duration_seconds: run.elapsed,
              total_volume_kg: totalVolume,
            })
            .eq("id", run.sessionId);
          if (sessionError) get().showToast("Não foi possível salvar a sessão");
        })();

        const summary: RunSummary = {
          duration: run.elapsed,
          setsCompleted: done.length,
          volume: totalVolume,
          programName: program?.name ?? "",
          workoutName: workout?.name ?? "",
        };
        set({ lastSummary: summary });
        return summary;
      },

      addStudentByCode: async (code) => {
        if (code.length !== 6) return { ok: false, message: "Digite os 6 dígitos do código" };
        const trainerId = get().currentUserId;
        if (!trainerId) return { ok: false, message: "Código não encontrado" };

        const { data: student, error } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("invite_code", code)
          .maybeSingle();
        if (error || !student) return { ok: false, message: "Código não encontrado" };
        if (student.id === trainerId) return { ok: false, message: "Código não encontrado" };

        const exists = get().trainerStudents.some(
          (ts) => ts.trainer_id === trainerId && ts.student_id === student.id
        );
        if (exists) return { ok: true, message: `Convite já enviado para ${student.full_name}` };

        const link: TrainerStudent = {
          id: uid(),
          trainer_id: trainerId,
          student_id: student.id,
          status: "pending",
          invited_at: nowIso(),
          joined_at: null,
        };
        const { error: insertError } = await supabase.from("trainer_students").insert(link);
        if (insertError) return { ok: false, message: "Não foi possível enviar o convite" };

        set((s) => ({ trainerStudents: [...s.trainerStudents, link] }));
        return { ok: true, message: `Convite enviado para ${student.full_name}` };
      },

      removeStudentFromTeam: (studentId) => {
        const trainerId = get().currentUserId;
        set((s) => ({
          trainerStudents: s.trainerStudents.filter(
            (ts) => !(ts.trainer_id === trainerId && ts.student_id === studentId)
          ),
        }));
        supabase
          .from("trainer_students")
          .delete()
          .eq("trainer_id", trainerId ?? "")
          .eq("student_id", studentId)
          .then(() => {});
      },

      scheduleAssignment: (assignmentId, liveAt, status) => {
        set((s) => ({
          programAssignments: s.programAssignments.map((a) =>
            a.id === assignmentId ? { ...a, live_at: liveAt ?? a.live_at, status } : a
          ),
        }));
        supabase
          .from("program_assignments")
          .update({ live_at: liveAt ?? undefined, status })
          .eq("id", assignmentId)
          .then(({ error }) => {
            if (error) get().showToast("Não foi possível atualizar a atribuição");
          });
      },
      cancelAssignment: (assignmentId) => {
        set((s) => ({
          programAssignments: s.programAssignments.filter((a) => a.id !== assignmentId),
        }));
        supabase
          .from("program_assignments")
          .delete()
          .eq("id", assignmentId)
          .then(() => {});
      },

      resetDemo: () => {
        set({ activeRun: null, toast: null, lastSummary: null });
      },
    }),
    {
      name: "fittracker-store",
      partialize: (s) => ({
        theme: s.theme,
        activeRun: s.activeRun,
        lastSummary: s.lastSummary,
      }),
      onRehydrateStorage: () => () => {
        // a hidratação de dados agora vem do Supabase (ver initAuth em HydrationGate)
      },
    }
  )
);
