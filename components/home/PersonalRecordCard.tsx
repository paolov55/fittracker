"use client";

import type { PersonalRecord } from "@/lib/stats";
import { formatWeight, type WeightUnit } from "@/lib/format";
import { Card, Eyebrow, IconTile } from "@/components/ui/primitives";
import { TargetIcon } from "@/components/icons";

/** Só renderiza quando há recorde recente — não vira ruído permanente. */
export function PersonalRecordCard({
  records,
  weightUnit,
}: {
  records: PersonalRecord[];
  weightUnit: WeightUnit;
}) {
  if (records.length === 0) return null;
  const top = [...records].sort((a, b) => b.deltaKg - a.deltaKg)[0];
  const rest = records.length - 1;

  return (
    <Card className="flex items-center gap-3 border-2 border-accent">
      <IconTile>
        <TargetIcon size={20} />
      </IconTile>
      <div className="flex-1 min-w-0">
        <Eyebrow>Novo recorde</Eyebrow>
        <div className="text-md font-medium truncate">{top.exerciseName}</div>
        <div className="text-sm text-muted">
          {formatWeight(top.kg, weightUnit)} · +{formatWeight(top.deltaKg, weightUnit)}
          {rest > 0 && ` · e mais ${rest}`}
        </div>
      </div>
    </Card>
  );
}
