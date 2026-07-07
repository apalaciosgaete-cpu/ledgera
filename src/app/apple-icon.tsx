// src/app/apple-icon.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LEDGERA";
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
          background: "#071B28",
          color: "#F8FAFC",
          fontSize: 27,
          fontWeight: 900,
          letterSpacing: "0.1em",
          fontFamily: "Arial, sans-serif",
        }}
      >
        LEDGERA
      </div>
    ),
    size,
  );
}
