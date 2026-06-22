"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DigitalModuleDefinition } from "@/modules/digital-operating-system";
import { fonts } from "@/styles/tokens";

type Props = {
  module: DigitalModuleDefinition;
  sections?: string[];
};

const STATUS_LABEL: Record<string, string> = {
  EMPTY: "Sin datos",
  PARTIAL: "Parcial",
  IN_REVIEW: "En revisión",
  VALIDATED: "Validado",
  REQUIRES_ACTION: "Requiere acción",
};

export function CryptoFirstModulePage({ module, sections = [] }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    router.push(`/conversaciones?q=${encodeURIComponent(clean)}&module=${encodeURIComponent(module.key)}`);
  }

  return (
    <main style={{ display: "grid", gap: 12, alignContent: "start" }}>
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 22, padding: "14px 22px" }}>
        <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 6px", textTransform: "uppercase", fontFamily: fonts.body }}>
          Patrimonio Digital
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>
              {module.label}
            </h1>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, maxWidth: 640, margin: 0, fontFamily: fonts.body }}>
              {module.description}
            </p>
          </div>
          <span style={{ border: "1px solid rgba(15,118,110,0.18)", background: "rgba(15,118,110,0.08)", color: "#0F766E", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", fontFamily: fonts.body }}>
            {STATUS_LABEL[module.status] ?? module.status}
          </span>
        </div>
      </section>

      <section style={{ background: "#071B28", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "12px" }}>
        <p style={{ color: "#4ADE80", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 6px", textTransform: "uppercase", fontFamily: fonts.body }}>
          Conversar con LEDGERA
        </p>
        <h2 style={{ color: "#F8FAFC", fontSize: "1.1rem", fontWeight: 850, margin: "0 0 10px", fontFamily: fonts.body }}>
          {module.primaryQuestion}
        </h2>
        <form onSubmit={submit} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={module.examples[0] ?? "Describe tu situación"}
            style={{ flex: "1 1 320px", minHeight: 46, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#F8FAFC", padding: "0 14px", fontSize: 14, outline: "none", fontFamily: fonts.body }}
          />
          <button type="submit" style={{ minHeight: 46, borderRadius: 14, border: "none", background: "#16A34A", color: "#FFFFFF", padding: "0 16px", fontWeight: 850, cursor: "pointer", fontFamily: fonts.body }}>
            Analizar →
          </button>
        </form>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {module.examples.map((example) => (
            <button key={example} type="button" onClick={() => setQuery(example)} style={{ border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", color: "#CBD5E1", borderRadius: 999, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontFamily: fonts.body }}>
              {example}
            </button>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {["Vista ejecutiva", "Detalle", "Documentos relacionados", "Próxima acción"].map((title, index) => (
          <article key={title} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: "10px 14px", minHeight: "105px", display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#0F766E", fontSize: 12, fontWeight: 850 }}>{String(index + 1).padStart(2, "0")}</span>
            <h3 style={{ color: "#0F2A3D", fontSize: 18, fontWeight: 850, margin: "10px 0 8px", fontFamily: fonts.body }}>{title}</h3>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: 0, fontFamily: fonts.body }}>
              {sections[index] ?? "Se alimentará con datos del Sistema Operativo Crypto First."}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
