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

const APP_ROUTES = [
  "/onboarding",
  "/importaciones",
  "/panel",
  "/cryptoactivos",
  "/origen-fondos",
  "/obligaciones-tributarias",
  "/declaraciones",
  "/documentacion",
  "/casos",
  "/configuracion",
  "/ayuda",
];

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, isHydratedFromCache, user } = useAuth();
  const publicRoute = isPublicRoute(pathname);
  const appRoute = isAppRoute(pathname);
  const wasAuthenticated = useRef(false);

  const needsOnboarding = user?.needsOnboarding === true;
  const isSupport = user?.role === "support";
  const isAdmin = user?.role === "admin";
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

    if (isAuthenticated && isSupport && appRoute) {
      router.replace("/admin/chat");
      return;
    }

    if (isAuthenticated && needsOnboarding && !appRoute && !isSupport && !isAdmin) {
      router.replace("/panel");
    }
  }, [appRoute, isAdmin, isAuthenticated, isLoading, isSupport, needsOnboarding, publicRoute, router]);

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

  if (isSupport && appRoute) {
    return null;
  }

  return <>{children}</>;
}
