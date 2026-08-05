"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useCurrentProfile, useRole } from "@/lib/hooks";
import { firstName, MONTHS } from "@/lib/format";
import {
  Screen,
  Header,
  Card,
  Chip,
  PrimaryButton,
  TextField,
  Stepper,
  Toggle,
  ScreenSkeleton,
} from "@/components/ui/primitives";
import { CalendarIcon, ListIcon } from "@/components/icons";

type Scope = "program" | "workout" | "exercise";

const SCOPE_LABEL: Record<Scope, string> = {
  program: "Programa",
  workout: "Treino",
  exercise: "Exercício",
};
const SCOPES: Scope[] = ["program", "workout", "exercise"];

function WizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("aluno");

  const profile = useCurrentProfile();
  const role = useRole();
  const createProgram = useAppStore((s) => s.createProgram);
  const showToast = useAppStore((s) => s.showToast);
  const trainerStudents = useAppStore((s) => s.trainerStudents);
  const profiles = useAppStore((s) => s.profiles);

  const myStudents = useMemo(
    () =>
      trainerStudents
        .filter((ts) => ts.trainer_id === profile?.id && ts.status === "active")
        .map((ts) => profiles.find((p) => p.id === ts.student_id))
        .filter((p): p is NonNullable<typeof p> => !!p),
    [trainerStudents, profiles, profile?.id],
  );

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("Hipertrofia");
  const [mode, setMode] = useState<"sync" | "async">("sync");
  const [setsBy, setSetsBy] = useState<Scope>("exercise");
  const [restBy, setRestBy] = useState<Scope>("workout");
  const [repRange, setRepRange] = useState(true);
  const [weekly, setWeekly] = useState(false);
  const [sets, setSets] = useState(3);
  const [repMin, setRepMin] = useState(8);
  const [repMax, setRepMax] = useState(12);
  const [rest, setRest] = useState(90);
  const [forStudentId, setForStudentId] = useState<string | null>(preselected);
  const [liveWhen, setLiveWhen] = useState<"now" | "monday" | "date">("now");
  const [liveDate, setLiveDate] = useState("");

  const forStudent = myStudents.find((s) => s.id === forStudentId) ?? null;

  const stepLabel = forStudent
    ? `Novo programa para ${firstName(forStudent.full_name)} · passo ${step} de 3`
    : `Novo programa · passo ${step} de 3`;

  function back() {
    if (step === 1) return router.back();
    setStep((s) => s - 1);
  }

  function next() {
    if (step === 1 && !name.trim()) return showToast("Dê um nome ao programa");
    if (step < 3) return setStep((s) => s + 1);
    submit();
  }

  function nextMonday() {
    const d = new Date();
    const add = (8 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + add);
    return d;
  }

  function submit() {
    if (!profile) return;
    let liveAt: string | null = null;
    if (forStudent) {
      if (liveWhen === "now") liveAt = new Date().toISOString();
      else if (liveWhen === "monday") liveAt = nextMonday().toISOString();
      else {
        if (!liveDate) return showToast("Escolha a data de liberação");
        liveAt = new Date(liveDate).toISOString();
      }
    }

    const program = createProgram({
      ownerId: profile.id,
      name: name.trim(),
      goal,
      mode,
      setsBy,
      restBy,
      repRangeEnabled: repRange,
      weeklyProgression: weekly,
      defaultSets: sets,
      defaultRepMin: repMin,
      defaultRepMax: repMax,
      defaultRestSeconds: rest,
      forStudentId: forStudent?.id ?? null,
      liveAt,
    });

    if (forStudent) {
      if (liveWhen === "now")
        showToast(
          `Programa criado e liberado para ${firstName(forStudent.full_name)}`,
        );
      else
        showToast(
          `Programa agendado para ${firstName(forStudent.full_name)} · ${liveDate || "próxima segunda"}`,
        );
    } else {
      showToast("Programa criado · monte o treino de cada dia");
    }
    router.push(`/programas/${program.id}`);
  }

  const ctaLabel =
    step < 3
      ? "Continuar"
      : forStudent
        ? liveWhen === "now"
          ? "Criar e liberar"
          : "Criar e agendar"
        : "Criar programa";

  return (
    <Screen>
      <Header title={undefined} onBack={back} />
      <p className="-mt-2 text-sm text-muted">{stepLabel}</p>
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-1.5 flex-1 rounded-pill"
            style={{
              background: n <= step ? "var(--accent)" : "var(--border)",
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold">
              Como vai chamar seu programa?
            </h1>
            <p className="text-base text-muted">Você pode mudar depois.</p>
          </div>
          <TextField
            placeholder="Ex: Upper/Lower 4x"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted px-1">
              Objetivo
            </span>
            <div className="flex flex-wrap gap-2">
              {["Hipertrofia", "Força", "Resistência"].map((g) => (
                <Chip key={g} active={goal === g} onClick={() => setGoal(g)}>
                  {g}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold">
              Como quer organizar os treinos?
            </h1>
            <p className="text-base text-muted">
              Isso define como o app te cobra os treinos.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode("sync")}
              className="flex items-start gap-3 rounded-xl border-2 p-4 text-left"
              style={{
                borderColor:
                  mode === "sync" ? "var(--accent)" : "var(--border)",
              }}
            >
              <CalendarIcon size={20} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <div className="text-md font-medium">Síncrono</div>
                <div className="text-sm text-muted">
                  Cada dia da semana tem um treino fixo. Segunda o A, terça o B,
                  quarta descanso.
                </div>
              </div>
            </button>
            <button
              onClick={() => setMode("async")}
              className="flex items-start gap-3 rounded-xl border-2 p-4 text-left"
              style={{
                borderColor:
                  mode === "async" ? "var(--accent)" : "var(--border)",
              }}
            >
              <ListIcon size={20} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <div className="text-md font-medium">Assíncrono</div>
                <div className="text-sm text-muted">
                  Treinos em sequência (A, B, C…). Você treina quando puder e o
                  app avança a fila.
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold">
              Configurações do programa
            </h1>
            <p className="text-base text-muted">
              Onde cada valor é definido. Dá para trocar depois.
            </p>
          </div>

          <Card className="flex flex-col gap-3">
            <span className="text-md font-medium">
              Séries e repetições definidas por
            </span>
            <SegmentedControl value={setsBy} onChange={setSetsBy} />
            {setsBy === "program" && (
              <div className="anim-ft-up flex flex-col gap-3 border-t border-border pt-3">
                <p className="text-sm text-muted">
                  Vale para todos os exercícios do programa
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Séries por exercício</span>
                  <Stepper value={sets} onChange={setSets} min={1} max={10} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Repetições</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={repMin}
                      onChange={(e) =>
                        setRepMin(
                          parseInt(e.target.value.replace(/\D/g, "")) || 0,
                        )
                      }
                      className="h-9 w-12 rounded-md border border-border bg-surface text-center text-sm"
                    />
                    <span className="text-sm text-muted">–</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={repMax}
                      onChange={(e) =>
                        setRepMax(
                          parseInt(e.target.value.replace(/\D/g, "")) || 0,
                        )
                      }
                      className="h-9 w-12 rounded-md border border-border bg-surface text-center text-sm"
                    />
                    <span className="text-sm text-muted">reps</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <span className="text-md font-medium">Descanso definido por</span>
            <SegmentedControl value={restBy} onChange={setRestBy} />
            {restBy === "program" && (
              <div className="anim-ft-up flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm">Descanso entre séries</span>
                <Stepper
                  value={rest}
                  onChange={setRest}
                  min={15}
                  max={300}
                  step={15}
                  format={(v) => `${v}s`}
                />
              </div>
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <Row
              label="Faixa de repetições mín–máx"
              sub="Ex: 8 a 10 reps por série"
              on={repRange}
              onClick={() => setRepRange((v) => !v)}
            />
            <div className="h-px bg-border" />
            <Row
              label="Progressão por semana"
              sub="Usar faixa de repetições diferentes por semana"
              on={weekly}
              onClick={() => setWeekly((v) => !v)}
            />
          </Card>

          {role === "trainer" && myStudents.length > 0 && (
            <Card className="flex flex-col gap-3">
              <span className="text-md font-medium">Para qual aluno?</span>
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={!forStudentId}
                  onClick={() => setForStudentId(null)}
                >
                  Para mim
                </Chip>
                {myStudents.map((s) => (
                  <Chip
                    key={s.id}
                    active={forStudentId === s.id}
                    onClick={() => setForStudentId(s.id)}
                  >
                    {firstName(s.full_name)}
                  </Chip>
                ))}
              </div>

              {forStudent && (
                <div className="anim-ft-up flex flex-col gap-3 border-t border-border pt-3">
                  <span className="text-md font-medium">
                    Quando liberar para {firstName(forStudent.full_name)}?
                  </span>
                  <p className="text-sm text-muted">
                    O aluno só vê o programa a partir da data escolhida.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      active={liveWhen === "now"}
                      onClick={() => setLiveWhen("now")}
                    >
                      Assim que salvar
                    </Chip>
                    <Chip
                      active={liveWhen === "monday"}
                      onClick={() => setLiveWhen("monday")}
                    >
                      Próxima segunda
                    </Chip>
                    <Chip
                      active={liveWhen === "date"}
                      onClick={() => setLiveWhen("date")}
                    >
                      Escolher data
                    </Chip>
                  </div>
                  {liveWhen === "date" && (
                    <input
                      type="date"
                      value={liveDate}
                      onChange={(e) => setLiveDate(e.target.value)}
                      className="h-11 rounded-[14px] border border-border bg-surface px-3 text-sm"
                    />
                  )}
                  <p className="text-sm text-muted">
                    {liveWhen === "now" &&
                      `${firstName(forStudent.full_name)} recebe o programa assim que você criar. Os treinos podem ser montados depois.`}
                    {liveWhen === "monday" &&
                      `Fica visível para ${firstName(forStudent.full_name)} em ${nextMonday().getDate()} de ${MONTHS[nextMonday().getMonth()]}. Até lá o programa segue como rascunho seu.`}
                    {liveWhen === "date" &&
                      (liveDate
                        ? `Fica visível para ${firstName(forStudent.full_name)} em ${new Date(liveDate).getDate()} de ${MONTHS[new Date(liveDate).getMonth()]}. Até lá o programa segue como rascunho seu.`
                        : `Escolha a data em que o programa fica visível para ${firstName(forStudent.full_name)}.`)}
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      <PrimaryButton onClick={next} className="mt-2">
        {ctaLabel}
      </PrimaryButton>
    </Screen>
  );
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: Scope;
  onChange: (v: Scope) => void;
}) {
  return (
    <div className="flex rounded-[12px] bg-surface2 p-1">
      {SCOPES.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="flex-1 rounded-[9px] py-1.5 text-sm font-medium"
          style={{
            background: value === s ? "var(--surface)" : "transparent",
            color: value === s ? "var(--text)" : "var(--muted)",
            boxShadow: value === s ? "0 1px 3px rgba(0,0,0,.08)" : undefined,
          }}
        >
          {SCOPE_LABEL[s]}
        </button>
      ))}
    </div>
  );
}

function Row({
  label,
  sub,
  on,
  onClick,
}: {
  label: string;
  sub: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted">{sub}</div>
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}

export default function WizardPage() {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <WizardInner />
    </Suspense>
  );
}
