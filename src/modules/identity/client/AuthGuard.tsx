"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./authContext";

const PUBLIC_ROUTES = ["/", "/bienvenida", "/login", "/register"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const isPublic = PUBLIC_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );
      if (!isPublic) {
        router.push("/bienvenida");
      }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Validando sesion...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}