"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useCurrentProfile } from "@/lib/hooks";
import {
  Screen,
  Header,
  StatCard,
  InitialsAvatar,
  ProgressBar,
  PrimaryButton,
  ScreenSkeleton,
} from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/overlays";
import { PlusIcon, ChevronRightIcon } from "@/components/icons";

export default function AlunosPage() {
  const profile = useCurrentProfile();
  const trainerStudents = useAppStore((s) => s.trainerStudents);
  const profiles = useAppStore((s) => s.profiles);
  const assignments = useAppStore((s) => s.programAssignments);
  const sessions = useAppStore((s) => s.sessions);
  const workouts = useAppStore((s) => s.workouts);
  const programs = useAppStore((s) => s.programs);
  const addStudentByCode = useAppStore((s) => s.addStudentByCode);
  const showToast = useAppStore((s) => s.showToast);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; message: string }>(
    null,
  );

  if (!profile) return <ScreenSkeleton />;

  const links = trainerStudents.filter((ts) => ts.trainer_id === profile.id);
  const activeLinks = links.filter((l) => l.status === "active");
  const pendingLinks = links.filter((l) => l.status === "pending");

  const todayStr = new Date().toDateString();
  const workoutsToday = sessions.filter(
    (s) =>
      s.status === "completed" &&
      new Date(s.started_at).toDateString() === todayStr &&
      activeLinks.some((l) => l.student_id === s.student_id),
  ).length;

  async function submitCode() {
    const digits = code.replace(/\D/g, "").slice(0, 6);
    const r = await addStudentByCode(digits);
    setResult(r);
    showToast(r.message);
    if (r.ok) {
      setCode("");
      setTimeout(() => setSheetOpen(false), 400);
    }
  }

  return (
    <Screen>
      <Header
        title="Alunos"
        right={
          <button
            onClick={() => {
              setResult(null);
              setCode("");
              setSheetOpen(true);
            }}
            className="flex h-10 items-center gap-1.5 rounded-2xl bg-ink px-3.5 text-sm font-semibold text-[#fafafa]"
          >
            <PlusIcon size={15} />
            Aluno
          </button>
        }
      />
      <p className="-mt-3 text-sm text-muted">
        {activeLinks.length} ativos · {pendingLinks.length} convite
        {pendingLinks.length === 1 ? "" : "s"} pendente
        {pendingLinks.length === 1 ? "" : "s"}
      </p>

      <div className="flex gap-3">
        <StatCard value={activeLinks.length} label="alunos ativos" />
        <StatCard value={pendingLinks.length} label="convites pendentes" />
        <StatCard value={workoutsToday} label="treinos feitos hoje" />
      </div>

      <div className="flex flex-col gap-2.5">
        {links.map((link) => {
          const student = profiles.find((p) => p.id === link.student_id);
          if (!student) return null;
          const assignment = assignments.find(
            (a) => a.student_id === student.id && a.status === "live",
          );
          const program = assignment
            ? programs.find((p) => p.id === assignment.program_id)
            : null;
          const workoutCount = program
            ? workouts.filter((w) => w.program_id === program.id && w.day_key)
                .length
            : 0;
          const doneThisWeek = sessions.filter(
            (s) => s.student_id === student.id && s.status === "completed",
          ).length;

          return (
            <Link
              key={link.id}
              href={`/alunos/${student.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <InitialsAvatar name={student.full_name} />
              <div className="min-w-0 flex-1">
                <div className="text-md font-medium truncate">
                  {student.full_name}
                </div>
                <div className="text-sm text-muted truncate">
                  {program?.name ?? "Sem programa"}
                </div>
                {link.status === "active" ? (
                  workoutCount > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <ProgressBar
                        value={
                          (Math.min(doneThisWeek, workoutCount) /
                            workoutCount) *
                          100
                        }
                        color={
                          doneThisWeek / workoutCount >= 0.6
                            ? undefined
                            : "var(--warm)"
                        }
                        className="w-14"
                      />
                      <span className="text-xs text-muted">
                        {Math.min(doneThisWeek, workoutCount)} de {workoutCount}{" "}
                        treinos
                      </span>
                    </div>
                  )
                ) : (
                  <span className="mt-1.5 inline-block rounded-md bg-surface2 px-2 py-0.5 text-xs text-muted">
                    Convite pendente
                  </span>
                )}
              </div>
              <ChevronRightIcon size={16} className="shrink-0 text-muted" />
            </Link>
          );
        })}
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Adicionar aluno"
      >
        <p className="text-sm text-muted">
          Peça o código de 6 dígitos que aparece no perfil do aluno.
        </p>
        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="000000"
          inputMode="numeric"
          className="mx-auto h-16 w-full max-w-55 rounded-2xl border border-border bg-surface2 text-center text-3xl font-semibold outline-none"
          style={{ letterSpacing: ".24em" }}
        />
        {result && !result.ok && (
          <p className="text-center text-sm text-danger">
            Não encontramos ninguém com esse código. Confira os dígitos com o
            aluno.
          </p>
        )}
        <PrimaryButton onClick={submitCode}>
          {result?.ok ? "Enviar convite" : "Buscar aluno"}
        </PrimaryButton>
      </Sheet>
    </Screen>
  );
}
