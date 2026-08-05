"use client";

import { useRouter } from "next/navigation";
import type { ActiveRun } from "@/lib/store";
import { clock } from "@/lib/format";
import { Card, Eyebrow } from "@/components/ui/primitives";
import { PlayIcon, ChevronRightIcon } from "@/components/icons";

/**
 * `activeRun` já é persistido no store, mas hoje só é alcançável dentro do
 * runner — fechar o app no meio do treino perde o caminho de volta. Este
 * card devolve esse caminho a partir da home.
 */
export function ResumeRunCard({
  activeRun,
  workoutName,
}: {
  activeRun: ActiveRun;
  workoutName: string;
}) {
  const router = useRouter();
  const setsCompleted = Object.values(activeRun.sets).reduce(
    (sum, sets) => sum + sets.filter((s) => s.completed).length,
    0,
  );
  const setsTotal = Object.values(activeRun.sets).reduce((sum, sets) => sum + sets.length, 0);

  return (
    <Card
      ink
      onClick={() => router.push(`/treino/executar/${activeRun.workoutId}`)}
      className="flex items-center gap-3"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
        <PlayIcon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <Eyebrow>Treino em andamento</Eyebrow>
        <div className="text-md font-medium truncate">{workoutName}</div>
        <div className="text-sm" style={{ color: "rgba(250,250,250,.6)" }}>
          {clock(activeRun.elapsed)} · {setsCompleted}/{setsTotal} séries
        </div>
      </div>
      <ChevronRightIcon size={18} style={{ color: "rgba(250,250,250,.6)" }} />
    </Card>
  );
}
