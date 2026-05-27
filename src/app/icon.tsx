// src/app/icon.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #071520 0%, #0A1F2E 55%, #14532D 100%)",
        }}
      >
        <div
          style={{
            width: 342,
            height: 342,
            borderRadius: 92,
            background: "rgba(255, 255, 255, 0.08)",
            border: "2px solid rgba(255, 255, 255, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 36px 110px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div
            style={{
              fontSize: 180,
              lineHeight: 1,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.08em",
            }}
          >
            L
          </div>
        </div>
      </div>
    ),
    size,
  );
}
