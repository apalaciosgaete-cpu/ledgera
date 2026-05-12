import type { ReactNode } from "react";

interface AppScreenProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function AppScreen({
  title,
  description,
  children,
}: AppScreenProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 24px",
        backgroundColor: "#0b1020",
        color: "#f5f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "40px" }}>{title}</h1>

        {description ? (
          <p style={{ marginTop: "16px", color: "#cbd5e1", lineHeight: 1.7 }}>
            {description}
          </p>
        ) : null}

        {children ? <section style={{ marginTop: "32px" }}>{children}</section> : null}
      </div>
    </main>
  );
}