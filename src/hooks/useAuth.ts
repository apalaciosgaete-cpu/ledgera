"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    signIn: (provider?: string) => signIn(provider),
    signOut: () => signOut({ callbackUrl: "/" }),
  };
}
