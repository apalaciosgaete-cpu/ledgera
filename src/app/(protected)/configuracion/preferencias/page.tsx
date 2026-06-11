"use client";

export default function PreferenciasPage() {
  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-body)", fontSize: "20px", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>
        Preferencias
      </h2>
      <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
        Ajustes de experiencia y visualización.
      </p>

      <div
        style={{
          marginTop: "1.5rem",
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          padding: "2rem",
          textAlign: "center",
          color: "#64748B",
          fontSize: "14px",
        }}
      >
        Próximamente.
      </div>
    </div>
  );
}
