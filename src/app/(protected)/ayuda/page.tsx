"use client";

import { fonts } from "@/styles/tokens";

export default function AyudaPage() {
  return (
    <section style={{ maxWidth: 700, width: "100%" }}>
      <h1 style={{ color: "#0F2A3D", fontSize: "1.8rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px", fontFamily: fonts.display }}>
        Centro de Ayuda
      </h1>
      <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: "0 0 32px" }}>
        Encuentra respuestas a tus preguntas sobre LEDGERA.
      </p>

      <div style={{ display: "grid", gap: 16 }}>
        <HelpCard
          title="¿Qué es LEDGERA?"
          description="LEDGERA es un Sistema Operativo Financiero y Tributario que te ayuda a entender las consecuencias de tus decisiones antes de actuar."
        />
        <HelpCard
          title="¿Cómo empezar una conversación?"
          description="Desde la pantalla principal, escribe tu consulta en el campo de texto o haz clic en '+ Nueva conversación' en el header."
        />
        <HelpCard
          title="¿Qué es el Expediente?"
          description="Tu Expediente reúne toda tu información financiera y tributaria: perfil, patrimonio, operaciones y documentos en un solo lugar."
        />
        <HelpCard
          title="Soporte humano"
          description="Si necesitas ayuda personalizada, contáctanos en soporte@ledgera.cl y te responderemos a la brevedad."
        />
      </div>
    </section>
  );
}

function HelpCard({ title, description }: { title: string; description: string }) {
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: 12,
      padding: "20px 24px",
    }}>
      <h3 style={{ color: "#0F2A3D", fontSize: 15, fontWeight: 800, margin: "0 0 6px", fontFamily: fonts.body }}>
        {title}
      </h3>
      <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
        {description}
      </p>
    </div>
  );
}
