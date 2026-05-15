import Link from "next/link";

export default function ConfiguracionPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0B1020",
        color: "#F8FAFC",
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gap: "24px",
        }}
      >
        <header>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Configuración
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#94A3B8",
            }}
          >
            Administra preferencias y seguridad operacional de tu cuenta.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          <Link
            href="/configuracion/seguridad"
            style={{
              display: "block",
              textDecoration: "none",
              border: "1px solid #1E293B",
              background: "#020617",
              borderRadius: "18px",
              padding: "24px",
              color: "#F8FAFC",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "18px",
              }}
            >
              Seguridad y sesiones
            </h2>

            <p
              style={{
                margin: 0,
                color: "#94A3B8",
                lineHeight: 1.6,
              }}
            >
              Revisa sesiones activas, identifica accesos y
              administra seguridad de autenticación.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}