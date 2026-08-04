"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { ChevronLeftIcon } from "@/components/icons";
import { PrimaryButton, TextField } from "@/components/ui/primitives";

const STRENGTH_LABELS = ["Use pelo menos 8 caracteres", "Senha fraca", "Senha razoável", "Senha forte"];

function strengthOf(pass: string) {
  if (pass.length === 0) return 0;
  if (pass.length < 6) return 1;
  if (pass.length < 10) return 2;
  return 3;
}

export default function CadastroPage() {
  const router = useRouter();
  const signup = useAppStore((s) => s.signup);
  const showToast = useAppStore((s) => s.showToast);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [accept, setAccept] = useState(false);

  const strength = useMemo(() => strengthOf(pass), [pass]);

  function submit() {
    if (!name.trim()) return showToast("Informe seu nome");
    if (!/^\S+@\S+\.\S+$/.test(email)) return showToast("E-mail inválido");
    if (pass.length < 8) return showToast("A senha precisa de 8 caracteres");
    if (!accept) return showToast("Aceite os termos para continuar");
    signup(name.trim(), email.trim(), "student");
    router.push("/onboarding");
  }

  return (
    <div className="anim-ft-fade flex flex-col gap-6 px-6 pt-3.5">
      <button
        onClick={() => router.push("/login")}
        aria-label="Voltar"
        className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-surface border border-border"
      >
        <ChevronLeftIcon size={18} />
      </button>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold">Criar sua conta</h1>
        <p className="text-base text-muted">Leva menos de um minuto.</p>
      </div>

      <div className="flex flex-col gap-4">
        <TextField label="Nome completo" placeholder="Sara Souza" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label="E-mail"
          type="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <TextField
            label="Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-pill"
                style={{ background: i < strength ? "var(--accent)" : "var(--border)" }}
              />
            ))}
          </div>
          <span className="text-sm text-muted">{STRENGTH_LABELS[strength]}</span>
        </div>

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-[7px] accent-[var(--accent)]"
          />
          <span className="text-sm text-muted">
            Aceito os termos de uso e a política de privacidade do FitTracker.
          </span>
        </label>
      </div>

      <PrimaryButton onClick={submit}>Criar conta</PrimaryButton>
    </div>
  );
}
