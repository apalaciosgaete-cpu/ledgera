import Link from "next/link";

function isValidHash(value: string | null): boolean {
  return Boolean(value && /^[a-f0-9]{64}$/i.test(value));
}

function isValidFolio(value: string | null): boolean {
  return Boolean(value && /^LED-[A-Z0-9-]{6,64}$/i.test(value));
}

export default function VerifyReportPage({ searchParams }: { searchParams: { folio?: string; hash?: string; year?: string } }) {
  const folio = searchParams.folio ?? null;
  const hash = searchParams.hash ?? null;
  const year = searchParams.year ?? null;
  const valid = isValidFolio(folio) && isValidHash(hash);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-sunken)", color: "var(--text)", display: "grid", placeItems: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ width: "min(760px, 100%)", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 24, boxShadow: "0 24px 70px rgba(15,42,61,0.10)", padding: 28, display: "grid", gap: 18 }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", margin: "0 0 6px", textTransform: "uppercase" }}>LEDGERA</p>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(1.45rem, 4vw, 2rem)", fontWeight: 950, letterSpacing: "-0.045em", lineHeight: 1.05, margin: 0 }}>Verificación de trazabilidad</h1>
          </div>
          <span style={{ background: valid ? "var(--accent-soft)" : "rgba(196,99,74,0.14)", border: valid ? "1px solid var(--accent-soft)" : "1px solid rgba(196,99,74,0.14)", color: valid ? "var(--accent)" : "var(--loss)", borderRadius: 999, fontSize: 13, fontWeight: 900, padding: "8px 12px" }}>
            {valid ? "Formato verificable" : "Parámetros inválidos"}
          </span>
        </header>

        <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
          Esta pantalla permite contrastar el folio y el hash impresos en el respaldo generado por LEDGERA. Si el hash del documento descargado coincide con el hash mostrado aquí, la trazabilidad declarada no fue alterada.
        </p>

        <section style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 18, padding: 16, display: "grid", gap: 10 }}>
          <div>
            <p style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 850, margin: "0 0 3px" }}>Folio</p>
            <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 900, margin: 0, overflowWrap: "anywhere" }}>{folio ?? "—"}</p>
          </div>
          <div>
            <p style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 850, margin: "0 0 3px" }}>Hash de trazabilidad</p>
            <p style={{ color: "var(--text)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5, fontWeight: 800, margin: 0, overflowWrap: "anywhere" }}>{hash ?? "—"}</p>
          </div>
          <div>
            <p style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 850, margin: "0 0 3px" }}>Año</p>
            <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 850, margin: 0 }}>{year ?? "Todos"}</p>
          </div>
        </section>

        <section style={{ background: valid ? "var(--accent-soft)" : "var(--bg-elev)", border: valid ? "1px solid var(--accent-soft)" : "1px solid var(--border)", borderRadius: 18, padding: 16 }}>
          <h2 style={{ color: valid ? "var(--accent)" : "var(--text-soft)", fontSize: 16, fontWeight: 950, margin: "0 0 6px" }}>
            {valid ? "Documento con identificadores de trazabilidad válidos" : "No es posible verificar este enlace"}
          </h2>
          <p style={{ color: valid ? "var(--accent)" : "var(--text)", fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
            {valid
              ? "El folio y el hash tienen formato válido. Para validación material, compare este hash con el hash impreso en el PDF o Excel generado desde LEDGERA."
              : "El enlace no contiene un folio o hash válido. Genere nuevamente el respaldo desde LEDGERA."}
          </p>
        </section>

        <footer style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <p style={{ color: "var(--text-soft)", fontSize: 12.5, margin: 0 }}>Verificación pública de respaldo de movimientos.</p>
          <Link href="/bienvenida" style={{ color: "var(--accent)", fontSize: 13, fontWeight: 900, textDecoration: "none" }}>Ir a LEDGERA</Link>
        </footer>
      </section>
    </main>
  );
}
