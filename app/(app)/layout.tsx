"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useRole } from "@/lib/hooks";
import BottomNav from "@/components/nav/BottomNav";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const currentUserId = useAppStore((s) => s.currentUserId);
  const role = useRole();

  useEffect(() => {
    if (!currentUserId) router.replace("/login");
  }, [currentUserId, router]);

  if (!currentUserId) return null;

  return (
    <div className="flex min-h-dvh justify-center bg-page">
      <div className="relative flex w-full max-w-[430px] flex-col bg-bg min-h-dvh">
        {children}
        <BottomNav role={role} />
      </div>
    </div>
  );
}
