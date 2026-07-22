// src/components/public/PublicLayout.tsx
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { fonts } from "@/styles/tokens";

export const PUBLIC_CONTACT_EMAIL = "admin@ledgera.cl";
export const publicNavLinks = [
  { label: "Quiénes somos", href: "/quienes-somos" },
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Planes", href: "/planes" },
  { label: "Preguntas", href: "/preguntas" },
  { label: "Blog", href: "/blog" },
];

export const publicPalette = {
  page: "var(--bg)",
  section: "var(--bg-sunken)",
  sectionSoft: "var(--bg-elev)",
  footer: "var(--bg-sunken)",
  action: "var(--accent)",
  actionHover: "var(--accent)",
  warning: "var(--warn)",
  text: "var(--text)",
  textSoft: "var(--text-soft)",
  textMuted: "var(--text-soft)",
  textFaint: "var(--text-faint)",
  border: "var(--border)",
  borderStrong: "var(--border-strong)",
  card: "var(--bg-elev)",
  cardStrong: "var(--bg-elev)",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1180px",
  margin: "0 auto",
  paddingLeft: "24px",
  paddingRight: "24px",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,var(--bg) 0%,var(--bg-sunken) 36%,var(--bg) 100%)",
  color: publicPalette.text,
  fontFamily: fonts.body,
  overflowX: "hidden",
};

const navLinkStyle: CSSProperties = {
  borderRadius: 10,
  color: "var(--text-soft)",
  fontSize: 14,
  fontWeight: 750,
  padding: "10px 12px",
  textDecoration: "none",
};

const primaryLinkStyle: CSSProperties = {
  alignItems: "center",
  background: "var(--accent)",
  border: "1px solid var(--accent)",
  borderRadius: 10,
  color: "var(--accent-contrast)",
  display: "inline-flex",
  fontSize: 14,
  fontWeight: 900,
  justifyContent: "center",
  minHeight: 42,
  padding: "0 16px",
  textDecoration: "none",
};

export function PublicContainer({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...containerStyle, ...style }}>{children}</div>;
}

function PublicNavLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} style={navLinkStyle}>{children}</Link>;
}

