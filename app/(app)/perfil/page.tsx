"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useCurrentProfile, useRole, useStudentDetails, useTrainerDetails } from "@/lib/hooks";
import { firstName, formatWeight } from "@/lib/format";
import { Screen, Header, Card, Eyebrow, InitialsAvatar, DangerButton, EmptyDashed, ScreenSkeleton, TextField, PrimaryButton } from "@/components/ui/primitives";
import { Modal, ModalButton, Sheet } from "@/components/ui/overlays";
import { CheckIcon, CopyIcon, ChevronRightIcon, CameraIcon } from "@/components/icons";

export default function PerfilPage() {
  const router = useRouter();
  const profile = useCurrentProfile();
  const role = useRole();
  const student = useStudentDetails(profile?.id);
  const trainer = useTrainerDetails(profile?.id);
  const trainerStudents = useAppStore((s) => s.trainerStudents);
  const profiles = useAppStore((s) => s.profiles);
  const hasCoach = useAppStore((s) => s.hasCoach);
  const leaveCoach = useAppStore((s) => s.leaveCoach);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const showToast = useAppStore((s) => s.showToast);
  const logout = useAppStore((s) => s.logout);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const uploadAvatar = useAppStore((s) => s.uploadAvatar);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return <ScreenSkeleton />;

  const myTrainerLink = trainerStudents.find((ts) => ts.student_id === profile.id && ts.status === "active");
  const trainerProfile = myTrainerLink ? profiles.find((p) => p.id === myTrainerLink.trainer_id) : null;
  const weightUnit = student?.weight_unit ?? "kg";

  function copyCode() {
    navigator.clipboard?.writeText(profile!.invite_code).catch(() => {});
    showToast(`Código ${profile!.invite_code} copiado`);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const res = await uploadAvatar(file);
    setUploading(false);
    showToast(res.ok ? "Foto atualizada" : (res.message ?? "Erro ao enviar a foto"));
  }

  async function pickUnit(unit: "kg" | "lb") {
    setUnitOpen(false);
    const res = await updateProfile({ weightUnit: unit });
    showToast(res.ok ? "Unidade atualizada" : (res.message ?? "Erro ao salvar"));
  }

  function openGoal() {
    const kg = student?.goal_weight_kg;
    const displayed = kg ? (weightUnit === "lb" ? kg * 2.20462 : kg) : null;
    setGoalInput(displayed ? displayed.toFixed(1) : "");
    setGoalOpen(true);
  }

  async function saveGoal() {
    const entered = Number(goalInput.replace(",", "."));
    if (!entered || entered <= 0) {
      showToast("Informe um peso válido");
      return;
    }
    const kg = weightUnit === "lb" ? entered / 2.20462 : entered;
    const res = await updateProfile({ goalWeightKg: kg });
    setGoalOpen(false);
    showToast(res.ok ? "Meta de peso atualizada" : (res.message ?? "Erro ao salvar"));
  }

  return (
    <Screen>
      <Header title="Perfil" />

      <Card className="flex items-center gap-3.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Trocar foto de perfil"
          className="relative shrink-0 rounded-2xl"
          disabled={uploading}
        >
          {profile.avatar_url ? (
            <div className="relative h-13.5 w-13.5 overflow-hidden rounded-2xl">
              <Image src={profile.avatar_url} alt="" fill className="object-cover" sizes="54px" />
            </div>
          ) : (
            <InitialsAvatar name={profile.full_name} size={54} />
          )}
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[#fafafa]">
            <CameraIcon size={12} />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold truncate">{profile.full_name}</span>
            {role === "trainer" && (
              <span className="shrink-0 rounded-lg bg-accent/12 px-2 py-0.5 text-2xs font-bold uppercase text-accent">
                Personal
              </span>
            )}
          </div>
          <span className="text-sm text-muted truncate">{profile.email}</span>
        </div>
      </Card>

      {role === "trainer" && trainer && (
        <Card className="flex items-center justify-between">
          <div>
            <Eyebrow>CREF</Eyebrow>
            <div className="text-md font-medium">
              {trainer.cref_number}/{trainer.cref_uf}
            </div>
          </div>
          {trainer.verification_status === "verified" && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-accent">
              <CheckIcon size={14} />
              Verificado
            </div>
          )}
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <span className="text-sm text-muted">
          {role === "trainer" ? "Seu código de treinador" : "Seu código de aluno"}
        </span>
        <div className="flex items-center justify-between">
          <span className="tabular-nums text-3xl font-semibold" style={{ letterSpacing: ".16em" }}>
            {profile.invite_code}
          </span>
          <button
            onClick={copyCode}
            aria-label="Copiar código"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface2 border border-border"
          >
            <CopyIcon size={16} />
          </button>
        </div>
        <p className="text-sm text-muted">
          {role === "trainer"
            ? "Seus alunos usam este código para confirmar sua identidade."
            : "Passe este código ao seu personal para entrar na equipe dele."}
        </p>
      </Card>

      {role === "student" && hasCoach && trainerProfile && (
        <Card className="flex flex-col gap-4">
          <Eyebrow>Equipe</Eyebrow>
          <div className="flex items-center gap-3">
            <InitialsAvatar name={trainerProfile.full_name} />
            <div>
              <div className="text-md font-medium">{trainerProfile.full_name}</div>
              <div className="text-sm text-muted">Personal · desde {myTrainerLink && new Date(myTrainerLink.joined_at ?? myTrainerLink.invited_at).toLocaleDateString("pt-BR", { month: "long" })}</div>
            </div>
          </div>
          <DangerButton onClick={() => setLeaveOpen(true)}>Sair da equipe</DangerButton>
        </Card>
      )}

      {role === "student" && !hasCoach && (
        <EmptyDashed>
          <span className="text-md font-medium">Você não está em nenhuma equipe</span>
          <span className="text-sm text-muted">Compartilhe seu código para um personal te adicionar.</span>
        </EmptyDashed>
      )}

      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface overflow-hidden">
        <SettingsRow
          label="Tema"
          value={theme === "dark" ? "Escuro" : "Claro"}
          onClick={toggleTheme}
        />
        <SettingsRow
          label="Unidade de carga"
          value={weightUnit}
          onClick={() => setUnitOpen(true)}
        />
        <SettingsRow
          label="Meta de peso"
          value={student?.goal_weight_kg ? formatWeight(student.goal_weight_kg, weightUnit) : "—"}
          onClick={openGoal}
        />
      </div>

      <button
        onClick={() => {
          logout();
          router.replace("/login");
        }}
        className="text-sm font-medium text-muted self-center mt-2"
      >
        Sair da conta
      </button>

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={`Sair da equipe do ${firstName(trainerProfile?.full_name ?? "")}?`}
        body="Você mantém seus treinos, mas ele deixa de acompanhar seu progresso. Para voltar, será preciso enviar seu código novamente."
      >
        <div className="flex flex-col gap-2.5">
          <ModalButton kind="ghost" onClick={() => setLeaveOpen(false)}>
            Ficar na equipe
          </ModalButton>
          <ModalButton
            kind="danger"
            onClick={() => {
              leaveCoach();
              setLeaveOpen(false);
              showToast("Você saiu da equipe");
            }}
          >
            Sair da equipe
          </ModalButton>
        </div>
      </Modal>

      <Sheet open={unitOpen} onClose={() => setUnitOpen(false)} title="Unidade de carga">
        <div className="flex flex-col gap-2.5">
          {(["kg", "lb"] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => pickUnit(unit)}
              className="flex items-center justify-between rounded-2xl border border-border px-4 py-3.5 text-left"
            >
              <span className="text-md font-medium">{unit === "kg" ? "Quilogramas (kg)" : "Libras (lb)"}</span>
              {weightUnit === unit && <CheckIcon size={16} className="text-accent" />}
            </button>
          ))}
        </div>
      </Sheet>

      <Modal open={goalOpen} onClose={() => setGoalOpen(false)} title="Meta de peso">
        <TextField
          label={`Peso alvo (${weightUnit})`}
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          inputMode="decimal"
          placeholder="0.0"
        />
        <PrimaryButton onClick={saveGoal}>Salvar</PrimaryButton>
      </Modal>
    </Screen>
  );
}

function SettingsRow({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
      <span className="text-md">{label}</span>
      <span className="flex items-center gap-1.5 text-sm text-muted">
        {value}
        {onClick && <ChevronRightIcon size={14} />}
      </span>
    </Comp>
  );
}
