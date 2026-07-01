import Link from "next/link";

async function getData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/ai-center`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function AICenterPage() {
  const data = await getData();

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-blue-600">LEDGERA AI</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Centro AI Unificado</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Aquí se reúne tu riesgo, score, memoria tributaria, aprendizaje, recomendaciones y automatizaciones.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/memoria-tributaria" className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700">Ver memoria</Link>
          <Link href="/mi-perfil-tributario" className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700">Ver perfil</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card title="Riesgo" value={data?.risk?.level ?? "Sin calcular"} detail={data?.risk?.score ? `${data.risk.score}/100` : "Ejecuta una actualización"} />
        <Card title="Score Tributario" value={data?.smartScore ?? "Sin dato"} detail="Estado inteligente" />
        <Card title="Alertas" value={data?.counts?.alerts ?? 0} detail="Abiertas" />
        <Card title="Automatizaciones" value={data?.counts?.automationProposals ?? 0} detail="Propuestas pendientes" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card title="Tareas" value={data?.counts?.tasks ?? 0} detail="Pendientes" />
        <Card title="Recomendaciones" value={data?.counts?.recommendations ?? 0} detail="Activas" />
        <Card title="Memoria" value={data?.counts?.memoryPatterns ?? 0} detail="Patrones detectados" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Aprendizaje tributario</h2>
          {data?.learning ? (
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <p>Recomendaciones aceptadas: <b>{data.learning.recommendationAcceptanceRate}%</b></p>
              <p>Automatizaciones aceptadas: <b>{data.learning.automationAcceptanceRate}%</b></p>
              <p>Tareas completadas: <b>{data.learning.taskCompletionRate}%</b></p>
              <p>Tendencia score: <b>{data.learning.scoreTrend}</b></p>
            </div>
          ) : <p className="mt-3 text-sm text-slate-500">Aún no hay suficientes datos de aprendizaje.</p>}
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Memoria reciente</h2>
          <div className="mt-4 space-y-3">
            {(data?.memory ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Aún no hay patrones visibles.</p>
            ) : data.memory.map((item: { id: string; title: string; description: string; strength: string }) => (
              <div key={item.id} className="rounded-xl border p-3">
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-600">{item.description}</p>
                <p className="mt-1 text-xs text-slate-500">Fuerza: {item.strength}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}
