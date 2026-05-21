"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/brand/Logo";

const WHATSAPP_URL = "https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number";

export default function CookiesPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)",
        color: "#e2e8f0",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* NAV */}
      <nav
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "rgba(10,10,15,0.9)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Logo />
        </Link>
        <Link
          href="/"
          style={{
            color: "#94a3b8",
            fontSize: "0.85rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          ← Volver al inicio
        </Link>
      </nav>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <div style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "999px",
              padding: "0.3rem 1rem",
              fontSize: "0.78rem",
              color: "#818cf8",
              marginBottom: "1.5rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Documento legal
          </div>
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              color: "#f8fafc",
              margin: "0 0 1rem",
              lineHeight: 1.15,
            }}
          >
            Política de Cookies
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Última actualización: 8 de mayo de 2026 · Versión 1.0
          </p>
        </div>

        <LegalSection title="1. ¿Qué son las cookies?">
          <p>
            Las cookies son pequeños archivos de texto que un sitio web almacena en el navegador del
            Usuario cuando este lo visita. Permiten que el sitio recuerde información sobre su visita
            para mejorar la experiencia de uso.
          </p>
          <p>
            Ledgera utiliza cookies y tecnologías similares (como localStorage y tokens de sesión)
            para garantizar el correcto funcionamiento de la Plataforma.
          </p>
        </LegalSection>

        <LegalSection title="2. Tipos de cookies que utilizamos">
          <CookieTable
            type="Estrictamente necesarias"
            color="#22c55e"
            description="Imprescindibles para el funcionamiento de la Plataforma. Sin ellas, el servicio no puede prestarse correctamente."
            examples={[
              {
                nombre: "next-auth.session-token",
                finalidad: "Mantener la sesión autenticada del Usuario",
                duracion: "Sesión / 30 días",
                tipo: "Propia",
              },
              {
                nombre: "next-auth.csrf-token",
                finalidad: "Protección contra ataques CSRF",
                duracion: "Sesión",
                tipo: "Propia",
              },
              {
                nombre: "next-auth.callback-url",
                finalidad: "Redirigir al Usuario tras el inicio de sesión",
                duracion: "Sesión",
                tipo: "Propia",
              },
            ]}
          />

          <CookieTable
            type="Funcionales"
            color="#818cf8"
            description="Permiten recordar preferencias del Usuario para personalizar la experiencia."
            examples={[
              {
                nombre: "ledgera-theme",
                finalidad: "Preferencias de visualización",
                duracion: "1 año",
                tipo: "Propia",
              },
              {
                nombre: "ledgera-period",
                finalidad: "Período tributario seleccionado",
                duracion: "Sesión",
                tipo: "Propia",
              },
            ]}
          />

          <CookieTable
            type="Analíticas"
            color="#f59e0b"
            description="Recogen información anónima sobre cómo los usuarios interactúan con la Plataforma."
            examples={[
              {
                nombre: "Analítica interna",
                finalidad: "Métricas de uso agregadas y anónimas (sin PII)",
                duracion: "Variable",
                tipo: "Propia",
              },
            ]}
          />

          <div
            style={{
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: "10px",
              padding: "1rem 1.2rem",
            }}
          >
            <p style={{ color: "#a5b4fc", fontSize: "0.88rem", margin: 0 }}>
              ℹ️{" "}
              <strong style={{ color: "#c7d2fe" }}>
                Ledgera NO utiliza cookies de publicidad
              </strong>{" "}
              ni comparte datos de comportamiento con redes publicitarias de terceros.
            </p>
          </div>
        </LegalSection>

        <LegalSection title="3. Cookies de terceros">
          <p>
            Algunos proveedores utilizados por la Plataforma pueden instalar cookies propias:
          </p>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
                color: "#94a3b8",
              }}
            >
              <thead>
                <tr>
                  {["Proveedor", "Finalidad", "Política de privacidad"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "0.6rem 0.8rem",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        color: "#cbd5e1",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    proveedor: "Cloudflare",
                    finalidad: "Seguridad, CDN, protección DDoS",
                    url: "https://www.cloudflare.com/privacypolicy/",
                  },
                  {
                    proveedor: "Vercel",
                    finalidad: "Hosting y despliegue de la aplicación",
                    url: "https://vercel.com/legal/privacy-policy",
                  },
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td style={{ padding: "0.6rem 0.8rem", color: "#e2e8f0", fontWeight: 500 }}>
                      {row.proveedor}
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem" }}>{row.finalidad}</td>
                    <td style={{ padding: "0.6rem 0.8rem" }}>
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#818cf8" }}
                      >
                        Ver política →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LegalSection>

        <LegalSection title="4. Gestión y control de cookies">
          <p>
            Puede gestionar, bloquear o eliminar las cookies desde la configuración de su navegador:
          </p>
          <ul style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {[
              { name: "Google Chrome", url: "https://support.google.com/chrome/answer/95647" },
              { name: "Mozilla Firefox", url: "https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web" },
              { name: "Safari", url: "https://support.apple.com/es-cl/guide/safari/sfri11471/mac" },
              { name: "Microsoft Edge", url: "https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
            ].map((b) => (
              <li key={b.name}>
                <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8" }}>
                  {b.name} →
                </a>
              </li>
            ))}
          </ul>
          <p>
            <strong style={{ color: "#e2e8f0" }}>Atención:</strong> deshabilitar las cookies
            estrictamente necesarias impedirá el inicio de sesión y el funcionamiento correcto de la
            Plataforma.
          </p>
        </LegalSection>

        <LegalSection title="5. Consentimiento">
          <p>
            Al utilizar Ledgera, el Usuario acepta el uso de las cookies descritas en esta Política.
            El consentimiento se obtiene como parte de la aceptación de los{" "}
            <Link href="/terminos" style={{ color: "#818cf8" }}>
              Términos y Condiciones
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection title="6. Modificaciones">
          <p>
            Esta Política podrá ser actualizada cuando se incorporen nuevas tecnologías o proveedores.
            Los cambios significativos serán notificados al correo electrónico registrado.
          </p>
        </LegalSection>

        <LegalSection title="7. Contacto">
          <p>
            Consultas sobre cookies:{" "}
            <a href="mailto:admin@ledgera.cl" style={{ color: "#818cf8" }}>
              admin@ledgera.cl
            </a>
            .
          </p>
        </LegalSection>

        <div
          style={{
            marginTop: "3rem",
            padding: "1.5rem",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "0.85rem", alignSelf: "center" }}>Ver también:</span>
          <Link href="/terminos" style={{ color: "#818cf8", fontSize: "0.85rem", textDecoration: "none" }}>
            Términos y Condiciones →
          </Link>
          <Link href="/privacidad" style={{ color: "#818cf8", fontSize: "0.85rem", textDecoration: "none" }}>
            Política de Privacidad →
          </Link>
        </div>
      </main>

      <footer style={{ background: "#040C13", padding: "3rem 2.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem", marginBottom: "2rem" }}>
            <div>
              <div style={{ marginBottom: "12px" }}>
                <Logo variant="light" size="sm" showSubtitle />
              </div>
              <p style={{ fontSize: "13px", color: "#475569", margin: 0, maxWidth: "260px", lineHeight: 1.6 }}>
                Software tributario especializado en criptomonedas para el mercado chileno.
              </p>
            </div>
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Producto</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/register" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Comenzar gratis</Link>
                  <Link href="/login" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Iniciar sesión</Link>
                  <Link href="/blog" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Blog</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Legal</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/terminos" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Términos y condiciones</Link>
                  <Link href="/privacidad" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Política de privacidad</Link>
                  <Link href="/cookies" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Política de cookies</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Contacto</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <a href="mailto:admin@ledgera.cl" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>admin@ledgera.cl</a>
                  <a href="https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number" target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>WhatsApp soporte</a>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <span style={{ fontSize: "12px", color: "#334155" }}>© {new Date().getFullYear()} Ledgera · Chile · Ley 21.719 protección de datos</span>
            <span style={{ fontSize: "12px", color: "#334155" }}>ledgera.cl</span>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Volver arriba"
          style={{ position: "fixed", bottom: "92px", right: "28px", width: "44px", height: "44px", borderRadius: "50%", background: "rgba(10,31,46,0.92)", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 998, backdropFilter: "blur(8px)" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 13V5M5 9l4-4 4 4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
        style={{ position: "fixed", bottom: "28px", right: "28px", width: "52px", height: "52px", borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", zIndex: 999 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#f1f5f9",
          marginBottom: "1rem",
          paddingBottom: "0.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          color: "#94a3b8",
          fontSize: "0.92rem",
          lineHeight: 1.75,
        }}
      >
        {children}
      </div>
    </section>
  );
}

type CookieRow = {
  nombre: string;
  finalidad: string;
  duracion: string;
  tipo: string;
};

function CookieTable({
  type,
  color,
  description,
  examples,
}: {
  type: string;
  color: string;
  description: string;
  examples: CookieRow[];
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "0.8rem 1.2rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>{type}</span>
      </div>
      <div style={{ padding: "0.8rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>{description}</p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", color: "#94a3b8" }}
        >
          <thead>
            <tr>
              {["Cookie / Tecnología", "Finalidad", "Duración", "Tipo"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "0.5rem 1rem",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    color: "#cbd5e1",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {examples.map((row, i) => (
              <tr key={i}>
                <td
                  style={{
                    padding: "0.5rem 1rem",
                    color: "#e2e8f0",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                  }}
                >
                  {row.nombre}
                </td>
                <td style={{ padding: "0.5rem 1rem" }}>{row.finalidad}</td>
                <td style={{ padding: "0.5rem 1rem", whiteSpace: "nowrap" }}>{row.duracion}</td>
                <td style={{ padding: "0.5rem 1rem" }}>{row.tipo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}