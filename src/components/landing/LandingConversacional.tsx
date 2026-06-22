// src/components/landing/LandingConversacional.tsx
// UX 3.0.01 v1.6.1 — Hero orientado a activos y claridad
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";

const BRAND_SUBTITLE = "Sistema Operativo Financiero y Tributario";

const PROMPTS = [
  "Vender Bitcoin",
  "Crear una SpA",
  "Invertir en un inmueble",
  "Regularizar movimientos crypto",
] as const;

const TRUST_AREAS = ["Personas", "Empresas", "Profesionales"] as const;
const DOMAIN_AREAS = ["Cryptoactivos", "Patrimonio", "Tributación", "Finanzas"] as const;

const DECISION_FLOW = [
  ["01", "Activos", "Qué tienes, dónde está y qué movimiento estás evaluando."],
  ["02", "Contexto", "Tu situación financiera, tributaria y patrimonial."],
  ["03", "Normativa", "Reglas chilenas aplicables a la operación."],
  ["04", "Escenarios", "Alternativas posibles antes de ejecutar."],
  ["05", "Claridad", "Información ordenada para decidir mejor."],
] as const;

const PROBLEM_CARDS = [
  ["Cryptoactivos", "Movimientos, tenencia, valorización y tributación."],
  ["Empresas", "Estructura societaria, régimen tributario y obligaciones."],
  ["Patrimonio", "Inversiones, inmuebles, flujos y planificación."],
  ["Tributación", "Normas, cumplimiento, documentación y criterios aplicables."],
] as const;

const PROCESS = [
  ["Entiende", "Recoge contexto financiero, tributario y patrimonial."],
  ["Interpreta", "Conecta la situación con normativa chilena aplicable."],
  ["Simula", "Compara alternativas y efectos posibles."],
  ["Explica", "Traduce complejidad a comprensión accionable."],
  ["Decides", "La decisión final permanece siempre en tus manos."],
] as const;

const CASES = [
  ["Venta de Bitcoin", "Evalúa la operación, el registro necesario y el tratamiento tributario antes de mover tu posición."],
  ["Empresa Web3", "Ordena estructura societaria, régimen tributario y modelo operativo desde el inicio."],
  ["Patrimonio internacional", "Relaciona activos fuera de Chile con obligaciones locales y documentación necesaria."],
  ["Tokenización", "Evalúa el modelo financiero, la operación y los criterios tributarios aplicables."],
] as const;

const FOOTER_LINKS = [
  ["Seguridad", "/seguridad"],
  ["Privacidad", "/privacidad"],
  ["Términos", "/terminos"],
] as const;

function CinematicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#050C12]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_18%,rgba(56,189,248,0.22),transparent_26%),radial-gradient(circle_at_18%_28%,rgba(22,163,74,0.18),transparent_30%),radial-gradient(circle_at_82%_72%,rgba(245,158,11,0.10),transparent_24%),linear-gradient(180deg,rgba(5,12,18,0.10)_0%,rgba(5,12,18,0.96)_82%,#050C12_100%)]" />
      <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(246,248,250,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(246,248,250,0.08)_1px,transparent_1px)] [background-size:82px_82px]" />
      <div className="absolute left-[48%] top-[12%] h-[520px] w-[520px] rounded-full border border-[#38BDF8]/20 bg-[radial-gradient(circle,rgba(56,189,248,0.18),rgba(22,163,74,0.08)_38%,transparent_70%)] shadow-[0_0_180px_rgba(56,189,248,0.16)]" />
      <div className="absolute left-[55%] top-[22%] h-[300px] w-[300px] rounded-full border border-[#16A34A]/20" />
      <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 1440 760" preserveAspectRatio="none" fill="none">
        <path className="premium-flow" d="M-80 570 C150 425 320 600 510 372 C650 202 824 360 1010 210 C1160 88 1260 156 1520 42" stroke="#16A34A" strokeWidth="2" strokeOpacity="0.42" />
        <path className="premium-flow flow-b" d="M-80 650 C190 520 370 590 560 470 C740 356 820 420 980 322 C1130 230 1260 260 1520 178" stroke="#F59E0B" strokeWidth="1.4" strokeOpacity="0.24" />
        <path className="premium-flow flow-c" d="M120 180 C300 105 460 128 620 184 C820 254 960 120 1180 202 C1300 246 1380 228 1500 202" stroke="#38BDF8" strokeWidth="1.2" strokeOpacity="0.24" />
      </svg>
      <div className="orb left-[44%] top-[42%]" />
      <div className="orb left-[60%] top-[28%] delay-a" />
      <div className="orb left-[78%] top-[44%] delay-b" />
    </div>
  );
}

