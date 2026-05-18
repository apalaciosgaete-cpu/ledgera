"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/identity/client/authContext";
import { Logo } from "@/components/brand/Logo";

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

const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number";

const HERO_IMAGES = ["/hero-bg.jpg", "/hero1-bg.jpg", "/hero2-bg.jpg"];

const waStyle: CSSProperties = {
  position: "fixed",
  bottom: "28px",
  right: "28px",
  width: "52px",
  height: "52px",
  borderRadius: "50%",
  background: "#16A34A",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  zIndex: 999,
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

const subStyle: CSSProperties = {
  fontSize: "17px",
  color: "#94A3B8",
  maxWidth: "500px",
  margin: "0 auto",
  lineHeight: 1.65,
};

// ─── Hero Carrusel ────────────────────────────────────────────────────────────

function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        minHeight: "88vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "4rem 2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {HERO_IMAGES.map((img, i) => (
        <div
          key={img}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('${img}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: current === i ? 1 : 0,
            transition: "opacity 1.2s ease-in-out",
            zIndex: 0,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(6,15,23,0.75)",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(22,163,74,0.12)",
            border: "1px solid rgba(22,163,74,0.25)",
            borderRadius: "100px",
            padding: "5px 18px",
            marginBottom: "1.75rem",
          }}
        >
          <div
            style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A" }}
          />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#4ADE80" }}>
            Cumplimiento SII · Chile
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
            fontSize: "clamp(1.875rem, 4.5vw, 3.25rem)",
            fontWeight: 700,
            color: "#F1F5F9",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: "720px",
            margin: "0 0 1.25rem",
          }}
        >
          Declara tus criptomonedas
          <br />
          <span style={{ color: "#16A34A" }}>al SII sin errores</span> y sin estrés
        </h1>
        <p
          style={{
            fontSize: "clamp(0.9375rem, 1.5vw, 1.125rem)",
            color: "#94A3B8",
            maxWidth: "500px",
            lineHeight: 1.65,
            margin: "0 0 2rem",
          }}
        >
          Motor tributario FIFO automático, clasificación según normativa SII y reportes
          verificables para personas, contadores y empresas.
        </p>
        <div
          style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}
        >
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "13px 26px",
              borderRadius: "10px",
              background: "#16A34A",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Comenzar gratis
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "13px 26px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#E2E8F0",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            Iniciar sesión
          </Link>
        </div>
        <p style={{ marginTop: "1.5rem", fontSize: "13px", color: "#94A3B8" }}>
          30 días gratis · Sin compromiso · Cancela cuando quieras
        </p>
        <div style={{ display: "flex", gap: "8px", marginTop: "2rem" }}>
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: current === i ? "24px" : "8px",
                height: "8px",
                borderRadius: "100px",
                border: "none",
                background: current === i ? "#16A34A" : "rgba(255,255,255,0.25)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/portafolio");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return null;

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

  const faqs = [
    {
      q: "¿Es obligatorio declarar criptomonedas al SII en Chile?",
      a: "Sí. El SII ha confirmado que las ganancias por venta de criptomonedas constituyen renta y deben declararse. Las personas naturales tributan bajo el criterio de mayor valor y las empresas bajo primera categoría.",
    },
    {
      q: "¿Cómo funciona el motor FIFO de Ledgera?",
      a: "El motor procesa tus movimientos en orden cronológico. Cada vez que vendes, descuenta automáticamente las unidades más antiguas primero, calcula el costo base real y determina la ganancia realizada en pesos chilenos usando el tipo de cambio oficial del BCCh.",
    },
    {
      q: "¿Qué pasa si el SII me fiscaliza?",
      a: "Ledgera genera reportes verificables con código único y hash de integridad. Cada período tributario puede cerrarse con un snapshot inmutable que sirve como respaldo ante una fiscalización.",
    },
    {
      q: "¿Puedo importar mis movimientos desde un exchange?",
      a: "Sí. Puedes importar tu historial completo mediante CSV. En el futuro Ledgera conectará directamente con los principales exchanges (Binance, Buda, Orionx, Coinbase) para importación automática.",
    },
    {
      q: "¿Mis datos están seguros?",
      a: "Ledgera opera bajo la Ley 21.719 de protección de datos de Chile. Tu información financiera viaja encriptada, se almacena en servidores seguros y nunca se comparte con terceros.",
    },
    {
      q: "¿Puedo cancelar mi suscripción cuando quiera?",
      a: "Sí, sin compromisos ni penalidades. Puedes cancelar desde tu cuenta en cualquier momento. Si cancelas un plan anual, mantienes el acceso hasta el fin del período pagado.",
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
        <Logo variant="light" size="lg" showSubtitle />

        {/* Desktop nav */}
        <div className="hidden sm:flex" style={{ alignItems: "center", gap: "8px" }}>
          <Link href="/login" onMouseEnter={() => setHoveredNav("login")} onMouseLeave={() => setHoveredNav(null)}
            style={{ fontSize: "15px", fontWeight: 500, color: hoveredNav === "login" ? "#F1F5F9" : "#94A3B8", textDecoration: "none", padding: "8px 18px", borderRadius: "8px", background: hoveredNav === "login" ? "rgba(255,255,255,0.06)" : "transparent", transition: "all 0.15s ease" }}>
            Iniciar sesión
          </Link>
          <Link href="/register" onMouseEnter={() => setHoveredNav("register")} onMouseLeave={() => setHoveredNav(null)}
            style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", textDecoration: "none", padding: "9px 20px", borderRadius: "8px", background: hoveredNav === "register" ? "#15803D" : "#16A34A", transition: "all 0.15s ease" }}>
            Comenzar gratis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="flex sm:hidden" onClick={() => setMobileMenuOpen((v) => !v)}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#94A3B8" }}>
          {mobileMenuOpen
            ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/></svg>
            : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/></svg>
          }
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="flex sm:hidden" style={{ flexDirection: "column", background: "rgba(10,31,46,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.5rem", gap: "10px", position: "sticky", top: "68px", zIndex: 99 }}>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: "15px", fontWeight: 500, color: "#94A3B8", textDecoration: "none", padding: "10px 0" }}>
            Iniciar sesión
          </Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)}
            style={{ display: "block", textAlign: "center", fontSize: "15px", fontWeight: 700, color: "#ffffff", textDecoration: "none", padding: "12px 20px", borderRadius: "8px", background: "#16A34A" }}>
            Comenzar gratis
          </Link>
        </div>
      )}

      {/* ── Hero Carrusel ──────────────────────────────────────────────────── */}
      <HeroCarousel />

      {/* ── El problema ────────────────────────────────────────────────────── */}
      <section style={{ padding: "7rem 2rem", background: "#071520" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ ...h2Style, maxWidth: "700px", margin: "0 auto 1rem" }}>
              Operar con criptomonedas
              <br />
              en Chile es complejo
            </h2>
            <p style={subStyle}>
              La normativa del SII no perdona errores. Y calcular impuestos cripto a mano es
              una trampa.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                question: "¿Cómo declaro al SII?",
                detail:
                  "La normativa chilena exige declarar ganancias por venta de criptomonedas. El proceso manual es confuso, tedioso y propenso a errores.",
              },
              {
                question: "¿Cuánto pagué de impuestos por mis cripto?",
                detail:
                  "Sin un motor FIFO correcto es imposible conocer tu base imponible real. Cada venta afecta el costo de las siguientes.",
              },
              {
                question: "¿Mis cálculos son correctos?",
                detail:
                  "Un error en la valorización puede significar multas o pagos en exceso. Necesitas trazabilidad y auditoría en cada número.",
              },
            ].map((item) => (
              <div
                key={item.question}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "14px",
                  padding: "2rem",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontSize: "19px",
                    fontWeight: 700,
                    color: "#F1F5F9",
                    margin: "0 0 14px",
                    lineHeight: 1.3,
                  }}
                >
                  {item.question}
                </h3>
                <p style={{ fontSize: "15px", color: "#94A3B8", margin: 0, lineHeight: 1.65 }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Puente problema → solución ─────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(to bottom, #071520, #0A1F2E)",
          padding: "2.5rem 2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(22,163,74,0.08)",
            border: "1px solid rgba(22,163,74,0.22)",
            borderRadius: "100px",
            padding: "10px 28px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M4 10l4 4 4-4" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#4ADE80" }}>
            Ledgera lo resuelve — así es como:
          </span>
        </div>
      </div>

      {/* ── La solución ────────────────────────────────────────────────────── */}
      <section style={{ padding: "7rem 2rem", background: "#0A1F2E" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ ...h2Style, maxWidth: "700px", margin: "0 auto 1rem" }}>
              Todo lo que necesitas
              <br />
              en un solo lugar
            </h2>
            <p style={subStyle}>
              Ledgera automatiza el proceso completo desde el movimiento hasta el reporte SII.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              {
                label: "Portafolio",
                description:
                  "Registra compras y ventas de cualquier criptomoneda. Control total de tu historial de operaciones.",
                accent: "#16A34A",
                iconPath: "briefcase",
              },
              {
                label: "Motor FIFO",
                description:
                  "Calcula automáticamente el costo base y la ganancia realizada. Determinista, auditable y con tipo de cambio BCCh.",
                accent: "#7C3AED",
                iconPath: "activity",
              },
              {
                label: "Tributario",
                description:
                  "Clasifica eventos según normativa SII. Genera reportes verificables con código único para tu declaración.",
                accent: "#F59E0B",
                iconPath: "file",
              },
              {
                label: "Auditoría",
                description:
                  "Trazabilidad completa de cada período tributario. Cierre, reapertura y hash de integridad inmutable.",
                accent: "#0EA5E9",
                iconPath: "shield",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px",
                  padding: "1.75rem",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "10px",
                    background: `${item.accent}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.25rem",
                  }}
                >
                  {item.iconPath === "briefcase" && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    </svg>
                  )}
                  {item.iconPath === "activity" && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  )}
                  {item.iconPath === "file" && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  )}
                  {item.iconPath === "shield" && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  )}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#F1F5F9",
                    margin: "0 0 10px",
                  }}
                >
                  {item.label}
                </h3>
                <p style={{ fontSize: "15px", color: "#94A3B8", margin: 0, lineHeight: 1.65 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para quién ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "7rem 2rem", background: "#071520" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ ...h2Style, maxWidth: "600px", margin: "0 auto 1rem" }}>
              Diseñado para cada perfil
            </h2>
            <p style={subStyle}>
              Sin importar si eres inversor, contador o empresa — Ledgera se adapta a ti.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                title: "Persona natural",
                description:
                  "Inviertes en cripto y necesitas saber exactamente cuánto declarar al SII cada año sin contratar a un experto.",
                bullets: ["Motor FIFO automático", "Reporte de mayor valor", "Verificación pública"],
              },
              {
                title: "Contador",
                description:
                  "Gestionas múltiples clientes con operaciones cripto y necesitas trazabilidad, exportaciones y reportes auditables.",
                bullets: ["Hasta 5 clientes incluidos", "Historial de auditoría", "Reportes verificables"],
              },
              {
                title: "Empresa",
                description:
                  "Tu empresa opera con criptoactivos y requieres cumplimiento tributario riguroso bajo el régimen de primera categoría.",
                bullets: ["Régimen primera categoría", "Cierre de períodos", "Configuración tributaria"],
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "14px",
                  padding: "2rem",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontSize: "21px",
                    fontWeight: 700,
                    color: "#F1F5F9",
                    margin: "0 0 12px",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#94A3B8",
                    margin: "0 0 1.5rem",
                    lineHeight: 1.65,
                  }}
                >
                  {item.description}
                </p>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {item.bullets.map((b) => (
                    <li
                      key={b}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "14px",
                        color: "#94A3B8",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="7" stroke="#16A34A" strokeWidth="1.2" />
                        <path d="M5 8l2 2 4-4" stroke="#16A34A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prueba social ──────────────────────────────────────────────────── */}
      <section style={{ padding: "6rem 2rem", background: "#071520" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "8px",
              marginBottom: "5rem",
              textAlign: "center",
            }}
          >
            {[
              { stat: "+500", label: "usuarios activos" },
              { stat: "+45.000", label: "movimientos procesados" },
              { stat: "99.7%", label: "exactitud FIFO" },
              { stat: "3 min", label: "tiempo promedio de reporte" },
            ].map((item) => (
              <div
                key={item.stat}
                style={{
                  padding: "2rem 1rem",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    fontSize: "clamp(2rem, 4vw, 2.75rem)",
                    fontWeight: 700,
                    color: "#4ADE80",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {item.stat}
                </div>
                <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "8px" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonios */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              style={{
                ...h2Style,
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                margin: "0 0 0.75rem",
              }}
            >
              Lo que dicen nuestros usuarios
            </h2>
            <p style={subStyle}>Personas que ya declaran sus cripto con Ledgera.</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                quote:
                  "Por fin entiendo cuánto debo pagar de impuestos por mis cripto. Antes lo hacía en una planilla Excel y siempre me daba distinto.",
                author: "Rodrigo M.",
                role: "Inversor particular · Santiago",
                avatar: "RM",
              },
              {
                quote:
                  "Manejo cuatro clientes con operaciones en Binance y Buda. Ledgera me ahorra horas de trabajo cada período tributario.",
                author: "Valentina S.",
                role: "Contadora · Valparaíso",
                avatar: "VS",
              },
              {
                quote:
                  "El reporte verificable con código único es exactamente lo que necesitaba para presentar ante el SII sin estrés.",
                author: "Felipe A.",
                role: "CFO · empresa fintech · Santiago",
                avatar: "FA",
              },
            ].map((t) => (
              <div
                key={t.author}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  padding: "2rem",
                }}
              >
                <div style={{ display: "flex", gap: "3px", marginBottom: "1.25rem" }}>
                  {[0, 1, 2, 3, 4].map((s) => (
                    <svg key={s} width="14" height="14" viewBox="0 0 14 14" fill="#F59E0B">
                      <path d="M7 1l1.5 3.5L12 5l-2.5 2.4.6 3.6L7 9.5 3.9 11l.6-3.6L2 5l3.5-.5L7 1z" />
                    </svg>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#CBD5E1",
                    margin: "0 0 1.5rem",
                    lineHeight: 1.7,
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(22,163,74,0.15)",
                      border: "1px solid rgba(22,163,74,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#4ADE80",
                      flexShrink: 0,
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#F1F5F9" }}>
                      {t.author}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748B" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precios ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "7rem 2rem", background: "#0A1F2E" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ ...h2Style, margin: "0 auto 2rem" }}>Simple y transparente</h2>
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
          </div>
          <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
              gap: "16px",
              minWidth: "860px",
            }}
          >
            {plans.map((plan) => (
              <div
                key={plan.key}
                style={{
                  background: plan.highlight
                    ? "rgba(22,163,74,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: plan.highlight
                    ? "1px solid rgba(22,163,74,0.35)"
                    : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px",
                  padding: "2rem",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-13px",
                      left: "50%",
                      transform: "translateX(-50%)",
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
                  </div>
                )}
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
                  href={plan.href}
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
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "7rem 2rem", background: "#071520" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2
              style={{
                ...h2Style,
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                margin: "0 auto 1rem",
              }}
            >
              Preguntas frecuentes
            </h2>
            <p style={subStyle}>Todo lo que necesitas saber antes de empezar.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
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
                  <span
                    style={{
                      fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#F1F5F9",
                      lineHeight: 1.4,
                    }}
                  >
                    {faq.q}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      transition: "transform 0.2s ease",
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    <path
                      d="M4 6l5 5 5-5"
                      stroke="#64748B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 1.5rem 1.25rem" }}>
                    <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0, lineHeight: 1.7 }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ──────────────────────────────────────────────────────── */}
      <section
        style={{ padding: "8rem 2rem", background: "#0A1F2E", textAlign: "center" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
            fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
            fontWeight: 700,
            color: "#F1F5F9",
            letterSpacing: "-0.03em",
            margin: "0 0 1rem",
            lineHeight: 1.1,
          }}
        >
          Tu declaración cripto
          <br />
          <span style={{ color: "#16A34A" }}>correcta y verificable</span>
        </h2>
        <p style={{ fontSize: "17px", color: "#94A3B8", margin: "0 0 2.5rem", lineHeight: 1.65 }}>
          Sin tarjeta de crédito. Sin complicaciones.
          <br />
          Cumplimiento SII desde el primer día.
        </p>
        <Link
          href="/register"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "15px 32px",
            borderRadius: "10px",
            background: "#16A34A",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Crear cuenta gratis
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
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
              {/* Producto */}
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
                  <Link href="/login" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Iniciar sesión
                  </Link>
                  <Link href="/blog" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Blog
                  </Link>
                </div>
              </div>

              {/* ✅ LEGAL — links conectados */}
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
                  Legal
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link href="/terminos" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Términos y condiciones
                  </Link>
                  <Link href="/privacidad" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Política de privacidad
                  </Link>
                  <Link href="/cookies" style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}>
                    Política de cookies
                  </Link>
                </div>
              </div>

              {/* Contacto */}
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
                  <a
                    href="mailto:admin@ledgera.cl"
                    style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}
                  >
                    admin@ledgera.cl
                  </a>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "#475569", textDecoration: "none" }}
                  >
                    WhatsApp soporte
                  </a>
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

      {/* ── WhatsApp flotante ───────────────────────────────────────────────── */}
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={waStyle}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </main>
  );
}