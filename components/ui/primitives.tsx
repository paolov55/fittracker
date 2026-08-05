"use client";

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { ChevronLeftIcon, MinusIcon, PlusIcon } from "@/components/icons";

export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`anim-ft-fade flex flex-col gap-4 px-5 pt-7 pb-27.5 ${className}`}
    >
      {children}
    </div>
  );
}

export function ScreenSkeleton() {
  return (
    <div className="anim-ft-fade flex flex-col gap-4 px-5 pt-7 pb-27.5">
      <div className="h-8 w-2/5 rounded-lg bg-surface2" />
      <div className="h-28 w-full rounded-2xl bg-surface2" />
      <div className="h-20 w-full rounded-2xl bg-surface2" />
      <div className="h-20 w-full rounded-2xl bg-surface2" />
    </div>
  );
}

export function Header({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-surface border border-border text-text"
          >
            <ChevronLeftIcon size={18} />
          </button>
        )}
        {title && <h1 className="truncate text-2xl font-semibold">{title}</h1>}
      </div>
      {right}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="text-2xs font-semibold uppercase tracking-[.09em] text-muted">
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wide text-muted px-1">
      {children}
    </div>
  );
}

export function Card({
  children,
  className = "",
  ink = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  ink?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`text-left rounded-2xl border p-4.5 ${
        ink
          ? "bg-ink text-[#fafafa] border-transparent"
          : "bg-surface border-border text-text"
      } ${className}`}
    >
      {children}
    </Comp>
  );
}

export function StatCard({
  value,
  label,
}: {
  value: ReactNode;
  label: string;
}) {
  return (
    <Card className="flex-1 flex flex-col gap-1">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </Card>
  );
}

export function ListRow({
  title,
  meta,
  icon,
  right,
  onClick,
  danger = false,
}: {
  title: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl bg-surface border border-border px-4 py-3.5 text-left"
    >
      {icon}
      <div className="flex-1 min-w-0">
        <div
          className={`text-md font-medium truncate ${danger ? "text-danger" : ""}`}
        >
          {title}
        </div>
        {meta && <div className="text-sm text-muted truncate">{meta}</div>}
      </div>
      {right}
    </Comp>
  );
}

export function IconTile({
  children,
  size = 42,
  tinted = true,
}: {
  children: ReactNode;
  size?: number;
  tinted?: boolean;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-2xl ${
        tinted ? "bg-accent/12 text-accent" : "bg-surface2 text-muted"
      }`}
    >
      {children}
    </div>
  );
}

export function InitialsAvatar({
  name,
  size = 44,
  ink = false,
}: {
  name: string;
  size?: number;
  ink?: boolean;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`flex shrink-0 items-center justify-center rounded-2xl font-semibold ${
        ink ? "bg-ink text-[#fafafa]" : "bg-accent/12 text-accent"
      }`}
    >
      {initials}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8.5 shrink-0 whitespace-nowrap rounded-[11px] border px-3.5 text-sm font-medium transition-colors ${
        active
          ? "bg-accent border-accent text-white"
          : "bg-surface border-border text-text"
      }`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex h-13.5 w-full items-center justify-center gap-2 rounded-[17px] bg-accent text-white text-md font-semibold disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function InkButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex h-13.5 w-full items-center justify-center gap-2 rounded-[16px] bg-ink text-[#fafafa] text-md font-semibold disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex h-12.5 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-transparent text-md font-medium text-text ${className}`}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex h-12.5 w-full items-center justify-center gap-2 rounded-2xl border border-danger text-danger bg-transparent text-md font-medium ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex h-11.5 items-center justify-center gap-2 rounded-[14px] bg-surface2 border border-border text-sm font-medium text-text px-4 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-semibold text-muted px-0.5">{label}</span>
      )}
      <input
        {...props}
        className={`h-13 w-full rounded-lg border border-border bg-surface px-4 text-md outline-none focus:border-accent ${className}`}
      />
    </label>
  );
}

export function ProgressBar({
  value,
  className = "",
  color,
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  return (
    <div
      className={`h-1.5 w-full rounded-pill bg-border overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-pill transition-[width]"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color ?? "var(--accent)",
        }}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-xl bg-surface2 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`h-7 rounded-[9px] px-3 text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-accent text-white"
              : "bg-transparent text-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="relative h-7.5 w-12.5 shrink-0 rounded-pill transition-colors"
      style={{ background: on ? "var(--accent)" : "var(--border)" }}
    >
      <span
        className="absolute top-0.75 h-6 w-6 rounded-full bg-white shadow transition-[left]"
        style={{ left: on ? 23 : 3, transitionDuration: "180ms" }}
      />
    </button>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface2 border border-border text-lg"
      >
        <MinusIcon size={14} />
      </button>
      <span className="min-w-16 text-center text-md font-semibold tabular-nums">
        {format ? format(value) : value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface2 border border-border text-lg"
      >
        <PlusIcon size={14} />
      </button>
    </div>
  );
}

export function EmptyDashed({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center flex flex-col items-center gap-1.5">
      {children}
    </div>
  );
}

export function Row(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`flex items-center justify-between ${props.className ?? ""}`}
    />
  );
}
