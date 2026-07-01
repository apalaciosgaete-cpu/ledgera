"use client";

import { useEffect, useState } from "react";

export default function SiiPanelPage() {
  const [status, setStatus] = useState<{ environment: string; status: string } | null>(null);
  const [cafs, setCafs] = useState<
    Array<{
      id: string;
      documentType: string;
      folioStart: number;
      folioEnd: number;
      currentFolio: number;
      available: number;
      isActive: boolean;
      uploadedAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [statusRes, cafsRes] = await Promise.all([
          fetch("/api/sii/status"),
          fetch("/api/sii/caf"),
        ]);

        const statusJson = await statusRes.json();
        const cafsJson = await cafsRes.json();

        if (statusJson.ok) setStatus(statusJson.data);
        if (cafsJson.ok) setCafs(cafsJson.data);
      } catch (error) {
        console.error("[SII panel] error loading data", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleTestConnection() {
    setTestResult(null);
    try {
      const res = await fetch("/api/sii/test-connection", { method: "POST" });
      const json = await res.json();
      setTestResult(json.ok ? "Conexión exitosa" : json.message ?? "Error");
    } catch (error) {
      setTestResult("Error de conexión");
    }
  }

  return (
    <section style={{ padding: "24px 0" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 850, margin: "0 0 8px" }}>
          Integración SII
        </h1>
        <p style={{ color: "var(--text-soft)", margin: 0 }}>
          Estado, certificados, CAF y folios para emisión de DTE.
        </p>
      </header>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>Estado de conexión</h2>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Ambiente:</strong> {status?.environment ?? "—"}
            </p>
            <p style={{ margin: "0 0 16px" }}>
              <strong>Estado:</strong> {status?.status ?? "—"}
            </p>
            <button
              onClick={handleTestConnection}
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: 6,
                color: "var(--text)",
                cursor: "pointer",
                fontWeight: 700,
                padding: "10px 16px",
              }}
            >
              Probar conexión
            </button>
            {testResult && (
              <p style={{ color: "var(--text-soft)", margin: "12px 0 0" }}>{testResult}</p>
            )}
          </div>

          <div
            style={{
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>CAF cargados</h2>
            {cafs.length === 0 ? (
              <p style={{ color: "var(--text-soft)", margin: 0 }}>No hay CAF cargados.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {cafs.map((caf) => (
                  <li
                    key={caf.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      padding: "12px 0",
                    }}
                  >
                    <p style={{ margin: "0 0 4px" }}>
                      <strong>Tipo {caf.documentType}</strong> — Folios {caf.folioStart} a{" "}
                      {caf.folioEnd}
                    </p>
                    <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>
                      Actual {caf.currentFolio} · Disponibles {caf.available} ·{" "}
                      {caf.isActive ? "Activo" : "Inactivo"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            style={{
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 12px" }}>Certificado</h2>
            <p style={{ color: "var(--text-soft)", margin: 0 }}>
              La vigencia del certificado digital se verifica desde las credenciales activas.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
