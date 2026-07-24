"use client";

import { httpClient } from "./httpClient";

function endpointsForRoute(href: string): string[] {
  switch (href) {
    case "/panel":
      return ["/api/assets/summary"];
    case "/cryptoactivos":
      return ["/api/imports/staging"];
    case "/obligaciones-tributarias":
      return ["/api/tax/events", "/api/imports/staging"];
    case "/declaraciones":
      return [`/api/tax/summary?year=${new Date().getFullYear()}`];
    case "/origen-fondos":
      return [
        "/api/bank/summary",
        "/api/integrations/binance/connection",
        "/api/connectors/buda",
        "/api/documents?status=ACTIVE",
        "/api/imports/staging",
      ];
    case "/configuracion":
      return ["/api/configuracion/perfil"];
    case "/admin":
      return ["/api/admin/users", "/api/admin/metrics"];
    default:
      return [];
  }
}

export async function prefetchProtectedRoute(href: string): Promise<void> {
  const endpoints = endpointsForRoute(href);
  if (endpoints.length === 0) return;

  await Promise.allSettled(
    endpoints.map((url) => httpClient(url, { auth: true })),
  );
}
