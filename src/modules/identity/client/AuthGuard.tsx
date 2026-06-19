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

const ONBOARDING_ROUTES = [
  "/onboarding",
  "/integraciones",
  "/import",
  "/import/manual",
  "/import/binance",
  "/import/bank",
  "/importaciones",
  "/panel",
  "/patrimonio-digital",
  "/cryptoactivos",
  "/exchanges",
  "/wallets",
  "/origen-fondos",
  "/obligaciones-tributarias",
  "/documentacion",
  "/casos",
  "/conversaciones",
  "/ayuda",
];

function isOnboardingRoute(pathname: string): boolean {
  return ONBOARDING_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router        = useRouter();
  const pathname      = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();
  const publicRoute   = isPublicRoute(pathname);
  const wasAuthenticated = useRef(false);

  const needsOnboarding = user?.needsOnboarding === true;

  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !publicRoute) {
      if (wasAuthenticated.current) {
        return;
      }
      router.push("/login");
      return;
    }

    if (!isLoading && isAuthenticated && needsOnboarding && !isOnboardingRoute(pathname)) {
      router.push("/panel");
    }
  }, [isAuthenticated, isLoading, needsOnboarding, pathname, publicRoute, router]);

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
