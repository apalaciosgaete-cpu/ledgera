"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { fonts } from "@/styles/tokens";

type ProviderId = "fintoc" | "floid" | "sfa";

type Provider = {
  id: ProviderId;
  name: string;
  category: string;
  status: string;
  enabled: boolean;
  description: string;
  currentCondition: string;
  scope: string[];
};

const PROVIDERS: Record<ProviderId, Provider> = {
  fintoc: {
    id: "fintoc",
    name: "Fintoc",
    category: "Proveedor comercial",
    status: "Disponible para integrar",
    enabled: true,
    description: "Permite implementar acceso de solo lectura a cuentas, saldos y movimientos bancarios mediante su infraestructura.",
    currentCondition: "Hasta que LEDGERA disponga de un acuerdo comercial propio, esta alternativa requiere una cuenta empresarial de Fintoc y que su costo sea asumido por el cliente que solicite la integración.",
    scope: ["Autorización mediante el flujo del proveedor", "Consulta de cuentas y movimientos", "Sin permisos para pagos o transferencias"],
  },
  floid: {
    id: "floid",
    name: "Floid",
    category: "Proveedor comercial",
    status: "Disponible para integrar",
    enabled: true,
    description: "Permite implementar agregación de información bancaria y conciliación mediante una cuenta comercial del proveedor.",
    currentCondition: "Hasta que LEDGERA disponga de un acuerdo comercial propio, esta alternativa requiere una cuenta empresarial de Floid y que su costo sea asumido por el cliente que solicite la integración.",
    scope: ["Autorización mediante el flujo del proveedor", "Acceso de solo lectura a datos bancarios", "Conciliación con movimientos registrados en LEDGERA"],
  },
  sfa: {
    id: "sfa",
    name: "SFA · CMF",
    category: "Sistema regulado",
    status: "Próximamente · 2028",
    enabled: false,
    description: "Será la infraestructura regulada del Sistema de Finanzas Abiertas para acceder a información financiera autorizada por el usuario.",
    currentCondition: "La conexión productiva todavía no está disponible. LEDGERA deberá integrarse directamente o mediante un proveedor registrado cuando el sistema entre en operación.",
    scope: ["Consentimiento regulado", "Acceso estandarizado de solo lectura", "Revocación y trazabilidad del acceso"],
  },
};

function ProviderIcon({ id }: { id: ProviderId }) {
  if (id === "fintoc") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="7" y="9" width="34" height="30" rx="10" stroke="currentColor" strokeWidth="2.2" />
        <path d="M15 30V20M24 34V15M33 27V22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "floid") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M10 15.5C10 12.5 12.5 10 15.5 10h17C35.5 10 38 12.5 38 15.5v17c0 3-2.5 5.5-5.5 5.5h-17C12.5 38 10 35.5 10 32.5v-17Z" stroke="currentColor" strokeWidth="2.2" />
        <path d="M16 25h16M24 17v16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="24" cy="25" r="5" fill="var(--bg-elev)" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 20h32M12 20v15M20 20v15M28 20v15M36 20v15M8 36h32M24 8l16 8H8l16-8Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BankProviderPage() {
  const params = useParams<{ bankId: string }>();
  const provider = PROVIDERS[params.bankId as ProviderId];

  if (!provider) notFound();

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", display: "grid", alignContent: "start", gap: 22, fontFamily: fonts.body }}>
      <Link href="/origen-fondos/bancos" style={{ width: "fit-content", color: "var(--text-soft)", fontSize: 13, textDecoration: "none" }}>
        ← Volver a conexión bancaria
      </Link>

      <section style={{ maxWidth: 960, width: "100%", margin: "0 auto", display: "grid", gap: 18 }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ width: 72, height: 72, borderRadius: 20, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}>
              <ProviderIcon id={provider.id} />
            </span>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ color: "var(--text-faint)", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em" }}>{provider.category}</span>
              <h1 style={{ color: "var(--text)", fontFamily: fonts.display, fontSize: "clamp(1.8rem,3.2vw,2.5rem)", fontWeight: 900, letterSpacing: "-.045em", margin: 0 }}>{provider.name}</h1>
            </div>
          </div>

          <span style={{ borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-sunken)", color: provider.enabled ? "var(--accent)" : "var(--text-faint)", padding: "8px 12px", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".045em" }}>
            {provider.status}
          </span>
        </header>

        <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 22, padding: "clamp(20px,3vw,28px)", display: "grid", gap: 20, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <h2 style={{ color: "var(--text)", fontSize: 19, fontWeight: 900, margin: 0 }}>Implementación en LEDGERA</h2>
            <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{provider.description}</p>
          </div>

          <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, display: "grid", gap: 7 }}>
            <strong style={{ color: "var(--text)", fontSize: 13.5 }}>Condición actual</strong>
            <p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{provider.currentCondition}</p>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <strong style={{ color: "var(--text)", fontSize: 13.5 }}>Alcance previsto</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
              {provider.scope.map((item) => (
                <div key={item} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.45, background: "var(--bg-sunken)" }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {provider.enabled ? (
              <span style={{ borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent)", padding: "10px 14px", fontSize: 12.5, fontWeight: 900 }}>
                Preparado para integración comercial
              </span>
            ) : (
              <span style={{ borderRadius: 999, background: "var(--bg-sunken)", border: "1px solid var(--border)", color: "var(--text-faint)", padding: "10px 14px", fontSize: 12.5, fontWeight: 900 }}>
                Integración aún no disponible
              </span>
            )}

            <Link href="/import/bank" style={{ borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--bg-sunken)", color: "var(--text)", padding: "10px 14px", fontSize: 12.5, fontWeight: 900, textDecoration: "none" }}>
              Importar cartola mientras se habilita
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
