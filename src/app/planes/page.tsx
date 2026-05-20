"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import { Logo } from "@/components/brand/Logo";
import { BillingCheckoutButton } from "@/components/billing/BillingCheckoutButton";
import { BillingPaymentStatusBanner } from "@/components/billing/BillingPaymentStatusBanner";
import { useAuth } from "@/modules/identity/client/authContext";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number";

type PlanKey = "free" | "personal" | "contador" | "empresa";
type PaidPlanKey = Exclude<PlanKey, "free">;
type BillingPlan = "PROFESIONAL" | "EMPRESA";

type Plan = {
  key: PlanKey;
  name: string;
  monthly: number;
  annual: number;
  description: string;
  highlight: boolean;
  cta: string;
  features: string[];
  disabled: string[];
  note: string | null;
};

const NAV_LINKS = [
  { label: "Quiénes somos", href: "/bienvenida#quienes-somos" },
  { label: "Cómo funciona", href: "/bienvenida#como-funciona" },
  { label: "Planes", href: "/planes" },
  { label: "Preguntas", href: "/preguntas" },
  { label: "Blog", href: "/blog" },
];

const plans: Plan[] = [
  {
    key: "free",
    name: "Gratuito",
    monthly: 0,
    annual: 0,
    description: "Para explorar la plataforma",
    highlight: false,
    cta: "Crear cuenta gratis",
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

const h2Style: CSSProperties = {
  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
  fontSize: "clamp(2rem, 4vw, 3.25rem)",
  fontWeight: 700,
  color: "#F1F5F9",
  letterSpacing: "-0.03em",
  margin: "0 0 1rem",
  lineHeight: 1.1,
};

function formatClp(value: number) {
  if (value === 0) return "Gratis";

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);
}

function resolvePaidPlan(planKey: PaidPlanKey): BillingPlan {
  return planKey === "empresa" ? "EMPRESA" : "PROFESIONAL";
}

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

  return (
    <main
      style={{
        fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
        background: "#0A1F2E",
        color: "#F1F5F9",
        overflowX: "hidden",
      }}
    >
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
                  color:
                    isActive || hoveredNav === item.label
                      ? "#F1F5F9"
                      : "#94A3B8",
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

          <div
            style={{
              width: 1,
              height: 20,
              background: "rgba(255,255,255,0.1)",
              margin: "0 8px",
            }}
          />

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
              background:
                hoveredNav === "login" ? "rgba(255,255,255,0.06)" : "transparent",
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

        <button
          className="flex sm:hidden"
          onClick={() => setMobileMenuOpen((value) => !value)}
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
              <path
                d="M4 4l12 12M16 4L4 16"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </nav>

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

          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.06)",
              margin: "6px 0",
            }}
          />

          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "#94A3B8",
              textDecoration: "none",
              padding: "10px 0",
            }}
          >
            Iniciar sesión
          </Link>

          <Link
            href={isAuthenticated ? "/portafolio" : "/register"}
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
            {isAuthenticated ? "Ir a mi cuenta" : "Comenzar gratis"}
          </Link>
        </div>
      )}

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
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#4ADE80",
              letterSpacing: "0.04em",
            }}
          >
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
            maxWidth: "520px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.65,
          }}
        >
          Elige el plan que se adapte a tu operación. Puedes pagar con
          Mercado Pago o transferencia bancaria vía Khipu.
        </p>

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
          {(["monthly", "annual"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setBilling(option)}
              style={{
                padding: "9px 22px",
                borderRadius: "7px",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
                background: billing === option ? "#16A34A" : "transparent",
                color: billing === option ? "#ffffff" : "#64748B",
                transition: "all 0.15s ease",
              }}
            >
              {option === "monthly" ? "Mensual" : "Anual — 1 mes gratis"}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 2rem 5rem" }}>
        <BillingPaymentStatusBanner />

        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
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
                        fontFamily:
                          "var(--font-display, 'Space Grotesk', sans-serif)",
                        fontSize: "19px",
                        fontWeight: 700,
                        color: "#F1F5F9",
                        margin: "0 0 6px",
                      }}
                    >
                      {plan.name}
                    </h3>

                    <p
                      style={{
                        fontSize: "13px",
                        color: "#64748B",
                        margin: "0 0 1.25rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {plan.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily:
                            "var(--font-display, 'Space Grotesk', sans-serif)",
                          fontSize: "34px",
                          fontWeight: 700,
                          color: "#F1F5F9",
                          lineHeight: 1,
                        }}
                      >
                        {billing === "monthly"
                          ? formatClp(plan.monthly)
                          : formatClp(plan.annual)}
                      </span>

                      {plan.monthly > 0 && (
                        <span style={{ fontSize: "13px", color: "#475569" }}>
                          /{billing === "monthly" ? "mes" : "año"}
                        </span>
                      )}
                    </div>

                    {billing === "annual" && plan.annual > 0 && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#4ADE80",
                          margin: "6px 0 0",
                          fontWeight: 500,
                        }}
                      >
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
                    {plan.features.map((feature) => {
                      const isDisabled = plan.disabled.includes(feature);

                      return (
                        <li
                          key={feature}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "14px",
                            color: isDisabled ? "#334155" : "#94A3B8",
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            style={{ flexShrink: 0 }}
                          >
                            {isDisabled ? (
                              <line
                                x1="4"
                                y1="8"
                                x2="12"
                                y2="8"
                                stroke="#334155"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            ) : (
                              <>
                                <circle
                                  cx="8"
                                  cy="8"
                                  r="7"
                                  stroke="#16A34A"
                                  strokeWidth="1.2"
                                />
                                <path
                                  d="M5 8l2 2 4-4"
                                  stroke="#16A34A"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </>
                            )}
                          </svg>

                          {feature}
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

                  {plan.key === "free" ? (
                    <Link
                      href={isAuthenticated ? "/portafolio" : "/register"}
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "13px 20px",
                        borderRadius: "9px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#E2E8F0",
                        fontSize: "14px",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      {isAuthenticated ? "Ir al panel" : plan.cta}
                    </Link>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <BillingCheckoutButton
                        provider="MERCADOPAGO"
                        plan={resolvePaidPlan(plan.key)}
                        style={{
                          padding: "13px 20px",
                          borderRadius: "9px",
                          background: plan.highlight
                            ? "#16A34A"
                            : "rgba(255,255,255,0.06)",
                          border: plan.highlight
                            ? "none"
                            : "1px solid rgba(255,255,255,0.1)",
                          color: plan.highlight ? "#ffffff" : "#E2E8F0",
                          fontSize: "14px",
                          fontWeight: 700,
                          fontFamily:
                            "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
                        }}
                      >
                        Pagar con Mercado Pago
                      </BillingCheckoutButton>

                      <BillingCheckoutButton
                        provider="KHIPU"
                        plan={resolvePaidPlan(plan.key)}
                        style={{
                          padding: "11px 20px",
                          borderRadius: "9px",
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#94A3B8",
                          fontSize: "13px",
                          fontWeight: 600,
                          fontFamily:
                            "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
                        }}
                      >
                        Pagar por transferencia Khipu
                      </BillingCheckoutButton>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                q: "¿Puedo pagar con transferencia?",
                a: "Sí. Khipu permite iniciar pagos por transferencia bancaria desde bancos chilenos.",
              },
              {
                q: "¿Puedo pagar con tarjeta?",
                a: "Sí. Mercado Pago permite pagar con tarjetas y medios disponibles en su checkout.",
              },
              {
                q: "¿Cuándo se activa el plan?",
                a: "La activación ocurre cuando el proveedor confirma el pago mediante webhook.",
              },
              {
                q: "¿Puedo cambiar de plan después?",
                a: "Sí. La gestión avanzada de cambios de plan se implementará sobre el mismo módulo de billing.",
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
                    fontFamily:
                      "var(--font-display, 'Space Grotesk', sans-serif)",
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
        </div>
      </section>

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

              <p
                style={{
                  fontSize: "13px",
                  color: "#475569",
                  margin: 0,
                  maxWidth: "260px",
                  lineHeight: 1.6,
                }}
              >
                Software tributario especializado en criptomonedas para el mercado chileno.
              </p>
            </div>

            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 12px",
                  }}
                >
                  Producto
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/register" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Comenzar gratis
                  </Link>
                  <Link href="/planes" style={{ fontSize: "13px", color: "#4ADE80", textDecoration: "none" }}>
                    Precios
                  </Link>
                  <Link href="/login" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Iniciar sesión
                  </Link>
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 12px",
                  }}
                >
                  Contacto
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <a href="mailto:admin@ledgera.cl" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    admin@ledgera.cl
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: "12px", color: "#334155", margin: 0 }}>
              © {new Date().getFullYear()} LEDGERA. Todos los derechos reservados.
            </p>

            <p style={{ fontSize: "12px", color: "#334155", margin: 0 }}>
              Pagos integrados con Mercado Pago y Khipu.
            </p>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            right: "24px",
            bottom: "24px",
            zIndex: 120,
            width: "44px",
            height: "44px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(10,31,46,0.92)",
            color: "#94A3B8",
            cursor: "pointer",
          }}
        >
          ↑
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