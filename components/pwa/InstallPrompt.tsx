"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DumbbellIcon, XIcon } from "@/components/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "fittracker-install-dismissed";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);

    if (isIos()) {
      const t = setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 2000);
      return () => {
        window.removeEventListener("beforeinstallprompt", onPrompt);
        clearTimeout(t);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-[100px] z-90 flex justify-center px-6">
      <div className="anim-ft-up flex w-full max-w-[380px] items-center gap-3 rounded-2xl bg-surface border border-border p-3.5 shadow-[0_12px_30px_rgba(0,0,0,.16)]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink text-[#fafafa]">
          <DumbbellIcon size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Instalar o FitTracker</div>
          <div className="text-xs text-muted">
            {iosHint
              ? "Toque em Compartilhar e depois em “Adicionar à Tela de Início”."
              : "Acesso rápido, direto da tela inicial."}
          </div>
        </div>
        {!iosHint && (
          <button onClick={install} className="shrink-0 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white">
            Instalar
          </button>
        )}
        <button onClick={dismiss} aria-label="Fechar" className="shrink-0 text-muted">
          <XIcon size={15} />
        </button>
      </div>
    </div>,
    document.body
  );
}
