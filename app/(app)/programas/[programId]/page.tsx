"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useCurrentProfile } from "@/lib/hooks";
import { WEEK, restLabel } from "@/lib/format";
import { startOfWeek } from "@/lib/workout";
import { Screen, Header, Card, ScreenSkeleton } from "@/components/ui/primitives";
import { CheckIcon, PlayIcon } from "@/components/icons";

export default function ProgramDetailPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = use(params);
  const router = useRouter();
  const profile = useCurrentProfile();

  const programs = useAppStore((s) => s.programs);
  const workouts = useAppStore((s) => s.workouts);
  const workoutExercises = useAppStore((s) => s.workoutExercises);
  const sessions = useAppStore((s) => s.sessions);
  const profiles = useAppStore((s) => s.profiles);

  const program = programs.find((p) => p.id === programId);
  if (!profile || !program) return <ScreenSkeleton />;

  const isOwner = program.owner_id === profile.id;
  const owner = profiles.find((p) => p.id === program.owner_id);
  const programWorkouts = workouts.filter((w) => w.program_id === program.id);

  const weekStart = startOfWeek();
  const doneThisWeek = new Set(
    sessions
      .filter((s) => s.status === "completed" && new Date(s.started_at) >= weekStart)
      .map((s) => workouts.find((w) => w.id === s.workout_id)?.day_key)
      .filter(Boolean)
  );

  const badges: string[] = [program.mode === "sync" ? "Síncrono" : "Assíncrono"];
  if (program.sets_by === "program") {
    badges.push(`Todos: ${program.default_sets} × ${program.default_rep_min}–${program.default_rep_max} reps`);
  } else {
    badges.push(program.sets_by === "workout" ? "Séries por treino" : "Séries por exercício");
  }
  if (program.rest_by === "program") {
    badges.push(`Descanso ${program.default_rest_seconds}s`);
  } else {
    badges.push("Descanso por treino");
  }
  badges.push(program.rep_range_enabled ? "Faixa de reps" : "Reps fixas");
  if (program.weekly_progression) badges.push("Progressão semanal");

  return (
    <Screen>
      <Header title={program.name} onBack={() => router.push("/programas")} />
      <p className="-mt-3 text-sm text-muted">
        {isOwner ? "Criado por você" : `Montado por ${owner?.full_name ?? ""}`}
      </p>

      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <span key={b} className="rounded-lg border border-border bg-surface2 px-2.5 py-1 text-xs text-muted">
            {b}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {WEEK.map((day) => {
          const workout = programWorkouts.find((w) => w.day_key === day.k);
          const exerciseCount = workout
            ? workoutExercises.filter((we) => we.workout_id === workout.id).length
            : 0;
          const done = workout ? doneThisWeek.has(day.k) : false;

          return (
            <Card key={day.k} className="flex items-center gap-3">
              <span className="w-9 shrink-0 text-sm font-medium text-muted">{day.short}</span>
              {workout ? (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {done && (
                        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-accent text-white">
                          <CheckIcon size={11} />
                        </span>
                      )}
                      <span className="truncate text-md font-medium">{workout.name}</span>
                    </div>
                    <div className="truncate text-sm text-muted">
                      {exerciseCount} exercícios · {restLabel(workout.rest_seconds)} de descanso
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => router.push(`/programas/${program.id}/treino/${day.k}`)}
                      className="shrink-0 rounded-[14px] border border-border px-3 py-2 text-sm font-medium"
                    >
                      Editar
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/treino/executar/${workout.id}`)}
                    disabled={exerciseCount === 0}
                    className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-ink text-[#fafafa] disabled:opacity-40"
                    aria-label="Iniciar treino"
                  >
                    <PlayIcon size={13} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-muted">Descanso</span>
                  {isOwner && (
                    <button
                      onClick={() => router.push(`/programas/${program.id}/treino/${day.k}`)}
                      className="shrink-0 rounded-[14px] border-2 border-dashed border-border px-3 py-2 text-sm font-medium text-muted"
                    >
                      Criar treino
                    </button>
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
