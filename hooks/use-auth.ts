"use client";

import { useStore } from "@/lib/services/store";

/** Current demo session, user and linked rider / partner profile. */
export function useAuth() {
  const session = useStore((s) => s.session);
  const user = useStore((s) => (s.session ? s.users.find((u) => u.id === s.session!.userId) : undefined));
  const rider = useStore((s) => (user?.role === "rider" ? s.riders.find((r) => r.userId === user.id) : undefined));
  const partner = useStore((s) => (user?.role === "partner" ? s.partners.find((p) => p.userId === user.id) : undefined));
  const logout = useStore((s) => s.logout);
  return { session, user, rider, partner, logout, isAuthenticated: !!user };
}
