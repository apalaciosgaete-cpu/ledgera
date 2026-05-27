// src/components/landing/LedgeraLanding.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";

type BillingMode = "monthly" | "annual";

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
  note?: string;
};

const CONTACT_HREF =
  "mailto:admin@ledgera.cl?subject=Contacto%20LEDGERA";

const HERO_IMAGES = ["/hero-bg.jpg", "/hero1-bg.jpg", "/hero2-bg.jpg"];

const navLinks = [
  { label: "Quiénes somos", href: "/quienes-somos" },
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Planes", href: "/planes" },
  { label: "Preguntas", href: "/preguntas" },
  { label: "Blog", href: "/blog" },
];

const modules = [
  {
    title: "Importaciones",
    text: "Revisa datos antes de confirmarlos. Nada entra al portafolio sin control.",
  },
  {
    title: "Banco",
    text: "Carga cartolas y detecta movimientos que pueden tener relación con actividad crypto.",
  },
  {
    title: "Portafolio",
    text: "Conserva solo movimientos confirmados para construir una vista financiera limpia.",
  },
  {
    title: "Conciliación",
    text: "Relaciona banco, exchange y portafolio con revisión humana antes de cerrar coincidencias.",
  },
  {
    title: "Tributario",
    text: "Prepara una base ordenada para revisar impuestos crypto en Chile.",
  },
  {
    title: "Auditoría",
    text: "Mantén trazabilidad de decisiones, cambios y movimientos relevantes.",
  },
];

const flow = [
  {
    step: "01",
    title: "Importa tus fuentes",
    text: "Carga movimientos desde exchanges compatibles, cartolas bancarias o registros manuales.",
  },
  {
    step: "02",
    title: "Revisa antes de confirmar",
    text: "Cada evento queda en una bandeja de importaciones para evitar duplicados y errores.",
  },
  {
    step: "03",
    title: "Concilia banco y crypto",
    text: "Busca coincidencias entre transferencias bancarias y movimientos confirmados.",
  },
  {
    step: "04",
    title: "Prepara información clara",
    text: "Obtén portafolio limpio, trazabilidad y base útil para revisión financiera y tributaria.",
  },
];

const problems = [
  "Movimientos repartidos entre exchange, banco y archivos sueltos.",
  "Compras, ventas, depósitos y retiros difíciles de explicar.",
  "Transferencias bancarias sin contexto financiero crypto.",
  "Portafolios contaminados por importaciones automáticas o duplicadas.",
  "Información insuficiente para conversar con un contador.",
];

const seoLinks = [
  { label: "Impuestos crypto en Chile", href: "/impuestos-crypto-chile" },
  { label: "Declarar criptomonedas", href: "/como-declarar-crypto-en-chile" },
  { label: "Conciliación banco y crypto", href: "/conciliacion-binance-banco" },
  { label: "Contador crypto en Chile", href: "/contador-crypto-chile" },
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
    href: "/register",
    features: [
      "Hasta 25 movimientos",
      "Importaciones básicas",
      "Portafolio inicial",
      "Panel tributario básico",
    ],
  },
  {
    key: "personal",
    name: "Personal",
    monthly: 4990,
    annual: 49900,
    description: "Para usuarios crypto individuales",
    highlight: true,
    cta: "Empezar ahora",
    href: "/register",
    features: [
      "Movimientos ilimitados",
      "Importaciones y revisión",
      "Conciliación banco y crypto",
      "Exportación CSV y PDF",
      "Auditoría de movimientos",
    ],
  },
  {
    key: "contador",
    name: "Contador",
    monthly: 14990,
    annual: 149900,
    description: "Para revisar información de clientes",
    highlight: false,
    cta: "Contactar a LEDGERA",
    href: CONTACT_HREF,
    features: [
      "Todo lo de Personal",
      "Hasta 5 clientes incluidos",
      "Reportes verificables",
      "Trazabilidad por cliente",
      "Soporte prioritario",
    ],
    note: "Cliente adicional según volumen.",
  },
  {
    key: "empresa",
    name: "Empresa",
    monthly: 29990,
    annual: 299900,
    description: "Para operación corporativa",
    highlight: false,
    cta: "Hablar con LEDGERA",
    href: CONTACT_HREF,
    features: [
      "Todo lo de Contador",
      "Usuarios y clientes ampliados",
      "Auditoría operacional",
      "Configuración tributaria",
      "Soporte dedicado",
    ],
  },
];