function DecisionPanel() {
  return (
    <aside className="relative min-h-[560px] lg:min-h-[640px]">
      <div className="absolute left-[4%] top-[8%] h-[380px] w-[380px] rounded-full border border-[#38BDF8]/20 bg-[radial-gradient(circle,rgba(56,189,248,0.17),transparent_65%)] shadow-[0_0_160px_rgba(56,189,248,0.10)]" />
      <div className="absolute right-0 top-0 w-full max-w-[460px] space-y-4">
        {DECISION_FLOW.map(([num, title, text]) => (
          <article key={title} className="rounded-2xl border border-[#1e4a6b]/75 bg-[#071B28]/78 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl transition hover:border-[#16A34A]/55">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 text-sm font-black text-[#86EFAC]">{num}</span>
              <div>
                <h3 className="font-display text-[21px] font-black tracking-[-0.035em] text-[#F6F8FA]">{title}</h3>
                <p className="mt-1 text-[15px] leading-6 text-[#CBD5E1]">{text}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}

function HeroSection() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");

  const start = () => {
    const clean = inputValue.trim();
    if (clean) window.sessionStorage.setItem("ledgera.initialDecision", clean);
    router.push("/register");
  };

  return (
    <section className="relative overflow-hidden px-5 pb-14 pt-14 sm:px-8 lg:px-10 lg:pb-20 lg:pt-20">
      <CinematicBackground />
      <div className="relative z-10 mx-auto grid max-w-[1380px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(500px,0.88fr)]">
        <div>
          <div className="mb-7 inline-flex rounded-full border border-[#16A34A]/35 bg-[#16A34A]/10 px-4 py-2 text-[12px] font-black uppercase tracking-[0.18em] text-[#86EFAC]">
            Activos · Patrimonio · Tributación
          </div>
          <h1 className="max-w-[790px] font-display text-[44px] font-black leading-[1.02] tracking-[-0.055em] text-[#F6F8FA] sm:text-[62px] lg:text-[74px] xl:text-[82px]">
            Claridad para tus activos. Decisiones mejor informadas.
          </h1>
          <p className="mt-6 max-w-[650px] text-[18px] leading-[1.65] text-[#CBD5E1] sm:text-[20px]">
            LEDGERA interpreta normativa chilena, contexto patrimonial y movimientos de cryptoactivos para ayudarte a evaluar decisiones financieras y tributarias.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); start(); }} className="mt-8 max-w-[680px]">
            <div className="rounded-2xl border border-[#1e4a6b] bg-[#071B28]/80 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl transition focus-within:border-[#16A34A]/70">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="¿Qué activo o decisión necesitas evaluar?" className="min-h-[58px] flex-1 rounded-xl border-0 bg-transparent px-5 text-[17px] font-semibold text-[#F6F8FA] outline-none placeholder:text-[#94A3B8]" />
                <button type="submit" className="min-h-[56px] rounded-xl bg-[#16A34A] px-6 text-[16px] font-black text-white transition hover:bg-[#15803D]">Evaluar con LEDGERA →</button>
              </div>
            </div>
          </form>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => setInputValue(prompt)} className="rounded-full border border-[#1e4a6b] bg-[#071B28]/50 px-4 py-2 text-[13px] font-bold text-[#CBD5E1] transition hover:border-[#16A34A]/60 hover:bg-[#16A34A]/10 hover:text-white">{prompt}</button>)}
          </div>
        </div>
        <DecisionPanel />
      </div>
      <div className="relative z-10 mx-auto mt-8 grid max-w-[1000px] gap-5 text-center">
        <div className="flex flex-wrap justify-center gap-3">{TRUST_AREAS.map((area) => <span key={area} className="rounded-full border border-[#1e4a6b]/70 bg-[#071B28]/60 px-5 py-2 text-sm font-black text-[#F6F8FA] backdrop-blur-xl">{area}</span>)}</div>
        <div className="flex flex-wrap justify-center gap-3">{DOMAIN_AREAS.map((area) => <span key={area} className="text-sm font-bold uppercase tracking-[0.18em] text-[#94A3B8]">{area}</span>)}</div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section id="soluciones" className="border-t border-[#1e4a6b]/60 bg-[#06131D] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1380px]">
        <p className="text-[13px] font-black uppercase tracking-[0.22em] text-[#4ADE80]">El problema</p>
        <h2 className="mt-5 max-w-[760px] font-display text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-[#F6F8FA] sm:text-[48px]">Los activos se mueven rápido. La claridad no puede esperar.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PROBLEM_CARDS.map(([title, text]) => (
            <article key={title} className="premium-card min-h-[260px] rounded-3xl border border-[#1e4a6b]/80 bg-[#0F2A3D] p-7 transition hover:-translate-y-1 hover:border-[#16A34A]/65">
              <div className="relative z-10 flex h-full flex-col justify-end">
                <span className="mb-7 grid h-12 w-12 place-items-center rounded-2xl bg-[#16A34A] text-lg font-black text-white">L</span>
                <h3 className="font-display text-[26px] font-black tracking-[-0.035em] text-[#F6F8FA]">{title}</h3>
                <p className="mt-3 text-[16px] leading-6 text-[#CBD5E1]">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="border-t border-[#1e4a6b]/60 bg-[#071B28] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-[1380px] gap-12 lg:grid-cols-[0.82fr_1.4fr] lg:items-center">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.22em] text-[#4ADE80]">Qué hace LEDGERA</p>
          <h2 className="mt-5 font-display text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-[#F6F8FA] sm:text-[48px]">Convierte información compleja en claridad accionable.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {PROCESS.map(([title, text], index) => (
            <article key={title} className="rounded-3xl border border-[#1e4a6b]/70 bg-[#0F2A3D]/72 p-5">
              <div className="mb-6 grid h-10 w-10 place-items-center rounded-full bg-[#16A34A] text-sm font-black text-white">{index + 1}</div>
              <h3 className="text-[18px] font-black text-[#F6F8FA]">{title}</h3>
              <p className="mt-3 text-[14px] leading-6 text-[#CBD5E1]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CasesSection() {
  return (
    <section id="casos" className="border-t border-[#1e4a6b]/60 bg-[#06131D] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1380px]">
        <p className="text-[13px] font-black uppercase tracking-[0.22em] text-[#4ADE80]">Casos reales</p>
        <h2 className="mt-5 max-w-[760px] font-display text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-[#F6F8FA] sm:text-[48px]">Evalúa activos, estructuras y movimientos con mayor claridad.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CASES.map(([title, text]) => (
            <article key={title} className="premium-card min-h-[280px] rounded-3xl border border-[#1e4a6b]/80 bg-[#0F2A3D] p-7 transition hover:-translate-y-1 hover:border-[#16A34A]/65">
              <div className="relative z-10 flex h-full flex-col justify-end">
                <h3 className="font-display text-[25px] font-black tracking-[-0.035em] text-[#F6F8FA]">{title}</h3>
                <p className="mt-3 text-[16px] leading-6 text-[#CBD5E1]">{text}</p>
                <span className="mt-6 text-sm font-black text-[#4ADE80]">Evaluar con LEDGERA →</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrincipleSection() {
  return (
    <section className="border-t border-[#1e4a6b]/60 bg-[#071B28] px-5 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-[1380px] items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.22em] text-[#4ADE80]">Principio LEDGERA</p>
          <h2 className="mt-3 font-display text-[32px] font-black tracking-[-0.045em] text-[#F6F8FA] sm:text-[42px]">LEDGERA no decide por ti.</h2>
          <p className="mt-4 max-w-[820px] text-[17px] leading-[1.7] text-[#CBD5E1]">Te ayuda a ordenar información, interpretar normas aplicables, comparar alternativas y entender cada escenario antes de actuar.</p>
        </div>
        <Link href="/register" className="inline-flex min-h-[56px] items-center justify-center rounded-xl bg-[#16A34A] px-7 text-[16px] font-black text-white transition hover:bg-[#15803D]">Evaluar con LEDGERA →</Link>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-[#1e4a6b]/60 bg-[#06131D] px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1380px] flex-col items-center gap-8 sm:flex-row sm:justify-between">
        <Logo variant="light" size="sm" showSubtitle subtitle={BRAND_SUBTITLE} />
        <nav className="flex flex-wrap justify-center gap-x-7 gap-y-3">
          {FOOTER_LINKS.map(([label, href]) => <Link key={label} href={href} className="text-sm font-semibold text-[#CBD5E1] transition hover:text-[#F6F8FA]">{label}</Link>)}
          <a href="mailto:admin@ledgera.cl" className="text-sm font-semibold text-[#CBD5E1] transition hover:text-[#F6F8FA]">Contacto</a>
        </nav>
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
    <main className="min-h-screen overflow-x-hidden bg-[#06131D] text-[#F6F8FA]">
      <style jsx global>{`
        @keyframes premiumDash { 0% { stroke-dashoffset: 860; } 100% { stroke-dashoffset: 0; } }
        @keyframes orbPulse { 0%, 100% { transform: scale(1); opacity: .45; } 50% { transform: scale(1.65); opacity: 1; } }
        .premium-flow { stroke-dasharray: 18 28; animation: premiumDash 22s linear infinite; }
        .flow-b { animation-duration: 28s; }
        .flow-c { animation-duration: 34s; }
        .orb { position: absolute; width: 9px; height: 9px; border-radius: 9999px; background: #16A34A; box-shadow: 0 0 32px rgba(22,163,74,.72); animation: orbPulse 4.8s ease-in-out infinite; }
        .delay-a { animation-delay: 700ms; }
        .delay-b { animation-delay: 1200ms; }
        .premium-card { position: relative; overflow: hidden; }
        .premium-card:before { content: ""; position: absolute; inset: 0; opacity: .48; background: radial-gradient(circle at 35% 18%, rgba(22,163,74,.34), transparent 28%), linear-gradient(135deg, rgba(245,158,11,.14), transparent 42%); }
      `}</style>

      <nav className="sticky top-0 z-[100] border-b border-[#1e4a6b]/60 bg-[#06131D]/88 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[78px] max-w-[1380px] items-center justify-between gap-6">
          <Link href="/" aria-label="Inicio LEDGERA"><Logo variant="light" size="md" showSubtitle subtitle={BRAND_SUBTITLE} /></Link>
          <div className="hidden items-center gap-8 lg:flex">
            <a href="#soluciones" className="text-sm font-semibold text-[#CBD5E1] transition hover:text-white">Soluciones</a>
            <a href="#casos" className="text-sm font-semibold text-[#CBD5E1] transition hover:text-white">Casos de uso</a>
            <Link href="/login" className="text-sm font-black text-[#CBD5E1] transition hover:text-white">Iniciar sesión</Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl border border-[#16A34A]/50 bg-[#16A34A]/10 px-6 py-3.5 text-sm font-black text-[#F6F8FA] transition hover:bg-[#16A34A]">Evaluar con LEDGERA →</Link>
          </div>
          <button type="button" className="rounded-xl border border-[#1e4a6b] bg-[#13364F] px-4 py-3 text-sm font-black text-[#F6F8FA] lg:hidden" onClick={() => setMobileMenuOpen((current) => !current)}>Menú</button>
        </div>
      </nav>

      {mobileMenuOpen ? <div className="sticky top-[78px] z-[90] border-b border-[#1e4a6b]/70 bg-[#06131D]/98 px-6 py-5 backdrop-blur-xl lg:hidden"><div className="grid gap-4"><a href="#soluciones" onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-[#CBD5E1]">Soluciones</a><a href="#casos" onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-[#CBD5E1]">Casos de uso</a><Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-[#CBD5E1]">Iniciar sesión</Link><Link href="/register" onClick={() => setMobileMenuOpen(false)} className="inline-flex items-center justify-center rounded-xl bg-[#16A34A] px-5 py-4 text-center font-black text-white">Evaluar con LEDGERA →</Link></div></div> : null}

      <HeroSection />
      <ProblemSection />
      <ProcessSection />
      <CasesSection />
      <PrincipleSection />
      <LandingFooter />
    </main>
  );
}
