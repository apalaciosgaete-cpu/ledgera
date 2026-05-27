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
        a: "Las ganancias por venta de criptomonedas pueden constituir renta y deben revisarse dentro de la declaración anual correspondiente. LEDGERA ayuda a ordenar la información, pero la interpretación final debe validarse con un contador o asesor tributario.",
      },
      {
        q: "¿Qué operaciones pueden requerir revisión tributaria?",
        a: "Ventas a moneda fiat, intercambios entre activos, pagos recibidos en cripto y movimientos con ganancia realizada pueden requerir análisis. La simple compra o tenencia normalmente no genera impuesto por sí sola.",
      },
      {
        q: "¿Cuándo debo declarar?",
        a: "La declaración depende del período tributario y del calendario vigente de Operación Renta. LEDGERA separa movimientos por fecha para facilitar la revisión del período correspondiente.",
      },
      {
        q: "¿Qué pasa si operé en años anteriores sin ordenar mi información?",
        a: "Puedes reconstruir períodos anteriores desde tus movimientos históricos. Si corresponde rectificar o complementar información, conviene hacerlo con apoyo profesional.",
      },
    ],
  },
  {
    label: "Motor FIFO",
    color: "#7C3AED",
    faqs: [
      {
        q: "¿Cómo funciona el motor FIFO de LEDGERA?",
        a: "El motor procesa movimientos confirmados en orden cronológico. Cuando existe una venta, consume primero las unidades más antiguas y calcula costo, resultado y trazabilidad desde los movimientos disponibles.",
      },
      {
        q: "¿Puedo auditar los cálculos?",
        a: "Sí. Cada evento conserva referencia al movimiento, fecha, cantidad, costo, precio, comisiones y clasificación aplicada para que pueda revisarse posteriormente.",
      },
      {
        q: "¿Qué pasa si tengo compras parciales?",
        a: "LEDGERA puede consumir lotes de forma parcial y conservar el remanente para ventas futuras, manteniendo trazabilidad por movimiento.",
      },
    ],
  },
  {
    label: "Plataforma",
    color: "#0EA5E9",
    faqs: [
      {
        q: "¿Puedo importar movimientos desde un exchange?",
        a: "Sí. LEDGERA está diseñado para trabajar con importaciones, revisión previa y confirmación antes de afectar el portafolio.",
      },
      {
        q: "¿Puedo conciliar banco y exchange?",
        a: "Sí. El objetivo es relacionar transferencias bancarias, movimientos de exchange y portafolio para reducir desorden operacional.",
      },
      {
        q: "¿LEDGERA reemplaza a un contador?",
        a: "No. LEDGERA organiza y prepara información financiera-tributaria. No reemplaza la revisión profesional ni constituye asesoría tributaria personalizada.",
      },
      {
        q: "¿Qué incluye un reporte?",
        a: "Según el plan y el módulo disponible, los reportes pueden incluir movimientos, eventos, resultados y trazabilidad para revisión interna o profesional.",
      },
    ],
  },
  {
    label: "Planes y precios",
    color: "#F59E0B",
    faqs: [
      {
        q: "¿Hay plan gratuito?",
        a: "Sí. El plan gratuito permite explorar la plataforma con un volumen limitado de movimientos.",
      },
      {
        q: "¿Qué plan conviene para un usuario individual?",
        a: "El plan Personal está pensado para usuarios que necesitan ordenar movimientos, revisar portafolio, conciliación y reportes.",
      },
      {
        q: "¿Hay planes para contadores o empresas?",
        a: "Sí. Los planes Contador y Empresa están orientados a operación multiusuario, clientes o revisión profesional con mayor trazabilidad.",
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
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(7,21,32,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }} aria-label="Inicio LEDGERA">
            <Logo variant="light" size="lg" showSubtitle />
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[
              { label: "Quiénes somos", href: "/quienes-somos" },
              { label: "Cómo funciona", href: "/como-funciona" },
              { label: "Planes", href: "/planes" },
              { label: "Preguntas", href: "/preguntas" },
              { label: "Blog", href: "/blog" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  fontSize: "14px",
                  fontWeight: item.href === "/preguntas" ? 600 : 500,
                  color: item.href === "/preguntas" ? "#4ADE80" : "#94A3B8",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/login" style={{ marginLeft: "8px", fontSize: "14px", fontWeight: 600, color: "#E2E8F0", padding: "8px 18px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none" }}>
              Iniciar sesión
            </Link>
            <Link href="/register" style={{ marginLeft: "6px", fontSize: "14px", fontWeight: 700, color: "#fff", padding: "8px 18px", borderRadius: "9px", background: "#16A34A", textDecoration: "none" }}>
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

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
        <p style={{ fontSize: "17px", color: "#94A3B8", maxWidth: "560px", margin: "0 auto", lineHeight: 1.65 }}>
          Tributación, motor FIFO, importaciones, conciliación, plataforma y planes para ordenar información crypto en Chile.
        </p>
      </section>

      <section style={{ padding: "4rem 2rem 5rem", maxWidth: "860px", margin: "0 auto" }}>
        {CATEGORIES.map((cat) => (
          <div key={cat.label} style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {cat.label}
              </span>
            </div>

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

        <div style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)", borderRadius: "16px", padding: "2rem", textAlign: "center", marginTop: "1rem" }}>
          <p style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontSize: "18px", fontWeight: 700, color: "#F1F5F9", margin: "0 0 8px" }}>
            ¿Tu pregunta no está aquí?
          </p>
          <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 1.5rem" }}>
            Escríbenos para revisar tu caso y orientarte sobre el uso de LEDGERA.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", borderRadius: "9px", background: "#16A34A", color: "#ffffff", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
              Crear cuenta gratis
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer style={{ background: "#040C13", padding: "3rem 2.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem", marginBottom: "2rem" }}>
            <div>
              <div style={{ marginBottom: "12px" }}>
                <Logo variant="light" size="sm" showSubtitle />
              </div>
              <p style={{ fontSize: "13px", color: "#475569", margin: 0, maxWidth: "260px", lineHeight: 1.6 }}>
                Software para ordenar movimientos crypto, conciliación y base tributaria en Chile.
              </p>
            </div>
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Producto</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Inicio</Link>
                  <Link href="/register" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Comenzar gratis</Link>
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
            <span style={{ fontSize: "12px", color: "#334155" }}>© {new Date().getFullYear()} LEDGERA · Chile</span>
            <span style={{ fontSize: "12px", color: "#334155" }}>ledgera.cl</span>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Volver arriba"
          style={{ position: "fixed", bottom: "92px", right: "28px", width: "44px", height: "44px", borderRadius: "50%", background: "rgba(10,31,46,0.92)", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 998, backdropFilter: "blur(8px)" }}>
          ↑
        </button>
      )}
    </main>
  );
}
