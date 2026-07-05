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
  ["Exchanges", "Carga CSV/API y movimientos manuales"],
  ["Activos digitales", "BTC, ETH, stablecoins y más"],
  ["Respaldo tributario", "PDF + Excel trazable"],
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
      ["Privacidad", "/privacidad"],
      ["Términos", "/terminos"],
      ["Cookies", "/cookies"],
    ],
  },
] as const;

function ProductSnapshot() {
  const kpis = [
    ["Operaciones", "CSV/API", "text-sky-300"],
    ["Activos", "10", "text-white"],
    ["Respaldo", "PDF + Excel", "text-emerald-300"],
  ] as const;

  const rows = [
    ["BTC", "Exchange", "OK", "PDF"],
    ["USDT", "CSV", "Revisar", "Excel"],
    ["ETH", "API", "OK", "PDF"],
  ] as const;

  return (
    <aside className="relative mx-auto w-full max-w-[760px] rounded-[2rem] border border-white/10 bg-slate-950/80 p-4 shadow-[0_30px_100px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:p-6">
      <div className="rounded-2xl border border-sky-400/20 bg-white/[0.03] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-white">LEDGERA · Respaldo tributario</p>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-xs font-black text-emerald-300">
            AT 2026
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {kpis.map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className={`mt-3 text-2xl font-black tracking-[-0.04em] ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <p className="text-sm font-extrabold text-white">Obligaciones detectadas</p>
        <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-300">
          <div>
            <span className="mr-3 text-amber-300">●</span>Declarar / respaldar
          </div>
          <div>
            <span className="mr-3 text-sky-300">●</span>Revisar trazabilidad de fondos
          </div>
          <div>
            <span className="mr-3 text-slate-500">●</span>Sin impuesto determinado
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
        <div className="grid grid-cols-4 border-b border-white/10 px-5 py-3 font-mono text-xs text-slate-500">
          <span>Activo</span>
          <span>Origen</span>
          <span>Estado</span>
          <span>Archivo</span>
        </div>
        {rows.map(([asset, source, status, file]) => (
          <div
            key={`${asset}-${source}`}
            className="grid grid-cols-4 border-b border-white/10 px-5 py-3 font-mono text-xs text-slate-300 last:border-0"
          >
            <span>{asset}</span>
            <span>{source}</span>
            <span className={status === "OK" ? "text-emerald-300" : "text-amber-300"}>{status}</span>
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
    <main className="ledgera-welcome min-h-screen overflow-x-hidden bg-[#020617] text-slate-50">
      <nav className="sticky top-0 z-[100] border-b border-white/10 bg-[#020617]/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[82px] max-w-[1440px] items-center justify-between gap-5">
          <Link href="/" aria-label="Inicio LEDGERA" className="inline-flex items-center">
            <Logo variant="light" size="sm" />
          </Link>
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="text-sm font-bold text-slate-300 transition hover:text-white">
                {label}
              </Link>
            ))}
            <Link href="/login" className="text-sm font-black text-slate-300 transition hover:text-white">
              Ingresar
            </Link>
            <Link
              href="/register"
              className="inline-flex rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 shadow-2xl shadow-sky-950/40 transition hover:-translate-y-0.5 hover:bg-sky-200"
            >
              Comenzar
            </Link>
          </div>
          <button
            type="button"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            Menú
          </button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div className="sticky top-[82px] z-[90] border-b border-white/10 bg-[#020617]/98 px-6 py-5 backdrop-blur-xl lg:hidden">
          <div className="grid gap-4">
            {navItems.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-black text-slate-300"
              >
                {label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-slate-300">
              Ingresar
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex justify-center rounded-2xl bg-sky-300 px-5 py-4 text-center font-black text-slate-950"
            >
              Comenzar análisis
            </Link>
          </div>
        </div>
      ) : null}

      <section className="relative overflow-hidden px-5 pb-12 pt-16 sm:px-8 lg:px-10 lg:pb-16 lg:pt-20">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_76%_12%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_14%_26%,rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#0B1120_56%,#020617_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:88px_88px]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(560px,1fr)]">
          <div>
            <div className="inline-flex rounded-full border border-sky-300/30 bg-sky-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-sky-300">
              Bienvenido a LEDGERA
            </div>
            <h1 className="mt-7 max-w-[860px] font-display text-[44px] font-black leading-[1.02] tracking-[-0.065em] text-white sm:text-[64px] lg:text-[82px]">
              De tus exchanges a tu declaración, sin planillas.
            </h1>
            <p className="mt-6 max-w-[740px] text-lg leading-8 text-slate-300 sm:text-xl">
              LEDGERA importa operaciones cripto desde exchanges, ordena tus activos digitales y genera respaldos tributarios trazables en PDF y Excel.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-[58px] items-center justify-center rounded-2xl bg-sky-300 px-7 text-base font-black text-slate-950 shadow-2xl shadow-sky-950/40 transition hover:-translate-y-0.5 hover:bg-sky-200"
              >
                Comenzar análisis →
              </Link>
              <Link
                href="/como-funciona"
                className="inline-flex min-h-[58px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 text-base font-black text-sky-200 transition hover:border-sky-300/40 hover:bg-sky-300/10"
              >
                Ver cómo funciona
              </Link>
            </div>
            <div className="mt-8 grid max-w-[740px] gap-3 sm:grid-cols-3">
              {trustItems.map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
                  <p className="text-sm font-black text-sky-300">{title}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <ProductSnapshot />
        </div>

        <div className="relative z-10 mx-auto mt-12 max-w-[1440px] rounded-[2rem] border border-white/10 bg-white/[0.045] px-6 py-5 text-sm font-semibold leading-7 text-slate-300 backdrop-blur-xl sm:px-8">
          <span className="font-black text-sky-300">Una entrada simple al producto:</span> carga tus movimientos de exchanges, valida activos y descarga respaldo tributario trazable.
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#020617] px-5 py-12 text-slate-300 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1.1fr_1.5fr_0.8fr]">
          <div>
            <Logo variant="light" size="sm" />
            <p className="mt-5 max-w-[430px] text-sm leading-6 text-slate-400">
              Orden, trazabilidad y respaldo tributario para activos digitales. Diseñado para revisar mejor antes de declarar o tomar decisiones patrimoniales.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-sky-300">{column.title}</h3>
                <div className="mt-4 grid gap-3">
                  {column.links.map(([label, href]) => (
                    <Link key={`${column.title}-${href}`} href={href} className="text-sm font-semibold text-slate-300 transition hover:text-white">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-sky-300/20 bg-sky-300/10 p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-300">Opinión</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Ayúdanos a mejorar LEDGERA con feedback orgánico sobre claridad, utilidad y funcionamiento real de la app.
            </p>
            <Link href="/preguntas" className="mt-5 inline-flex rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black text-slate-950">
              Revisar dudas
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
