"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useCurrentProfile } from "@/lib/hooks";
import {
  firstName,
  formatWeight,
  formatHeight,
  toKg,
  toCm,
  toDisplayWeight,
  toDisplayHeight,
  type WeightUnit,
  type HeightUnit,
} from "@/lib/format";
import { ChevronLeftIcon, CheckIcon } from "@/components/icons";
import { Chip, PrimaryButton, TextField, Segmented } from "@/components/ui/primitives";

type Goal = "gain_muscle" | "lose_weight" | "maintain" | "endurance";
type Exp = "beginner" | "intermediate" | "advanced";
type ExpId = "never" | "lt1y" | "1to3y" | "gt3y";

const GOAL_OPTIONS: { value: Goal; label: string; sub: string }[] = [
  {
    value: "gain_muscle",
    label: "Ganhar massa muscular",
    sub: "Foco em volume e hipertrofia",
  },
  {
    value: "lose_weight",
    label: "Perder peso",
    sub: "Gasto calórico com preservação de massa",
  },
  {
    value: "maintain",
    label: "Ganhar força",
    sub: "Cargas altas, menos repetições",
  },
  {
    value: "endurance",
    label: "Manter a forma",
    sub: "Rotina consistente e equilibrada",
  },
];

// Ids distintos por opção — evita que duas respostas com o mesmo nível
// (ex: "beginner") acendam ambas ao mesmo tempo. O nível salvo vem de
// EXP_TO_LEVEL.
const EXP_OPTIONS: { value: ExpId; label: string }[] = [
  { value: "never", label: "Nunca treinei" },
  { value: "lt1y", label: "Menos de 1 ano" },
  { value: "1to3y", label: "De 1 a 3 anos" },
  { value: "gt3y", label: "Mais de 3 anos" },
];

const EXP_TO_LEVEL: Record<ExpId, Exp> = {
  never: "beginner",
  lt1y: "beginner",
  "1to3y": "intermediate",
  gt3y: "advanced",
};

const EQUIP_OPTIONS = [
  "Academia completa",
  "Halteres",
  "Barra",
  "Polia",
  "Elásticos",
  "Nenhum equipamento",
];
const LIMIT_OPTIONS = [
  "Nenhuma",
  "Ombro",
  "Lombar",
  "Joelho",
  "Punho",
  "Cervical",
];

interface Answers {
  goal: Goal | null;
  exp: ExpId | null;
  weightUnit: WeightUnit;
  weight: string;
  goalWeight: string;
  heightUnit: HeightUnit;
  height: string;
  heightFeet: string;
  heightInches: string;
  equip: string[];
  limits: string[];
  isTrainer: boolean | null;
  cref: string;
}

