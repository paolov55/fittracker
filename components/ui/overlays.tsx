"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "@/lib/store";
import { CheckIcon } from "@/components/icons";

export function Sheet({
  open,
  onClose,
  title,
  children,
  maxHeight = "78%",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeight?: string;
}) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-70 flex items-end justify-center">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="anim-ft-fade-fast absolute inset-0 bg-black/45"
      />
      <div
        className="anim-ft-up relative z-10 flex w-full max-w-[430px] flex-col rounded-t-[28px] bg-surface p-5 pb-8"
        style={{ maxHeight }}
      >
        {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
        <div className="flex flex-col gap-3 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function Modal({
  open,
  onClose,
  title,
  body,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  body?: string;
  children?: ReactNode;
}) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-90 flex items-center justify-center px-6">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="anim-ft-fade-fast absolute inset-0 bg-black/50"
      />
      <div className="anim-ft-up-slow relative z-10 w-full max-w-[360px] rounded-3xl bg-surface p-[22px] flex flex-col gap-4">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        {body && <p className="text-sm text-muted leading-relaxed">{body}</p>}
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalButton({
  kind,
  onClick,
  children,
}: {
  kind: "ghost" | "danger" | "primary";
  onClick: () => void;
  children: ReactNode;
}) {
  const cls =
    kind === "primary"
      ? "bg-accent text-white border-transparent"
      : kind === "danger"
        ? "border-danger text-danger bg-transparent"
        : "border-border text-text bg-transparent";
  return (
    <button
      onClick={onClick}
      className={`flex h-[50px] w-full items-center justify-center rounded-2xl border text-md font-semibold ${cls}`}
    >
      {children}
    </button>
  );
}

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => clearToast(), 2200);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-x-0 bottom-[100px] z-100 flex justify-center px-6 pointer-events-none">
      <div className="anim-ft-up flex items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-[#fafafa] shadow-[0_12px_30px_rgba(0,0,0,.28)] max-w-[380px]">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <CheckIcon size={12} />
        </span>
        {toast}
      </div>
    </div>,
    document.body
  );
}
