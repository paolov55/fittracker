"use client";

import { useAppStore } from "@/lib/store";
import { useCurrentProfile, useStudentDetails } from "@/lib/hooks";
import { weekdayLabel, formatWeight, formatVolume } from "@/lib/format";
import { Screen, Header, Card, StatCard, IconTile, ScreenSkeleton } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/icons";

export default function HistoricoPage() {
  const profile = useCurrentProfile();
  const student = useStudentDetails(profile?.id);
  const weightUnit = student?.weight_unit ?? "kg";
  const sessions = useAppStore((s) => s.sessions);
  const workouts = useAppStore((s) => s.workouts);

  if (!profile) return <ScreenSkeleton />;

  const mine = sessions
    .filter((s) => s.student_id === profile.id && s.status === "completed")
    .sort((a, b) => b.started_at.localeCompare(a.started_at));

  const now = new Date();
  const thisMonth = mine.filter((s) => {
    const d = new Date(s.started_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalVolumeKg = mine.reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0);

  return (
    <Screen>
      <Header title="Histórico" />

      <div className="flex gap-3">
        <StatCard value={thisMonth.length} label="treinos no mês" />
        <StatCard value={formatVolume(totalVolumeKg, weightUnit)} label="volume total" />
      </div>

      <div className="flex flex-col gap-2.5">
        {mine.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted">
            Nenhum treino concluído ainda.
          </div>
        )}
        {mine.map((s) => {
          const workout = workouts.find((w) => w.id === s.workout_id);
          const minutes = Math.round((s.duration_seconds ?? 0) / 60);
          return (
            <Card key={s.id} className="flex items-center gap-3">
              <IconTile>
                <CheckIcon size={16} />
              </IconTile>
              <div className="flex-1 min-w-0">
                <div className="text-md font-medium truncate">{workout?.name ?? "Treino"}</div>
                <div className="text-sm text-muted truncate">
                  {minutes} min · {formatWeight(s.total_volume_kg ?? 0, weightUnit)}
                </div>
              </div>
              <span className="shrink-0 text-sm text-muted capitalize">{weekdayLabel(s.started_at)}</span>
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
