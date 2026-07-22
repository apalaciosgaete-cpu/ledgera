// src/components/landing/LandingConversacional.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";

const navItems = [
  ["Inicio", "/"],
  ["Cómo funciona", "/como-funciona"],
  ["Planes", "/planes"],
  ["Preguntas", "/preguntas"],
  ["Blog", "/blog"],
] as const;

const trustItems = [
  ["Exchanges", "Carga CSV/API y movimientos manuales"],
  ["Activos digitales", "BTC, ETH, stablecoins y más"],
  ["Respaldo tributario", "PDF + Excel trazable"],
] as const;

const problemItems = [
  ["Operaciones dispersas", "CSV, APIs, movimientos manuales y registros incompletos entre exchanges."],
  ["Activos difíciles de seguir", "Compras, ventas, swaps, retiros, depósitos y comisiones mezcladas."],
  ["Respaldo insuficiente", "Una planilla no siempre explica origen, cálculo, estado y trazabilidad."],
] as const;

const processSteps = [
  ["01", "Importa operaciones", "Carga movimientos desde exchanges por CSV/API o registra operaciones manuales."],
  ["02", "Revisa y ordena", "LEDGERA clasifica activos, detecta inconsistencias y consolida trazabilidad."],
  ["03", "Genera respaldo", "Descarga PDF y Excel trazables para revisión tributaria y patrimonial."],
] as const;

const verificationItems = [
  ["PDF tributario", "Resumen claro para revisar antes de declarar."],
  ["Excel trazable", "Detalle por activo, operación y cálculo revisable."],
  ["Folio interno", "Identificación única para cada respaldo generado."],
  ["Hash y QR", "Validación de integridad documental y consulta verificable."],
  ["No custodia", "LEDGERA no administra fondos ni llaves privadas."],
  ["Criterio revisable", "Información preparada para análisis financiero y tributario."],
] as const;

const audienceItems = [
  ["Personas naturales", "Ordena tus operaciones antes de revisar tu declaración."],
  ["Inversionistas cripto", "Consolida movimientos de distintos exchanges y activos."],
  ["Contadores y asesores", "Trabaja con información trazable y más fácil de revisar."],
] as const;

const footerColumns = [
  {
    title: "Producto",
    links: [
      ["Cómo funciona", "/como-funciona"],
      ["Planes", "/planes"],
      ["Preguntas", "/preguntas"],
      ["Comenzar", "/register"],
    ],
  },
  {
    title: "Recursos",
    links: [
      ["Tributación cripto Chile", "/impuestos-crypto-chile"],
      ["Declarar operaciones cripto", "/como-declarar-crypto-en-chile"],
      ["Conciliación banco-exchange", "/conciliacion-binance-banco"],
      ["Blog", "/blog"],
    ],
  },
  {
    title: "Empresa",
    links: [
      ["Quiénes somos", "/quienes-somos"],
      ["Contacto", "/contacto"],
      ["Privacidad", "/privacidad"],
      ["Términos", "/terminos"],
    ],
  },
] as const;

