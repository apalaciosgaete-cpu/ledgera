// src/app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LEDGERA: respaldo tributario para operaciones cripto";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #040C13 0%, #071B28 38%, #0A2235 70%, #0B2132 100%)",
          color: "#F8FAFC",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ fontSize: "42px", fontWeight: 900, letterSpacing: "0.14em", lineHeight: 0.95 }}>
            LEDGERA
          </div>
          <div style={{ fontSize: "13px", color: "#4ADE80", fontWeight: 800, letterSpacing: "0.42em", marginTop: "12px" }}>
            RESPALDO TRIBUTARIO
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "930px" }}>
          <div style={{ fontSize: "28px", color: "#4ADE80", fontWeight: 800, marginBottom: "22px" }}>
            De tus exchanges a tu declaración
          </div>

          <div style={{ fontSize: "68px", lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.055em" }}>
            Ordena operaciones cripto y genera respaldo tributario
          </div>

          <div style={{ fontSize: "28px", lineHeight: 1.35, color: "#CBD5E1", marginTop: "28px", maxWidth: "850px" }}>
            Importa movimientos desde exchanges, ordena activos digitales y exporta información trazable en PDF y Excel.
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", color: "#CBD5E1", fontSize: "22px" }}>
          <span>Exchanges</span>
          <span>·</span>
          <span>Activos digitales</span>
          <span>·</span>
          <span>PDF + Excel</span>
          <span>·</span>
          <span>Chile</span>
        </div>
      </div>
    ),
    size,
  );
}
