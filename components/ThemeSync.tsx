"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function ThemeSync() {
  const theme = useAppStore((s) => s.theme);
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, hasHydrated]);

  return null;
}
