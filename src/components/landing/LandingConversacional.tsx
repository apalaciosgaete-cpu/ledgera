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
  ["Quiénes somos", "/quienes-somos"],
] as const;

const trustItems = [
  ["Crypto", "Binance, Buda, CSV"],
  ["Trazabilidad", "operaciones y activos"],
  ["Respaldo", "PDF + Excel"],
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
      ["Blog", "/blog"],
      ["Impuestos crypto Chile", "/impuestos-crypto-chile"],
      ["Declarar criptomonedas", "/como-declarar-crypto-en-chile"],
      ["Conciliación banco crypto", "/conciliacion-binance-banco"],
    ],
  },
  {
    title: "Empresa",
    links: [
      ["Quiénes somos", "/quienes-somos"],
      ["Privacidad", "/privacidad"],
      ["Términos", "/terminos"],
      ["Cookies", "/cookies"],
    ],
  },
] as const;

function ProductSnapshot() {
  const kpis = [
    ["Activos", "10", "text-text"],
    ["Operaciones", "26", "text-text"],
    ["Respaldo", "PDF + Excel", "text-accent"],
  ] as const;

  const rows = [
    ["BTC", "Binance", "OK", "PDF"],
    ["USDT", "Banco", "Revisar", "Excel"],
    ["ETH", "CSV", "OK", "PDF"],
  ] as const;

  return (
    <aside className="relative mx-auto w-full max-w-[760px] rounded-[2rem] border border-border-strong bg-bg-elev/95 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="rounded-2xl border border-border bg-bg-sunken px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black text-text">LEDGERA · Respaldo tributario</p>
          <span className="font-mono text-xs font-black text-accent">AT 2026</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {kpis.map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-border bg-bg-sunken p-4">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-faint">{label}</p>
            <p className={`mt-3 font-display text-2xl font-black tracking-[-0.04em] ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-bg-sunken p-5">
        <p className="text-sm font-black text-text">Obligaciones detectadas</p>
        <div className="mt-4 grid gap-3 text-sm font-semibold text-text-soft">
          <div><span className="mr-3 text-warn">●</span>Declarar / respaldar</div>
          <div><span className="mr-3 text-accent">●</span>Revisar fuente de fondos</div>
          <div><span className="mr-3 text-text-faint">●</span>Sin impuesto determinado</div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-bg-sunken">
        <div className="grid grid-cols-4 border-b border-border px-5 py-3 font-mono text-xs text-text-faint">
          <span>Activo</span>
          <span>Origen</span>
          <span>Estado</span>
          <span>Archivo</span>
        </div>
        {rows.map(([asset, source, status, file]) => (
          <div key={`${asset}-${source}`} className="grid grid-cols-4 border-b border-border px-5 py-3 font-mono text-xs text-text-soft last:border-0">
            <span>{asset}</span>
            <span>{source}</span>
            <span className={status === "OK" ? "text-gain" : "text-warn"}>{status}</span>
            <span>{file}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function LandingConversacional() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-bg text-text">
      <nav className="sticky top-0 z-[100] border-b border-border bg-bg/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[82px] max-w-[1440px] items-center justify-between gap-5">
          <Link href="/" aria-label="Inicio LEDGERA" className="inline-flex items-center"><Logo variant="light" size="sm" /></Link>
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map(([label, href]) => <Link key={href} href={href} className="text-sm font-bold text-text-soft transition hover:text-text">{label}</Link>)}
            <Link href="/login" className="text-sm font-black text-text-soft transition hover:text-text">Ingresar</Link>
            <Link href="/register" className="inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-black text-accent-contrast shadow-2xl transition hover:-translate-y-0.5">Comenzar</Link>
          </div>
          <button type="button" className="rounded-2xl border border-border bg-bg-elev px-4 py-3 text-sm font-black text-text lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>Menú</button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div className="sticky top-[82px] z-[90] border-b border-border bg-bg/98 px-6 py-5 backdrop-blur-xl lg:hidden">
          <div className="grid gap-4">
            {navItems.map(([label, href]) => <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-text-soft">{label}</Link>)}
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-text-soft">Ingresar</Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="inline-flex justify-center rounded-2xl bg-accent px-5 py-4 text-center font-black text-accent-contrast">Comenzar evaluación</Link>
          </div>
        </div>
      ) : null}

      <section className="relative overflow-hidden px-5 pb-12 pt-16 sm:px-8 lg:px-10 lg:pb-16 lg:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_14%,var(--accent-soft),transparent_30%),radial-gradient(circle_at_14%_28%,var(--bg-elev),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(232,184,75,0.12),transparent_24%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(231,228,218,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(231,228,218,0.08)_1px,transparent_1px)] [background-size:92px_92px]" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(560px,1fr)]">
          <div>
            <div className="inline-flex rounded-full border border-accent bg-accent-soft px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-accent">Bienvenido a LEDGERA</div>
            <h1 className="mt-7 max-w-[820px] font-display text-[44px] font-black leading-[1.03] tracking-[-0.055em] text-text sm:text-[62px] lg:text-[76px]">Ordena tus activos, revisa tus obligaciones y genera respaldo tributario.</h1>
            <p className="mt-6 max-w-[720px] text-lg leading-8 text-text-soft sm:text-xl">LEDGERA transforma movimientos de crypto, bancos e inversiones en información ordenada, trazable y exportable para revisar antes de declarar.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-[58px] items-center justify-center rounded-2xl bg-accent px-7 text-base font-black text-accent-contrast shadow-2xl transition hover:-translate-y-0.5">Comenzar evaluación →</Link>
              <Link href="/preguntas" className="inline-flex min-h-[58px] items-center justify-center rounded-2xl border border-border bg-bg-elev px-7 text-base font-black text-accent transition hover:border-accent hover:bg-accent-soft">Ver preguntas frecuentes</Link>
            </div>
            <div className="mt-8 grid max-w-[720px] gap-3 sm:grid-cols-3">
              {trustItems.map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-border bg-bg-elev p-5">
                  <p className="text-sm font-black text-accent">{title}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-text-faint">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <ProductSnapshot />
        </div>

        <div className="relative z-10 mx-auto mt-12 max-w-[1440px] rounded-[2rem] border border-border bg-bg-elev px-6 py-5 text-sm font-semibold leading-7 text-text-soft backdrop-blur-xl sm:px-8">
          <span className="font-black text-accent">Una entrada simple al producto:</span> sube tus movimientos, revisa tus activos y descarga respaldo trazable.
        </div>
      </section>

      <footer className="border-t border-border bg-bg-sunken px-5 py-12 text-text-soft sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1.1fr_1.5fr_0.8fr]">
          <div>
            <Logo variant="light" size="sm" />
            <p className="mt-5 max-w-[430px] text-sm leading-6 text-text-faint">Orden, trazabilidad y respaldo tributario para activos financieros. Diseñado para revisar mejor antes de declarar o tomar decisiones patrimoniales.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-accent">{column.title}</h3>
                <div className="mt-4 grid gap-3">{column.links.map(([label, href]) => <Link key={`${column.title}-${href}`} href={href} className="text-sm font-semibold text-text-soft transition hover:text-text">{label}</Link>)}</div>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-accent bg-accent-soft p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Opinión</p>
            <p className="mt-3 text-sm leading-6 text-text-soft">Ayúdanos a mejorar LEDGERA con feedback orgánico sobre claridad, utilidad y funcionamiento real de la app.</p>
            <Link href="/preguntas" className="mt-5 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-black text-accent-contrast">Revisar dudas</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
