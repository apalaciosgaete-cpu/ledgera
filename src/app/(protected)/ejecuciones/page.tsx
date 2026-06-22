import Link from "next/link";

type Execution = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "REJECTED";
  sourceType: string | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
};

async function getExecutions() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/execution/requests`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function EjecucionesPage() {
  const executions: Execution[] = await getExecutions();
  const pending = executions.filter((item) => item.status === "PENDING").length;
  const completed = executions.filter((item) => item.status === "COMPLETED").length;
  const failed = executions.filter((item) => item.status === "FAILED").length;

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 24 }}>
      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24 }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Motor de Ejecución Supervisada
        </p>
        <h1 style={{ color: "#0F2A3D", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
          Ejecuciones AI supervisadas
        </h1>
        <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Toda acción operativa aprobada por el usuario pasa por esta cola trazable antes de ejecutarse.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        <Metric title="Pendientes" value={pending} detail="Esperando ejecución" />
        <Metric title="Completadas" value={completed} detail="Ejecutadas correctamente" />
        <Metric title="Fallidas" value={failed} detail="Requieren revisión" />
        <Metric title="Total" value={executions.length} detail="Historial visible" />
      </section>

      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 22 }}>
        <h2 style={{ color: "#0F2A3D", fontSize: 20, fontWeight: 900, margin: "0 0 14px" }}>Historial</h2>
        {executions.length === 0 ? (
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Aún no hay ejecuciones registradas.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {executions.map((execution) => (
              <article key={execution.id} style={{ border: "1px solid #E2E8F0", borderRadius: 14, padding: 16, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <p style={{ color: colorFor(execution.status), fontSize: 12, fontWeight: 900, margin: "0 0 5px", textTransform: "uppercase" }}>
                      {execution.status} · {execution.type}
                    </p>
                    <h3 style={{ color: "#0F2A3D", fontSize: 17, fontWeight: 900, margin: 0 }}>{execution.title}</h3>
                    <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: "6px 0 0" }}>{execution.description}</p>
                  </div>
                  <p style={{ color: "#94A3B8", fontSize: 12, fontWeight: 700, margin: 0 }}>{execution.sourceType ?? "Manual"}</p>
                </div>
                {execution.error && <p style={{ color: "#B91C1C", fontSize: 13, fontWeight: 700, margin: 0 }}>{execution.error}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      <Link href="/decisiones" style={{ color: "#0F766E", fontSize: 14, fontWeight: 850, textDecoration: "none" }}>
        Volver al Centro de Decisiones →
      </Link>
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

function colorFor(status: Execution["status"]) {
  if (status === "COMPLETED") return "#15803D";
  if (status === "FAILED" || status === "REJECTED") return "#B91C1C";
  if (status === "RUNNING") return "#0369A1";
  return "#B45309";
}