export function PublicHeader({ activePath: _activePath }: { activePath?: string }) {
  return (
    <header style={{ background: "var(--bg-sunken)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
      <div style={{ alignItems: "center", display: "flex", gap: 20, justifyContent: "space-between", minHeight: 76, padding: "0 24px" }}>
        <Link href="/" aria-label="Inicio LEDGERA" style={{ flexShrink: 0 }}>
          <Logo variant="light" size="lg" showSubtitle />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
          {publicNavLinks.map((item) => <PublicNavLink key={item.href} href={item.href}>{item.label}</PublicNavLink>)}
          <span style={{ background: "var(--border)", height: 24, margin: "0 8px", width: 1 }} aria-hidden="true" />
          <PublicNavLink href="/login">Iniciar sesión</PublicNavLink>
          <Link href="/register" style={primaryLinkStyle}>Comenzar ahora</Link>
        </nav>
        <details className="group relative md:hidden">
          <summary style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", cursor: "pointer", fontSize: 14, fontWeight: 900, listStyle: "none", padding: "12px 16px" }}>Menú</summary>
          <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow-lg)", display: "grid", gap: 12, minWidth: 230, padding: 16, position: "absolute", right: 0, top: 56, zIndex: 110 }}>
            {publicNavLinks.map((item) => <Link key={item.href} href={item.href} style={{ color: "var(--text-soft)", fontSize: 14, fontWeight: 750, textDecoration: "none" }}>{item.label}</Link>)}
            <span style={{ background: "var(--border)", height: 1 }} />
            <Link href="/login" style={{ color: "var(--text-soft)", fontSize: 14, fontWeight: 750, textDecoration: "none" }}>Iniciar sesión</Link>
            <Link href="/register" style={{ ...primaryLinkStyle, textAlign: "center" }}>Comenzar ahora</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

function FooterGroup({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <p style={{ color: publicPalette.textFaint, fontSize: 11, fontWeight: 850, letterSpacing: "0.12em", margin: "0 0 14px", textTransform: "uppercase" }}>{title}</p>
      <div style={{ display: "grid", gap: 10 }}>
        {links.map((link) => <Link key={link.href} href={link.href} style={{ color: publicPalette.textMuted, fontSize: 13, fontWeight: 650, lineHeight: 1.35, textDecoration: "none" }}>{link.label}</Link>)}
      </div>
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer style={{ background: publicPalette.footer, borderTop: `1px solid ${publicPalette.border}`, padding: "52px 0 32px" }}>
      <PublicContainer>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1.5fr) repeat(3,minmax(150px,1fr))", gap: 28, alignItems: "start" }}>
          <div>
            <Link href="/" aria-label="Inicio LEDGERA" style={{ textDecoration: "none" }}><Logo variant="light" size="sm" showSubtitle /></Link>
            <p style={{ color: publicPalette.textFaint, fontSize: 13, lineHeight: 1.7, margin: "16px 0 0", maxWidth: 320 }}>Plataforma para ordenar operaciones cripto desde exchanges, banco, portafolio y respaldo tributario trazable en Chile.</p>
          </div>
          <FooterGroup title="Producto" links={[{ label: "Quiénes somos", href: "/quienes-somos" }, { label: "Cómo funciona", href: "/como-funciona" }, { label: "Planes", href: "/planes" }, { label: "Preguntas frecuentes", href: "/preguntas" }, { label: "Blog", href: "/blog" }]} />
          <FooterGroup title="Recursos" links={[{ label: "Tributación cripto Chile", href: "/impuestos-crypto-chile" }, { label: "Declarar operaciones cripto", href: "/como-declarar-crypto-en-chile" }, { label: "Conciliación banco-exchange", href: "/conciliacion-binance-banco" }, { label: "Contador para activos digitales", href: "/contador-crypto-chile" }]} />
          <FooterGroup title="Legal y contacto" links={[{ label: "Términos", href: "/terminos" }, { label: "Privacidad", href: "/privacidad" }, { label: "Cookies", href: "/cookies" }, { label: PUBLIC_CONTACT_EMAIL, href: "mailto:admin@ledgera.cl" }]} />
        </div>
        <div style={{ borderTop: `1px solid ${publicPalette.border}`, marginTop: 36, paddingTop: 22, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <p style={{ color: "var(--text-soft)", fontSize: 12, margin: 0 }}>© {new Date().getFullYear()} LEDGERA. Todos los derechos reservados.</p>
          <p style={{ color: "var(--text-soft)", fontSize: 12, margin: 0 }}>Software de organización financiera-tributaria. No reemplaza asesoría profesional.</p>
        </div>
      </PublicContainer>
    </footer>
  );
}

export function PublicShell({ children, activePath }: { children: ReactNode; activePath?: string }) {
  return <main style={pageStyle}><PublicHeader activePath={activePath} />{children}<PublicFooter /></main>;
}

export function PublicHero({ eyebrow, title, description, children, align = "center" }: { eyebrow: string; title: ReactNode; description: ReactNode; children?: ReactNode; align?: "center" | "left" }) {
  return (
    <section style={{ borderBottom: `1px solid ${publicPalette.border}`, background: "radial-gradient(circle at top left,var(--accent-soft),transparent 34%),linear-gradient(135deg,var(--bg-elev),var(--bg))", padding: "86px 0 70px" }}>
      <PublicContainer><div style={{ maxWidth: align === "center" ? 820 : 900, margin: align === "center" ? "0 auto" : 0, textAlign: align }}>
        <p style={{ color: "var(--accent)", display: "inline-flex", alignItems: "center", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 999, fontSize: 12, fontWeight: 850, letterSpacing: "0.12em", margin: "0 0 22px", padding: "7px 16px", textTransform: "uppercase" }}>{eyebrow}</p>
        <h1 style={{ color: publicPalette.text, fontFamily: fonts.display, fontSize: "clamp(2.2rem,5vw,4.2rem)", fontWeight: 900, letterSpacing: "-0.055em", lineHeight: 1.02, margin: "0 0 20px" }}>{title}</h1>
        <p style={{ color: publicPalette.textSoft, fontSize: "clamp(1rem,2vw,1.22rem)", lineHeight: 1.75, margin: align === "center" ? "0 auto" : 0, maxWidth: 740 }}>{description}</p>
        {children ? <div style={{ marginTop: 30 }}>{children}</div> : null}
      </div></PublicContainer>
    </section>
  );
}

export function PublicButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const primary = variant === "primary";
  return <Link href={href} style={{ alignItems: "center", background: primary ? "var(--accent)" : "var(--bg-elev)", border: primary ? "1px solid var(--accent)" : `1px solid ${publicPalette.border}`, borderRadius: 12, color: primary ? "var(--accent-contrast)" : "var(--text)", display: "inline-flex", fontSize: 15, fontWeight: 850, justifyContent: "center", minHeight: 48, padding: "0 22px", textDecoration: "none" }}>{children}</Link>;
}

export function PublicCta({ title, description, primaryLabel = "Comenzar ahora", primaryHref = "/register", secondaryLabel = "Ver planes", secondaryHref = "/planes" }: { title: string; description: string; primaryLabel?: string; primaryHref?: string; secondaryLabel?: string; secondaryHref?: string }) {
  return <section style={{ background: publicPalette.page, padding: "72px 0" }}><PublicContainer><div style={{ background: "linear-gradient(135deg,var(--accent-soft),var(--bg-elev))", border: "1px solid var(--accent)", borderRadius: 28, padding: "44px 28px", textAlign: "center" }}><h2 style={{ color: publicPalette.text, fontFamily: fonts.display, fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.045em", lineHeight: 1.1, margin: "0 auto 14px", maxWidth: 760 }}>{title}</h2><p style={{ color: publicPalette.textMuted, fontSize: 16, lineHeight: 1.7, margin: "0 auto 26px", maxWidth: 680 }}>{description}</p><div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}><PublicButton href={primaryHref}>{primaryLabel}</PublicButton><PublicButton href={secondaryHref} variant="secondary">{secondaryLabel}</PublicButton></div></div></PublicContainer></section>;
}

export function PublicCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: publicPalette.card, border: `1px solid ${publicPalette.border}`, borderRadius: 22, padding: 28, ...style }}>{children}</div>;
}

export function LegalShell({ title, updatedAt, version, children }: { title: string; updatedAt: string; version: string; children: ReactNode }) {
  return <PublicShell><PublicHero eyebrow="Documento legal" title={title} description={`Última actualización: ${updatedAt} · Versión ${version}. Documento público de LEDGERA para usuarios, clientes y visitantes.`} /><section style={{ background: publicPalette.section, padding: "64px 0" }}><PublicContainer style={{ maxWidth: 900 }}><article style={{ display: "grid", gap: 22 }}>{children}</article></PublicContainer></section></PublicShell>;
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section style={{ background: "var(--bg-elev)", border: `1px solid ${publicPalette.border}`, borderRadius: 20, padding: 26 }}><h2 style={{ color: publicPalette.text, fontFamily: fonts.display, fontSize: 22, fontWeight: 850, letterSpacing: "-0.025em", margin: "0 0 14px" }}>{title}</h2><div style={{ color: publicPalette.textMuted, display: "grid", fontSize: 15, gap: 12, lineHeight: 1.78 }}>{children}</div></section>;
}

export function LegalNotice({ children }: { children: ReactNode }) {
  return <div style={{ background: "rgba(232,184,75,0.14)", border: "1px solid rgba(232,184,75,0.32)", borderLeft: "4px solid var(--warn)", borderRadius: 16, color: "var(--warn)", fontSize: 15, lineHeight: 1.75, padding: "20px 22px" }}>{children}</div>;
}
