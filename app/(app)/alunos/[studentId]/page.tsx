"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { firstName, formatDate, weekdayLabel } from "@/lib/format";
import { startOfWeek } from "@/lib/workout";
import { Screen, Header, Card, Eyebrow, StatCard, InitialsAvatar, DangerButton, IconTile } from "@/components/ui/primitives";
import { Modal, ModalButton } from "@/components/ui/overlays";
import { CalendarIcon, CheckIcon } from "@/components/icons";

export default function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const router = useRouter();

  const profiles = useAppStore((s) => s.profiles);
  const trainerStudents = useAppStore((s) => s.trainerStudents);
  const assignments = useAppStore((s) => s.programAssignments);
  const programs = useAppStore((s) => s.programs);
  const workouts = useAppStore((s) => s.workouts);
  const sessions = useAppStore((s) => s.sessions);
  const removeStudentFromTeam = useAppStore((s) => s.removeStudentFromTeam);
  const scheduleAssignment = useAppStore((s) => s.scheduleAssignment);
  const cancelAssignment = useAppStore((s) => s.cancelAssignment);
  const showToast = useAppStore((s) => s.showToast);

  const [removeOpen, setRemoveOpen] = useState(false);

  const student = profiles.find((p) => p.id === studentId);
  const link = trainerStudents.find((ts) => ts.student_id === studentId);

  if (!student) return null;

  const liveAssignment = assignments.find((a) => a.student_id === studentId && a.status === "live");
  const scheduledAssignment = assignments.find((a) => a.student_id === studentId && a.status === "scheduled");
  const liveProgram = liveAssignment ? programs.find((p) => p.id === liveAssignment.program_id) : null;
  const scheduledProgram = scheduledAssignment ? programs.find((p) => p.id === scheduledAssignment.program_id) : null;

  const weekStart = startOfWeek();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const mySessions = sessions
    .filter((s) => s.student_id === studentId && s.status === "completed")
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
  const thisWeek = mySessions.filter((s) => new Date(s.started_at) >= weekStart).length;
  const thisMonth = mySessions.filter((s) => new Date(s.started_at) >= monthStart);
  const volumeMonthTons = thisMonth.reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0) / 1000;
  const weeklyWorkoutCount = liveProgram
    ? workouts.filter((w) => w.program_id === liveProgram.id && w.day_key).length
    : 0;

  return (
    <Screen>
      <Header title="Aluno" onBack={() => router.push("/alunos")} />

      <Card className="flex items-center gap-3.5">
        <InitialsAvatar name={student.full_name} size={54} />
        <div>
          <div className="text-lg font-semibold">{student.full_name}</div>
          <div className="text-sm text-muted">
            {link?.status === "active"
              ? `Na sua equipe desde ${link.joined_at ? new Date(link.joined_at).toLocaleDateString("pt-BR", { month: "long" }) : ""}`
              : "Convite pendente"}
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <StatCard value={`${thisWeek}/${weeklyWorkoutCount || "–"}`} label="treinos nesta semana" />
        <StatCard value={thisMonth.length} label="treinos no mês" />
        <StatCard value={`${volumeMonthTons.toFixed(1).replace(".", ",")} t`} label="volume no mês" />
      </div>

      <div className="flex flex-col gap-2">
        <Eyebrow>Programa atual</Eyebrow>
        <Card className="flex flex-col gap-3">
          <div>
            <div className="text-md font-medium">{liveProgram?.name ?? "Aguardando o aluno aceitar o convite"}</div>
            {liveProgram && (
              <div className="text-sm text-muted">
                {liveProgram.mode === "sync" ? "Síncrono" : "Assíncrono"} · {weeklyWorkoutCount} treinos/semana ·
                montado por você
              </div>
            )}
          </div>
          <div className="flex gap-2.5">
            {liveProgram && (
              <button
                onClick={() => {
                  showToast(`Editando o programa de ${firstName(student.full_name)}`);
                  router.push(`/programas/${liveProgram.id}`);
                }}
                className="flex-1 h-11 rounded-2xl bg-accent text-white text-sm font-semibold"
              >
                Editar treinos
              </button>
            )}
            <button
              onClick={() => router.push(`/programas/novo?aluno=${student.id}`)}
              className="flex-1 h-11 rounded-2xl border border-border text-sm font-semibold"
            >
              Novo programa
            </button>
          </div>
        </Card>
      </div>

      {scheduledAssignment && scheduledProgram && (
        <div className="flex flex-col gap-2">
          <Eyebrow>Programa agendado</Eyebrow>
          <Card className="flex flex-col gap-3 border-2 border-accent">
            <div className="flex items-start gap-2.5">
              <CalendarIcon size={18} className="mt-0.5 text-accent" />
              <div>
                <div className="text-md font-medium">{scheduledProgram.name}</div>
                <div className="text-sm text-muted">
                  Fica visível para {firstName(student.full_name)} em {formatDate(scheduledAssignment.live_at)} ·
                  substitui o programa atual
                </div>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  scheduleAssignment(scheduledAssignment.id, new Date().toISOString(), "live");
                  showToast(`Programa liberado para ${firstName(student.full_name)}`);
                }}
                className="flex-1 h-11 rounded-2xl bg-accent text-white text-sm font-semibold"
              >
                Liberar agora
              </button>
              <button
                onClick={() => {
                  cancelAssignment(scheduledAssignment.id);
                  showToast("Agendamento cancelado");
                }}
                className="flex-1 h-11 rounded-2xl border border-border text-sm font-semibold"
              >
                Cancelar agendamento
              </button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {mySessions.slice(0, 5).map((s) => {
          const workout = workouts.find((w) => w.id === s.workout_id);
          const minutes = Math.round((s.duration_seconds ?? 0) / 60);
          const volume = Math.round(s.total_volume_kg ?? 0).toLocaleString("pt-BR");
          return (
            <Card key={s.id} className="flex items-center gap-3">
              <IconTile>
                <CheckIcon size={16} />
              </IconTile>
              <div className="flex-1 min-w-0">
                <div className="text-md font-medium truncate">{workout?.name ?? "Treino"}</div>
                <div className="text-sm text-muted truncate">
                  {minutes} min · {volume} kg
                </div>
              </div>
              <span className="shrink-0 text-sm text-muted capitalize">{weekdayLabel(s.started_at)}</span>
            </Card>
          );
        })}
      </div>

      <DangerButton onClick={() => setRemoveOpen(true)}>Remover aluno da equipe</DangerButton>

      <Modal
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title={`Remover ${firstName(student.full_name)} da equipe?`}
        body={`${firstName(student.full_name)} perde o acesso ao programa que você montou, mas mantém o histórico. Vocês podem se reconectar depois pelo código.`}
      >
        <div className="flex flex-col gap-2.5">
          <ModalButton kind="ghost" onClick={() => setRemoveOpen(false)}>
            Manter na equipe
          </ModalButton>
          <ModalButton
            kind="danger"
            onClick={() => {
              removeStudentFromTeam(studentId);
              showToast(`${student.full_name} saiu da sua equipe`);
              router.replace("/alunos");
            }}
          >
            Remover aluno
          </ModalButton>
        </div>
      </Modal>
    </Screen>
  );
}
