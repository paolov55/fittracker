"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { scorePassword } from "@/lib/password";
import { ChevronLeftIcon } from "@/components/icons";
import { PrimaryButton, TextField } from "@/components/ui/primitives";

const STRENGTH_COLOR: Record<number, string> = {
  1: "var(--danger)",
  2: "var(--warm)",
  3: "var(--accent)",
  4: "var(--accent)",
};

export default function CadastroPage() {
  const router = useRouter();
  const signup = useAppStore((s) => s.signup);
  const showToast = useAppStore((s) => s.showToast);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => scorePassword(pass, [name, email]), [pass, name, email]);

  async function submit() {
    if (!name.trim()) return showToast("Informe seu nome");
    if (!/^\S+@\S+\.\S+$/.test(email)) return showToast("E-mail inválido");
    if (pass.length < 8) return showToast("A senha precisa de pelo menos 8 caracteres");
    if (strength.score < 2) return showToast(strength.hint || "Escolha uma senha mais forte");
    if (!accept) return showToast("Aceite a política de privacidade para continuar");
    setLoading(true);
    const id = await signup(name.trim(), email.trim(), pass, "student");
    setLoading(false);
    if (!id) return;
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
        <TextField
          label="Nome completo"
          placeholder="Seu nome e sobrenome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-pill"
                style={{
                  background:
                    i <= strength.score ? STRENGTH_COLOR[strength.score] : "var(--border)",
                }}
              />
            ))}
          </div>
          {strength.label && (
            <span className="text-sm text-muted">
              {strength.label}
              {strength.hint ? ` — ${strength.hint}` : ""}
            </span>
          )}
        </div>

        <label htmlFor="accept-privacy" className="flex items-start gap-2.5">
          <input
            id="accept-privacy"
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5 h-5.5 w-5.5 shrink-0 rounded-xs accent-accent"
          />
          <span className="text-sm text-muted">
            Aceito a{" "}
            <Link
              href="/privacidade"
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-accent"
            >
              política de privacidade
            </Link>{" "}
            do FitTracker.
          </span>
        </label>
      </div>

      <PrimaryButton onClick={submit} disabled={loading}>
        {loading ? "Criando conta…" : "Criar conta"}
      </PrimaryButton>
    </div>
  );
}
