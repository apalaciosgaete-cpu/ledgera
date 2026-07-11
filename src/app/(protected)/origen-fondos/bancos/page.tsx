"use client";

import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";

type ProviderId = "fintoc" | "floid" | "sfa";

type BankProvider = {
  id: ProviderId;
  name: string;
  eyebrow: string;
  description: string;
  capability: string;
  status: string;
  enabled: boolean;
};

const PROVIDERS: BankProvider[] = [
  {
    id: "fintoc",
    name: "Fintoc",
    eyebrow: "Proveedor comercial",
    description: "Conexión bancaria de solo lectura mediante una cuenta comercial propia.",
    capability: "Cuentas, saldos y movimientos",
    status: "Disponible para integrar",
    enabled: true,
  },
  {
    id: "floid",
    name: "Floid",
    eyebrow: "Proveedor comercial",
    description: "Integración de datos bancarios y conciliación mediante una cuenta comercial propia.",
    capability: "Datos bancarios y conciliación",
    status: "Disponible para integrar",
    enabled: true,
  },
  {
    id: "sfa",
    name: "SFA · CMF",
    eyebrow: "Sistema regulado",
    description: "Acceso regulado al Sistema de Finanzas Abiertas cuando entre en operación.",
    capability: "Infraestructura financiera abierta",
    status: "Próximamente · 2028",
    enabled: false,
  },
];

function ProviderIcon({ id }: { id: ProviderId }) {
  if (id === "fintoc") {
    return (
      <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="7" y="9" width="34" height="30" rx="10" stroke="currentColor" strokeWidth="2.2" />
        <path d="M15 30V20M24 34V15M33 27V22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "floid") {
    return (
      <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M10 15.5C10 12.5 12.5 10 15.5 10h17C35.5 10 38 12.5 38 15.5v17c0 3-2.5 5.5-5.5 5.5h-17C12.5 38 10 35.5 10 32.5v-17Z" stroke="currentColor" strokeWidth="2.2" />
        <path d="M16 25h16M24 17v16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="24" cy="25" r="5" fill="var(--bg-elev)" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }

  return (
    <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 20h32M12 20v15M20 20v15M28 20v15M36 20v15M8 36h32M24 8l16 8H8l16-8Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BancosOrigenFondosPage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", display: "grid", alignContent: "start", gap: 24, fontFamily: fonts.body }}>
      <section style={{ display: "grid", gap: 8 }}>
        <button onClick={() => router.push("/origen-fondos")} style={{ width: "fit-content", display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0 }}>
          ← Volver a Origen de Fondos
        </button>
        <div style={{ display: "grid", gap: 5 }}>
          <h1 style={{ color: "var(--text)", fontSize: "clamp(1.65rem,3vw,2.25rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.045em", fontFamily: fonts.display }}>
            Conexión bancaria
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.55, margin: 0, maxWidth: 720 }}>
            Selecciona el proveedor mediante el cual se implementará el acceso de solo lectura a cuentas y movimientos bancarios.
          </p>
        </div>
      </section>

      <section style={{ width: "100%", maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 16, alignItems: "stretch" }}>
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            disabled={!provider.enabled}
            onClick={() => provider.enabled && router.push(`/origen-fondos/bancos/${provider.id}`)}
            style={{
              minHeight: 300,
              borderRadius: 22,
              border: `1px solid ${provider.enabled ? "var(--border-strong)" : "var(--border)"}`,
              background: provider.enabled ? "var(--bg-elev)" : "var(--bg-sunken)",
              color: "var(--text)",
              cursor: provider.enabled ? "pointer" : "not-allowed",
              display: "grid",
              gridTemplateRows: "auto auto 1fr auto",
              gap: 18,
              padding: 24,
              textAlign: "left",
              opacity: provider.enabled ? 1 : 0.58,
              boxShadow: provider.enabled ? "var(--shadow-sm)" : "none",
              fontFamily: fonts.body,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ width: 62, height: 62, borderRadius: 18, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}>
                <ProviderIcon id={provider.id} />
              </span>
              <span style={{ borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-sunken)", color: provider.enabled ? "var(--accent)" : "var(--text-faint)", padding: "6px 10px", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".045em", textAlign: "center" }}>
                {provider.status}
              </span>
            </div>

            <div style={{ display: "grid", gap: 5 }}>
              <span style={{ color: "var(--text-faint)", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em" }}>{provider.eyebrow}</span>
              <strong style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 900, letterSpacing: "-.035em" }}>{provider.name}</strong>
            </div>

            <div style={{ display: "grid", alignContent: "start", gap: 12 }}>
              <p style={{ color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{provider.description}</p>
              <span style={{ color: "var(--text)", fontSize: 12.5, fontWeight: 800 }}>{provider.capability}</span>
            </div>

            <span style={{ color: provider.enabled ? "var(--accent)" : "var(--text-faint)", fontSize: 13, fontWeight: 900 }}>
              {provider.enabled ? "Revisar implementación →" : "No disponible todavía"}
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}
