"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type CSSProperties } from "react";
import { useAuth } from "@/modules/identity/client/authContext";
import { Logo } from "@/components/brand/Logo";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number";

type Plan = {
  key: string;
  name: string;
  monthly: number;
  annual: number;
  description: string;
  highlight: boolean;
  cta: string;
  href: string;
  features: string[];
  disabled: string[];
  note: string | null;
};

const h2Style: CSSProperties = {
  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
  fontSize: "clamp(2rem, 4vw, 3.25rem)",
  fontWeight: 700,
  color: "#F1F5F9",
  letterSpacing: "-0.03em",
  margin: "0 0 1rem",
  lineHeight: 1.1,
};

const NAV_LINKS = [
  { label: "Quiénes somos", href: "/bienvenida#quienes-somos" },
  { label: "Cómo funciona", href: "/bienvenida#como-funciona" },
  { label: "Planes",        href: "/planes" },
  { label: "Preguntas",     href: "/preguntas" },
  { label: "Blog",          href: "/blog" },
];

function PlanesContent() {
  const { isAuthenticated } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const plans: Plan[] = [
    {
      key: "free",
      name: "Gratuito",
      monthly: 0,
      annual: 0,
      description: "Para explorar la plataforma",
      highlight: false,
      cta: "Crear cuenta gratis",
      href: "/register",
      features: [
        "Hasta 25 movimientos",
        "Motor FIFO incluido",
        "Panel tributario básico",
        "Sin exportaciones",
        "Sin auditoría",
      ],
      disabled: ["Sin exportaciones", "Sin auditoría"],
      note: null,
    },
    {
      key: "personal",
      name: "Personal",
      monthly: 4990,
      annual: 49900,
      description: "Para el inversor individual",
      highlight: true,
      cta: "Empezar ahora",
      href: "/register",
      features: [
        "Movimientos ilimitados",
        "Motor FIFO automático",
        "Exportación CSV y PDF",
        "Auditoría completa",
        "Soporte por email",
      ],
      disabled: [],
      note: null,
    },
    {
      key: "contador",
      name: "Contador",
      monthly: 14990,
      annual: 149900,
      description: "Para gestión de múltiples clientes",
      highlight: false,
      cta: "Empezar ahora",
      href: "/register",
      features: [
        "Todo lo de Personal",
        "Hasta 5 clientes incluidos",
        "Cliente adicional +20%",
        "Reportes verificables SII",
        "Soporte prioritario",
      ],
      disabled: [],
      note: "Mensual: $2.998/cliente adicional · Anual: $29.980/cliente adicional",
    },
    {
      key: "empresa",
      name: "Empresa",
      monthly: 29990,
      annual: 299900,
      description: "Para operación corporativa",
      highlight: false,
      cta: "Empezar ahora",
      href: "/register",
      features: [
        "Todo lo de Contador",
        "Clientes ilimitados",
        "Régimen primera categoría",
        "Configuración tributaria",
        "Soporte dedicado",
      ],
      disabled: [],
      note: null,
    },
  ];

  function formatClp(value: number) {
    if (value === 0) return "Gratis";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value);
  }

  return (
    <main
      style={{
        fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
        background: "#0A1F2E",
        color: "#F1F5F9",
        overflowX: "hidden",
      }}
    >
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
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
        <Link href="/bienvenida" style={{ textDecoration: "none" }}>
          <Logo variant="light" size="lg" showSubtitle />
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex" style={{ alignItems: "center", gap: "4px" }}>
          {NAV_LINKS.map((item) => {
            const isActive = item.href === "/planes";
            return (
              <Link
                key={item.label}
                href={item.href}
                onMouseEnter={() => setHoveredNav(item.label)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive || hoveredNav === item.label ? "#F1F5F9" : "#94A3B8",
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: isActive
                    ? "rgba(22,163,74,0.12)"
                    : hoveredNav === item.label
                    ? "rgba(255,255,255,0.06)"
                    : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 8px" }} />
          <Link
            href="/login"
            onMouseEnter={() => setHoveredNav("login")}
            onMouseLeave={() => setHoveredNav(null)}
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: hoveredNav === "login" ? "#F1F5F9" : "#94A3B8",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              background: hoveredNav === "login" ? "rgba(255,255,255,0.06)" : "transparent",
              transition: "all 0.15s ease",
            }}
          >
            Iniciar sesión
          </Link>
          <Link
            href={isAuthenticated ? "/portafolio" : "/register"}
            onMouseEnter={() => setHoveredNav("register")}
            onMouseLeave={() => setHoveredNav(null)}
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              textDecoration: "none",
              padding: "9px 18px",
              borderRadius: "8px",
              background: hoveredNav === "register" ? "#15803D" : "#16A34A",
              transition: "all 0.15s ease",
            }}
          >
            {isAuthenticated ? "Ir a mi cuenta" : "Comenzar gratis"}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex sm:hidden"
          onClick={() => setMobileMenuOpen((v) => !v)}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            padding: "8px",
            cursor: "pointer",
            color: "#94A3B8",
          }}
        >
          {mobileMenuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="flex sm:hidden"
          style={{
            flexDirection: "column",
            background: "rgba(10,31,46,0.97)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "1rem 1.5rem",
            gap: "4px",
            position: "sticky",
            top: "68px",
            zIndex: 99,
          }}
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: "14px",
                fontWeight: item.href === "/planes" ? 600 : 500,
                color: item.href === "/planes" ? "#4ADE80" : "#94A3B8",
                textDecoration: "none",
                padding: "10px 0",
              }}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: "15px", fontWeight: 500, color: "#94A3B8", textDecoration: "none", padding: "10px 0" }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: "block",
              textAlign: "center",
              fontSize: "15px",
              fontWeight: 700,
              color: "#ffffff",
              textDecoration: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              background: "#16A34A",
            }}
          >
            Comenzar gratis
          </Link>
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "5rem 2rem 3rem",
          textAlign: "center",
          background: "linear-gradient(to bottom, #071520, #0A1F2E)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(22,163,74,0.1)",
            border: "1px solid rgba(22,163,74,0.22)",
            borderRadius: "100px",
            padding: "4px 16px",
            marginBottom: "1.5rem",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#4ADE80", letterSpacing: "0.04em" }}>
            Planes y precios
          </span>
        </div>
        <h1 style={{ ...h2Style, margin: "0 auto 1rem", maxWidth: "700px" }}>
          Simple y transparente
        </h1>
        <p
          style={{
            fontSize: "17px",
            color: "#94A3B8",
            maxWidth: "480px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.65,
          }}
        >
          Sin sorpresas. Elige el plan que se adapte a tu operación. Cancela cuando quieras.
        </p>

        {/* Billing toggle */}
        <div
          style={{
            display: "inline-flex",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "4px",
            gap: "4px",
          }}
        >
          {(["monthly", "annual"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: "9px 22px",
                borderRadius: "7px",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
                background: billing === b ? "#16A34A" : "transparent",
                color: billing === b ? "#ffffff" : "#64748B",
                transition: "all 0.15s ease",
              }}
            >
              {b === "monthly" ? "Mensual" : "Anual — 1 mes gratis"}
            </button>
          ))}
        </div>
      </section>

      {/* ── Plan cards ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 2rem 5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", overflowX: "auto", paddingBottom: "4px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
              gap: "16px",
              minWidth: "860px",
              paddingTop: "28px",
            }}
          >
            {plans.map((plan) => (
              <div key={plan.key} style={{ position: "relative" }}>
                {plan.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-22px",
                      left: 0,
                      right: 0,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        background: "#16A34A",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 14px",
                        borderRadius: "100px",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.06em",
                      }}
                    >
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                <div
                  style={{
                    background: plan.highlight
                      ? "rgba(22,163,74,0.08)"
                      : "rgba(255,255,255,0.03)",
                    border: plan.highlight
                      ? "1px solid rgba(22,163,74,0.35)"
                      : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "14px",
                    padding: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                        fontSize: "19px",
                        fontWeight: 700,
                        color: "#F1F5F9",
                        margin: "0 0 6px",
                      }}
                    >
                      {plan.name}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 1.25rem", lineHeight: 1.5 }}>
                      {plan.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                          fontSize: "34px",
                          fontWeight: 700,
                          color: "#F1F5F9",
                          lineHeight: 1,
                        }}
                      >
                        {billing === "monthly" ? formatClp(plan.monthly) : formatClp(plan.annual)}
                      </span>
                      {plan.monthly > 0 && (
                        <span style={{ fontSize: "13px", color: "#475569" }}>
                          /{billing === "monthly" ? "mes" : "año"}
                        </span>
                      )}
                    </div>
                    {billing === "annual" && plan.annual > 0 && (
                      <p style={{ fontSize: "12px", color: "#4ADE80", margin: "6px 0 0", fontWeight: 500 }}>
                        Equivale a {formatClp(Math.round(plan.annual / 12))}/mes
                      </p>
                    )}
                  </div>

                  <ul
                    style={{
                      margin: "0 0 1rem",
                      padding: 0,
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      flex: 1,
                    }}
                  >
                    {plan.features.map((f) => {
                      const isDisabled = plan.disabled.includes(f);
                      return (
                        <li
                          key={f}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "14px",
                            color: isDisabled ? "#334155" : "#94A3B8",
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                            {isDisabled ? (
                              <line x1="4" y1="8" x2="12" y2="8" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
                            ) : (
                              <>
                                <circle cx="8" cy="8" r="7" stroke="#16A34A" strokeWidth="1.2" />
                                <path d="M5 8l2 2 4-4" stroke="#16A34A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              </>
                            )}
                          </svg>
                          {f}
                        </li>
                      );
                    })}
                  </ul>

                  {plan.note && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#475569",
                        margin: "0 0 1.25rem",
                        lineHeight: 1.5,
                        padding: "8px 10px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "7px",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {plan.note}
                    </p>
                  )}

                  <Link
                    href={plan.key === "free" && isAuthenticated ? "/portafolio" : plan.href}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "13px 20px",
                      borderRadius: "9px",
                      background: plan.highlight ? "#16A34A" : "rgba(255,255,255,0.06)",
                      border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.1)",
                      color: plan.highlight ? "#ffffff" : "#E2E8F0",
                      fontSize: "14px",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    {plan.key === "free" && isAuthenticated ? "Ir al panel" : plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Garantía */}
        <div style={{ maxWidth: "480px", margin: "2.5rem auto 0", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
            Todos los planes incluyen <strong style={{ color: "#64748B" }}>30 días de prueba gratis</strong>. Sin tarjeta de crédito requerida. Cancela en cualquier momento desde tu perfil.
          </p>
        </div>
      </section>

      {/* ── FAQ precios ────────────────────────────────────────────────────── */}
      <section style={{ padding: "3rem 2rem 5rem", background: "#071520" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 700,
              color: "#F1F5F9",
              margin: "0 0 2.5rem",
              textAlign: "center",
            }}
          >
            Preguntas frecuentes sobre los planes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              {
                q: "¿Puedo cambiar de plan después?",
                a: "Sí. Puedes subir o bajar de plan en cualquier momento desde la configuración de tu cuenta. Los cambios se aplican al siguiente ciclo de facturación.",
              },
              {
                q: "¿Qué pasa si cancelo?",
                a: "Tu cuenta pasa al plan Gratuito automáticamente. Conservas el acceso a todos tus datos históricos. Solo pierdes las funcionalidades premium.",
              },
              {
                q: "¿Hay cobros ocultos?",
                a: "No. El precio que ves es el que pagas. Para el plan Contador, los clientes adicionales más allá de los 5 incluidos tienen un cargo adicional claramente indicado.",
              },
              {
                q: "¿Aceptan boleta o factura?",
                a: "Sí, emitimos boleta electrónica automática. Para factura electrónica contáctanos a admin@ledgera.cl.",
              },
            ].map((item) => (
              <div
                key={item.q}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "12px",
                  padding: "1.5rem",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#F1F5F9",
                    margin: "0 0 8px",
                  }}
                >
                  {item.q}
                </h3>
                <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0, lineHeight: 1.65 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <p style={{ fontSize: "14px", color: "#64748B", margin: "0 0 1rem" }}>
              ¿Tienes más preguntas?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 22px",
                  borderRadius: "9px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94A3B8",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#4ADE80">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Escribir por WhatsApp
              </a>
              <a
                href="mailto:admin@ledgera.cl"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 22px",
                  borderRadius: "9px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94A3B8",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                admin@ledgera.cl
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: "#040C13",
          padding: "3rem 2.5rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
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
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                  Producto
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/register" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Comenzar gratis</Link>
                  <Link href="/planes" style={{ fontSize: "13px", color: "#4ADE80", textDecoration: "none" }}>Precios</Link>
                  <Link href="/login" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Iniciar sesión</Link>
                  <Link href="/blog" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Blog</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                  Legal
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/terminos" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Términos y condiciones</Link>
                  <Link href="/privacidad" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Política de privacidad</Link>
                  <Link href="/cookies" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>Política de cookies</Link>
                </div>
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                  Contacto
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <a href="mailto:admin@ledgera.cl" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>admin@ledgera.cl</a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>WhatsApp soporte</a>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.04)",
              paddingTop: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <span style={{ fontSize: "12px", color: "#334155" }}>
              © {new Date().getFullYear()} Ledgera · Chile · Ley 21.719 protección de datos
            </span>
            <span style={{ fontSize: "12px", color: "#334155" }}>ledgera.cl</span>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "rgba(10,31,46,0.92)",
            border: "1px solid rgba(255,255,255,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 998,
            backdropFilter: "blur(8px)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 12V4M4 8l4-4 4 4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </main>
  );
}

export default function PlanesPage() {
  return (
    <Suspense>
      <PlanesContent />
    </Suspense>
  );
}
