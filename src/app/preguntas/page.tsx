"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Logo } from "@/components/brand/Logo";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number";

const CATEGORIES = [
  {
    label: "Tributación",
    color: "#16A34A",
    faqs: [
      {
        q: "¿Es obligatorio declarar criptomonedas al SII en Chile?",
        a: "Sí. El SII ha confirmado que las ganancias por venta de criptomonedas constituyen renta y deben declararse anualmente. Las personas naturales tributan bajo el criterio de mayor valor en la enajenación de bienes y las empresas bajo el régimen de primera categoría.",
      },
      {
        q: "¿Qué operaciones generan un hecho tributario?",
        a: "Las ventas de criptomonedas a pesos chilenos o a otra moneda, los intercambios entre criptomonedas (swaps) y la recepción de cripto como pago por servicios. La simple tenencia o compra con CLP no genera impuesto.",
      },
      {
        q: "¿Cuándo debo declarar?",
        a: "Las personas naturales declaran en la Operación Renta de cada año, con plazo hasta el 30 de abril. Las empresas siguen el calendario de primera categoría del SII (abril-mayo). Ledgera separa automáticamente tus eventos por período tributario.",
      },
      {
        q: "¿Qué pasa si operé en años anteriores sin declarar?",
        a: "Puedes presentar declaraciones rectificatorias en el SII por los períodos no declarados. Ledgera te permite reabrir períodos anteriores, registrar los movimientos y generar las declaraciones correspondientes con trazabilidad completa.",
      },
    ],
  },
  {
    label: "Motor FIFO",
    color: "#7C3AED",
    faqs: [
      {
        q: "¿Cómo funciona el motor FIFO de Ledgera?",
        a: "El motor procesa tus movimientos en orden cronológico estricto. Cuando vendes, descuenta automáticamente las unidades más antiguas primero, calcula el costo base real en pesos chilenos usando el tipo de cambio BCCh de la fecha de compra, y determina la ganancia realizada neta.",
      },
      {
        q: "¿Por qué el SII exige FIFO y no otro método?",
        a: "El SII aplica el criterio de \"mayor valor\" cronológico, lo que equivale a FIFO: el costo de las unidades más antiguas se compara contra el precio de venta actual. Usar otro método (LIFO, promedio) no está permitido y puede resultar en diferencias con el fisco.",
      },
      {
        q: "¿Qué pasa si tengo lotes parciales o muchas compras distintas?",
        a: "Ledgera maneja lotes fraccionados con precisión. Si vendes una fracción de un lote, consume esa fracción y conserva el resto con su costo original. Cada lote queda trazado individualmente y aparece en el detalle del reporte.",
      },
      {
        q: "¿Puedo auditar los cálculos del motor FIFO?",
        a: "Sí. Desde la sección Tributario puedes revisar el detalle de cada evento: el lote consumido, el costo base aplicado, el tipo de cambio BCCh y la ganancia resultante. El PDF de trazabilidad incluye toda esta información con hash de integridad.",
      },
    ],
  },
  {
    label: "Plataforma",
    color: "#0EA5E9",
    faqs: [
      {
        q: "¿Puedo importar mis movimientos desde un exchange?",
        a: "Sí. Puedes importar tu historial completo desde Binance, Buda u Orionx mediante CSV. Ledgera detecta el formato automáticamente y mapea cada columna. También puedes ingresar movimientos manualmente uno a uno.",
      },
      {
        q: "¿Qué tipo de cambio usa Ledgera para convertir a CLP?",
        a: "Ledgera usa el dólar observado publicado diariamente por el Banco Central de Chile (BCCh), que es el tipo de cambio exigido por el SII. El TCO se aplica automáticamente en la fecha de cada movimiento.",
      },
      {
        q: "¿Qué es el cierre de período y para qué sirve?",
        a: "Cerrar un período tributario genera un snapshot inmutable del estado de tu portafolio con un hash SHA-256 de integridad. Sirve como respaldo irrefutable ante el SII: prueba que los datos del período no fueron modificados después del cierre.",
      },
      {
        q: "¿Qué incluye el reporte verificable?",
        a: "Cada reporte (PDF o CSV) incluye un código único, un hash SHA-256 y un QR de verificación. Cualquier persona puede comprobar la autenticidad del documento en ledgera.cl/verify/report/[código] sin necesidad de cuenta.",
      },
    ],
  },
  {
    label: "Planes y precios",
    color: "#F59E0B",
    faqs: [
      {
        q: "¿Puedo cancelar mi suscripción cuando quiera?",
        a: "Sí, sin compromisos ni penalidades. Puedes cancelar desde tu cuenta en cualquier momento. Si cancelas un plan anual, mantienes el acceso hasta el fin del período pagado.",
      },
      {
        q: "¿Hay período de prueba gratuito?",
        a: "Sí. El plan Gratuito te permite explorar la plataforma con hasta 25 movimientos sin necesidad de tarjeta de crédito. Los planes de pago incluyen 30 días de prueba sin compromiso.",
      },
      {
        q: "¿El plan Contador cubre a todos mis clientes?",
        a: "El plan Contador incluye hasta 5 clientes. Cada cliente adicional tiene un costo del 20% del plan mensual o anual. El plan Empresa incluye clientes ilimitados.",
      },
      {
        q: "¿Puedo cambiar de plan en cualquier momento?",
        a: "Sí. Puedes subir o bajar de plan desde tu cuenta. Al subir, el costo se prorratea por los días restantes del período. Al bajar, el cambio aplica al inicio del siguiente período.",
      },
    ],
  },
];

