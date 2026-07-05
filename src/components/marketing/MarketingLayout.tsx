import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const marketingNavItems = [
  ["Inicio", "/"],
  ["Producto", "/producto"],
  ["Precio", "/precio"],
  ["Seguridad", "/seguridad"],
  ["Blog", "/blog"],
  ["Contacto", "/contacto"],
] as const;

const footerColumns = [
  {
    title: "Producto",
    links: [
      ["Cómo funciona", "/producto"],
      ["Precio", "/precio"],
      ["Seguridad", "/seguridad"],
      ["Comenzar", "/register"],
    ],
  },
  {
    title: "Recursos",
    links: [
      ["Blog", "/blog"],
      ["Guías tributarias", "/blog"],
      ["Crypto Chile", "/blog#crypto-chile"],
      ["Preguntas frecuentes", "/blog#preguntas"],
    ],
  },
  {
    title: "Empresa",
    links: [
      ["Privacidad", "/privacidad"],
      ["Términos", "/terminos"],
      ["Contacto", "/contacto"],
      ["Opinión", "/opinion"],
    ],
  },
] as const;

export function MarketingNav({ active }: { active?: string }) {
  return (
    <nav className="sticky top-0 z-[100] border-b border-[#24345F]/70 bg-[#080E1F]/88 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[82px] max-w-[1440px] flex-wrap items-center justify-between gap-5 py-3 lg:flex-nowrap">
        <Link href="/" aria-label="Inicio LEDGERA" className="inline-flex items-center">
          <Logo size="sm" />
        </Link>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-3 lg:order-2 lg:w-auto lg:justify-center lg:gap-x-7">
          {marketingNavItems.map(([label, href]) => {
            const isActive = active === label;
            return (
              <Link
                key={href}
                href={href}
                className={
                  isActive
                    ? "text-sm font-black text-[#C9A84C]"
                    : "text-sm font-bold text-[#BFC8D9] transition hover:text-[#F2EBD8]"
                }
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="order-2 flex items-center gap-3 lg:order-3">
          <Link href="/login" className="hidden text-sm font-black text-[#BFC8D9] transition hover:text-[#F2EBD8] sm:inline-flex">
            Ingresar
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-2xl border border-[#C9A84C]/70 bg-[#C9A84C] px-5 py-3 text-sm font-black text-[#080E1F] shadow-[0_18px_60px_rgba(201,168,76,0.22)] transition hover:-translate-y-0.5 hover:bg-[#DDBB61]"
          >
            Comenzar
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#24345F]/70 bg-[#070B18] px-5 py-12 text-[#BFC8D9] sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1.1fr_1.5fr_0.8fr]">
        <div>
          <Logo size="sm" />
          <p className="mt-5 max-w-[420px] text-sm leading-6 text-[#7F8BA5]">
            Orden, trazabilidad y respaldo tributario para activos financieros. Diseñado para revisar mejor antes de declarar o tomar decisiones patrimoniales.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#C9A84C]">{column.title}</h3>
              <div className="mt-4 grid gap-3">
                {column.links.map(([label, href]) => (
                  <Link key={`${column.title}-${href}`} href={href} className="text-sm font-semibold text-[#BFC8D9] transition hover:text-[#F2EBD8]">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-[#C9A84C]/45 bg-[#101C3D]/80 p-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#C9A84C]">Opinión</p>
          <p className="mt-3 text-sm leading-6 text-[#BFC8D9]">
            Ayúdanos a mejorar LEDGERA con feedback orgánico sobre claridad, utilidad y funcionamiento real de la app.
          </p>
          <Link href="/opinion" className="mt-5 inline-flex rounded-2xl border border-[#C9A84C]/70 px-5 py-3 text-sm font-black text-[#C9A84C] transition hover:bg-[#C9A84C] hover:text-[#080E1F]">
            Sugerir una mejora
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-[1440px] flex-col gap-3 border-t border-[#24345F]/60 pt-6 text-xs leading-5 text-[#7F8BA5] sm:flex-row sm:items-center sm:justify-between">
        <p>LEDGERA entrega herramientas de orden, trazabilidad y respaldo. No reemplaza asesoría contable, legal ni tributaria profesional.</p>
        <p>© 2026 LEDGERA</p>
      </div>
    </footer>
  );
}

export function MarketingPage({
  active,
  eyebrow,
  title,
  description,
  children,
}: {
  active?: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#080E1F] text-[#F2EBD8]">
      <MarketingNav active={active} />
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_12%,rgba(77,163,255,0.20),transparent_30%),radial-gradient(circle_at_12%_22%,rgba(31,78,140,0.24),transparent_26%),radial-gradient(circle_at_84%_78%,rgba(201,168,76,0.12),transparent_26%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(191,200,217,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(191,200,217,0.08)_1px,transparent_1px)] [background-size:92px_92px]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-[1440px]">
          <div className="inline-flex rounded-full border border-[#C9A84C]/50 bg-[#111D3E] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#C9A84C]">
            {eyebrow}
          </div>
          <h1 className="mt-6 max-w-[980px] font-display text-[42px] font-black leading-[1.03] tracking-[-0.055em] text-[#F2EBD8] sm:text-[58px] lg:text-[76px]">
            {title}
          </h1>
          <p className="mt-6 max-w-[820px] text-lg leading-8 text-[#BFC8D9] sm:text-xl">{description}</p>
          <div className="mt-12">{children}</div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}

export function MarketingCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <article className={`rounded-3xl border border-[#24345F] bg-[#0B1430]/86 p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)] ${className}`}>{children}</article>;
}