const sectionStyle: CSSProperties = {
  padding: "4.5rem 1.5rem",
};

const containerStyle: CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const h2Style: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "clamp(2rem, 4vw, 3.25rem)",
  fontWeight: 800,
  lineHeight: 1.05,
  letterSpacing: "-0.045em",
  color: "var(--color-text-light)",
  margin: 0,
};

const mutedTextStyle: CSSProperties = {
  color: "var(--color-text-muted)",
  lineHeight: 1.7,
};

function formatClp(value: number) {
  if (value === 0) return "Gratis";

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);
}

function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        minHeight: "calc(100vh - 76px)",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        padding: "4rem 1.5rem",
      }}
    >
      {HERO_IMAGES.map((image, index) => (
        <div
          key={image}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('${image}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: current === index ? 1 : 0,
            transition: "opacity 1.2s ease-in-out",
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(4,12,19,0.92) 0%, rgba(15,42,61,0.86) 52%, rgba(15,42,61,0.72) 100%)",
        }}
      />

      <div
        className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-8 items-center"
        style={{
          ...containerStyle,
          position: "relative",
          zIndex: 1,
          width: "100%",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: "999px",
              border: "1px solid rgba(22,163,74,0.28)",
              background: "rgba(22,163,74,0.14)",
              color: "#86EFAC",
              padding: "0.45rem 1rem",
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            Orden financiero crypto para Chile
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 6vw, 5.6rem)",
              fontWeight: 850,
              lineHeight: 0.95,
              letterSpacing: "-0.075em",
              color: "var(--color-text-light)",
              margin: 0,
              maxWidth: "820px",
            }}
          >
            Ordena tus movimientos crypto.
            <br />
            <span style={{ color: "var(--color-accent)" }}>
              Concilia banco, exchange y portafolio.
            </span>
            <br />
            Prepara información clara.
          </h1>

          <p
            style={{
              ...mutedTextStyle,
              maxWidth: "650px",
              fontSize: "1.08rem",
              margin: "1.5rem 0 0",
              color: "#CBD5E1",
            }}
          >
            LEDGERA conecta importaciones, banco, portafolio, conciliación y
            base tributaria en un flujo trazable para personas con actividad
            crypto en Chile.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.85rem",
              marginTop: "2rem",
            }}
          >
            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                background: "var(--color-accent)",
                color: "#FFFFFF",
                padding: "0.95rem 1.45rem",
                fontWeight: 800,
                fontSize: "0.95rem",
              }}
            >
              Comenzar a ordenar
            </Link>

            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "#E2E8F0",
                padding: "0.95rem 1.45rem",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              Ya tengo cuenta
            </Link>
          </div>

          <p
            style={{
              marginTop: "1.25rem",
              fontSize: "0.86rem",
              color: "#94A3B8",
            }}
          >
            Importa tus fuentes, concilia banco y exchange, y prepara una base
            tributaria trazable para Chile.
          </p>
        </div>

        <div
          className="hidden md:block"
          style={{
            borderRadius: "28px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(15,42,61,0.84)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
            padding: "1rem",
          }}
        >
          <div
            style={{
              borderRadius: "22px",
              background: "rgba(4,12,19,0.72)",
              padding: "1.35rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-warning)",
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Flujo LEDGERA
                </p>
                <p style={{ margin: "0.35rem 0 0", color: "#94A3B8" }}>
                  Revisión antes de confirmar
                </p>
              </div>

              <span
                style={{
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  background: "rgba(22,163,74,0.14)",
                  color: "#86EFAC",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}
              >
                Trazable
              </span>
            </div>

            <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
              {[
                ["Importar", "Exchange, banco o carga manual"],
                ["Revisar", "Bandeja de confirmación antes de confirmar"],
                ["Conciliar", "Banco y crypto en un solo flujo"],
                ["Preparar", "Base tributaria trazable para Chile"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  style={{
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    padding: "1rem",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 850, color: "#F8FAFC" }}>
                    {title}
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      color: "#94A3B8",
                      fontSize: "0.9rem",
                    }}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LedgeraLanding() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [billing, setBilling] = useState<BillingMode>("monthly");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const visiblePlans = plans;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/portafolio");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main
      style={{
        fontFamily: "var(--font-body)",
        background:
          "linear-gradient(180deg, var(--color-primary) 0%, #071B28 28%, #061520 58%, var(--color-primary) 100%)",
        color: "var(--color-text-light)",
        overflowX: "hidden",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: "76px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(15,42,61,0.96)",
          backdropFilter: "blur(14px)",
        }}
      >
        <Link href="/" aria-label="Inicio LEDGERA">
          <Logo variant="light" size="lg" showSubtitle />
        </Link>

        <div className="hidden md:flex" style={{ alignItems: "center", gap: 6 }}>
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "0.55rem 0.85rem",
                borderRadius: "10px",
                color: "#CBD5E1",
                fontSize: "0.9rem",
                fontWeight: 700,
              }}
            >
              {item.label}
            </Link>
          ))}

          <span
            style={{
              width: 1,
              height: 22,
              background: "rgba(255,255,255,0.12)",
              margin: "0 0.5rem",
            }}
          />

          <Link
            href="/login"
            style={{
              padding: "0.65rem 0.95rem",
              borderRadius: "10px",
              color: "#CBD5E1",
              fontSize: "0.9rem",
              fontWeight: 700,
            }}
          >
            Iniciar sesión
          </Link>

          <Link
            href="/register"
            style={{
              padding: "0.72rem 1rem",
              borderRadius: "10px",
              background: "var(--color-accent)",
              color: "#FFFFFF",
              fontSize: "0.9rem",
              fontWeight: 850,
            }}
          >
            Comenzar ahora
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileMenuOpen((current) => !current)}
          style={{
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)",
            color: "#E2E8F0",
            borderRadius: "12px",
            padding: "0.6rem 0.8rem",
            fontWeight: 800,
          }}
        >
          Menú
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div
          className="md:hidden"
          style={{
            position: "sticky",
            top: "76px",
            zIndex: 90,
            background: "rgba(15,42,61,0.98)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "1rem 1.5rem",
          }}
        >
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: "#CBD5E1", fontWeight: 700 }}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: "#CBD5E1", fontWeight: 700 }}
            >
              Iniciar sesión
            </Link>

            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                borderRadius: "10px",
                background: "var(--color-accent)",
                color: "#FFFFFF",
                padding: "0.75rem 1rem",
                textAlign: "center",
                fontWeight: 850,
              }}
            >
              Comenzar ahora
            </Link>
          </div>
        </div>
      ) : null}

      <HeroCarousel />

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <div
            style={{
              maxWidth: 860,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "var(--color-warning)",
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontSize: "0.78rem",
                margin: 0,
              }}
            >
              Problema real
            </p>

            <h2 style={{ ...h2Style, marginTop: "0.9rem" }}>
              Tu información crypto está dispersa antes de llegar a impuestos.
            </h2>

            <p
              style={{
                ...mutedTextStyle,
                maxWidth: 720,
                fontSize: "1rem",
                margin: "1rem auto 0",
              }}
            >
              Exchange, banco, portafolio y reportes tributarios no deberían
              vivir separados. LEDGERA conecta esas piezas antes de preparar
              cualquier análisis.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "1rem",
              marginTop: "2rem",
            }}
          >
            {problems.map((problem) => (
              <div
                key={problem}
                style={{
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  padding: "1.25rem",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#CBD5E1",
                    fontSize: "0.95rem",
                    lineHeight: 1.55,
                    fontWeight: 650,
                  }}
                >
                  {problem}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: "rgba(255,255,255,0.03)" }}>
        <div style={containerStyle}>
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
            <p
              style={{
                color: "#86EFAC",
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontSize: "0.78rem",
                margin: 0,
              }}
            >
              Cómo funciona
            </p>
            <h2 style={{ ...h2Style, marginTop: "0.9rem" }}>
              De datos dispersos a información financiera revisada.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(235px, 1fr))",
              gap: "1rem",
              marginTop: "2.25rem",
            }}
          >
            {flow.map((item) => (
              <div
                key={item.step}
                style={{
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(15,42,61,0.72)",
                  padding: "1.35rem",
                }}
              >
                <span
                  style={{
                    color: "var(--color-warning)",
                    fontWeight: 900,
                    fontSize: "0.82rem",
                  }}
                >
                  {item.step}
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#F8FAFC",
                    fontSize: "1.25rem",
                    margin: "0.65rem 0 0",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    ...mutedTextStyle,
                    margin: "0.75rem 0 0",
                    fontSize: "0.95rem",
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <div
            style={{
              maxWidth: 900,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "var(--color-warning)",
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontSize: "0.78rem",
                margin: 0,
              }}
            >
              Producto construido
            </p>

            <h2 style={{ ...h2Style, marginTop: "0.9rem" }}>
              LEDGERA no es una extensión de un exchange. Es un sistema de
              orden financiero crypto.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
              marginTop: "2rem",
            }}
          >
            {modules.map((module) => (
              <div
                key={module.title}
                style={{
                  borderRadius: "18px",
                  background: "rgba(255,255,255,0.045)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "1.45rem",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.35rem",
                    color: "#F8FAFC",
                    margin: 0,
                  }}
                >
                  {module.title}
                </h3>
                <p
                  style={{
                    ...mutedTextStyle,
                    margin: "0.75rem 0 0",
                    fontSize: "0.95rem",
                  }}
                >
                  {module.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="planes"
        style={{ ...sectionStyle, background: "rgba(255,255,255,0.03)" }}
      >
        <div style={containerStyle}>
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
            <p
              style={{
                color: "#86EFAC",
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontSize: "0.78rem",
                margin: 0,
              }}
            >
              Planes
            </p>
            <h2 style={{ ...h2Style, marginTop: "0.9rem" }}>
              Empieza simple y escala cuando tu información crezca.
            </h2>

            <div
              style={{
                display: "inline-flex",
                gap: "0.35rem",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "999px",
                padding: "0.35rem",
                marginTop: "1.5rem",
              }}
            >
              {[
                { value: "monthly", label: "Mensual" },
                { value: "annual", label: "Anual" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBilling(option.value as BillingMode)}
                  style={{
                    border: "none",
                    borderRadius: "999px",
                    padding: "0.6rem 1rem",
                    background:
                      billing === option.value
                        ? "var(--color-accent)"
                        : "transparent",
                    color: billing === option.value ? "#FFFFFF" : "#CBD5E1",
                    fontWeight: 850,
                    cursor: "pointer",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
              gap: "1rem",
              marginTop: "2rem",
            }}
          >
            {visiblePlans.map((plan) => {
              const price = billing === "monthly" ? plan.monthly : plan.annual;

              return (
                <div
                  key={plan.key}
                  style={{
                    position: "relative",
                    borderRadius: "20px",
                    border: plan.highlight
                      ? "1px solid rgba(22,163,74,0.55)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: plan.highlight
                      ? "linear-gradient(180deg, rgba(22,163,74,0.13), rgba(255,255,255,0.045))"
                      : "rgba(255,255,255,0.045)",
                    padding: "1.45rem",
                  }}
                >
                  {plan.highlight ? (
                    <span
                      style={{
                        position: "absolute",
                        top: "1rem",
                        right: "1rem",
                        borderRadius: "999px",
                        background: "rgba(22,163,74,0.16)",
                        color: "#86EFAC",
                        padding: "0.35rem 0.75rem",
                        fontSize: "0.72rem",
                        fontWeight: 900,
                      }}
                    >
                      Recomendado
                    </span>
                  ) : null}

                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.35rem",
                      margin: 0,
                    }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    style={{
                      ...mutedTextStyle,
                      minHeight: 48,
                      margin: "0.6rem 0 0",
                      fontSize: "0.92rem",
                    }}
                  >
                    {plan.description}
                  </p>

                  <div style={{ marginTop: "1.25rem" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "2rem",
                        fontWeight: 850,
                      }}
                    >
                      {formatClp(price)}
                    </span>
                    {price > 0 ? (
                      <span style={{ color: "#94A3B8", marginLeft: "0.35rem" }}>
                        / {billing === "monthly" ? "mes" : "año"}
                      </span>
                    ) : null}
                  </div>

                  <Link
                    href={plan.href}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "1.25rem",
                      borderRadius: "12px",
                      background: plan.highlight
                        ? "var(--color-accent)"
                        : "rgba(255,255,255,0.08)",
                      border: plan.highlight
                        ? "1px solid var(--color-accent)"
                        : "1px solid rgba(255,255,255,0.10)",
                      color: "#FFFFFF",
                      padding: "0.85rem 1rem",
                      fontWeight: 850,
                    }}
                  >
                    {plan.cta}
                  </Link>

                  <ul
                    style={{
                      display: "grid",
                      gap: "0.65rem",
                      listStyle: "none",
                      padding: 0,
                      margin: "1.25rem 0 0",
                    }}
                  >
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        style={{
                          color: "#CBD5E1",
                          fontSize: "0.9rem",
                          lineHeight: 1.45,
                        }}
                      >
                        ✓ {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.note ? (
                    <p
                      style={{
                        margin: "1rem 0 0",
                        color: "#94A3B8",
                        fontSize: "0.78rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {plan.note}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <div
            className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] items-center"
            style={{
              borderRadius: "26px",
              border: "1px solid rgba(255,255,255,0.10)",
              background:
                "linear-gradient(135deg, rgba(22,163,74,0.16), rgba(15,42,61,0.92))",
              padding: "2rem",
              gap: "1.5rem",
            }}
          >
            <div>
              <h2 style={{ ...h2Style, fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}>
                Ordena tu historial crypto antes de tomar decisiones
                tributarias.
              </h2>
              <p
                style={{
                  ...mutedTextStyle,
                  color: "#CBD5E1",
                  maxWidth: 720,
                  margin: "1rem 0 0",
                }}
              >
                Primero importa, revisa y confirma. Después analiza portafolio,
                conciliación y base tributaria.
              </p>
            </div>

            <Link
              href="/register"
              className="text-center"
              style={{
                display: "block",
                borderRadius: "14px",
                background: "var(--color-accent)",
                color: "#FFFFFF",
                padding: "1rem 1.35rem",
                fontWeight: 900,
              }}
            >
              Comenzar ahora
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            {seoLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.045)",
                  padding: "1.1rem",
                  color: "#E2E8F0",
                  fontWeight: 800,
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "1.5rem 1.5rem 0" }}>
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <p
            style={{
              color: "#475569",
              fontSize: "0.8rem",
              lineHeight: 1.6,
              maxWidth: 760,
              margin: "0 auto",
            }}
          >
            LEDGERA organiza y prepara información financiera-tributaria. No
            reemplaza la revisión profesional de un contador ni constituye
            asesoría tributaria personalizada.
          </p>
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "3rem 1.5rem",
          background: "#040C13",
        }}
      >
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,minmax(150px,1fr))]"
          style={{
            ...containerStyle,
            gap: "2rem",
          }}
        >
          <div>
            <Logo variant="light" size="lg" showSubtitle />
            <p
              style={{
                ...mutedTextStyle,
                maxWidth: 360,
                margin: "1rem 0 0",
                fontSize: "0.92rem",
              }}
            >
              Sistema financiero-tributario para ordenar actividad crypto,
              conciliar fuentes y preparar información clara en Chile.
            </p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.85rem", color: "#F8FAFC" }}>
              Producto
            </h4>
            <div style={{ display: "grid", gap: "0.55rem" }}>
              {navLinks.map((item) => (
                <Link key={item.href} href={item.href} style={{ color: "#94A3B8" }}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.85rem", color: "#F8FAFC" }}>Legal</h4>
            <div style={{ display: "grid", gap: "0.55rem" }}>
              <Link href="/terminos" style={{ color: "#94A3B8" }}>
                Términos y condiciones
              </Link>
              <Link href="/privacidad" style={{ color: "#94A3B8" }}>
                Política de privacidad
              </Link>
              <Link href="/cookies" style={{ color: "#94A3B8" }}>
                Política de cookies
              </Link>
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.85rem", color: "#F8FAFC" }}>
              Contacto
            </h4>

            <div style={{ display: "grid", gap: "0.55rem" }}>
              <a href="mailto:admin@ledgera.cl" style={{ color: "#94A3B8" }}>
                admin@ledgera.cl
              </a>
            </div>
          </div>
        </div>

        <div
          style={{
            ...containerStyle,
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "#64748B",
            fontSize: "0.85rem",
          }}
        >
          © {new Date().getFullYear()} LEDGERA. Todos los derechos reservados.
        </div>
      </footer>

      {showScrollTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            right: "1.25rem",
            bottom: "1.25rem",
            zIndex: 80,
            width: 48,
            height: 48,
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "var(--color-primary-hover)",
            color: "#FFFFFF",
            fontWeight: 900,
            cursor: "pointer",
          }}
          aria-label="Volver arriba"
        >
          ↑
        </button>
      ) : null}
    </main>
  );
}
