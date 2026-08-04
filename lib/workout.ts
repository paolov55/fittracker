import type { DayKey } from "./db/types";
import { WEEK } from "./format";

export function todayKey(): DayKey {
  const day = new Date().getDay(); // 0=dom..6=sáb
  const idx = (day + 6) % 7; // seg=0
  return WEEK[idx].k;
}

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const idx = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - idx);
  return d;
}

export function isSameOrAfter(a: Date, b: Date) {
  return a.getTime() >= b.getTime();
}
