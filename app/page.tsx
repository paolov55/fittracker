"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function RootPage() {
  const router = useRouter();
  const currentUserId = useAppStore((s) => s.currentUserId);

  useEffect(() => {
    router.replace(currentUserId ? "/inicio" : "/login");
  }, [currentUserId, router]);

  return null;
}
