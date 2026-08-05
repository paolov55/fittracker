"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import type { BodyMetric } from "@/lib/db/types";
import { formatWeight, toDisplayWeight, toKg, type WeightUnit } from "@/lib/format";
import {
  Card,
  Eyebrow,
  ProgressBar,
  EmptyDashed,
  PrimaryButton,
  TextField,
} from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlays";
import { PlusIcon } from "@/components/icons";

/**
 * Antes deste card, nada no app inseria em `body_metrics` — o card "Peso
 * corporal" da home só aparecia se essa tabela já tivesse dado por outro
 * caminho (nenhum existia), então na prática nunca renderizava. Agora ele
 * sempre aparece para o aluno: vazio com CTA, ou com o progresso real.
 */
export function BodyWeightCard({
  metrics,
  goalWeightKg,
  weightUnit,
}: {
  /** Ordenado por `recorded_at` crescente. */
  metrics: BodyMetric[];
  goalWeightKg: number | null;
  weightUnit: WeightUnit;
}) {
  const addBodyMetric = useAppStore((s) => s.addBodyMetric);
  const showToast = useAppStore((s) => s.showToast);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const latest = metrics[metrics.length - 1];
  const first = metrics[0];

  async function save() {
    const entered = Number(input.replace(",", "."));
    if (!entered || entered <= 0) {
      showToast("Informe um peso válido");
      return;
    }
    setSaving(true);
    const res = await addBodyMetric(toKg(entered, weightUnit));
    setSaving(false);
    if (!res.ok) {
      showToast(res.message ?? "Não foi possível registrar");
      return;
    }
    setOpen(false);
    setInput("");
    showToast("Peso registrado");
  }

  const modal = (
    <Modal open={open} onClose={() => setOpen(false)} title="Registrar peso">
      <TextField
        label={`Peso (${weightUnit})`}
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/[^\d.,]/g, ""))}
        inputMode="decimal"
        placeholder="0.0"
        autoFocus
      />
      <PrimaryButton onClick={save} disabled={saving}>
        {saving ? "Salvando…" : "Salvar"}
      </PrimaryButton>
    </Modal>
  );

  if (!latest) {
    return (
      <Card className="flex flex-col gap-3">
        <Eyebrow>Peso corporal</Eyebrow>
        <EmptyDashed>
          <span className="text-md font-medium">Registre seu peso</span>
          <span className="text-sm text-muted">
            Acompanhe sua evolução ao longo do tempo.
          </span>
        </EmptyDashed>
        <button
          onClick={() => setOpen(true)}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold"
        >
          <PlusIcon size={14} />
          Registrar peso
        </button>
        {modal}
      </Card>
    );
  }

  const displayValue = toDisplayWeight(latest.weight_kg, weightUnit).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const progress =
    goalWeightKg && first
      ? Math.min(
          100,
          Math.max(
            0,
            ((first.weight_kg - latest.weight_kg) / (first.weight_kg - goalWeightKg || 1)) * 100,
          ),
        )
      : 0;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Eyebrow>Peso corporal</Eyebrow>
        <div className="flex items-center gap-2">
          {goalWeightKg ? (
            <span className="text-sm text-muted">
              Meta {formatWeight(goalWeightKg, weightUnit)}
            </span>
          ) : (
            <Link href="/perfil" className="text-sm font-medium text-accent">
              Definir meta
            </Link>
          )}
          <button
            onClick={() => {
              setInput("");
              setOpen(true);
            }}
            aria-label="Registrar peso"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface2"
          >
            <PlusIcon size={13} />
          </button>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold tabular-nums">{displayValue}</span>
        <span className="text-sm text-muted">{weightUnit}</span>
      </div>
      {goalWeightKg !== null && <ProgressBar value={progress} />}
      <span className="text-sm text-muted">
        {formatWeight(latest.weight_kg - first.weight_kg, weightUnit)} desde o início
        {goalWeightKg !== null &&
          ` · faltam ${formatWeight(Math.abs(latest.weight_kg - goalWeightKg), weightUnit)}`}
      </span>
      {modal}
    </Card>
  );
}
