import Link from "next/link";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 18,
          transform: "translateX(-50%)",
          zIndex: 20,
          width: "calc(100% - 32px)",
          maxWidth: 400,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <Link
          href="/recuperar-2fa"
          style={{
            display: "inline-block",
            pointerEvents: "auto",
            padding: "9px 14px",
            borderRadius: 999,
            border: "1px solid var(--border-strong)",
            background: "rgba(15,18,19,.9)",
            color: "var(--text)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 800,
            boxShadow: "0 8px 24px rgba(0,0,0,.35)",
            backdropFilter: "blur(12px)",
          }}
        >
          ¿No tienes acceso a tu autenticador? Recuperar 2FA
        </Link>
      </div>
    </>
  );
}
