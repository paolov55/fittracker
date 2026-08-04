"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { clock, formatKg } from "@/lib/format";
import { CheckIcon } from "@/components/icons";
import { InkButton } from "@/components/ui/primitives";

export default function ResumoPage() {
  const router = useRouter();
  const summary = useAppStore((s) => s.lastSummary);
  const clearSummary = useAppStore((s) => s.clearSummary);

  useEffect(() => {
    if (!summary) router.replace("/inicio");
  }, [summary, router]);

  if (!summary) return null;

  const rows: [string, string][] = [
    ["Duração", clock(summary.duration)],
    ["Séries concluídas", String(summary.setsCompleted)],
    ["Volume total", `${formatKg(summary.volume)} kg`],
    ["Programa", summary.programName],
  ];

  return (
    <div className="anim-ft-up-slow flex flex-col gap-6 px-5 pt-14 pb-10">
      <div className="flex h-[62px] w-[62px] items-center justify-center rounded-2xl bg-accent text-white">
        <CheckIcon size={28} />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold">Treino concluído</h1>
        <p className="text-base text-muted">{summary.workoutName} · progresso salvo</p>
      </div>

      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface overflow-hidden">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-muted">{label}</span>
            <span className="text-sm font-semibold tabular-nums">{value}</span>
          </div>
        ))}
      </div>

      <InkButton
        onClick={() => {
          clearSummary();
          router.replace("/inicio");
        }}
      >
        Voltar ao início
      </InkButton>
    </div>
  );
}
