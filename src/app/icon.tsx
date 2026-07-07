// src/app/icon.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LEDGERA";
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
          background: "#071B28",
          color: "#F8FAFC",
          fontSize: 76,
          fontWeight: 900,
          letterSpacing: "0.12em",
          fontFamily: "Arial, sans-serif",
        }}
      >
        LEDGERA
      </div>
    ),
    size,
  );
}
