// src/app/apple-icon.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
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
            width: 116,
            height: 116,
            borderRadius: 34,
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 72,
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
