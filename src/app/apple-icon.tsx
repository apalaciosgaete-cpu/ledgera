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
          borderRadius: "40px",
          border: "7px solid #15384F",
        }}
      >
        <svg width="124" height="124" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M176 140 H240 V310 H352 V372 H176 Z" fill="#F8FAFC" />
          <rect x="252" y="310" width="100" height="18" rx="9" fill="#16A34A" />
        </svg>
      </div>
    ),
    size,
  );
}