function ProductSnapshot() {
  const kpis = [
    ["Operaciones", "CSV/API", "text-accent"],
    ["Activos", "10", "text-text"],
    ["Verificación", "QR + hash", "text-gain"],
  ] as const;

  const rows = [
    ["BTC", "Exchange", "OK", "PDF"],
    ["USDT", "CSV", "Revisar", "Excel"],
    ["ETH", "API", "OK", "QR"],
  ] as const;

  return (
    <aside className="relative mx-auto w-full max-w-[760px] rounded-[2rem] border border-border bg-bg-elev/80 p-4 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-6">
      <div className="rounded-2xl border border-border-strong bg-accent-soft px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-text">LEDGERA · Respaldo tributario</p>
          <span className="rounded-full border border-accent bg-accent-soft px-3 py-1 font-mono text-xs font-black text-accent">
            AT 2026
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {kpis.map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-border bg-bg-sunken p-4">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-faint">{label}</p>
            <p className={`mt-3 text-2xl font-black tracking-[-0.04em] ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-bg-sunken p-5">
        <p className="text-sm font-extrabold text-text">Obligaciones detectadas</p>
        <div className="mt-4 grid gap-3 text-sm font-semibold text-text-soft">
          <div><span className="mr-3 text-warn">●</span>Declarar / respaldar</div>
          <div><span className="mr-3 text-accent">●</span>Revisar trazabilidad de fondos</div>
          <div><span className="mr-3 text-text-faint">●</span>Sin impuesto determinado</div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-bg-sunken">
        <div className="grid grid-cols-4 border-b border-border px-5 py-3 font-mono text-xs text-text-faint">
          <span>Activo</span><span>Origen</span><span>Estado</span><span>Archivo</span>
        </div>
        {rows.map(([asset, source, status, file]) => (
          <div key={`${asset}-${source}`} className="grid grid-cols-4 border-b border-border px-5 py-3 font-mono text-xs text-text-soft last:border-0">
            <span>{asset}</span><span>{source}</span>
            <span className={status === "OK" ? "text-gain" : "text-warn"}>{status}</span>
            <span>{file}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 rounded-3xl border border-accent bg-accent-soft p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Verificación</p>
          <p className="mt-2 text-sm font-bold leading-6 text-text-soft">Folio, hash, URL y QR para validar el respaldo generado.</p>
        </div>
        <div className="grid h-20 w-20 place-items-center rounded-2xl border border-accent bg-bg-elev text-xs font-black text-text">
          QR
        </div>
      </div>
    </aside>
  );
}

function CtaLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const base = "inline-flex min-h-[58px] items-center justify-center rounded-2xl px-7 text-base font-black transition hover:-translate-y-0.5";
  const classes = variant === "primary"
    ? `${base} bg-accent text-accent-contrast shadow-2xl shadow-sky-950/40 hover:bg-[var(--color-accent-hover)]`
    : `${base} border border-border bg-bg-elev text-accent hover:border-accent hover:bg-accent-soft`;

  return <Link href={href} className={classes}>{children}</Link>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.055em] text-text sm:text-5xl">{title}</h2>
      {description ? <p className="mt-5 text-base leading-8 text-text-soft sm:text-lg">{description}</p> : null}
    </div>
  );
}

export default function LandingConversacional() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/panel");
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="ledgera-welcome min-h-screen overflow-x-hidden bg-bg text-text">
      <nav className="sticky top-0 z-[100] border-b border-border bg-bg/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[96px] max-w-[1440px] items-center justify-between gap-5">
          <Link href="/" aria-label="Inicio LEDGERA" className="inline-flex shrink-0 items-center">
            <Logo variant="light" size="lg" showSubtitle />
          </Link>
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="text-sm font-bold text-text-soft transition hover:text-text">{label}</Link>
            ))}
            <Link href="/login" className="text-sm font-black text-text-soft transition hover:text-text">Ingresar</Link>
            <Link href="/register" className="inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-black text-accent-contrast shadow-2xl shadow-sky-950/40 transition hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)]">Comenzar análisis</Link>
          </div>
          <button type="button" className="rounded-2xl border border-border bg-bg-elev px-4 py-3 text-sm font-black text-text lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            Menú
          </button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div className="sticky top-[96px] z-[90] border-b border-border bg-bg/95 px-6 py-5 backdrop-blur-xl lg:hidden">
          <div className="grid gap-4">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-text-soft">{label}</Link>
            ))}
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-text-soft">Ingresar</Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="inline-flex justify-center rounded-2xl bg-accent px-5 py-4 text-center font-black text-accent-contrast">Comenzar análisis</Link>
          </div>
        </div>
      ) : null}

      <section className="relative overflow-hidden px-5 pb-12 pt-16 sm:px-8 lg:px-10 lg:pb-16 lg:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_12%,var(--accent-soft),transparent_30%),radial-gradient(circle_at_14%_26%,rgba(110,231,184,0.12),transparent_28%),linear-gradient(180deg,var(--bg)_0%,var(--bg-elev)_56%,var(--bg)_100%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:88px_88px]" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(560px,1fr)]">
          <div>
            <div className="inline-flex rounded-full border border-accent bg-accent-soft px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-accent">Bienvenido a LEDGERA</div>
            <h1 className="mt-7 max-w-[860px] font-display text-[44px] font-black leading-[1.02] tracking-[-0.065em] text-text sm:text-[64px] lg:text-[82px]">De tus exchanges a tu declaración, sin planillas.</h1>
            <p className="mt-6 max-w-[740px] text-lg leading-8 text-text-soft sm:text-xl">LEDGERA importa tus operaciones cripto desde exchanges, ordena tus activos digitales y genera respaldos tributarios trazables en PDF y Excel para revisar mejor antes de declarar.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/register">Comenzar análisis →</CtaLink>
              <CtaLink href="/como-funciona" variant="secondary">Ver cómo funciona</CtaLink>
            </div>
            <div className="mt-8 grid max-w-[740px] gap-3 sm:grid-cols-3">
              {trustItems.map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-border bg-bg-elev/75 p-5 backdrop-blur">
                  <p className="text-sm font-black text-accent">{title}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-text-faint">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <ProductSnapshot />
        </div>

        <div className="relative z-10 mx-auto mt-12 max-w-[1440px] rounded-[2rem] border border-border bg-bg-elev/75 px-6 py-5 text-sm font-semibold leading-7 text-text-soft backdrop-blur-xl sm:px-8">
          <span className="font-black text-accent">Una entrada simple al producto:</span> carga tus movimientos de exchanges, valida activos y descarga respaldo tributario trazable.
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeading eyebrow="El problema" title="Tus operaciones cripto no vienen listas para declarar." description="Los exchanges entregan movimientos, no respaldo tributario ordenado. Entre compras, ventas, swaps, retiros, depósitos y comisiones, reconstruir tu historial puede volverse lento, frágil y difícil de justificar." />
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {problemItems.map(([title, text]) => (
              <article key={title} className="rounded-3xl border border-border bg-bg-elev p-6">
                <h3 className="font-display text-2xl font-black tracking-[-0.04em] text-text">{title}</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-text-faint">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-bg-elev/40 px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <SectionHeading eyebrow="Cómo funciona" title="De movimientos cripto a respaldo tributario en 3 pasos." />
            <p className="text-base leading-8 text-text-faint sm:text-lg">LEDGERA separa el proceso en etapas revisables para que entiendas qué se cargó, qué se ordenó y qué respaldo se genera antes de avanzar.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {processSteps.map(([number, title, text]) => (
              <article key={number} className="rounded-3xl border border-border bg-bg-sunken p-6">
                <p className="font-mono text-sm font-black text-accent">{number}</p>
                <h3 className="mt-5 font-display text-2xl font-black tracking-[-0.04em] text-text">{title}</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-text-faint">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="lg:sticky lg:top-32">
            <SectionHeading eyebrow="Confianza y respaldo" title="Respaldo diseñado para revisión, no solo para descargar." description="La salida debe poder revisarse: documentos, cálculos, operaciones y verificación del respaldo generado." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {verificationItems.map(([title, text]) => (
              <article key={title} className="rounded-3xl border border-border bg-bg-elev p-6">
                <h3 className="font-display text-xl font-black tracking-[-0.035em] text-text">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-text-faint">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-bg-elev/40 px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeading eyebrow="Para quién es" title="Diseñado para quienes necesitan ordenar operaciones cripto." />
          <div className="mx-auto mt-9 grid max-w-[1080px] gap-4 md:grid-cols-3">
            {audienceItems.map(([title, text]) => (
              <article key={title} className="rounded-3xl border border-border bg-bg-sunken p-6">
                <h3 className="font-display text-xl font-black tracking-[-0.035em] text-text">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-text-faint">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1100px] rounded-[2rem] border border-accent bg-accent-soft px-6 py-10 text-center sm:px-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">Antes de declarar</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-black tracking-[-0.055em] text-text sm:text-5xl">Ordena tus operaciones, revisa obligaciones y genera respaldo trazable.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-7 text-text-soft sm:text-base">LEDGERA prepara información para revisión financiera y tributaria. La determinación final debe evaluarse según tu situación particular.</p>
          <div className="mt-8 flex justify-center">
            <CtaLink href="/register">Comenzar análisis →</CtaLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-bg px-5 py-12 text-text-soft sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1.1fr_1.5fr]">
          <div>
            <Logo variant="light" size="sm" showSubtitle />
            <p className="mt-5 max-w-[430px] text-sm leading-6 text-text-faint">Orden, trazabilidad y respaldo tributario para activos digitales. Diseñado para revisar mejor antes de declarar o tomar decisiones patrimoniales.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-accent">{column.title}</h3>
                <div className="mt-4 grid gap-3">
                  {column.links.map(([label, href]) => (
                    <Link key={`${column.title}-${href}`} href={href} className="text-sm font-semibold text-text-soft transition hover:text-text">{label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
