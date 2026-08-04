"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useCurrentProfile, useRole } from "@/lib/hooks";
import { Screen, Header, SectionLabel, IconTile } from "@/components/ui/primitives";
import { PlusIcon, ChevronRightIcon, UsersIcon } from "@/components/icons";

export default function ProgramasPage() {
  const router = useRouter();
  const profile = useCurrentProfile();
  const role = useRole();
  const programs = useAppStore((s) => s.programs);
  const workouts = useAppStore((s) => s.workouts);
  const assignments = useAppStore((s) => s.programAssignments);
  const profiles = useAppStore((s) => s.profiles);

  if (!profile) return null;

  const myPrograms =
    role === "trainer"
      ? programs.filter((p) => p.owner_id === profile.id && p.visibility === "private")
      : assignments
          .filter((a) => a.student_id === profile.id)
          .map((a) => programs.find((p) => p.id === a.program_id))
          .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <Screen>
      <Header
        title="Programas"
        right={
          <button
            onClick={() => router.push("/programas/novo")}
            className="flex h-10 items-center gap-1.5 rounded-2xl bg-ink px-3.5 text-sm font-semibold text-[#fafafa]"
          >
            <PlusIcon size={15} />
            Criar
          </button>
        }
      />

      <SectionLabel>Meus programas</SectionLabel>

      <div className="flex flex-col gap-3">
        {myPrograms.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted">
            Você ainda não tem nenhum programa.
          </div>
        )}
        {myPrograms.map((program) => {
          const owner = profiles.find((p) => p.id === program.owner_id);
          const isMine = program.owner_id === profile.id;
          const workoutCount = workouts.filter((w) => w.program_id === program.id && w.day_key).length;
          return (
            <Link
              key={program.id}
              href={`/programas/${program.id}`}
              className="flex flex-col overflow-hidden rounded-[22px] border border-border bg-surface"
            >
              <div className="relative h-[118px] w-full">
                <Image
                  src={program.cover_url ?? "/covers/novo.jpg"}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="430px"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg,rgba(0,0,0,.42) 0%,rgba(0,0,0,0) 45%,rgba(0,0,0,.3) 100%)",
                  }}
                />
                {!isMine && owner && (
                  <span className="absolute left-3 top-3 rounded-lg bg-black/[.6] px-2.5 py-1 text-2xs font-semibold text-white backdrop-blur">
                    Montado por {owner.full_name}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="text-md font-medium truncate">{program.name}</div>
                  <div className="text-sm text-muted truncate">
                    {program.mode === "sync" ? "Síncrono" : "Assíncrono"} · {workoutCount} treinos/semana
                    {program.goal ? ` · ${program.goal}` : ""}
                  </div>
                </div>
                <ChevronRightIcon size={16} className="shrink-0 text-muted" />
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/programas/comunidade"
        className="flex items-center gap-3 rounded-[22px] border border-border bg-surface p-4"
      >
        <IconTile>
          <UsersIcon size={20} />
        </IconTile>
        <div className="flex-1">
          <div className="text-md font-medium">Programas da comunidade</div>
          <div className="text-sm text-muted">Copie um programa pronto e ajuste do seu jeito</div>
        </div>
        <ChevronRightIcon size={16} className="text-muted" />
      </Link>
    </Screen>
  );
}