const TOTAL_STEPS = 7;

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function fmtInput(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export default function OnboardingPage() {
  const router = useRouter();
  const profile = useCurrentProfile();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const showToast = useAppStore((s) => s.showToast);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answers>({
    goal: null,
    exp: null,
    weightUnit: "kg",
    weight: "70",
    goalWeight: "65",
    heightUnit: "cm",
    height: "168",
    heightFeet: "5",
    heightInches: "6",
    equip: [],
    limits: [],
    isTrainer: null,
    cref: "",
  });

  const crefDigits = answers.cref.replace(/\D/g, "").length;

  useEffect(() => {
    if (crefDigits < 6) return;
    const t = setTimeout(() => setVerifiedAt(crefDigits), 1300);
    return () => clearTimeout(t);
  }, [crefDigits]);

  const effectiveCrefState =
    crefDigits < 6 ? "idle" : verifiedAt === crefDigits ? "ok" : "checking";

  const pct = ((step + (done ? 1 : 0)) / TOTAL_STEPS) * 100;

  // Valores finais, sempre em kg/cm — usados tanto no envio quanto no resumo.
  const weightKg = toKg(parseNum(answers.weight) ?? toDisplayWeight(70, answers.weightUnit), answers.weightUnit);
  const goalWeightKg = toKg(parseNum(answers.goalWeight) ?? toDisplayWeight(65, answers.weightUnit), answers.weightUnit);
  const heightCm =
    answers.heightUnit === "cm"
      ? parseNum(answers.height) ?? 168
      : toCm((parseNum(answers.heightFeet) ?? 5) * 12 + (parseNum(answers.heightInches) ?? 6), "ft");

  function toggleMulti(key: "equip" | "limits", value: string) {
    setAnswers((a) => {
      const list = a[key];
      const has = list.includes(value);
      return {
        ...a,
        [key]: has ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  function setWeightUnit(unit: WeightUnit) {
    setAnswers((a) => {
      if (unit === a.weightUnit) return a;
      const wKg = toKg(parseNum(a.weight) ?? 70, a.weightUnit);
      const gKg = toKg(parseNum(a.goalWeight) ?? 65, a.weightUnit);
      return {
        ...a,
        weightUnit: unit,
        weight: fmtInput(toDisplayWeight(wKg, unit)),
        goalWeight: fmtInput(toDisplayWeight(gKg, unit)),
      };
    });
  }

  function setHeightUnit(unit: HeightUnit) {
    setAnswers((a) => {
      if (unit === a.heightUnit) return a;
      if (unit === "ft") {
        const cm = parseNum(a.height) ?? 168;
        const totalIn = toDisplayHeight(cm, "ft");
        return {
          ...a,
          heightUnit: unit,
          heightFeet: String(Math.floor(totalIn / 12)),
          heightInches: String(Math.round(totalIn % 12)),
        };
      }
      const totalIn = (parseNum(a.heightFeet) ?? 5) * 12 + (parseNum(a.heightInches) ?? 6);
      return { ...a, heightUnit: unit, height: String(Math.round(toCm(totalIn, "ft"))) };
    });
  }

  function back() {
    if (step === 0) return router.push("/cadastro");
    setStep((s) => s - 1);
  }

  function next() {
    if (step === 0 && !answers.goal)
      return showToast("Responda para continuar");
    if (step === 1 && !answers.exp) return showToast("Responda para continuar");
    if (step === 6) {
      if (answers.isTrainer === null)
        return showToast("Responda para continuar");
      if (answers.isTrainer && effectiveCrefState !== "ok")
        return showToast("Informe um CREF válido para continuar");
      finish();
      return;
    }
    setStep((s) => s + 1);
  }

  function finish() {
    completeOnboarding({
      goal: answers.goal,
      experience_level: answers.exp ? EXP_TO_LEVEL[answers.exp] : null,
      weight_kg: weightKg,
      goal_weight_kg: goalWeightKg,
      height_cm: heightCm,
      weight_unit: answers.weightUnit,
      height_unit: answers.heightUnit,
      equipment: answers.equip,
      limitations: answers.limits,
      isTrainer: !!answers.isTrainer,
      cref: answers.cref,
    });
    setDone(true);
  }

  function exit() {
    if (answers.isTrainer) {
      showToast("CREF verificado · você já pode montar treinos");
      router.push("/alunos");
    } else {
      showToast("Perfil salvo · escolha seu primeiro programa");
      router.push("/programas");
    }
  }

  if (done) {
    const equipText = answers.equip.length
      ? answers.equip.join(", ")
      : "A definir";
    return (
      <div className="anim-ft-up-slow flex flex-col gap-6 px-6 pt-10 pb-10">
        <div className="flex h-15.5 w-15.5 items-center justify-center rounded-2xl bg-accent text-white">
          <CheckIcon size={28} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-semibold">
            Tudo pronto, {firstName(profile?.full_name ?? "")}
          </h1>
          <p className="text-base text-muted">
            {answers.isTrainer
              ? "Seu CREF foi verificado. Você já pode montar seus treinos e adicionar alunos à sua equipe."
              : "Agora escolha um programa da comunidade ou monte o seu do zero."}
          </p>
        </div>

        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface overflow-hidden">
          {[
            [
              "Objetivo",
              GOAL_OPTIONS.find((g) => g.value === answers.goal)?.label ?? "—",
            ],
            [
              "Experiência",
              EXP_OPTIONS.find((e) => e.value === answers.exp)?.label ?? "—",
            ],
            [
              "Peso",
              `${formatWeight(weightKg, answers.weightUnit)} → ${formatWeight(goalWeightKg, answers.weightUnit)}`,
            ],
            ["Altura", formatHeight(heightCm, answers.heightUnit)],
            ["Equipamento", equipText],
            [
              "Perfil",
              answers.isTrainer ? `Personal · CREF ${answers.cref}` : "Aluno",
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3.5"
            >
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>

        <PrimaryButton onClick={exit}>
          {answers.isTrainer ? "Começar" : "Escolher meu programa"}
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="anim-ft-fade flex flex-col gap-6 px-6 pt-3.5 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={back}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-surface border border-border"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <div className="h-1.25 flex-1 rounded-pill bg-border overflow-hidden">
            <div
              className="h-full rounded-pill bg-accent transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-sm text-muted tabular-nums">
            {step + 1}/{TOTAL_STEPS}
          </span>
        </div>
      </div>

      {step === 0 && (
        <StepOptions
          title="Qual seu objetivo principal?"
          sub="Usamos isso para sugerir programas e faixas de repetição."
          options={GOAL_OPTIONS}
          value={answers.goal}
          onChange={(v) => setAnswers((a) => ({ ...a, goal: v as Goal }))}
        />
      )}

      {step === 1 && (
        <StepOptions
          title="Há quanto tempo você treina?"
          sub="Isso define o ponto de partida das cargas."
          options={EXP_OPTIONS}
          value={answers.exp}
          onChange={(v) => setAnswers((a) => ({ ...a, exp: v as ExpId }))}
        />
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <StepHeader
            title="Peso atual e meta"
            sub="Você acompanha essa evolução na tela inicial."
            right={
              <Segmented
                options={[
                  { value: "kg", label: "kg" },
                  { value: "lb", label: "lb" },
                ]}
                value={answers.weightUnit}
                onChange={setWeightUnit}
              />
            }
          />
          <div className="flex gap-3">
            <TextField
              label={`Peso atual (${answers.weightUnit})`}
              inputMode="decimal"
              value={answers.weight}
              onChange={(e) =>
                setAnswers((a) => ({
                  ...a,
                  weight: e.target.value.replace(/[^\d.,]/g, ""),
                }))
              }
            />
            <TextField
              label={`Meta (${answers.weightUnit})`}
              inputMode="decimal"
              value={answers.goalWeight}
              onChange={(e) =>
                setAnswers((a) => ({
                  ...a,
                  goalWeight: e.target.value.replace(/[^\d.,]/g, ""),
                }))
              }
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <StepHeader
            title="Qual sua altura?"
            sub="Serve para calcular indicadores de composição."
            right={
              <Segmented
                options={[
                  { value: "cm", label: "cm" },
                  { value: "ft", label: "ft" },
                ]}
                value={answers.heightUnit}
                onChange={setHeightUnit}
              />
            }
          />
          {answers.heightUnit === "cm" ? (
            <TextField
              label="Altura (cm)"
              inputMode="decimal"
              value={answers.height}
              onChange={(e) =>
                setAnswers((a) => ({
                  ...a,
                  height: e.target.value.replace(/[^\d.,]/g, ""),
                }))
              }
            />
          ) : (
            <div className="flex gap-3">
              <TextField
                label="Pés"
                inputMode="numeric"
                value={answers.heightFeet}
                onChange={(e) =>
                  setAnswers((a) => ({
                    ...a,
                    heightFeet: e.target.value.replace(/\D/g, ""),
                  }))
                }
              />
              <TextField
                label="Polegadas"
                inputMode="numeric"
                value={answers.heightInches}
                onChange={(e) =>
                  setAnswers((a) => ({
                    ...a,
                    heightInches: e.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-5">
          <StepHeader
            title="O que você tem disponível?"
            sub="Marque tudo que costuma usar. Filtramos os exercícios por isso."
          />
          <div className="flex flex-wrap gap-2">
            {EQUIP_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                active={answers.equip.includes(opt)}
                onClick={() => toggleMulti("equip", opt)}
              >
                {opt}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-5">
          <StepHeader
            title="Alguma lesão ou restrição?"
            sub="Evitamos sugerir exercícios que agravem a região."
          />
          <div className="flex flex-wrap gap-2">
            {LIMIT_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                active={answers.limits.includes(opt)}
                onClick={() => toggleMulti("limits", opt)}
              >
                {opt}
              </Chip>
            ))}
          </div>
          <button
            onClick={next}
            className="self-start text-sm font-semibold text-muted"
          >
            Pular esta pergunta
          </button>
        </div>
      )}

      {step === 6 && (
        <div className="flex flex-col gap-5">
          <StepHeader
            title="Você é personal trainer?"
            sub="Treinadores montam treinos para alunos depois da verificação do CREF."
          />
          <div className="flex flex-col gap-3">
            {[
              {
                value: false,
                label: "Não, treino só para mim",
                sub: undefined,
              },
              {
                value: true,
                label: "Sim, sou personal",
                sub: "Vamos pedir seu CREF em seguida",
              },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() =>
                  setAnswers((a) => ({ ...a, isTrainer: opt.value }))
                }
                className="rounded-xl border-2 px-4 py-3.5 text-left transition-colors"
                style={{
                  borderColor:
                    answers.isTrainer === opt.value
                      ? "var(--accent)"
                      : "var(--border)",
                  background: "var(--surface)",
                }}
              >
                <div className="text-md font-medium">{opt.label}</div>
                {opt.sub && <div className="text-sm text-muted">{opt.sub}</div>}
              </button>
            ))}
          </div>

          {answers.isTrainer && (
            <div className="anim-ft-up flex flex-col gap-2 rounded-2xl border border-border bg-surface2 p-4">
              <span className="text-xs font-semibold text-muted">
                Número do CREF
              </span>
              <input
                value={answers.cref}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, cref: e.target.value }))
                }
                placeholder="000000-G/SP"
                style={{ letterSpacing: ".04em" }}
                className="h-13 rounded-lg border border-border bg-surface px-4 text-md outline-none focus:border-accent"
              />
              {effectiveCrefState === "idle" && (
                <p className="text-sm text-muted">
                  O gerenciamento de treinos para alunos será liberado após
                  verificação das informações enviadas.
                </p>
              )}
              {effectiveCrefState === "checking" && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span className="anim-ft-spin h-3.5 w-3.5 rounded-full border-2 border-border border-t-accent" />
                  Verificando no conselho regional…
                </div>
              )}
              {effectiveCrefState === "ok" && (
                <div className="flex items-center gap-2 text-sm font-medium text-accent">
                  <CheckIcon size={14} />
                  CREF válido e ativo
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <PrimaryButton onClick={next} className="mt-2">
        {step === 6 ? "Concluir" : "Continuar"}
      </PrimaryButton>
    </div>
  );
}

function StepHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-base text-muted">{sub}</p>
      </div>
      {right && <div className="mt-1 shrink-0">{right}</div>}
    </div>
  );
}

function StepOptions({
  title,
  sub,
  options,
  value,
  onChange,
}: {
  title: string;
  sub: string;
  options: { value: string; label: string; sub?: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <StepHeader title={title} sub={sub} />
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="rounded-xl border-2 px-4 py-3.5 text-left transition-colors"
            style={{
              borderColor:
                value === opt.value ? "var(--accent)" : "var(--border)",
              background: "var(--surface)",
            }}
          >
            <div className="text-md font-medium">{opt.label}</div>
            {opt.sub && <div className="text-sm text-muted">{opt.sub}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
