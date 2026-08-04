"use client";

import type { ReactNode } from "react";
import { useAppStore } from "@/lib/store";
import { DumbbellIcon } from "@/components/icons";

export default function HydrationGate({ children }: { children: ReactNode }) {
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] bg-ink text-[#fafafa] anim-ft-fade">
          <DumbbellIcon size={20} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
