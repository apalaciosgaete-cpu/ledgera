// src/components/landing/LandingConversacional.tsx
// Marketing home: bienvenida breve, nav completo, preview de producto y footer extendido.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";

const NAV_ITEMS = [
  ["Inicio", "/"],
  ["Producto", "/producto"],
  ["Precio", "/precio"],
  ["Seguridad", "/seguridad"],
  ["Blog", "/blog"],
  ["Contacto", "/contacto"],
] as const;

const TRUST_ITEMS = [
  ["Crypto", "Binance, Buda, CSV"],
  ["Trazabilidad", "operaciones y activos"],
  ["Respaldo", "PDF + Excel"],
] as const;

const FOOTER_COLUMNS = [
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
      ["Guías SII", "/blog"],
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

function ProductSnapshot() {
  const kpis = [
    ["Activos", "10", "text-[#F2EBD8]"],
    ["Operaciones", "26", "text-[#F2EBD8]"],
    ["Respaldo", "PDF + Excel", "text-[#C9A84C]"],
  ] as const;

  const rows = [
    ["BTC", "Binance", "OK", "PDF"],
    ["USDT", "Banco", "Revisar", "Excel"],
    ["ETH", "CSV", "OK", "PDF"],
  ] as const;

  return (
    <aside className="relative mx-auto w-full max-w-[760px] rounded-[2rem] border border-[#2B6CB0]/70 bg-[#0B1430]/92 p-4 shadow-[0_40px_140px_rgba(43,108,176,0.22)] backdrop-blur-xl sm:p-6">
      <div className="rounded-2xl border border-[#24345F] bg-[#101C3D] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black text-[#F2EBD8]">LEDGERA · Respaldo tributario</p>
          <span className="font-mono text-xs font-black text-[#C9A84C]">AT 2026</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {kpis.map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-[#24345F] bg-[#101C3D]/90 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#7F8BA5]">{label}</p>
            <p className={`mt-3 font-display text-2xl font-black tracking-[-0.04em] ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-[#24345F] bg-[#101C3D]/90 p-5">
        <p className="text-sm font-black text-[#F2EBD8]">Obligaciones detectadas</p>
        <div className="mt-4 grid gap-3 text-sm font-semibold text-[#BFC8D9]">
          <div><span className="mr-3 text-[#C9A84C]">●</span>Declarar / respaldar</div>
          <div><span className="mr-3 text-[#4DA3FF]">●</span>Revisar fuente de fondos</div>
          <div><span className="mr-3 text-[#7F8BA5]">●</span>Sin impuesto determinado</div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-[#24345F] bg-[#101C3D]/90">
        <div className="grid grid-cols-4 border-b border-[#24345F] px-5 py-3 font-mono text-xs text-[#7F8BA5]">
          <span>Activo</span>
          <span>Origen</span>
          <span>Estado</span>
          <span>Archivo</span>
        </div>
        {rows.map(([asset, source, status, file]) => (
          <div key={`${asset}-${source}`} className="grid grid-cols-4 border-b border-[#24345F]/60 px-5 py-3 font-mono text-xs text-[#BFC8D9] last:border-0">
            <span>{asset}</span>
            <span>{source}</span>
            <span className={status === "OK" ? "text-[#1D9E75]" : "text-[#C9A84C]"}>{status}</span>
            <span>{file}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function LandingNav({ mobileMenuOpen, setMobileMenuOpen }: { mobileMenuOpen: boolean; setMobileMenuOpen: (value: boolean) => void }) {
  return (
    <>
      <nav className="sticky top-0 z-[100] border-b border-[#24345F]/70 bg-[#080E1F]/88 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[82px] max-w-[1440px] items-center justify-between gap-5">
          <Link href="/" aria-label="Inicio LEDGERA" className="inline-flex items-center">
            <Logo size="sm" />
          </Link>
          <div className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map(([label, href]) => (
              <Link key={href} href={href} className="text-sm font-bold text-[#BFC8D9] transition hover:text-[#F2EBD8]">
                {label}
              </Link>
            ))}
            <Link href="/login" className="text-sm font-black text-[#BFC8D9] transition hover:text-[#F2EBD8]">Ingresar</Link>
            <Link href="/register" className="inline-flex rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-black text-[#080E1F] shadow-[0_18px_60px_rgba(201,168,76,0.22)] transition hover:-translate-y-0.5 hover:bg-[#DDBB61]">
              Comenzar
            </Link>
          </div>
          <button type="button" className="rounded-2xl border border-[#24345F] bg-[#0B1430] px-4 py-3 text-sm font-black text-[#F2EBD8] lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            Menú
          </button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div className="sticky top-[82px] z-[90] border-b border-[#24345F] bg-[#080E1F]/98 px-6 py-5 backdrop-blur-xl lg:hidden">
          <div className="grid gap-4">
            {NAV_ITEMS.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-[#BFC8D9]">
                {label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-[#BFC8D9]">Ingresar</Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="inline-flex justify-center rounded-2xl bg-[#C9A84C] px-5 py-4 text-center font-black text-[#080E1F]">Comenzar evaluación</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-[#24345F]/70 bg-[#070B18] px-5 py-12 text-[#BFC8D9] sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1.1fr_1.5fr_0.8fr]">
        <div>
          <Logo size="sm" />
          <p className="mt-5 max-w-[430px] text-sm leading-6 text-[#7F8BA5]">
            Orden, trazabilidad y respaldo tributario para activos financieros. Diseñado para revisar mejor antes de declarar o tomar decisiones patrimoniales.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {FOOTER_COLUMNS.map((column) => (
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

export default function LandingConversacional() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080E1F] text-[#F2EBD8]">
      <LandingNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <section className="relative overflow-hidden px-5 pb-12 pt-16 sm:px-8 lg:px-10 lg:pb-16 lg:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_14%,rgba(77,163,255,0.22),transparent_30%),radial-gradient(circle_at_14%_28%,rgba(31,78,140,0.24),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(201,168,76,0.14),transparent_24%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(191,200,217,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(191,200,217,0.08)_1px,transparent_1px)] [background-size:92px_92px]" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(560px,1fr)]">
          <div>
            <div className="inline-flex rounded-full border border-[#C9A84C]/50 bg-[#111D3E] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#C9A84C]">
              Bienvenido a LEDGERA
            </div>
            <h1 className="mt-7 max-w-[820px] font-display text-[44px] font-black leading-[1.03] tracking-[-0.055em] text-[#F2EBD8] sm:text-[62px] lg:text-[76px]">
              Ordena tus activos, revisa tus obligaciones y genera respaldo tributario.
            </h1>
            <p className="mt-6 max-w-[720px] text-lg leading-8 text-[#BFC8D9] sm:text-xl">
              LEDGERA transforma movimientos de crypto, bancos e inversiones en información ordenada, trazable y exportable para revisar antes de declarar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-[58px] items-center justify-center rounded-2xl bg-[#C9A84C] px-7 text-base font-black text-[#080E1F] shadow-[0_24px_80px_rgba(201,168,76,0.24)] transition hover:-translate-y-0.5 hover:bg-[#DDBB61]">
                Comenzar evaluación →
              </Link>
              <Link href="/opinion" className="inline-flex min-h-[58px] items-center justify-center rounded-2xl border border-[#24345F] bg-[#0B1430]/88 px-7 text-base font-black text-[#C9A84C] transition hover:border-[#C9A84C]/70 hover:bg-[#111D3E]">
                Ayúdanos a mejorar
              </Link>
            </div>

            <div className="mt-8 grid max-w-[720px] gap-3 sm:grid-cols-3">
              {TRUST_ITEMS.map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-[#24345F] bg-[#101C3D]/78 p-5">
                  <p className="text-sm font-black text-[#C9A84C]">{title}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#7F8BA5]">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <ProductSnapshot />
        </div>

        <div className="relative z-10 mx-auto mt-12 max-w-[1440px] rounded-[2rem] border border-[#24345F] bg-[#0B1430]/82 px-6 py-5 text-sm font-semibold leading-7 text-[#BFC8D9] backdrop-blur-xl sm:px-8">
          <span className="font-black text-[#C9A84C]">Una entrada simple al producto:</span> sube tus movimientos, revisa tus activos y descarga respaldo trazable.
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
