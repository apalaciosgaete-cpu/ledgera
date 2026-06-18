// src/components/landing/LandingConversacional.tsx
// UX 3.0.01 v1.4 — Premium cryptoassets landing
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";

const BRAND_SUBTITLE = "Sistema Operativo Financiero y Tributario para la economía digital";

const PROMPTS = [
  "Quiero vender Bitcoin",
  "Crear empresa crypto",
  "Regularizar movimientos",
  "Invertir en tokenización",
] as const;

const MARKET_TICKER = [
  ["BTC", "$66.842", "+2,35%"],
  ["ETH", "$3.142", "+1,18%"],
  ["SOL", "$154,21", "+3,46%"],
  ["USDC", "$1,00", "0,00%"],
  ["TOTAL CAP", "$2,47T", "+2,21%"],
] as const;

const PROBLEM_AREAS = [
  {
    title: "Cryptoactivos",
    items: ["Trading", "DeFi", "Staking", "NFTs / Tokens"],
  },
  {
    title: "Tributación",
    items: ["Impuesto a la Renta", "IVA", "DDAN", "Declaraciones al SII"],
  },
  {
    title: "Empresas",
    items: ["SpA / EIRL", "Holding", "Operación internacional", "Estructura fiscal"],
  },
  {
    title: "Riesgos",
    items: ["Fiscales", "Regulatorios", "Operacionales", "Reputacionales"],
  },
] as const;

const PROCESS_STEPS = [
  ["Entiende", "Analiza tu contexto financiero, patrimonial y tributario."],
  ["Interpreta", "Relaciona normativa chilena y criterios técnicos con tu situación."],
  ["Simula", "Compara escenarios, costos, impuestos y consecuencias."],
  ["Explica", "Entrega resultados claros, trazables y accionables para decidir."],
] as const;

const REAL_CASES = [
  {
    title: "Venta de Bitcoin",
    text: "¿Cuánto impuesto podría generar y cuándo conviene realizarla?",
    image: "bitcoin",
  },
  {
    title: "Empresa Web3",
    text: "¿Qué estructura societaria conviene para mi proyecto crypto?",
    image: "company",
  },
  {
    title: "Patrimonio internacional",
    text: "¿Qué obligaciones tengo en Chile por mis activos en el extranjero?",
    image: "global",
  },
  {
    title: "Tokenización",
    text: "¿Cuáles son los riesgos regulatorios y tributarios del modelo?",
    image: "token",
  },
] as const;

const FOOTER_LINKS = [
  { label: "Seguridad", href: "/seguridad" },
  { label: "Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terminos" },
  { label: "Contacto", href: "mailto:admin@ledgera.cl" },
] as const;

function PremiumBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#06131D]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_16%_24%,rgba(22,163,74,0.18),transparent_30%),radial-gradient(circle_at_54%_60%,rgba(245,158,11,0.10),transparent_24%),linear-gradient(180deg,rgba(6,19,29,0.30),rgba(3,9,14,0.98))]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(246,248,250,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(246,248,250,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="absolute left-[44%] top-[12%] h-[520px] w-[520px] rounded-full border border-[#1e4a6b]/50 bg-[radial-gradient(circle,rgba(14,165,233,0.20)_0%,rgba(22,163,74,0.08)_32%,transparent_68%)] blur-[1px]" />
      <div className="absolute left-[51%] top-[18%] h-[310px] w-[310px] rounded-full border border-[#16A34A]/20 bg-transparent" />

      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 1440 820" preserveAspectRatio="none" fill="none">
        <path className="premium-flow premium-flow-a" d="M-80 560 C170 410 340 590 520 360 C650 192 850 350 1010 210 C1150 88 1250 156 1520 40" stroke="#16A34A" strokeWidth="2" strokeOpacity="0.42" />
        <path className="premium-flow premium-flow-b" d="M-80 650 C190 520 370 590 560 470 C740 356 820 420 980 322 C1130 230 1260 260 1520 178" stroke="#F59E0B" strokeWidth="1.4" strokeOpacity="0.22" />
        <path className="premium-flow premium-flow-c" d="M120 180 C300 105 460 128 620 184 C820 254 960 120 1180 202 C1300 246 1380 228 1500 202" stroke="#38BDF8" strokeWidth="1.2" strokeOpacity="0.20" />
      </svg>

      <div className="crypto-dot left-[42%] top-[40%]" />
      <div className="crypto-dot left-[58%] top-[27%] animation-delay-700" />
      <div className="crypto-dot left-[76%] top-[41%] animation-delay-1000" />
      <div className="crypto-dot left-[67%] top-[67%] animation-delay-1500" />
    </div>
  );
}

function StatCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[#1e4a6b]/70 bg-[#071B28]/72 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">{title}</p>
      <p className="mt-2 font-display text-[26px] font-black tracking-[-0.04em] text-[#F6F8FA]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#4ADE80]">{detail}</p>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative min-h-[520px] lg:min-h-[620px]">
      <div className="absolute left-[8%] top-[6%] h-[360px] w-[360px] rounded-full border border-[#38BDF8]/20 bg-[radial-gradient(circle,rgba(56,189,248,0.17),transparent_65%)] shadow-[0_0_120px_rgba(56,189,248,0.10)]" />
      <div className="absolute left-[17%] top-[18%] h-[220px] w-[220px] rounded-full border border-[#16A34A]/20 bg-[radial-gradient(circle,rgba(22,163,74,0.12),transparent_68%)]" />

      <div className="absolute right-0 top-8 w-full max-w-[420px] space-y-4">
        <StatCard title="Patrimonio digital estimado" value="$248.820.450 CLP" detail="+12,6% vs. mes anterior" />
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#1e4a6b]/70 bg-[#071B28]/72 p-5 backdrop-blur-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">Diversificación</p>
            <div className="mt-5 flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-[conic-gradient(#16A34A_0_54%,#F59E0B_54%_72%,#38BDF8_72%_88%,#1e4a6b_88%_100%)] p-3">
                <div className="h-full w-full rounded-full bg-[#071B28]" />
              </div>
              <div className="space-y-1.5 text-xs font-bold text-[#CBD5E1]">
                <p>Crypto 54%</p>
                <p>Inversiones 18%</p>
                <p>Efectivo 16%</p>
              </div>
            </div>
          </div>
          <StatCard title="Exposición fiscal" value="$32,6M" detail="escenario anual" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Riesgo regulatorio" value="Medio" detail="monitoreo continuo" />
          <StatCard title="Próxima obligación" value="Renta" detail="30 abril" />
        </div>
      </div>

      <div className="absolute bottom-8 left-[8%] right-[10%] rounded-3xl border border-[#1e4a6b]/70 bg-[#071B28]/58 p-5 backdrop-blur-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.20em] text-[#94A3B8]">Simulación</p>
        <div className="mt-4 h-28 overflow-hidden rounded-2xl bg-[#06131D] p-4">
          <svg className="h-full w-full" viewBox="0 0 420 120" fill="none" preserveAspectRatio="none">
            <path d="M0 88 C40 78 58 92 92 70 C138 42 150 58 190 46 C244 28 262 58 310 38 C360 16 378 28 420 14" stroke="#16A34A" strokeWidth="4" />
            <path d="M0 98 C52 92 80 104 130 84 C178 64 220 86 270 72 C332 54 360 62 420 42" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.55" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");

  const startConversation = (value: string) => {
    const cleanValue = value.trim();
    if (cleanValue) {
      window.sessionStorage.setItem("ledgera.initialDecision", cleanValue);
    }
    router.push("/register");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startConversation(inputValue);
  };

  return (
    <section className="relative overflow-hidden px-5 pb-8 pt-14 sm:px-8 lg:px-10 lg:pb-14 lg:pt-20">
      <PremiumBackground />
      <div className="relative z-10 mx-auto grid max-w-[1360px] items-center gap-12 lg:grid-cols-[minmax(0,0.98fr)_minmax(460px,0.82fr)]">
        <div>
          <div className="mb-7 inline-flex rounded-full border border-[#16A34A]/30 bg-[#16A34A]/10 px-4 py-2 text-[12px] font-black uppercase tracking-[0.18em] text-[#86EFAC]">
            IA especializada en finanzas y tributación
          </div>

          <h1 className="font-display text-[46px] font-black leading-[1.02] tracking-[-0.055em] text-[#F6F8FA] sm:text-[64px] lg:text-[76px] xl:text-[84px]">
            Comprende el impacto de tus decisiones
            <span className="block text-[#16A34A]">patrimoniales</span>
            antes de ejecutarlas.
          </h1>

          <p className="mt-6 max-w-[640px] text-[18px] leading-[1.65] text-[#CBD5E1] sm:text-[20px]">
            LEDGERA interpreta normativa chilena, analiza escenarios, evalúa
            riesgos y entrega claridad para decidir con confianza en la economía digital.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-[650px]">
            <div className="rounded-2xl border border-[#1e4a6b] bg-[#071B28]/80 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl transition focus-within:border-[#16A34A]/70">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="¿Qué decisión necesitas evaluar?"
                  className="min-h-[58px] flex-1 rounded-xl border-0 bg-transparent px-5 text-[17px] font-semibold text-[#F6F8FA] outline-none placeholder:text-[#94A3B8]"
                />
                <button
                  type="submit"
                  className="min-h-[56px] rounded-xl bg-[#16A34A] px-6 text-[16px] font-black text-white transition hover:bg-[#15803D] active:scale-[0.98]"
                >
                  Evaluar decisión →
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInputValue(prompt)}
                className="rounded-full border border-[#1e4a6b] bg-[#071B28]/50 px-4 py-2 text-[13px] font-bold text-[#CBD5E1] transition hover:border-[#16A34A]/60 hover:bg-[#16A34A]/10 hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <HeroVisual />
      </div>

      <div className="relative z-10 mx-auto mt-5 max-w-[1360px] rounded-2xl border border-[#1e4a6b]/60 bg-[#071B28]/60 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[13px] font-bold text-[#CBD5E1]">
          {MARKET_TICKER.map(([asset, price, move]) => (
            <div key={asset} className="flex items-center gap-3">
              <span className="rounded-full bg-[#13364F] px-2 py-1 text-[#F6F8FA]">{asset}</span>
              <span>{price}</span>
              <span className="text-[#4ADE80]">{move}</span>
            </div>
          ))}
          <span className="text-[11px] uppercase tracking-[0.16em] text-[#64748B]">Datos ilustrativos</span>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section id="soluciones" className="relative border-t border-[#1e4a6b]/60 bg-[#06131D] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[0.9fr_1.35fr] lg:items-center">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.22em] text-[#4ADE80]">El problema</p>
          <h2 className="mt-5 font-display text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-[#F6F8FA] sm:text-[48px]">
            El patrimonio digital crece. La complejidad <span className="text-[#16A34A]">también.</span>
          </h2>
          <p className="mt-5 max-w-[520px] text-[17px] leading-[1.7] text-[#CBD5E1]">
            Normativa cambiante, múltiples plataformas, operaciones globales y
            obligaciones locales. Tomar decisiones sin claridad puede salir caro.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEM_AREAS.map((area) => (
            <article key={area.title} className="rounded-3xl border border-[#1e4a6b]/70 bg-[#0F2A3D]/78 p-6 transition hover:-translate-y-1 hover:border-[#16A34A]/55 hover:bg-[#13364F]">
              <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-[#16A34A]/20 bg-[#16A34A]/10 text-[22px] font-black text-[#86EFAC]">
                {area.title.slice(0, 1)}
              </div>
              <h3 className="font-display text-[24px] font-black tracking-[-0.035em] text-[#F6F8FA]">{area.title}</h3>
              <ul className="mt-5 space-y-3">
                {area.items.map((item) => (
                  <li key={item} className="text-[15px] font-medium text-[#CBD5E1]">› {item}</li>
                ))}
              </ul>
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
      <div className="mx-auto grid max-w-[1360px] gap-12 lg:grid-cols-[0.8fr_1.4fr] lg:items-center">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.22em] text-[#4ADE80]">Qué hace LEDGERA</p>
          <h2 className="mt-5 font-display text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-[#F6F8FA] sm:text-[48px]">
            Del contexto a la decisión. En <span className="text-[#16A34A]">cuatro pasos.</span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {PROCESS_STEPS.map(([title, text], index) => (
            <article key={title} className="relative rounded-3xl border border-[#1e4a6b]/70 bg-[#0F2A3D]/72 p-6">
              <div className="mb-7 grid h-11 w-11 place-items-center rounded-full bg-[#16A34A] text-sm font-black text-white">{index + 1}</div>
              <h3 className="text-[19px] font-black text-[#F6F8FA]">{title}</h3>
              <p className="mt-3 text-[15px] leading-6 text-[#CBD5E1]">{text}</p>
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
      <div className="mx-auto max-w-[1360px]">
        <p className="text-[13px] font-black uppercase tracking-[0.22em] text-[#4ADE80]">Casos reales</p>
        <h2 className="mt-5 max-w-[720px] font-display text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-[#F6F8FA] sm:text-[48px]">
          Decisiones que LEDGERA te ayuda a <span className="text-[#16A34A]">evaluar.</span>
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {REAL_CASES.map((item) => (
            <article key={item.title} className={`case-card case-${item.image} group min-h-[250px] overflow-hidden rounded-3xl border border-[#1e4a6b]/80 bg-[#0F2A3D] p-6 transition hover:-translate-y-1 hover:border-[#16A34A]/65`}>
              <div className="relative z-10 flex h-full flex-col justify-end">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#16A34A] text-lg font-black text-white">L</div>
                <h3 className="font-display text-[22px] font-black tracking-[-0.03em] text-[#F6F8FA]">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-[#CBD5E1]">{item.text}</p>
                <span className="mt-5 text-sm font-black text-[#4ADE80]">Evaluar ahora →</span>
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
    <section className="border-t border-[#1e4a6b]/60 bg-[#071B28] px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
      <div className="mx-auto grid max-w-[1360px] items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.22em] text-[#4ADE80]">Principio LEDGERA</p>
          <h2 className="mt-3 font-display text-[32px] font-black tracking-[-0.045em] text-[#F6F8FA] sm:text-[42px]">LEDGERA no decide por ti.</h2>
          <p className="mt-3 max-w-[760px] text-[17px] leading-[1.65] text-[#CBD5E1]">
            Te muestra qué ocurre, qué normas aplican, qué alternativas existen
            y qué consecuencias tiene cada camino. La decisión final sigue siendo tuya.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex min-h-[56px] items-center justify-center rounded-xl bg-[#16A34A] px-7 text-[16px] font-black text-white transition hover:bg-[#15803D]">Evaluar una decisión →</Link>
          <Link href="/login" className="inline-flex min-h-[56px] items-center justify-center rounded-xl border border-[#1e4a6b] bg-[#13364F] px-7 text-[16px] font-black text-[#F6F8FA] transition hover:bg-[#1e4a6b]">Ya tengo cuenta</Link>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-[#1e4a6b]/60 bg-[#06131D] px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-8 sm:flex-row sm:justify-between">
        <Logo variant="light" size="sm" showSubtitle subtitle={BRAND_SUBTITLE} />
        <nav className="flex flex-wrap justify-center gap-x-7 gap-y-3">
          {FOOTER_LINKS.map((link) =>
            link.href.startsWith("mailto:") ? (
              <a key={link.label} href={link.href} className="text-sm font-semibold text-[#CBD5E1] transition hover:text-[#F6F8FA]">{link.label}</a>
            ) : (
              <Link key={link.label} href={link.href} className="text-sm font-semibold text-[#CBD5E1] transition hover:text-[#F6F8FA]">{link.label}</Link>
            ),
          )}
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-[1360px] border-t border-[#1e4a6b]/60 pt-6 text-center text-sm text-[#94A3B8]">
        © {new Date().getFullYear()} LEDGERA. Todos los derechos reservados.
      </div>
    </footer>
  );
}

export default function LandingConversacional() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#06131D] text-[#F6F8FA]">
      <style jsx global>{`
        @keyframes premiumDash {
          0% { stroke-dashoffset: 860; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes cryptoPulse {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(1.65); opacity: 1; }
        }
        .premium-flow {
          stroke-dasharray: 18 28;
          animation: premiumDash 22s linear infinite;
        }
        .premium-flow-b { animation-duration: 28s; }
        .premium-flow-c { animation-duration: 34s; }
        .crypto-dot {
          position: absolute;
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          background: #16A34A;
          box-shadow: 0 0 32px rgba(22, 163, 74, 0.72);
          animation: cryptoPulse 4.8s ease-in-out infinite;
        }
        .animation-delay-700 { animation-delay: 700ms; }
        .animation-delay-1000 { animation-delay: 1000ms; }
        .animation-delay-1500 { animation-delay: 1500ms; }
        .case-card { position: relative; }
        .case-card::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.38;
          background: radial-gradient(circle at 35% 18%, rgba(22,163,74,0.36), transparent 28%), linear-gradient(135deg, rgba(245,158,11,0.12), transparent 42%);
        }
        .case-bitcoin::after { background: radial-gradient(circle at 28% 24%, rgba(245,158,11,0.45), transparent 22%); }
        .case-company::after { background: linear-gradient(135deg, rgba(56,189,248,0.28), transparent 55%); }
        .case-global::after { background: radial-gradient(circle at 50% 10%, rgba(56,189,248,0.36), transparent 30%); }
        .case-token::after { background: radial-gradient(circle at 70% 22%, rgba(22,163,74,0.34), transparent 30%); }
        .case-card::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.7;
        }
      `}</style>

      <nav className="sticky top-0 z-[100] border-b border-[#1e4a6b]/60 bg-[#06131D]/88 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[78px] max-w-[1360px] items-center justify-between gap-6">
          <Link href="/" aria-label="Inicio LEDGERA">
            <Logo variant="light" size="md" showSubtitle subtitle={BRAND_SUBTITLE} />
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <a href="#soluciones" className="text-sm font-semibold text-[#CBD5E1] transition hover:text-white">Soluciones</a>
            <a href="#casos" className="text-sm font-semibold text-[#CBD5E1] transition hover:text-white">Casos de uso</a>
            <Link href="/login" className="text-sm font-black text-[#CBD5E1] transition hover:text-white">Iniciar sesión</Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl border border-[#16A34A]/50 bg-[#16A34A]/10 px-6 py-3.5 text-sm font-black text-[#F6F8FA] transition hover:bg-[#16A34A]">Evaluar decisión →</Link>
          </div>

          <button
            type="button"
            className="rounded-xl border border-[#1e4a6b] bg-[#13364F] px-4 py-3 text-sm font-black text-[#F6F8FA] lg:hidden"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-expanded={mobileMenuOpen}
            aria-label="Abrir menú"
          >
            Menú
          </button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div className="sticky top-[78px] z-[90] border-b border-[#1e4a6b]/70 bg-[#06131D]/98 px-6 py-5 backdrop-blur-xl lg:hidden">
          <div className="grid gap-4">
            <a href="#soluciones" onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-[#CBD5E1]">Soluciones</a>
            <a href="#casos" onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-[#CBD5E1]">Casos de uso</a>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-black text-[#CBD5E1]">Iniciar sesión</Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="inline-flex items-center justify-center rounded-xl bg-[#16A34A] px-5 py-4 text-center font-black text-white">Evaluar decisión →</Link>
          </div>
        </div>
      ) : null}

      <HeroSection />
      <ProblemSection />
      <ProcessSection />
      <CasesSection />
      <PrincipleSection />
      <LandingFooter />

      {showScrollTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-[80] h-12 w-12 rounded-full border border-[#1e4a6b] bg-[#13364F] font-black text-white shadow-lg transition hover:bg-[#1e4a6b]"
          aria-label="Volver arriba"
        >
          ↑
        </button>
      ) : null}
    </main>
  );
}
