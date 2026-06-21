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
    (route) => pathname === route || pathname.startsWith(`${route}/`),
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
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isConfigurationRoute(pathname: string): boolean {
  return pathname === "/configuracion" || pathname.startsWith("/configuracion/");
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, isHydratedFromCache, user } = useAuth();
  const publicRoute = isPublicRoute(pathname);
  const wasAuthenticated = useRef(false);

  const needsOnboarding = user?.needsOnboarding === true;
  const canRenderFromCache = isLoading && isAuthenticated && isHydratedFromCache;

  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !publicRoute) {
      if (wasAuthenticated.current) {
        return;
      }
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isConfigurationRoute(pathname)) {
      router.replace("/panel");
      return;
    }

    if (isAuthenticated && needsOnboarding && !isOnboardingRoute(pathname)) {
      router.replace("/panel");
    }
  }, [isAuthenticated, isLoading, needsOnboarding, pathname, publicRoute, router]);

  if (isLoading && !canRenderFromCache) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#071B28",
          color: "#94A3B8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, fontWeight: 650 }}>
          Validando sesión...
        </p>
      </main>
    );
  }

  if (!isAuthenticated && !publicRoute && !wasAuthenticated.current) {
    return null;
  }

  if (isAuthenticated && isConfigurationRoute(pathname)) {
    return null;
  }

  return <>{children}</>;
}
