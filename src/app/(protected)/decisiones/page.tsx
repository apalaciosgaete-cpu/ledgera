import Link from "next/link";

type Decision = {
  id: string;
  category: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  impact: string;
  actionLabel: string;
  actionHref: string;
  score: number;
};

async function getDecisionData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/decisions`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function DecisionesPage() {
  const data = await getDecisionData();
  const decisions: Decision[] = data?.decisions ?? [];
  const urgent = decisions.filter((decision) => decision.priority === "CRITICAL");
  const attention = decisions.filter((decision) => decision.priority === "HIGH" || decision.priority === "MEDIUM");
  const opportunities = decisions.filter((decision) => decision.priority === "LOW");

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 24 }}>
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Centro de Decisiones
        </p>
        <h1 style={{ color: "#0F2A3D", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
          Decisiones tributarias priorizadas
        </h1>
        <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          LEDGERA reúne monitor, recomendaciones, automatizaciones y planes AI en una sola cola de acción.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        <Metric title="Total" value={decisions.length} detail="Decisiones detectadas" />
        <Metric title="Urgentes" value={data?.criticalCount ?? 0} detail="Prioridad crítica" />
        <Metric title="Alta prioridad" value={data?.highCount ?? 0} detail="Requieren atención" />
        <Metric title="Actualizado" value={data?.generatedAt ? "Ahora" : "Sin datos"} detail="Motor de decisiones" />
      </section>

      <DecisionGroup title="Urgente" subtitle="Resolver primero" decisions={urgent} empty="No hay decisiones críticas." />
      <DecisionGroup title="Atención" subtitle="Priorizar durante la jornada" decisions={attention} empty="No hay decisiones de atención." />
      <DecisionGroup title="Oportunidades" subtitle="Acciones de mejora" decisions={opportunities} empty="No hay oportunidades pendientes." />
    </main>
  );
}

function Metric({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 18 }}>
      <p style={{ color: "#64748B", fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>{title}</p>
      <p style={{ color: "#0F2A3D", fontSize: 26, fontWeight: 900, margin: 0 }}>{value}</p>
      <p style={{ color: "#94A3B8", fontSize: 13, margin: "4px 0 0" }}>{detail}</p>
    </article>
  );
}

function DecisionGroup({ title, subtitle, decisions, empty }: { title: string; subtitle: string; decisions: Decision[]; empty: string }) {
  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 22 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ color: "#0F2A3D", fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>{title}</h2>
        <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>{subtitle}</p>
      </div>

      {decisions.length === 0 ? (
        <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>{empty}</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {decisions.map((decision) => (
            <article key={decision.id} style={{ border: "1px solid #E2E8F0", borderRadius: 14, padding: 16, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: colorFor(decision.priority), fontSize: 12, fontWeight: 900, margin: "0 0 5px", textTransform: "uppercase" }}>
                    {decision.priority} · {decision.category}
                  </p>
                  <h3 style={{ color: "#0F2A3D", fontSize: 17, fontWeight: 900, margin: 0 }}>{decision.title}</h3>
                  <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: "6px 0 0" }}>{decision.description}</p>
                </div>
                <p style={{ color: "#0F2A3D", fontSize: 22, fontWeight: 900, margin: 0 }}>{decision.score}</p>
              </div>
              <p style={{ color: "#334155", fontSize: 13, fontWeight: 700, margin: 0 }}>Impacto: {decision.impact}</p>
              <Link href={decision.actionHref} style={{ color: "#0F766E", fontSize: 14, fontWeight: 850, textDecoration: "none" }}>
                {decision.actionLabel} →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function colorFor(priority: Decision["priority"]) {
  if (priority === "CRITICAL") return "#B91C1C";
  if (priority === "HIGH") return "#B45309";
  if (priority === "MEDIUM") return "#0369A1";
  return "#0F766E";
}
