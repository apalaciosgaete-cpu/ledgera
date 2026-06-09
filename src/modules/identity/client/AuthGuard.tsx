// src/modules/identity/client/AuthGuard.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./authContext";

const PUBLIC_ROUTES = [
  "/",
  "/bienvenida",
  "/login",
  "/register",
  "/blocked",
  "/verify/report",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

const TWOFAGATE_ROUTES = [
  "/configuracion",
  "/configuracion/perfil",
  "/configuracion/seguridad",
  "/configuracion/facturacion",
  "/configuracion/admin",
];

function is2FAGateRoute(pathname: string): boolean {
  return TWOFAGATE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router        = useRouter();
  const pathname      = usePathname();
  const { isAuthenticated, isLoading, needs2FA } = useAuth();
  const publicRoute   = isPublicRoute(pathname);
  const wasAuthenticated = useRef(false);

  // Trackear si el usuario estaba autenticado antes
  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !publicRoute) {
      // Si el usuario estaba autenticado y ahora no lo está
      // significa que hizo logout → no redirigir aquí, el layout lo maneja
      if (wasAuthenticated.current) {
        return;
      }
      router.push("/login");
      return;
    }

    if (!isLoading && isAuthenticated && needs2FA && !is2FAGateRoute(pathname)) {
      router.push("/configuracion/seguridad?setup2fa=1");
    }
  }, [isAuthenticated, isLoading, needs2FA, pathname, publicRoute, router]);

  if (isLoading) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Validando sesión...</p>
      </main>
    );
  }

  if (!isAuthenticated && !publicRoute && !wasAuthenticated.current) {
    return null;
  }

  return <>{children}</>;
}