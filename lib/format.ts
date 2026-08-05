import type { DayKey } from "./db/types";

export const WEEK: { k: DayKey; short: string; label: string; letter: string }[] = [
  { k: "seg", short: "Seg", label: "Segunda", letter: "S" },
  { k: "ter", short: "Ter", label: "Terça", letter: "T" },
  { k: "qua", short: "Qua", label: "Quarta", letter: "Q" },
  { k: "qui", short: "Qui", label: "Quinta", letter: "Q" },
  { k: "sex", short: "Sex", label: "Sexta", letter: "S" },
  { k: "sab", short: "Sáb", label: "Sábado", letter: "S" },
  { k: "dom", short: "Dom", label: "Domingo", letter: "D" },
];

export const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export function restLabel(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (rem === 0) return `${m} min`;
  return `${m}min ${rem}s`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function weekdayLabel(iso: string): string {
  const d = new Date(iso);
  const idx = (d.getDay() + 6) % 7; // 0 = segunda
  return WEEK[idx].short.toLowerCase();
}

export function formatKg(kg: number): string {
  return kg.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

const KG_TO_LB = 2.20462;

/**
 * Formata um peso (sempre armazenado em kg) na unidade escolhida pelo
 * usuário, incluindo o sufixo. A persistência nunca muda — isto é só
 * apresentação.
 */
export function formatWeight(kg: number, unit: "kg" | "lb" = "kg"): string {
  const value = unit === "lb" ? kg * KG_TO_LB : kg;
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unit}`;
}

export function formatWeekday(dateObj = new Date()): string {
  const dias = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
    "Quinta-feira", "Sexta-feira", "Sábado",
  ];
  return `${dias[dateObj.getDay()]}, ${dateObj.getDate()} de ${MONTHS[dateObj.getMonth()]}`;
}

export function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

export function initials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
