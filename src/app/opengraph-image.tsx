// src/app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LEDGERA: orden financiero crypto para Chile";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function BrandIcon({ size }: { size: number }) {
  const inner = Math.round(size * 0.72);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: "#16A34A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="10" height="28" rx="2" fill="#FFFFFF" />
        <rect x="8" y="30" width="22" height="10" rx="2" fill="#FFFFFF" />
        <rect x="26" y="30" width="10" height="10" rx="2" fill="#F59E0B" />
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
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <BrandIcon size={64} />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-0.04em" }}>
              LEDGERA
            </div>
            <div style={{ fontSize: "18px", color: "#94A3B8" }}>
              Finanzas crypto · Chile
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "930px" }}>
          <div style={{ fontSize: "28px", color: "#4ADE80", fontWeight: 700, marginBottom: "22px" }}>
            Sistema financiero-tributario para crypto
          </div>

          <div style={{ fontSize: "68px", lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.055em" }}>
            Ordena tus movimientos crypto en Chile
          </div>

          <div style={{ fontSize: "28px", lineHeight: 1.35, color: "#CBD5E1", marginTop: "28px", maxWidth: "850px" }}>
            Concilia banco, exchange y portafolio. Prepara información clara y trazable.
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
