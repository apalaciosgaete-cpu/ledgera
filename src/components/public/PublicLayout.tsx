// src/components/public/PublicLayout.tsx
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";
import { colors, fonts } from "@/styles/tokens";

export const PUBLIC_CONTACT_EMAIL = "admin@ledgera.cl";
export const PUBLIC_WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=56972871569&text=Hola%2C+tengo+una+consulta+sobre+Ledgera&type=phone_number";

export const publicNavLinks = [
  { label: "Quiénes somos", href: "/quienes-somos" },
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Planes", href: "/planes" },
  { label: "Preguntas", href: "/preguntas" },
  { label: "Blog", href: "/blog" },
];

export const publicPalette = {
  page: "#071520",
  section: "#0A1F2E",
  sectionSoft: "#0F2A3D",
  footer: "#040C13",
  action: colors.accent,
  actionHover: colors.accentHover,
  warning: colors.warning,
  text: "#F8FAFC",
  textSoft: "#CBD5E1",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
  border: "rgba(255,255,255,0.08)",
  card: "rgba(255,255,255,0.035)",
  cardStrong: "rgba(255,255,255,0.06)",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: publicPalette.page,
  color: publicPalette.text,
  fontFamily: fonts.body,
  overflowX: "hidden",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1120px",
  margin: "0 auto",
  paddingLeft: "24px",
  paddingRight: "24px",
};

