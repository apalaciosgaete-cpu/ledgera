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
          background: "#16A34A",
          borderRadius: "112px",
        }}
      >
        <svg width="352" height="352" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="10" height="28" rx="2" fill="#FFFFFF" />
          <rect x="8" y="30" width="22" height="10" rx="2" fill="#FFFFFF" />
          <rect x="26" y="30" width="10" height="10" rx="2" fill="#F59E0B" />
        </svg>
      </div>
    ),
    size,
  );
}
