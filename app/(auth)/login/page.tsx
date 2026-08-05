"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { firstName } from "@/lib/format";
import { DumbbellIcon } from "@/components/icons";
import { PrimaryButton, TextField } from "@/components/ui/primitives";

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const showToast = useAppStore((s) => s.showToast);

  const [email, setEmail] = useState("sara.souza@email.com");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !pass.trim()) {
      showToast("Informe e-mail e senha");
      return;
    }
    setLoading(true);
    const ok = await login(email.trim(), pass);
    setLoading(false);
    if (!ok) {
      showToast("E-mail ou senha incorretos");
      return;
    }
    showToast(`Bem-vindo(a) de volta, ${firstName(email.split("@")[0])}`);
    router.push("/inicio");
  }

  return (
    <div className="anim-ft-fade flex flex-col gap-6 px-6 pt-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9.5 w-9.5 items-center justify-center rounded-md bg-ink text-[#fafafa]">
          <DumbbellIcon size={20} />
        </div>
        <span className="text-lg font-bold tracking-tight">FitTracker</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold">Bom te ver de novo</h1>
        <p className="text-base text-muted">
          Entre para continuar seu programa.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <TextField
          label="E-mail"
          type="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <TextField
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <button
            onClick={() =>
              showToast("Enviamos um link de redefinição por e-mail")
            }
            className="self-end text-sm font-semibold text-accent"
          >
            Esqueci minha senha
          </button>
        </div>
      </div>

      <PrimaryButton onClick={submit} disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </PrimaryButton>

      <div className="flex items-center gap-3 text-sm text-muted">
        <div className="h-px flex-1 bg-border" />
        ou
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={() => showToast("Login social entra na versão do app")}
        className="flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl border border-border text-md font-medium"
      >
        <span className="h-4.75 w-4.75 rounded-[5px] bg-border" />
        Continuar com Google
      </button>

      <p className="text-center text-sm text-muted">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-accent">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
