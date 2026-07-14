import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { fonts } from "@/styles/tokens";

export default function CheckoutPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-elev)",
        color: "var(--text)",
        fontFamily: fonts.body,
        padding: "32px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <section
          style={{
            background: "var(--bg-elev)",
            border: "1px solid var(--border-strong)",
            borderRadius: 18,
            padding: 30,
            boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              borderRadius: 999,
              padding: "5px 10px",
              background: "rgba(14,165,233,0.09)",
              border: "1px solid rgba(14,165,233,0.22)",
              color: "var(--accent)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            Contratación segura
          </span>

          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 27,
              lineHeight: 1.18,
              margin: "0 0 12px",
              color: "var(--text)",
            }}
          >
            El checkout en línea está en preparación
          </h1>

          <p
            style={{
              margin: "0 0 18px",
              color: "var(--text-soft)",
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            LEDGERA no procesará pagos ni activará suscripciones desde una simulación. La contratación se habilitará cuando la pasarela, los webhooks y la emisión de documentos estén integrados y validados de extremo a extremo.
          </p>

          <div
            style={{
              background: "var(--bg-sunken)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <p style={{ margin: "0 0 5px", color: "var(--text)", fontSize: 13, fontWeight: 800 }}>
              No se realizará ningún cargo
            </p>
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12, lineHeight: 1.55 }}>
              Tampoco se crearán pagos pendientes ni se modificará el plan de tu cuenta desde esta página.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/planes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "1 1 190px",
                borderRadius: 9,
                padding: "12px 16px",
                background: "var(--accent)",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Volver a planes
            </Link>
            <a
              href="mailto:admin@ledgera.cl?subject=Contratación%20LEDGERA"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "1 1 190px",
                borderRadius: 9,
                padding: "12px 16px",
                border: "1px solid var(--border)",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Contactar soporte
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
