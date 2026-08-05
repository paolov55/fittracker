"use client";

import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/lib/store";
import { DumbbellIcon } from "@/components/icons";

export default function HydrationGate({ children }: { children: ReactNode }) {
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const initAuth = useAppStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
    // roda uma única vez, ao montar o app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page">
        <div className="flex h-9.5 w-9.5 items-center justify-center rounded-md bg-ink text-[#fafafa] anim-ft-fade">
          <DumbbellIcon size={20} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
