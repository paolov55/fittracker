"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Screen, Header } from "@/components/ui/primitives";

const FILTERS = ["Todos", "Iniciante", "Intermediário", "Hipertrofia", "Força"];

export default function ComunidadePage() {
  const router = useRouter();
  const programs = useAppStore((s) => s.programs);
  const cloneCommunityProgram = useAppStore((s) => s.cloneCommunityProgram);
  const showToast = useAppStore((s) => s.showToast);
  const [filter, setFilter] = useState("Todos");

  const community = programs.filter((p) => p.visibility === "community");
  const filtered = community.filter(
    (p) =>
      filter === "Todos" ||
      p.community_level === filter ||
      (p.community_meta ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  function use(programId: string) {
    const clone = cloneCommunityProgram(programId);
    showToast("Programa adicionado aos seus");
    router.push(`/programas/${clone.id}`);
  }

  return (
    <Screen>
      <Header title="Comunidade" onBack={() => router.push("/programas")} />
      <p className="-mt-3 text-sm text-muted">Programas públicos criados por treinadores</p>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="h-[34px] shrink-0 whitespace-nowrap rounded-[11px] border px-3.5 text-sm font-medium"
            style={{
              background: filter === f ? "var(--accent)" : "var(--surface)",
              borderColor: filter === f ? "var(--accent)" : "var(--border)",
              color: filter === f ? "#fff" : "var(--text)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-[22px] border border-border bg-surface">
            <div className="relative h-[150px] w-full">
              <Image src={p.cover_url ?? "/covers/novo.jpg"} alt="" fill className="object-cover" sizes="430px" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg,rgba(0,0,0,.3) 0%,rgba(0,0,0,.05) 40%,rgba(0,0,0,.72) 100%)",
                }}
              />
              {p.community_level && (
                <span className="absolute right-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-2xs font-semibold text-ink">
                  {p.community_level}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="text-lg font-semibold text-white">{p.name}</div>
                <div className="text-sm text-white/80">{p.community_meta}</div>
              </div>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <p className="text-sm text-muted">{p.community_desc}</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted truncate">{p.community_author}</span>
                <button
                  onClick={() => use(p.id)}
                  className="shrink-0 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white"
                >
                  Usar programa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
