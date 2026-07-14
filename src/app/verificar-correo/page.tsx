import Link from "next/link";
import { cookies } from "next/headers";

import { Logo } from "@/components/brand/Logo";
import { fonts } from "@/styles/tokens";

type PageProps = {
  searchParams?: {
    status?: string;
  };
};

const VERIFIED_EMAIL_COOKIE = "ledgera_verified_email";

export default function VerificarCorreoPage({ searchParams }: PageProps) {
  const success = searchParams?.status === "success";
  const verifiedEmail = success
    ? cookies().get(VERIFIED_EMAIL_COOKIE)?.value
    : undefined;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--bg)",
        fontFamily: fonts.body,
      }}
    >
      <section
        style={{
          width: "min(100%, 560px)",
          background: "var(--bg-elev)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "32px",
          textAlign: "center",
          boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <Logo variant="light" size="lg" />
        </div>

        <div
          aria-hidden="true"
          style={{
            width: "48px",
            height: "48px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "999px",
            border: `1px solid ${success ? "rgba(22,163,74,0.28)" : "rgba(220,38,38,0.28)"}`,
            background: success ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
            color: success ? "var(--accent)" : "var(--loss)",
            fontSize: "22px",
            fontWeight: 900,
            marginBottom: "18px",
          }}
        >
          {success ? "✓" : "×"}
        </div>

        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: "24px",
            color: "var(--text)",
            margin: "0 0 12px",
          }}
        >
          {success ? "Correo confirmado" : "Enlace no válido"}
        </h1>

        <p
          style={{
            color: "var(--text-soft)",
            fontSize: "14px",
            lineHeight: 1.65,
            margin: success ? "0 0 12px" : "0 0 24px",
          }}
        >
          {success ? (
            <>
              Verificamos correctamente{verifiedEmail ? " " : " tu dirección de correo"}
              {verifiedEmail ? (
                <strong style={{ color: "var(--text)", fontWeight: 800 }}>
                  {verifiedEmail}
                </strong>
              ) : null}
              . Tu cuenta dispone ahora de una vía segura para recuperar el acceso y recibir comunicaciones importantes de LEDGERA.
            </>
          ) : (
            "El enlace venció, ya fue utilizado o no corresponde a una verificación vigente. Solicita uno nuevo desde Configuración → Seguridad."
          )}
        </p>

        {success ? (
          <p
            style={{
              color: "var(--text-soft)",
              fontSize: "12px",
              lineHeight: 1.55,
              margin: "0 0 24px",
            }}
          >
            Por seguridad, este enlace ya no puede volver a utilizarse.
          </p>
        ) : null}

        <Link
          href={success ? "/login" : "/configuracion/seguridad"}
          style={{
            display: "inline-flex",
            justifyContent: "center",
            borderRadius: "10px",
            padding: "12px 18px",
            background: "var(--accent)",
            color: "var(--accent-contrast)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 800,
          }}
        >
          {success ? "Continuar a LEDGERA" : "Solicitar nuevo enlace"}
        </Link>
      </section>
    </main>
  );
}
