import Link from "next/link";

const cards = [
  {
    title: "Centro AI Usuario",
    description: "Vista consolidada de riesgo, score, memoria, aprendizaje y automatizaciones.",
    href: "/ai-center",
  },
  {
    title: "Memoria Tributaria",
    description: "Patrones históricos detectados por LEDGERA.",
    href: "/experto/memoria-tributaria",
  },
  {
    title: "Perfiles Adaptativos",
    description: "Clasificación dinámica de usuarios según comportamiento tributario.",
    href: "/experto/perfiles-adaptativos",
  },
  {
    title: "Recomendaciones",
    description: "Acciones sugeridas por el sistema para mejorar cumplimiento.",
    href: "/experto/recomendaciones",
  },
  {
    title: "Tareas",
    description: "Seguimiento operativo de acciones pendientes y críticas.",
    href: "/experto/tareas",
  },
  {
    title: "Auditoría AI",
    description: "Eventos de AI, aprendizaje, memoria y orquestación registrados.",
    href: "/experto/auditoria",
  },
];

export default function ExpertoAICenterPage() {
  return (
    <main style={{ display: "grid", gap: 24 }}>
      <section style={{ background: "#0B1D2C", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
        <p style={{ color: "#4ADE80", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 8px", textTransform: "uppercase" }}>
          LEDGERA AI · Experto
        </p>
        <h1 style={{ color: "#F8FAFC", fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
          Centro AI Experto
        </h1>
        <p style={{ color: "#94A3B8", maxWidth: 760, lineHeight: 1.65, margin: 0 }}>
          Acceso rápido a memoria tributaria, perfiles adaptativos, recomendaciones, tareas, auditoría y centro AI de usuario.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
            <article style={{ height: "100%", background: "#0F2537", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: 20 }}>
              <h2 style={{ color: "#F8FAFC", fontSize: 18, fontWeight: 850, margin: "0 0 8px" }}>{card.title}</h2>
              <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.55, margin: "0 0 16px" }}>{card.description}</p>
              <span style={{ color: "#4ADE80", fontSize: 13, fontWeight: 850 }}>Abrir →</span>
            </article>
          </Link>
        ))}
      </section>
    </main>
  );
}
