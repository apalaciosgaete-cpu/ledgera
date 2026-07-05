import type { Metadata } from "next";
import Link from "next/link";
import { MarketingCard, MarketingPage } from "@/components/marketing/MarketingLayout";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guías extensas de LEDGERA sobre cryptoactivos, respaldo tributario, SII, documentación y orden financiero en Chile.",
  alternates: { canonical: "/blog" },
};

const articles = [
  {
    title: "Cómo ordenar movimientos crypto antes de declarar",
    tag: "Crypto Chile",
    text: "Una guía para entender por qué el historial del exchange no basta por sí solo: fechas, monedas, costos, retiros, depósitos y respaldos deben quedar conectados en una trazabilidad revisable.",
  },
  {
    title: "Qué significa generar respaldo tributario",
    tag: "Respaldo",
    text: "El respaldo no es solo un PDF. Es una estructura documental que permite explicar de dónde viene cada dato, qué operación representa y qué queda pendiente de revisión profesional.",
  },
  {
    title: "Errores comunes al mezclar bancos, exchanges y CSV",
    tag: "Importaciones",
    text: "Duplicidades, movimientos internos, cambios de moneda y registros incompletos pueden distorsionar la lectura patrimonial. La clave está en conciliar antes de interpretar.",
  },
] as const;

const guideSections = [
  [
    "1. Orden financiero antes de interpretación tributaria",
    "Antes de discutir impuestos, el usuario necesita saber qué activos tiene, dónde están, qué movimientos realizó y qué fuentes documentales respaldan esa información. Esta etapa reduce errores y evita revisar obligaciones sobre datos incompletos.",
  ],
  [
    "2. Trazabilidad como lenguaje común",
    "La trazabilidad permite conversar con contadores, abogados tributarios o equipos financieros usando una misma base: operación, fecha, fuente, activo, monto, moneda, estado y respaldo asociado.",
  ],
  [
    "3. Separar declarar, respaldar y pagar",
    "No todo movimiento implica necesariamente pago de impuesto. Algunas operaciones pueden requerir declaración, otras solo respaldo, y otras una revisión más detallada. Separar esas categorías evita promesas excesivas y mejora la calidad de la revisión.",
  ],
  [
    "4. Cryptoactivos como primer caso de uso",
    "Los cryptoactivos son un buen punto de partida porque concentran alta fricción documental: exchanges, wallets, CSV, bancos, conversiones, retiros y movimientos entre cuentas propias. LEDGERA usa ese problema para construir una capa más amplia de orden patrimonial.",
  ],
  [
    "5. El rol de LEDGERA",
    "LEDGERA no reemplaza asesoría profesional. Su rol es ordenar, estructurar, identificar pendientes, facilitar revisión y generar reportes exportables para que la decisión se tome con mejor información.",
  ],
] as const;

export default function BlogPage() {
  return (
    <MarketingPage
      active="Blog"
      eyebrow="Blog LEDGERA"
      title="Información extensa para declarar, respaldar y revisar mejor."
      description="El blog debe construir autoridad. Aquí viven las guías largas sobre cryptoactivos, SII, respaldo documental, conciliación de movimientos y buenas prácticas para preparar información tributaria en Chile."
    >
      <section className="grid gap-5 lg:grid-cols-3">
        {articles.map((article) => (
          <MarketingCard key={article.title}>
            <span className="rounded-full border border-[#C9A84C]/50 bg-[#17140A] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#C9A84C]">{article.tag}</span>
            <h2 className="mt-5 font-display text-3xl font-black tracking-[-0.04em] text-[#F2EBD8]">{article.title}</h2>
            <p className="mt-4 text-sm leading-7 text-[#BFC8D9]">{article.text}</p>
            <Link href="/contacto" className="mt-6 inline-flex text-sm font-black text-[#C9A84C]">Sugerir tema →</Link>
          </MarketingCard>
        ))}
      </section>

      <section id="crypto-chile" className="mt-12 rounded-[2rem] border border-[#24345F] bg-[#0B1430]/86 p-7 sm:p-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#C9A84C]">Guía base</p>
        <h2 className="mt-4 max-w-[980px] font-display text-4xl font-black tracking-[-0.045em] text-[#F2EBD8]">Cómo preparar información tributaria de activos digitales sin perder trazabilidad.</h2>
        <p className="mt-5 max-w-[980px] text-base leading-8 text-[#BFC8D9]">
          La mayor dificultad para un usuario no suele ser solo entender una norma: es reconstruir operaciones dispersas. Cuando hay movimientos en exchanges, bancos, wallets y archivos CSV, la revisión tributaria empieza por una pregunta operativa: ¿la información está suficientemente ordenada para ser explicada?
        </p>

        <div className="mt-8 grid gap-5">
          {guideSections.map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-[#24345F] bg-[#101C3D]/70 p-6">
              <h3 className="font-display text-2xl font-black tracking-[-0.035em] text-[#F2EBD8]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#BFC8D9]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="preguntas" className="mt-12 grid gap-5 lg:grid-cols-2">
        <MarketingCard>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#C9A84C]">Preguntas frecuentes</p>
          <h2 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-[#F2EBD8]">¿LEDGERA calcula el impuesto final?</h2>
          <p className="mt-4 text-sm leading-7 text-[#BFC8D9]">
            La comunicación pública debe ser precisa: LEDGERA ordena activos, revisa obligaciones, estima impactos cuando corresponde y genera respaldo. La validación final debe quedar sujeta a revisión profesional.
          </p>
        </MarketingCard>
        <MarketingCard>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#C9A84C]">Contenido futuro</p>
          <h2 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-[#F2EBD8]">Qué temas debe cubrir el blog</h2>
          <p className="mt-4 text-sm leading-7 text-[#BFC8D9]">
            Declaración de cryptoactivos, conciliación Binance-banco, respaldo documental, diferencias entre patrimonio personal y empresa, preparación para Formulario 22 y criterios para conversar con asesores.
          </p>
        </MarketingCard>
      </section>
    </MarketingPage>
  );
}
