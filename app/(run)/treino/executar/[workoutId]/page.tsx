"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useCurrentProfile, useStudentDetails } from "@/lib/hooks";
import { clock, restLabel, toDisplayWeight, toKg, type WeightUnit } from "@/lib/format";
import { Modal, ModalButton } from "@/components/ui/overlays";
import { ScreenSkeleton } from "@/components/ui/primitives";
import {
  XIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  TargetIcon,
  VideoIcon,
  RefreshIcon,
} from "@/components/icons";

export default function RunPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = use(params);
  const router = useRouter();
  const profile = useCurrentProfile();
  const student = useStudentDetails(profile?.id);
  const weightUnit = student?.weight_unit ?? "kg";

  const workouts = useAppStore((s) => s.workouts);
  const workoutExercises = useAppStore((s) => s.workoutExercises);
  const exercises = useAppStore((s) => s.exercises);
  const programs = useAppStore((s) => s.programs);
  const activeRun = useAppStore((s) => s.activeRun);
  const startRun = useAppStore((s) => s.startRun);
  const tickRun = useAppStore((s) => s.tickRun);
  const toggleRunPause = useAppStore((s) => s.toggleRunPause);
  const updateSetField = useAppStore((s) => s.updateSetField);
  const toggleSetDone = useAppStore((s) => s.toggleSetDone);
  const addWarmupSet = useAppStore((s) => s.addWarmupSet);
  const addWorkSet = useAppStore((s) => s.addWorkSet);
  const removeRunSet = useAppStore((s) => s.removeRunSet);
  const setRunVariant = useAppStore((s) => s.setRunVariant);
  const pauseRest = useAppStore((s) => s.pauseRest);
  const resumeRest = useAppStore((s) => s.resumeRest);
  const skipRest = useAppStore((s) => s.skipRest);
  const resetRest = useAppStore((s) => s.resetRest);
  const cancelRun = useAppStore((s) => s.cancelRun);
  const finishRun = useAppStore((s) => s.finishRun);
  const showToast = useAppStore((s) => s.showToast);

  const workout = workouts.find((w) => w.id === workoutId);
  const program = workout
    ? programs.find((p) => p.id === workout.program_id)
    : null;
  const wes = useMemo(
    () =>
      workoutExercises
        .filter((we) => we.workout_id === workoutId)
        .sort((a, b) => a.order_index - b.order_index),
    [workoutExercises, workoutId],
  );

  const [cancelOpen, setCancelOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [videoExercise, setVideoExercise] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !workout) return;
    if (!activeRun || activeRun.workoutId !== workoutId) {
      startRun(workoutId, workout.program_id, profile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  useEffect(() => {
    const t = setInterval(() => tickRun(), 1000);
    return () => clearInterval(t);
  }, [tickRun]);

  if (!profile || !workout || !program || !activeRun) return <ScreenSkeleton />;

  const pendingCount = wes.reduce((sum, we) => {
    const sets = activeRun.sets[we.id] ?? [];
    return sum + sets.filter((s) => !s.completed).length;
  }, 0);

  function attemptFinish() {
    if (pendingCount > 0) {
      setPendingOpen(true);
    } else {
      const summary = finishRun("clean");
      if (summary) router.replace("/treino/resumo");
    }
  }

  function finishWith(mode: "markAllDone" | "deletePending") {
    const summary = finishRun(mode);
    setPendingOpen(false);
    if (summary) router.replace("/treino/resumo");
  }

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="fixed left-1/2 top-0 z-30 w-full max-w-107.5 -translate-x-1/2 rounded-b-2xl bg-ink px-3.5 pb-2.5 pt-[calc(env(safe-area-inset-top)+14px)] text-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setCancelOpen(true)}
            aria-label="Cancelar treino"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: "#f87171" }}
          >
            <XIcon size={17} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-sm font-medium">
              {workout.name} · {program.name}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="tabular-nums text-md font-semibold">
              {clock(activeRun.elapsed)}
            </span>
            <button
              onClick={toggleRunPause}
              aria-label={activeRun.running ? "Pausar" : "Retomar"}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "rgba(250,250,250,.12)" }}
            >
              {activeRun.running ? (
                <PauseIcon size={14} />
              ) : (
                <PlayIcon size={14} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-35 pt-21.5">
        {wes.map((we) => (
          <ExerciseRunCard
            key={we.id}
            we={we}
            exerciseName={(id) =>
              exercises.find((e) => e.id === id)?.name ?? ""
            }
            muscleOf={(id) =>
              exercises.find((e) => e.id === id)?.muscle_group ?? ""
            }
            sets={activeRun.sets[we.id] ?? []}
            weightUnit={weightUnit}
            variant={activeRun.variant[we.id] ?? 0}
            onVariant={(v) => setRunVariant(we.id, v)}
            onToggleSet={(idx) =>
              toggleSetDone(we.id, idx, workout.rest_seconds)
            }
            onField={(idx, field, v) => updateSetField(we.id, idx, field, v)}
            onAddWarm={() => addWarmupSet(we.id)}
            onAddWork={() => addWorkSet(we.id)}
            onRemoveSet={(idx) => removeRunSet(we.id, idx)}
            onVideo={() => setVideoExercise(we.exercise_id)}
          />
        ))}

        <button
          onClick={attemptFinish}
          className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-semibold text-white"
        >
          <CheckIcon size={16} />
          Concluir treino
        </button>
      </div>

      {activeRun.restLeft > 0 && (
        <div
          className="anim-ft-up fixed left-1/2 z-40 w-[calc(100%-32px)] max-w-99.5 -translate-x-1/2 rounded-2xl bg-ink px-4 text-[#fafafa] shadow-[0_12px_30px_rgba(0,0,0,.24)]"
          style={{
            bottom: 22,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => resetRest(activeRun.restTotal)}
            aria-label="Reiniciar descanso"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "rgba(250,250,250,.1)" }}
          >
            <RefreshIcon size={15} />
          </button>
          <div className="text-center">
            <div className="text-xs" style={{ color: "rgba(250,250,250,.6)" }}>
              {activeRun.restRunning ? "Descanso" : "Descanso pausado"}
            </div>
            <div className="tabular-nums text-lg font-semibold">
              {restLabel(activeRun.restLeft)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={activeRun.restRunning ? pauseRest : resumeRest}
              aria-label={
                activeRun.restRunning ? "Pausar descanso" : "Retomar descanso"
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white"
            >
              {activeRun.restRunning ? (
                <PauseIcon size={13} />
              ) : (
                <PlayIcon size={13} />
              )}
            </button>
            <button
              onClick={skipRest}
              className="text-sm font-semibold text-accent"
            >
              Pular
            </button>
          </div>
        </div>
      )}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Descartar este treino?"
        body="O tempo e as séries marcadas até agora serão perdidos."
      >
        <div className="flex flex-col gap-2.5">
          <ModalButton kind="ghost" onClick={() => setCancelOpen(false)}>
            Continuar treinando
          </ModalButton>
          <ModalButton
            kind="danger"
            onClick={() => {
              cancelRun();
              showToast("Treino descartado");
              router.replace("/inicio");
            }}
          >
            Descartar treino
          </ModalButton>
        </div>
      </Modal>

      <Modal
        open={pendingOpen}
        onClose={() => setPendingOpen(false)}
        title="Ainda há séries pendentes"
        body={
          pendingCount === 1
            ? "1 série não foi marcada como concluída. O que quer fazer com ela?"
            : `${pendingCount} séries não foram marcadas como concluídas. O que quer fazer com elas?`
        }
      >
        <div className="flex flex-col gap-2.5">
          <ModalButton kind="ghost" onClick={() => setPendingOpen(false)}>
            Voltar ao treino
          </ModalButton>
          <ModalButton kind="primary" onClick={() => finishWith("markAllDone")}>
            Marcar tudo como concluído
          </ModalButton>
          <ModalButton
            kind="danger"
            onClick={() => finishWith("deletePending")}
          >
            Excluir séries pendentes
          </ModalButton>
        </div>
      </Modal>

      <Modal
        open={!!videoExercise}
        onClose={() => setVideoExercise(null)}
        title={
          videoExercise
            ? exercises.find((e) => e.id === videoExercise)?.name
            : ""
        }
      >
        {(() => {
          const mediaUrl = videoExercise
            ? exercises.find((e) => e.id === videoExercise)?.media_url
            : null;
          if (mediaUrl) {
            return (
              <video
                src={mediaUrl}
                controls
                className="h-43 w-full rounded-2xl bg-black object-cover"
              />
            );
          }
          return (
            <div className="flex h-43 w-full flex-col items-center justify-center gap-2 rounded-2xl bg-surface2">
              <VideoIcon size={28} className="text-muted" />
              <span className="text-sm text-muted">
                Vídeo disponível em breve
              </span>
            </div>
          );
        })()}
        <ModalButton kind="ghost" onClick={() => setVideoExercise(null)}>
          Fechar
        </ModalButton>
      </Modal>
    </div>
  );
}

function ExerciseRunCard({
  we,
  exerciseName,
  muscleOf,
  sets,
  weightUnit,
  variant,
  onVariant,
  onToggleSet,
  onField,
  onAddWarm,
  onAddWork,
  onRemoveSet,
  onVideo,
}: {
  we: import("@/lib/db/types").WorkoutExercise;
  exerciseName: (id: string) => string;
  muscleOf: (id: string) => string;
  sets: import("@/lib/store").RunSetState[];
  weightUnit: WeightUnit;
  variant: 0 | 1;
  onVariant: (v: 0 | 1) => void;
  onToggleSet: (idx: number) => void;
  onField: (idx: number, field: "kg" | "reps", value: string) => void;
  onAddWarm: () => void;
  onAddWork: () => void;
  onRemoveSet: (idx: number) => void;
  onVideo: () => void;
}) {
  const hasAlt = !!we.alt_exercise_id;
  const activeName =
    variant === 0
      ? exerciseName(we.exercise_id)
      : exerciseName(we.alt_exercise_id!);
  const activeMuscle =
    variant === 0 ? muscleOf(we.exercise_id) : muscleOf(we.alt_exercise_id!);
  const workCount = sets.filter((s) => s.kind === "work").length;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2 rounded-xl bg-surface2 p-3 -m-1">
        <div className="min-w-0 flex-1">
          {hasAlt && (
            <div className="mb-1.5 flex items-center gap-2 text-2xs font-semibold text-muted">
              <span className="rounded-md bg-accent/12 px-2 py-0.5 text-accent">
                {variant === 0 ? "1/2 principal" : "2/2 alternativa"}
              </span>
              <span>arraste para trocar</span>
            </div>
          )}
          <div className="text-md font-medium truncate">{activeName}</div>
          <div className="text-sm text-muted truncate">
            {activeMuscle} · {variant === 0 ? "principal" : "alternativa"}
          </div>
          {hasAlt && (
            <div className="mt-1.5 flex gap-1.5">
              {[0, 1].map((i) => (
                <button
                  key={i}
                  onClick={() => onVariant(i as 0 | 1)}
                  className="h-1.25 rounded-pill transition-all"
                  style={{
                    width: variant === i ? 20 : 6,
                    background:
                      variant === i ? "var(--accent)" : "var(--border)",
                  }}
                  aria-label={`Variante ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onVideo}
          aria-label="Ver vídeo"
          className="shrink-0 rounded-lg p-1.5 text-muted"
        >
          <VideoIcon size={17} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <TargetIcon size={14} className="text-muted" />
        <span className="text-2xs font-semibold uppercase tracking-wide text-muted">
          Meta
        </span>
        <span className="ml-auto font-medium">
          {workCount} × {we.rep_min}–{we.rep_max} reps
        </span>
      </div>

      <div className="grid grid-cols-[44px_1fr_1fr] gap-2 text-xs text-muted px-1">
        <span>Sér.</span>
        <span>Carga</span>
        <span>Reps</span>
      </div>

      <div className="flex flex-col gap-2">
        {(() => {
          const warmCount = sets.filter((s) => s.kind === "warm").length;
          return sets.reduce<{ st: (typeof sets)[number]; label: string }[]>(
            (acc, st) => {
              if (st.kind === "warm") {
                const warmSoFar = acc.filter((x) =>
                  x.label.startsWith("AQ"),
                ).length;
                const label = warmCount > 1 ? `AQ${warmSoFar + 1}` : "AQ";
                return [...acc, { st, label }];
              }
              const workSoFar = acc.filter(
                (x) => !x.label.startsWith("AQ"),
              ).length;
              return [...acc, { st, label: String(workSoFar + 1) }];
            },
            [],
          );
        })()
          .map(({ st, label }) => {
            return (
              <div
                key={st.setIndex}
                className="grid grid-cols-[44px_1fr_1fr_28px] items-center gap-2"
              >
                <button
                  onClick={() => onToggleSet(st.setIndex)}
                  className="flex h-9.5 w-9.5 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    background: st.completed ? "var(--accent)" : "transparent",
                    color: st.completed ? "#fff" : "var(--text)",
                    boxShadow: st.completed
                      ? undefined
                      : `inset 0 0 0 2px ${st.kind === "warm" ? "var(--warm)" : "var(--border)"}`,
                  }}
                >
                  {st.completed ? <CheckIcon size={15} /> : label}
                </button>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface2 px-2 h-10">
                  <WeightField
                    kg={st.kg}
                    unit={weightUnit}
                    onChangeKg={(v) => onField(st.setIndex, "kg", v)}
                  />
                  <span className="text-xs text-muted">{weightUnit}</span>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface2 px-2 h-10">
                  <input
                    value={st.reps}
                    onChange={(e) =>
                      onField(st.setIndex, "reps", e.target.value)
                    }
                    placeholder={String(st.repMin)}
                    inputMode="numeric"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                  <span className="text-xs text-muted">rep</span>
                </div>
                <button
                  onClick={() => onRemoveSet(st.setIndex)}
                  aria-label="Remover série"
                  className="flex h-6 w-6 items-center justify-center text-muted"
                >
                  <XIcon size={13} />
                </button>
              </div>
            );
          })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onAddWarm}
          className="flex h-11 items-center justify-center rounded-xl border border-border bg-surface2 text-sm font-semibold"
          style={{ color: "var(--warm)" }}
        >
          + Aquecimento
        </button>
        <button
          onClick={onAddWork}
          className="flex h-11 items-center justify-center rounded-xl border border-border bg-surface2 text-sm font-semibold text-accent"
        >
          + Série
        </button>
      </div>
    </div>
  );
}

/**
 * Campo de carga da série. `kg` é sempre a fonte da verdade (o que vira
 * `session_sets.kg_done`); aqui só a exibição/entrada é convertida para a
 * unidade escolhida pelo usuário. Mantemos um texto local em vez de derivar
 * a exibição de `kg` a cada render — reformatar a cada tecla (arredondar,
 * trocar vírgula por ponto) atrapalharia digitar decimais em lb.
 */
function WeightField({
  kg,
  unit,
  onChangeKg,
}: {
  kg: string;
  unit: WeightUnit;
  onChangeKg: (kgValue: string) => void;
}) {
  const [text, setText] = useState(() =>
    unit === "kg"
      ? kg
      : String(Math.round(toDisplayWeight(parseFloat(kg.replace(",", ".")) || 0, unit) * 10) / 10),
  );

  return (
    <input
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.,]/g, "");
        setText(raw);
        if (unit === "kg") {
          onChangeKg(raw);
          return;
        }
        const num = parseFloat(raw.replace(",", ".")) || 0;
        onChangeKg(String(toKg(num, unit)));
      }}
      inputMode="decimal"
      className="w-full bg-transparent text-sm outline-none"
    />
  );
}
