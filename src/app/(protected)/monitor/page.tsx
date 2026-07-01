import Link from "next/link";

async function getMonitoringData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/monitoring/signals`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

type Signal = {
  id: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  value: number | string | null;
};

export default async function MonitorPage() {
  const data = await getMonitoringData();
  const signals: Signal[] = data?.signals ?? [];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24 }}>
      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Monitor Tributario
        </p>
        <h1 style={{ color: "var(--text)", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
          Estado en tiempo real
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          LEDGERA revisa señales críticas, tareas, documentos, recomendaciones, automatizaciones y planes AI pendientes.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        <Metric title="Estado" value={data?.status ?? "Sin datos"} detail="Evaluación general" />
        <Metric title="Críticas" value={data?.criticalCount ?? 0} detail="Señales críticas" />
        <Metric title="Advertencias" value={data?.warningCount ?? 0} detail="Señales de atención" />
        <Metric title="Total señales" value={signals.length} detail="Detectadas ahora" />
      </section>

      <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 18, padding: 22 }}>
        <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 900, margin: "0 0 14px" }}>
          Señales activas
        </h2>

        {signals.length === 0 ? (
          <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-soft)", borderRadius: 14, padding: 18 }}>
            <p style={{ color: "var(--accent)", fontSize: 16, fontWeight: 850, margin: "0 0 4px" }}>Sin señales críticas</p>
            <p style={{ color: "var(--accent)", fontSize: 14, margin: 0 }}>No se detectan riesgos urgentes en este momento.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {signals.map((signal) => (
              <article key={signal.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <p style={{ color: colorFor(signal.severity), fontSize: 12, fontWeight: 900, margin: "0 0 5px", textTransform: "uppercase" }}>
                      {signal.severity}
                    </p>
                    <h3 style={{ color: "var(--text)", fontSize: 17, fontWeight: 900, margin: 0 }}>{signal.title}</h3>
                    <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.55, margin: "6px 0 0" }}>{signal.description}</p>
                  </div>
                  <p style={{ color: "var(--text)", fontSize: 22, fontWeight: 900, margin: 0 }}>{signal.value ?? "—"}</p>
                </div>
                <Link href={signal.actionHref} style={{ color: "var(--accent)", fontSize: 14, fontWeight: 850, textDecoration: "none" }}>
                  {signal.actionLabel} →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
      <p style={{ color: "var(--text-soft)", fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>{title}</p>
      <p style={{ color: "var(--text)", fontSize: 26, fontWeight: 900, margin: 0 }}>{value}</p>
      <p style={{ color: "var(--text-soft)", fontSize: 13, margin: "4px 0 0" }}>{detail}</p>
    </article>
  );
}

function colorFor(severity: Signal["severity"]) {
  if (severity === "CRITICAL") return "#C4634A";
  if (severity === "WARNING") return "#E8B84B";
  return "#3FA687";
}
