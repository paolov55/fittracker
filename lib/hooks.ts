"use client";

import { useAppStore } from "./store";

export function useCurrentProfile() {
  const id = useAppStore((s) => s.currentUserId);
  return useAppStore((s) => s.profiles.find((p) => p.id === id) ?? null);
}

export function useRole(): "student" | "trainer" {
  const profile = useCurrentProfile();
  return profile?.role ?? "student";
}

export function useStudentDetails(profileId: string | undefined) {
  return useAppStore((s) => s.studentDetails.find((d) => d.profile_id === profileId) ?? null);
}

export function useTrainerDetails(profileId: string | undefined) {
  return useAppStore((s) => s.trainerDetails.find((d) => d.profile_id === profileId) ?? null);
}
