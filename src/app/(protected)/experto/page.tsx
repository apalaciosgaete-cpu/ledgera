"use client";

import Link from "next/link";
import { Feature } from "@/modules/subscription/domain/planFeatures";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { UpgradeCard } from "@/components/subscription/UpgradeCard";

const areas = [
  {
    title: "Tributario",
    href: "/experto/tributario",
    desc: "Estado tributario, simulación, cierre y reportes para el SII.",
  },
  {
    title: "Auditoría",
    href: "/experto/auditoria",
    desc: "FIFO, operaciones, eventos, integridad y trazabilidad.",
  },
  {
    title: "Reportes",
    href: "/experto/reportes",
    desc: "Exportación CSV, PDF y respaldo ante fiscalización.",
  },
  {
    title: "Memoria Tributaria",
    href: "/experto/memoria-tributaria",
    desc: "Visión completa e inteligente del historial tributario con insights.",
  },
  {
    title: "Perfiles Adaptativos",
    href: "/experto/perfiles-adaptativos",
    desc: "Distribución de perfiles de usuarios según su comportamiento tributario.",
  },
  {
    title: "Declaraciones",
    href: "/experto/declaraciones",
    desc: "Cadena de custodia de declaraciones juradas.",
  },
  {
    title: "Verificaciones",
    href: "/experto/verificaciones",
    desc: "Hashes públicos, estados y revocaciones de documentos.",
  },
  {
    title: "Operaciones",
    href: "/experto/operaciones",
    desc: "Revisión detallada de movimientos auditados.",
  },
];

export default function ExpertoPage() {
  return (
    <FeatureGate
      feature={Feature.EXPERT_MODE}
      source="experto_landing"
      fallback={
        <div style={{ maxWidth: 900, width: "100%", display: "flex", justifyContent: "center", paddingTop: 40 }}>
          <UpgradeCard feature={Feature.EXPERT_MODE} source="experto_landing" />
        </div>
      }
    >
    <div style={{ maxWidth: 900, width: "100%" }}>
      <section style={{ marginBottom: 28 }}>
        <p
          style={{
            color: "#0F766E",
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: "0.06em",
            margin: "0 0 7px",
            textTransform: "uppercase",
          }}
        >
          Modo Experto
        </p>
        <h1
          style={{
            color: "#F8FAFC",
            fontSize: "1.9rem",
            fontWeight: 850,
            lineHeight: 1.12,
            margin: "0 0 8px",
          }}
        >
          Detalle técnico
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
          Herramientas de profundidad para contadores, auditores y usuarios avanzados.
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
        }}
      >
        {areas.map((a) => (
          <Link
            key={a.title}
            href={a.href}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "22px",
              textDecoration: "none",
              display: "block",
              transition: "all 0.15s ease",
            }}
          >
            <h3
              style={{
                color: "#F8FAFC",
                fontSize: "1.05rem",
                fontWeight: 850,
                margin: "0 0 6px",
              }}
            >
              {a.title}
            </h3>
            <p style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              {a.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
    </FeatureGate>
  );
}
