// src/app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LEDGERA: calcula tus impuestos crypto para el SII en Chile";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function BrandIcon({ size }: { size: number }) {
  const inner = Math.round(size * 0.66);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: "#071B28",
        border: `${Math.max(3, Math.round(size * 0.035))}px solid #15384F`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M176 140 H240 V310 H352 V372 H176 Z" fill="#F8FAFC" />
        <rect x="252" y="310" width="100" height="18" rx="9" fill="#16A34A" />
      </svg>
    </div>
  );
}

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
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <BrandIcon size={70} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ fontSize: "38px", fontWeight: 900, letterSpacing: "0.14em", lineHeight: 0.95 }}>
              LEDGERA
            </div>
            <div style={{ fontSize: "13px", color: "#4ADE80", fontWeight: 800, letterSpacing: "0.42em", marginTop: "8px" }}>
              FINANZAS OS
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "930px" }}>
          <div style={{ fontSize: "28px", color: "#4ADE80", fontWeight: 800, marginBottom: "22px" }}>
            Declaración crypto simplificada
          </div>

          <div style={{ fontSize: "68px", lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.055em" }}>
            Calcula tus impuestos crypto para el SII
          </div>

          <div style={{ fontSize: "28px", lineHeight: 1.35, color: "#CBD5E1", marginTop: "28px", maxWidth: "850px" }}>
            Importa tus movimientos de Buda, Binance o CSV. LEDGERA calcula tu ganancia y te dice qué poner en el Formulario 22.
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", color: "#CBD5E1", fontSize: "22px" }}>
          <span>Importaciones</span>
          <span>·</span>
          <span>Conciliación</span>
          <span>·</span>
          <span>Portafolio</span>
          <span>·</span>
          <span>SII Chile</span>
        </div>
      </div>
    ),
    size,
  );
}
