"use client";

import type { VolumeTrend } from "@/lib/stats";
import { formatVolume, type WeightUnit } from "@/lib/format";
import { Card, StatCard } from "@/components/ui/primitives";

export function StatsStrip({
  monthlyCount,
  trend,
  streakWeeks,
  weeklySeriesKg,
  weightUnit,
}: {
  monthlyCount: number;
  trend: VolumeTrend;
  streakWeeks: number;
  weeklySeriesKg: number[];
  weightUnit: WeightUnit;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 overflow-x-auto -mx-1 px-1">
        <StatCard value={monthlyCount} label="treinos no mês" />
        <StatCard
          value={
            <span className="flex items-baseline gap-1.5">
              {formatVolume(trend.thisWeekKg, weightUnit)}
              {trend.changePct !== null && (
                <span
                  className="text-xs font-semibold"
                  style={{ color: trend.changePct >= 0 ? "var(--accent)" : "var(--danger)" }}
                >
                  {trend.changePct >= 0 ? "↑" : "↓"}
                  {Math.abs(Math.round(trend.changePct))}%
                </span>
              )}
            </span>
          }
          label="volume da semana"
        />
        <StatCard value={streakWeeks} label={streakWeeks === 1 ? "semana seguida" : "semanas seguidas"} />
      </div>
      <Card className="flex items-end justify-between gap-3">
        <span className="text-sm text-muted shrink-0">Últimas 6 semanas</span>
        <VolumeSparkline series={weeklySeriesKg} />
      </Card>
    </div>
  );
}

function VolumeSparkline({ series }: { series: number[] }) {
  const max = Math.max(1, ...series);
  const barWidth = 12;
  const gap = 6;
  const height = 32;
  const width = series.length * barWidth + (series.length - 1) * gap;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      {series.map((v, i) => {
        const h = v > 0 ? Math.max(3, (v / max) * height) : 2;
        const x = i * (barWidth + gap);
        const y = height - h;
        const isLast = i === series.length - 1;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={3}
            fill="var(--accent)"
            opacity={isLast ? 1 : 0.35}
          />
        );
      })}
    </svg>
  );
}
