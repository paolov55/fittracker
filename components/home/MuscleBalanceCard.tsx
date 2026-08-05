"use client";

import type { MuscleGroupVolume } from "@/lib/stats";
import { Card, Eyebrow, ProgressBar } from "@/components/ui/primitives";

/**
 * Única tela do app que dá um sinal acionável (grupo atrasado) em vez de só
 * um número — só renderiza com amostra mínima (gating de ≥3 sessões em 30
 * dias fica a cargo de quem chama, na home).
 */
export function MuscleBalanceCard({ balance }: { balance: MuscleGroupVolume[] }) {
  if (balance.length === 0) return null;
  const top = balance.slice(0, 5);
  const stalest = [...balance].sort(
    (a, b) => (b.daysSinceLast ?? 0) - (a.daysSinceLast ?? 0),
  )[0];

  return (
    <Card className="flex flex-col gap-3">
      <Eyebrow>Equilíbrio muscular</Eyebrow>
      <div className="flex flex-col gap-2.5">
        {top.map((g) => (
          <div key={g.group} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{g.group}</span>
              <span className="text-muted">{Math.round(g.percent)}%</span>
            </div>
            <ProgressBar value={g.percent} />
          </div>
        ))}
      </div>
      {stalest && stalest.daysSinceLast !== null && (
        <p className="text-sm text-muted">
          <span className="font-medium text-text">{stalest.group}</span>:{" "}
          {Math.round(stalest.percent)}% do volume ·{" "}
          {stalest.daysSinceLast === 0
            ? "treinado hoje"
            : `${stalest.daysSinceLast} dias sem treinar`}
        </p>
      )}
    </Card>
  );
}