export default function PreguntasPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main
      style={{
        fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
        background: "#0A1F2E",
        color: "#F1F5F9",
        minHeight: "100vh",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(10,31,46,0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 2.5rem",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/bienvenida" style={{ textDecoration: "none" }}>
            <Logo variant="light" size="lg" showSubtitle />
          </Link>
          <Link
            href="/bienvenida"
            style={{ fontSize: "14px", color: "#64748B", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4L3 8l4 4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Inicio
          </Link>
        </div>
        <Link
          href="/register"
          style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", textDecoration: "none", padding: "8px 18px", borderRadius: "8px", background: "#16A34A" }}
        >
          Comenzar gratis
        </Link>
      </nav>

      {/* Header */}
      <section style={{ padding: "5rem 2rem 3.5rem", background: "#071520", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: "100px", padding: "5px 18px", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#4ADE80" }}>Preguntas frecuentes</span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 700,
            color: "#F1F5F9",
            letterSpacing: "-0.03em",
            margin: "0 0 1rem",
            lineHeight: 1.1,
          }}
        >
          Todo lo que necesitas saber
        </h1>
        <p style={{ fontSize: "17px", color: "#94A3B8", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
          Tributación, motor FIFO, plataforma y planes — resolvemos tus dudas antes de empezar.
        </p>
      </section>

      {/* FAQ por categorías */}
      <section style={{ padding: "4rem 2rem 5rem", maxWidth: "860px", margin: "0 auto" }}>
        {CATEGORIES.map((cat) => (
          <div key={cat.label} style={{ marginBottom: "3rem" }}>
            {/* Categoría label */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {cat.label}
              </span>
            </div>

            {/* Acordeón */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {cat.faqs.map((faq, i) => {
                const key = `${cat.label}-${i}`;
                const isOpen = openFaq === key;
                return (
                  <div
                    key={key}
                    style={{
                      background: isOpen ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
                      border: isOpen ? `1px solid ${cat.color}30` : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "12px",
                      overflow: "hidden",
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : key)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1.125rem 1.5rem",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        gap: "1rem",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "15px", fontWeight: 600, color: "#F1F5F9", lineHeight: 1.4 }}>
                        {faq.q}
                      </span>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                        style={{ flexShrink: 0, transition: "transform 0.2s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                        <path d="M4 6l5 5 5-5" stroke={isOpen ? cat.color : "#64748B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 1.5rem 1.25rem" }}>
                        <p style={{ fontSize: "15px", color: "#94A3B8", margin: 0, lineHeight: 1.75 }}>
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ¿Más dudas? */}
        <div style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)", borderRadius: "16px", padding: "2rem", textAlign: "center", marginTop: "1rem" }}>
          <p style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "18px", fontWeight: 700, color: "#F1F5F9", margin: "0 0 8px" }}>
            ¿Tu pregunta no está aquí?
          </p>
          <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 1.5rem" }}>
            Escríbenos por WhatsApp y te respondemos en minutos.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", borderRadius: "9px", background: "#16A34A", color: "#ffffff", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
              Empezar gratis
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#4ADE80">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>WhatsApp soporte</a>
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
    </main>
  );
}
