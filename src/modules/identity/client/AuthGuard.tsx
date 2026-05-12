"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./authContext";

const PUBLIC_ROUTES = ["/", "/bienvenida", "/login", "/register"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !publicRoute) {
      router.push("/bienvenida");
    }
  }, [isAuthenticated, isLoading, publicRoute, router]);

  if (isLoading) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Validando sesión...</p>
      </main>
    );
  }

  if (!isAuthenticated && !publicRoute) {
    return null;
  }

  return <>{children}</>;
}