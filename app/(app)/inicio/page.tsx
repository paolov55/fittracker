"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useCurrentProfile, useRole } from "@/lib/hooks";
import { WEEK, formatWeekday, formatKg, firstName } from "@/lib/format";
import { todayKey, startOfWeek } from "@/lib/workout";
import {
  Screen,
  Card,
  Eyebrow,
  ProgressBar,
  InitialsAvatar,
  IconTile,
} from "@/components/ui/primitives";
import {
  SlidersIcon,
  PlayIcon,
  ChevronRightIcon,
  CheckIcon,
  UsersIcon,
} from "@/components/icons";

export default function InicioPage() {
  const router = useRouter();
  const profile = useCurrentProfile();
  const role = useRole();

  const programs = useAppStore((s) => s.programs);
  const workouts = useAppStore((s) => s.workouts);
  const workoutExercises = useAppStore((s) => s.workoutExercises);
  const assignments = useAppStore((s) => s.programAssignments);
  const sessions = useAppStore((s) => s.sessions);
  const bodyMetrics = useAppStore((s) => s.bodyMetrics);
  const trainerStudents = useAppStore((s) => s.trainerStudents);
  const hasInvite = useAppStore((s) => s.hasInvite);
  const hasCoach = useAppStore((s) => s.hasCoach);
  const acceptInvite = useAppStore((s) => s.acceptInvite);
  const declineInvite = useAppStore((s) => s.declineInvite);
  const showToast = useAppStore((s) => s.showToast);
  const profiles = useAppStore((s) => s.profiles);
  const student = useAppStore((s) =>
    s.studentDetails.find((d) => d.profile_id === profile?.id),
  );

  if (!profile) return null;

  const myAssignment = assignments.find(
    (a) => a.student_id === profile.id && a.status === "live",
  );
  const activeProgram = myAssignment
    ? programs.find((p) => p.id === myAssignment.program_id)
    : null;
  const programWorkouts = activeProgram
    ? workouts.filter((w) => w.program_id === activeProgram.id)
    : [];

  const today = todayKey();
  const todayIdx = WEEK.findIndex((d) => d.k === today);
  let nextWorkout = programWorkouts.find((w) => w.day_key === today);
  let nextDayLabel = "Hoje";
  if (!nextWorkout) {
    for (let i = 1; i <= 7; i++) {
      const idx = (todayIdx + i) % 7;
      const w = programWorkouts.find((wo) => wo.day_key === WEEK[idx].k);
      if (w) {
        nextWorkout = w;
        nextDayLabel = WEEK[idx].label;
        break;
      }
    }
  }
  const nextWorkoutExerciseCount = nextWorkout
    ? workoutExercises.filter((we) => we.workout_id === nextWorkout!.id).length
    : 0;

  const weekStart = startOfWeek();
  const doneThisWeek = new Set(
    sessions
      .filter(
        (s) =>
          s.student_id === profile.id &&
          s.status === "completed" &&
          new Date(s.started_at) >= weekStart,
      )
      .map((s) => workouts.find((w) => w.id === s.workout_id)?.day_key)
      .filter(Boolean),
  );

  const myMetrics = bodyMetrics
    .filter((m) => m.student_id === profile.id)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const latestWeight = myMetrics[myMetrics.length - 1];

  const myTrainerLink = trainerStudents.find(
    (ts) => ts.student_id === profile.id && ts.status === "active",
  );
  const trainerProfile = myTrainerLink
    ? profiles.find((p) => p.id === myTrainerLink.trainer_id)
    : null;
  const pendingInviteLink = trainerStudents.find(
    (ts) => ts.student_id === profile.id && ts.status === "pending",
  );
  const inviterProfile = pendingInviteLink
    ? profiles.find((p) => p.id === pendingInviteLink.trainer_id)
    : null;

  const myStudents = trainerStudents.filter(
    (ts) => ts.trainer_id === profile.id,
  );
  const activeStudentsCount = myStudents.filter(
    (ts) => ts.status === "active",
  ).length;
  const pendingStudentsCount = myStudents.filter(
    (ts) => ts.status === "pending",
  ).length;

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <InitialsAvatar name={profile.full_name} size={44} />
          <div>
            <div className="text-xs text-muted">{formatWeekday()}</div>
            <div className="text-lg font-semibold">
              Olá, {firstName(profile.full_name)}
            </div>
          </div>
        </div>
        <Link
          href="/perfil"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface border border-border"
        >
          <SlidersIcon size={18} />
        </Link>
      </div>

      {role === "student" && hasInvite && !hasCoach && inviterProfile && (
        <Card className="border-2 border-accent flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <InitialsAvatar name={inviterProfile.full_name} />
            <div>
              <div className="text-md font-medium">
                {inviterProfile.full_name} quer te adicionar à equipe dele
              </div>
              <div className="text-sm text-muted">
                Personal · CREF verificado
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                acceptInvite();
                showToast(
                  `Você entrou na equipe do ${firstName(inviterProfile.full_name)}`,
                );
              }}
              className="flex-1 h-11 rounded-2xl bg-accent text-white text-sm font-semibold"
            >
              Aceitar
            </button>
            <button
              onClick={() => {
                declineInvite();
                showToast("Convite recusado");
              }}
              className="flex-1 h-11 rounded-2xl border border-border text-sm font-semibold"
            >
              Recusar
            </button>
          </div>
        </Card>
      )}

      <Card ink className="relative overflow-hidden flex flex-col gap-4">
        <div
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent opacity-[.14]"
          aria-hidden
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <Eyebrow>Próximo treino</Eyebrow>
            <div className="text-xl font-semibold truncate">
              {nextWorkout ? nextWorkout.name : "Monte seu primeiro treino"}
            </div>
            <div className="text-sm" style={{ color: "rgba(250,250,250,.6)" }}>
              {nextWorkout
                ? `${nextDayLabel} · ${nextWorkoutExerciseCount} exercícios · ~${nextWorkoutExerciseCount * 9} min`
                : "Escolha um programa para começar"}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {nextWorkout && activeProgram && (
              <button
                onClick={() =>
                  router.push(`/treino/executar/${nextWorkout!.id}`)
                }
                className="flex h-12.5 items-center gap-2 rounded-2xl bg-accent px-4 text-sm font-semibold text-white"
              >
                <PlayIcon size={14} />
                Iniciar treino
              </button>
            )}
            <button
              onClick={() =>
                router.push(
                  activeProgram
                    ? `/programas/${activeProgram.id}`
                    : "/programas",
                )
              }
              className="flex h-12.5 w-12.5 items-center justify-center rounded-2xl"
              style={{ background: "rgba(250,250,250,.1)" }}
            >
              <ChevronRightIcon size={18} />
            </button>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Eyebrow>Semana</Eyebrow>
          <span className="text-sm text-muted">
            {doneThisWeek.size} de {programWorkouts.length || 0} treinos
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {WEEK.map((d, i) => {
            const isToday = d.k === today;
            const isDone = doneThisWeek.has(d.k);
            const dayNum = new Date(weekStart);
            dayNum.setDate(weekStart.getDate() + i);
            return (
              <div key={d.k} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-muted">{d.letter}</span>
                <div
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-xl text-sm font-medium"
                  style={{
                    background: isDone
                      ? "var(--accent)"
                      : isToday
                        ? "transparent"
                        : "var(--surface2)",
                    color: isDone ? "#fff" : "var(--text)",
                    boxShadow:
                      isToday && !isDone
                        ? "inset 0 0 0 2px var(--accent)"
                        : undefined,
                  }}
                >
                  {isDone ? <CheckIcon size={14} /> : dayNum.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {role === "student" && latestWeight && student?.goal_weight_kg && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Eyebrow>Peso corporal</Eyebrow>
            <span className="text-sm text-muted">
              Meta {formatKg(student.goal_weight_kg)} kg
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold tabular-nums">
              {formatKg(latestWeight.weight_kg)}
            </span>
            <span className="text-sm text-muted">kg</span>
          </div>
          <ProgressBar
            value={
              student.weight_kg && student.goal_weight_kg
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      (((myMetrics[0]?.weight_kg ?? latestWeight.weight_kg) -
                        latestWeight.weight_kg) /
                        ((myMetrics[0]?.weight_kg ?? latestWeight.weight_kg) -
                          student.goal_weight_kg || 1)) *
                        100,
                    ),
                  )
                : 0
            }
          />
          <span className="text-sm text-muted">
            {(
              latestWeight.weight_kg -
              (myMetrics[0]?.weight_kg ?? latestWeight.weight_kg)
            ).toFixed(1)}{" "}
            kg desde o início
            {student.goal_weight_kg &&
              ` · faltam ${Math.abs(latestWeight.weight_kg - student.goal_weight_kg).toFixed(1)} kg`}
          </span>
        </Card>
      )}

      {role === "trainer" && (
        <Card
          onClick={() => router.push("/alunos")}
          className="flex items-center gap-3"
        >
          <IconTile>
            <UsersIcon size={20} />
          </IconTile>
          <div className="flex-1">
            <Eyebrow>Sua equipe</Eyebrow>
            <div className="text-md font-medium">
              {activeStudentsCount} alunos ativos
            </div>
            <div className="text-sm text-muted">
              {pendingStudentsCount} convite aguardando aceite
            </div>
          </div>
          <ChevronRightIcon size={18} className="text-muted" />
        </Card>
      )}

      {role === "student" && hasCoach && trainerProfile && (
        <Card
          onClick={() => router.push("/perfil")}
          className="flex items-center gap-3"
        >
          <InitialsAvatar name={trainerProfile.full_name} />
          <div className="flex-1">
            <Eyebrow>Sua equipe</Eyebrow>
            <div className="text-md font-medium">
              {trainerProfile.full_name}
            </div>
            <div className="text-sm text-muted">
              Personal · monta seus treinos
            </div>
          </div>
          <ChevronRightIcon size={18} className="text-muted" />
        </Card>
      )}
    </Screen>
  );
}