export function PublicContainer({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <div style={{ ...containerStyle, ...style }}>{children}</div>;
}

export function PublicHeader({ activePath }: { activePath?: string }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(7, 21, 32, 0.94)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${publicPalette.border}`,
      }}
    >
      <PublicContainer
        style={{
          minHeight: "76px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          paddingTop: "10px",
          paddingBottom: "10px",
        }}
      >
        <Link href="/" aria-label="Inicio LEDGERA" style={{ textDecoration: "none", flexShrink: 0 }}>
          <Logo variant="light" size="lg" showSubtitle />
        </Link>

        <nav
          aria-label="Navegación principal"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          {publicNavLinks.map((item) => {
            const isActive = activePath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: isActive ? "#4ADE80" : publicPalette.textMuted,
                  background: isActive ? "rgba(22,163,74,0.12)" : "transparent",
                  border: isActive ? "1px solid rgba(22,163,74,0.18)" : "1px solid transparent",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: isActive ? 800 : 650,
                  padding: "8px 11px",
                  textDecoration: "none",
                  lineHeight: 1,
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/login"
            style={{
              marginLeft: "6px",
              color: publicPalette.textSoft,
              border: `1px solid ${publicPalette.border}`,
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              padding: "9px 14px",
              textDecoration: "none",
              lineHeight: 1,
            }}
          >
            Iniciar sesión
          </Link>

          <Link
            href="/register"
            style={{
              color: "#ffffff",
              background: publicPalette.action,
              border: "1px solid rgba(22,163,74,0.55)",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 850,
              padding: "10px 16px",
              textDecoration: "none",
              lineHeight: 1,
            }}
          >
            Comenzar gratis
          </Link>
        </nav>
      </PublicContainer>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer
      style={{
        background: publicPalette.footer,
        borderTop: `1px solid ${publicPalette.border}`,
        padding: "52px 0 32px",
      }}
    >
      <PublicContainer>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1.5fr) repeat(3, minmax(150px, 1fr))",
            gap: "28px",
            alignItems: "start",
          }}
        >
          <div>
            <Link href="/" aria-label="Inicio LEDGERA" style={{ textDecoration: "none" }}>
              <Logo variant="light" size="sm" showSubtitle />
            </Link>
            <p
              style={{
                color: publicPalette.textFaint,
                fontSize: "13px",
                lineHeight: 1.7,
                margin: "16px 0 0",
                maxWidth: "320px",
              }}
            >
              Sistema financiero-tributario para ordenar movimientos crypto, banco, portafolio y base tributaria trazable en Chile.
            </p>
          </div>

          <FooterGroup
            title="Producto"
            links={[
              { label: "Cómo funciona", href: "/como-funciona" },
              { label: "Planes", href: "/planes" },
              { label: "Preguntas frecuentes", href: "/preguntas" },
              { label: "Blog", href: "/blog" },
            ]}
          />

          <FooterGroup
            title="SEO / recursos"
            links={[
              { label: "Impuestos crypto Chile", href: "/impuestos-crypto-chile" },
              { label: "Declarar criptomonedas", href: "/como-declarar-crypto-en-chile" },
              { label: "Conciliación banco crypto", href: "/conciliacion-binance-banco" },
              { label: "Contador crypto", href: "/contador-crypto-chile" },
            ]}
          />

          <FooterGroup
            title="Legal y contacto"
            links={[
              { label: "Términos", href: "/terminos" },
              { label: "Privacidad", href: "/privacidad" },
              { label: "Cookies", href: "/cookies" },
              { label: PUBLIC_CONTACT_EMAIL, href: `mailto:${PUBLIC_CONTACT_EMAIL}` },
            ]}
          />
        </div>

        <div
          style={{
            borderTop: `1px solid ${publicPalette.border}`,
            marginTop: "36px",
            paddingTop: "22px",
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <p style={{ color: "#334155", fontSize: "12px", margin: 0 }}>
            © {new Date().getFullYear()} LEDGERA. Todos los derechos reservados.
          </p>
          <p style={{ color: "#334155", fontSize: "12px", margin: 0 }}>
            Software de organización financiera-tributaria. No reemplaza asesoría profesional.
          </p>
        </div>
      </PublicContainer>
    </footer>
  );
}

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <p
        style={{
          color: publicPalette.textFaint,
          fontSize: "11px",
          fontWeight: 850,
          letterSpacing: "0.12em",
          margin: "0 0 14px",
          textTransform: "uppercase",
        }}
      >
        {title}
      </p>
      <div style={{ display: "grid", gap: "10px" }}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              color: publicPalette.textMuted,
              fontSize: "13px",
              fontWeight: 650,
              lineHeight: 1.35,
              textDecoration: "none",
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicShell({
  children,
  activePath,
}: {
  children: ReactNode;
  activePath?: string;
}) {
  return (
    <main style={pageStyle}>
      <PublicHeader activePath={activePath} />
      {children}
      <PublicFooter />
    </main>
  );
}

export function PublicHero({
  eyebrow,
  title,
  description,
  children,
  align = "center",
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <section
      style={{
        borderBottom: `1px solid ${publicPalette.border}`,
        background:
          "radial-gradient(circle at top left, rgba(22,163,74,0.22), transparent 32%), linear-gradient(135deg, #061522 0%, #082033 48%, #0B2A3F 100%)",
        padding: "86px 0 70px",
      }}
    >
      <PublicContainer>
        <div
          style={{
            maxWidth: align === "center" ? "820px" : "900px",
            margin: align === "center" ? "0 auto" : "0",
            textAlign: align,
          }}
        >
          <p
            style={{
              color: "#4ADE80",
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(22,163,74,0.12)",
              border: "1px solid rgba(22,163,74,0.24)",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 850,
              letterSpacing: "0.12em",
              margin: "0 0 22px",
              padding: "7px 16px",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </p>

          <h1
            style={{
              color: publicPalette.text,
              fontFamily: fonts.display,
              fontSize: "clamp(2.2rem, 5vw, 4.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.055em",
              lineHeight: 1.02,
              margin: "0 0 20px",
            }}
          >
            {title}
          </h1>

          <p
            style={{
              color: publicPalette.textSoft,
              fontSize: "clamp(1rem, 2vw, 1.22rem)",
              lineHeight: 1.75,
              margin: align === "center" ? "0 auto" : 0,
              maxWidth: "740px",
            }}
          >
            {description}
          </p>

          {children ? <div style={{ marginTop: "30px" }}>{children}</div> : null}
        </div>
      </PublicContainer>
    </section>
  );
}

export function PublicButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const primary = variant === "primary";

  return (
    <Link
      href={href}
      style={{
        alignItems: "center",
        background: primary ? publicPalette.action : "rgba(255,255,255,0.055)",
        border: primary ? "1px solid rgba(22,163,74,0.55)" : `1px solid ${publicPalette.border}`,
        borderRadius: "12px",
        color: "#ffffff",
        display: "inline-flex",
        fontSize: "15px",
        fontWeight: 850,
        justifyContent: "center",
        minHeight: "48px",
        padding: "0 22px",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

export function PublicCta({
  title,
  description,
  primaryLabel = "Comenzar gratis",
  primaryHref = "/register",
  secondaryLabel = "Ver planes",
  secondaryHref = "/planes",
}: {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section style={{ background: publicPalette.page, padding: "72px 0" }}>
      <PublicContainer>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(22,163,74,0.10), rgba(15,42,61,0.72))",
            border: "1px solid rgba(22,163,74,0.20)",
            borderRadius: "28px",
            padding: "44px 28px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: publicPalette.text,
              fontFamily: fonts.display,
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 900,
              letterSpacing: "-0.045em",
              lineHeight: 1.1,
              margin: "0 auto 14px",
              maxWidth: "760px",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: publicPalette.textMuted,
              fontSize: "16px",
              lineHeight: 1.7,
              margin: "0 auto 26px",
              maxWidth: "680px",
            }}
          >
            {description}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <PublicButton href={primaryHref}>{primaryLabel}</PublicButton>
            <PublicButton href={secondaryHref} variant="secondary">
              {secondaryLabel}
            </PublicButton>
          </div>
        </div>
      </PublicContainer>
    </section>
  );
}

export function PublicCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: publicPalette.card,
        border: `1px solid ${publicPalette.border}`,
        borderRadius: "22px",
        padding: "28px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function LegalShell({
  title,
  updatedAt,
  version,
  children,
}: {
  title: string;
  updatedAt: string;
  version: string;
  children: ReactNode;
}) {
  return (
    <PublicShell>
      <PublicHero
        eyebrow="Documento legal"
        title={title}
        description={`Última actualización: ${updatedAt} · Versión ${version}. Documento público de LEDGERA para usuarios, clientes y visitantes.`}
      />

      <section style={{ background: publicPalette.section, padding: "64px 0" }}>
        <PublicContainer style={{ maxWidth: "900px" }}>
          <article
            style={{
              display: "grid",
              gap: "22px",
            }}
          >
            {children}
          </article>
        </PublicContainer>
      </section>
    </PublicShell>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: "rgba(255,255,255,0.032)",
        border: `1px solid ${publicPalette.border}`,
        borderRadius: "20px",
        padding: "26px",
      }}
    >
      <h2
        style={{
          color: publicPalette.text,
          fontFamily: fonts.display,
          fontSize: "22px",
          fontWeight: 850,
          letterSpacing: "-0.025em",
          margin: "0 0 14px",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          color: publicPalette.textMuted,
          display: "grid",
          fontSize: "15px",
          gap: "12px",
          lineHeight: 1.78,
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function LegalNotice({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.24)",
        borderLeft: `4px solid ${publicPalette.warning}`,
        borderRadius: "16px",
        color: "#FDE68A",
        fontSize: "15px",
        lineHeight: 1.75,
        padding: "20px 22px",
      }}
    >
      {children}
    </div>
  );
}
