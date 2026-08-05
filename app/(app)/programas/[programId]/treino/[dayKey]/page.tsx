"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { WEEK, restLabel } from "@/lib/format";
import type { DayKey } from "@/lib/db/types";
import { Screen, Header, Card, Stepper, ScreenSkeleton } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/overlays";
import {
  PlusIcon,
  KebabIcon,
  SwapIcon,
  BranchIcon,
  SupersetIcon,
  TrashIcon,
  SearchIcon,
  StopwatchIcon,
  DumbbellIcon,
} from "@/components/icons";

interface Draft {
  key: string;
  exercise_id: string;
  sets_count: number;
  rep_min: number;
  rep_max: number;
  target_kg: number;
  warmup: boolean;
  alt_exercise_id: string | null;
  superset_group: string | null;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function BuilderPage({
  params,
}: {
  params: Promise<{ programId: string; dayKey: string }>;
}) {
  const { programId, dayKey } = use(params);
  const day = WEEK.find((d) => d.k === (dayKey as DayKey));
  const router = useRouter();

  const programs = useAppStore((s) => s.programs);
  const workouts = useAppStore((s) => s.workouts);
  const workoutExercises = useAppStore((s) => s.workoutExercises);
  const exercises = useAppStore((s) => s.exercises);
  const saveWorkout = useAppStore((s) => s.saveWorkout);
  const showToast = useAppStore((s) => s.showToast);

  const program = programs.find((p) => p.id === programId);
  const existingWorkout = workouts.find(
    (w) => w.program_id === programId && w.day_key === dayKey,
  );

  const [name, setName] = useState(
    existingWorkout?.name ?? `Treino de ${day?.label ?? ""}`,
  );
  const [rest, setRest] = useState(
    existingWorkout?.rest_seconds ?? program?.default_rest_seconds ?? 90,
  );
  const [draft, setDraft] = useState<Draft[]>(() => {
    if (!existingWorkout) return [];
    return workoutExercises
      .filter((we) => we.workout_id === existingWorkout.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((we) => ({
        key: we.id,
        exercise_id: we.exercise_id,
        sets_count: we.sets_count,
        rep_min: we.rep_min ?? 8,
        rep_max: we.rep_max ?? 12,
        target_kg: we.target_kg ?? 0,
        warmup: !!we.warmup,
        alt_exercise_id: we.alt_exercise_id ?? null,
        superset_group: we.superset_group ?? null,
      }));
  });

  const [pickerOpen, setPickerOpen] = useState(draft.length === 0);
  const [pickerMode, setPickerMode] = useState<
    "add" | "trocar" | "alternativa" | "superset"
  >("add");
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [kebabTarget, setKebabTarget] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("Todos");

  const muscles = useMemo(() => {
    const set = new Set(exercises.map((e) => e.muscle_group));
    return ["Todos", ...Array.from(set)];
  }, [exercises]);

  if (!program || !day) return <ScreenSkeleton />;

  function exerciseName(id: string) {
    return exercises.find((e) => e.id === id)?.name ?? "";
  }

  function groupLabel(d: Draft) {
    if (!d.superset_group) return null;
    const sameGroup = draft.filter(
      (x) => x.superset_group === d.superset_group,
    );
    const idx = sameGroup.indexOf(d);
    return String.fromCharCode(65 + idx);
  }

  function updateDraft(key: string, patch: Partial<Draft>) {
    setDraft((list) =>
      list.map((d) => (d.key === key ? { ...d, ...patch } : d)),
    );
  }

  function removeDraft(key: string) {
    setDraft((list) => list.filter((d) => d.key !== key));
    showToast("Exercício removido");
  }

  function openPicker(mode: typeof pickerMode, target: string | null) {
    setPickerMode(mode);
    setPickerTarget(target);
    setQuery("");
    setMuscle("Todos");
    setPickerOpen(true);
    setKebabTarget(null);
  }

  function pick(exerciseId: string) {
    if (pickerMode === "add") {
      setDraft((list) => [
        ...list,
        {
          key: uid(),
          exercise_id: exerciseId,
          sets_count: program!.default_sets,
          rep_min: program!.default_rep_min,
          rep_max: program!.default_rep_max,
          target_kg: 0,
          warmup: false,
          alt_exercise_id: null,
          superset_group: null,
        },
      ]);
    } else if (pickerMode === "trocar" && pickerTarget) {
      updateDraft(pickerTarget, {
        exercise_id: exerciseId,
        alt_exercise_id: null,
        superset_group: null,
      });
    } else if (pickerMode === "alternativa" && pickerTarget) {
      updateDraft(pickerTarget, { alt_exercise_id: exerciseId });
    } else if (pickerMode === "superset" && pickerTarget) {
      const target = draft.find((d) => d.key === pickerTarget);
      const group = target?.superset_group ?? `sup-${uid()}`;
      setDraft((list) => [
        ...list.map((d) =>
          d.key === pickerTarget ? { ...d, superset_group: group } : d,
        ),
        {
          key: uid(),
          exercise_id: exerciseId,
          sets_count: target?.sets_count ?? program!.default_sets,
          rep_min: target?.rep_min ?? program!.default_rep_min,
          rep_max: target?.rep_max ?? program!.default_rep_max,
          target_kg: 0,
          warmup: false,
          alt_exercise_id: null,
          superset_group: group,
        },
      ]);
    }
    setPickerOpen(false);
  }

  const filteredExercises = exercises.filter(
    (e) =>
      (muscle === "Todos" || e.muscle_group === muscle) &&
      e.name.toLowerCase().includes(query.toLowerCase()),
  );

  const pickerTitle =
    pickerMode === "add"
      ? "Adicionar exercício"
      : pickerMode === "trocar"
        ? "Trocar exercício"
        : pickerMode === "alternativa"
          ? "Exercício alternativo"
          : "Unir em superset";

  function save() {
    if (draft.length === 0)
      return showToast("Adicione pelo menos um exercício");
    saveWorkout({
      programId,
      dayKey: dayKey as DayKey,
      name: name.trim() || `Treino de ${day?.label ?? ""}`,
      restSeconds: rest,
      exercises: draft.map((d) => ({
        exercise_id: d.exercise_id,
        order_index: 0,
        sets_count: d.sets_count,
        rep_min: d.rep_min,
        rep_max: d.rep_max,
        target_kg: d.target_kg,
        warmup: d.warmup,
        alt_exercise_id: d.alt_exercise_id,
        superset_group: d.superset_group,
      })),
    });
    showToast("Treino salvo · dias sem treino ficam como descanso");
    router.push(`/programas/${programId}`);
  }

  const kebabDraft = draft.find((d) => d.key === kebabTarget);

  return (
    <Screen>
      <Header
        onBack={() => router.push(`/programas/${programId}`)}
        right={
          <button onClick={save} className="text-sm font-semibold text-accent">
            Salvar
          </button>
        }
      />
      <p className="-mt-3 text-sm text-muted">
        {day.label} · {program.name}
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do treino"
        className="w-full bg-transparent text-lg font-semibold outline-none"
      />

      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <StopwatchIcon size={18} className="text-muted" />
          <span className="text-md font-medium">Descanso entre séries</span>
        </div>
        <Stepper
          value={rest}
          onChange={setRest}
          min={15}
          max={300}
          step={15}
          format={restLabel}
        />
      </Card>

      <div className="flex flex-col gap-3">
        {draft.map((d) => {
          const label = groupLabel(d);
          return (
            <Card key={d.key} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {d.superset_group && (
                    <div className="text-2xs font-semibold uppercase text-accent">
                      Superset
                    </div>
                  )}
                  <div className="text-md font-medium truncate">
                    {label ? `${label}. ` : ""}
                    {exerciseName(d.exercise_id)}
                  </div>
                  {!d.superset_group && (
                    <div className="text-sm text-muted">
                      {
                        exercises.find((e) => e.id === d.exercise_id)
                          ?.muscle_group
                      }{" "}
                      · {d.sets_count} séries
                    </div>
                  )}
                  {d.alt_exercise_id && (
                    <div className="flex items-center gap-1.5 text-sm text-muted mt-0.5">
                      <SwapIcon size={12} />
                      Alternativa: {exerciseName(d.alt_exercise_id)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setKebabTarget(d.key)}
                  aria-label="Mais opções"
                  className="shrink-0 rounded-lg p-1 text-muted"
                >
                  <KebabIcon size={18} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Séries</span>
                <Stepper
                  value={d.sets_count}
                  onChange={(v) => updateDraft(d.key, { sets_count: v })}
                  min={1}
                  max={10}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 flex flex-col gap-1">
                  <span className="text-xs text-muted">Reps mín</span>
                  <input
                    inputMode="numeric"
                    value={d.rep_min}
                    onChange={(e) =>
                      updateDraft(d.key, {
                        rep_min:
                          parseInt(e.target.value.replace(/\D/g, "")) || 0,
                      })
                    }
                    className="h-10 rounded-lg border border-border bg-surface px-2.5 text-sm"
                  />
                </label>
                <label className="flex-1 flex flex-col gap-1">
                  <span className="text-xs text-muted">Reps máx</span>
                  <input
                    inputMode="numeric"
                    value={d.rep_max}
                    onChange={(e) =>
                      updateDraft(d.key, {
                        rep_max:
                          parseInt(e.target.value.replace(/\D/g, "")) || 0,
                      })
                    }
                    className="h-10 rounded-lg border border-border bg-surface px-2.5 text-sm"
                  />
                </label>
                <label className="flex-1 flex flex-col gap-1">
                  <span className="text-xs text-muted">Carga (kg)</span>
                  <input
                    inputMode="decimal"
                    value={d.target_kg}
                    onChange={(e) =>
                      updateDraft(d.key, {
                        target_kg:
                          parseFloat(e.target.value.replace(/[^\d.,]/g, "")) ||
                          0,
                      })
                    }
                    className="h-10 rounded-lg border border-border bg-surface px-2.5 text-sm"
                  />
                </label>
              </div>

              <button
                onClick={() => updateDraft(d.key, { warmup: !d.warmup })}
                className="flex items-center gap-2 self-start text-sm font-medium"
                style={{ color: d.warmup ? "var(--warm)" : "var(--muted)" }}
              >
                <PlusIcon size={14} />
                {d.warmup ? "Aquecimento incluído" : "Aquecimento"}
              </button>
            </Card>
          );
        })}
      </div>

      <button
        onClick={() => openPicker("add", null)}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-[17px] border-2 border-dashed border-border text-md font-medium text-muted"
      >
        <PlusIcon size={16} />
        Adicionar exercício
      </button>

      <Sheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={pickerTitle}
      >
        <div className="flex items-center gap-2 rounded-[14px] bg-surface2 px-3 h-11">
          <SearchIcon size={16} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar exercício"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {muscles.map((m) => (
            <button
              key={m}
              onClick={() => setMuscle(m)}
              className="h-8 shrink-0 whitespace-nowrap rounded-lg border px-3 text-sm"
              style={{
                background: muscle === m ? "var(--accent)" : "var(--surface2)",
                borderColor: muscle === m ? "var(--accent)" : "var(--border)",
                color: muscle === m ? "#fff" : "var(--text)",
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
          {filteredExercises.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              Nenhum exercício encontrado.
            </p>
          )}
          {filteredExercises.map((e) => (
            <button
              key={e.id}
              onClick={() => pick(e.id)}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-surface2"
            >
              <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-surface2 text-muted">
                <DumbbellIcon size={16} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{e.name}</div>
                <div className="text-xs text-muted truncate">
                  {e.muscle_group} · {e.equipment}
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => setCustomOpen(true)}
          className="flex h-11.5 w-full items-center justify-center rounded-[14px] border-2 border-dashed border-border text-sm font-medium text-muted"
        >
          Criar meu exercício
        </button>
      </Sheet>

      <CustomExerciseSheet
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        initialName={query}
        onCreated={(id) => {
          pick(id);
          setCustomOpen(false);
        }}
      />

      <Sheet
        open={!!kebabTarget}
        onClose={() => setKebabTarget(null)}
        title={kebabDraft ? exerciseName(kebabDraft.exercise_id) : ""}
      >
        <KebabRow
          icon={<SwapIcon size={16} />}
          label="Trocar exercício"
          onClick={() => openPicker("trocar", kebabTarget)}
        />
        <KebabRow
          icon={<BranchIcon size={16} />}
          label="Adicionar exercício alternativo"
          onClick={() => openPicker("alternativa", kebabTarget)}
        />
        <KebabRow
          icon={<SupersetIcon size={16} />}
          label="Unir em superset"
          onClick={() => openPicker("superset", kebabTarget)}
        />
        <KebabRow
          icon={<TrashIcon size={16} />}
          label="Remover exercício"
          danger
          onClick={() => {
            if (kebabTarget) removeDraft(kebabTarget);
            setKebabTarget(null);
          }}
        />
        <button
          onClick={() => setKebabTarget(null)}
          className="flex h-12.5 w-full items-center justify-center rounded-2xl border border-border text-md font-medium mt-1"
        >
          Cancelar
        </button>
      </Sheet>
    </Screen>
  );
}

function KebabRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-13 w-full items-center gap-3 rounded-lg bg-surface2 px-4 text-left text-md font-medium"
      style={{ color: danger ? "var(--danger)" : "var(--text)" }}
    >
      {icon}
      {label}
    </button>
  );
}

const CUSTOM_MUSCLES = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Core",
];
const CUSTOM_EQUIPMENT = ["Peso corporal", "Halteres", "Polia", "Barra"];

function CustomExerciseSheet({
  open,
  onClose,
  initialName,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  initialName: string;
  onCreated: (id: string) => void;
}) {
  const createExercise = useAppStore((s) => s.createExercise);
  const showToast = useAppStore((s) => s.showToast);
  const [name, setName] = useState(initialName);
  const [muscles, setMuscles] = useState<string[]>([]);
  const [equipment, setEquipment] = useState("Peso corporal");
  const [wasOpen, setWasOpen] = useState(open);

  // Reinicializa o nome quando a sheet abre (ajuste de estado durante o
  // render, evitando um efeito que dispararia setState de forma síncrona).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setName(initialName);
  }

  function submit() {
    if (!name.trim()) return showToast("Dê um nome ao exercício");
    if (muscles.length === 0)
      return showToast("Escolha ao menos um músculo-alvo");
    const exercise = createExercise(name.trim(), muscles, equipment);
    onCreated(exercise.id);
    setName("");
    setMuscles([]);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Novo exercício">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do exercício"
        className="h-13 rounded-lg border border-border bg-surface px-4 text-md outline-none"
      />
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-muted">Músculos-alvo</span>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_MUSCLES.map((m) => (
            <button
              key={m}
              onClick={() =>
                setMuscles((list) =>
                  list.includes(m) ? list.filter((x) => x !== m) : [...list, m],
                )
              }
              className="h-8.5 rounded-[11px] border px-3.5 text-sm font-medium"
              style={{
                background: muscles.includes(m)
                  ? "var(--accent)"
                  : "var(--surface)",
                borderColor: muscles.includes(m)
                  ? "var(--accent)"
                  : "var(--border)",
                color: muscles.includes(m) ? "#fff" : "var(--text)",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-muted">Equipamento</span>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_EQUIPMENT.map((eq) => (
            <button
              key={eq}
              onClick={() => setEquipment(eq)}
              className="h-8.5 rounded-[11px] border px-3.5 text-sm font-medium"
              style={{
                background:
                  equipment === eq ? "var(--accent)" : "var(--surface)",
                borderColor:
                  equipment === eq ? "var(--accent)" : "var(--border)",
                color: equipment === eq ? "#fff" : "var(--text)",
              }}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={submit}
        className="flex h-13.5 w-full items-center justify-center rounded-[17px] bg-accent text-md font-semibold text-white"
      >
        Criar e adicionar
      </button>
    </Sheet>
  );
}
