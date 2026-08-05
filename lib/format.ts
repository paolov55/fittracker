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

export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "ft";

export const KG_TO_LB = 2.20462;
const CM_TO_IN = 1 / 2.54;

/** Converte um peso em kg (sempre a unidade de persistência) para a unidade de exibição. */
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  return unit === "lb" ? kg * KG_TO_LB : kg;
}

/** Converte um valor digitado na unidade de exibição de volta para kg (persistência). */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === "lb" ? value / KG_TO_LB : value;
}

/**
 * Formata um peso (sempre armazenado em kg) na unidade escolhida pelo
 * usuário, incluindo o sufixo. A persistência nunca muda — isto é só
 * apresentação.
 */
export function formatWeight(kg: number, unit: WeightUnit = "kg"): string {
  const value = toDisplayWeight(kg, unit);
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unit}`;
}

/** Converte uma altura em cm (sempre a unidade de persistência) para polegadas totais. */
export function toDisplayHeight(cm: number, unit: HeightUnit): number {
  return unit === "ft" ? cm * CM_TO_IN : cm;
}

/** Converte um valor digitado na unidade de exibição de volta para cm (persistência). */
export function toCm(value: number, unit: HeightUnit): number {
  return unit === "ft" ? value / CM_TO_IN : value;
}

/**
 * Formata uma altura (sempre armazenada em cm) na unidade escolhida pelo
 * usuário. Em `ft` usa o formato pés+polegadas (5'6"), como as pessoas que
 * usam o sistema imperial realmente leem — não decimal.
 */
export function formatHeight(cm: number, unit: HeightUnit = "cm"): string {
  if (unit === "cm") {
    return `${Math.round(cm)} cm`;
  }
  const totalInches = toDisplayHeight(cm, "ft");
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

export function unitLabel(unit: WeightUnit | HeightUnit): string {
  return unit;
}

/**
 * Formata um volume grande (soma de kg levantados) na unidade escolhida,
 * agrupando em toneladas (kg) ou milhares de libras (lb) — a magnitude de
 * "kg desde o início" não faz sentido em unidade fina para totais mensais.
 */
export function formatVolume(kg: number, unit: WeightUnit = "kg"): string {
  if (unit === "kg") {
    return `${(kg / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`;
  }
  const lb = toDisplayWeight(kg, "lb");
  return `${(lb / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil lb`;
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
