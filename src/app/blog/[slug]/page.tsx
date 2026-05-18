import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

/* ─── Contenido de artículos ─────────────────────────────────────────────── */

type Section = { type: "h2" | "p" | "ul" | "ol" | "callout" | "step"; content: string | string[] };

type Article = {
  slug: string;
  title: string;
  summary: string;
  tag: string;
  tagColor: string;
  readTime: string;
  date: string;
  sections: Section[];
};

const ARTICLES: Article[] = [
  {
    slug: "como-declarar-criptomonedas-sii-chile",
    title: "Cómo declarar criptomonedas al SII en Chile: guía completa 2025",
    summary:
      "Paso a paso para determinar tu ganancia de capital, aplicar el método FIFO y completar correctamente el Formulario 22 de acuerdo a la normativa vigente.",
    tag: "Declaración",
    tagColor: "#16A34A",
    readTime: "8 min",
    date: "12 de mayo, 2025",
    sections: [
      {
        type: "p",
        content:
          "Desde 2022, el SII ha confirmado que las ganancias por venta de criptomonedas constituyen renta y deben declararse anualmente. Si operaste con Bitcoin, Ether, USDT u otra criptomoneda durante el año, estás obligado a reportarlo.",
      },
      {
        type: "h2",
        content: "¿Qué evento tributario debo declarar?",
      },
      {
        type: "p",
        content:
          'El hecho gravado ocurre cuando vendes o intercambias criptomonedas. En Ledgera, cada vez que registras una venta el motor calcula automáticamente el "mayor valor" según el costo base de adquisición en pesos chilenos.',
      },
      {
        type: "ul",
        content: [
          "Comprar cripto con CLP o USD → no tributa",
          "Vender cripto a CLP → tributa por el mayor valor",
          "Intercambiar una cripto por otra (swap) → tributa por el valor en CLP al momento del intercambio",
          "Recibir cripto como pago → tributa como ingreso",
        ],
      },
      {
        type: "h2",
        content: "Paso 1: registra todos tus movimientos en Ledgera",
      },
      {
        type: "p",
        content:
          "Entra a tu portafolio en Ledgera y agrega cada operación: fecha, tipo (compra o venta), cantidad, precio en CLP o USD, y exchange. Si tienes un historial en CSV desde Binance, Buda u Orionx, puedes importarlo directamente desde el botón «Importar CSV».",
      },
      {
        type: "h2",
        content: "Paso 2: revisa el resumen tributario",
      },
      {
        type: "p",
        content:
          "Navega a la sección «Tributario» en el menú lateral. Ahí encontrarás el resumen anual con el total de ganancia realizada, el desglose por activo y el tipo de cambio BCCh aplicado a cada operación. Ledgera usa el dólar observado publicado diariamente por el Banco Central de Chile.",
      },
      {
        type: "h2",
        content: "Paso 3: genera tu declaración jurada (DDJJ)",
      },
      {
        type: "p",
        content:
          'En la sección «Declaraciones» puedes generar tu DDJJ tributaria. Ledgera produce dos tipos de reporte: el estricto (solo ventas realizadas) y el informativo (incluye posición actual). Descarga el PDF o CSV desde el botón «↓» en cada declaración.',
      },
      {
        type: "callout",
        content:
          "El reporte de Ledgera incluye un código único y hash de integridad que puedes compartir con tu contador o presentar ante el SII como respaldo verificable.",
      },
      {
        type: "h2",
        content: "Paso 4: completa el Formulario 22",
      },
      {
        type: "p",
        content:
          "Las personas naturales declaran el mayor valor como «Otras rentas» en la línea correspondiente del Formulario 22. El monto que debes ingresar es el total de ganancia realizada en CLP que muestra tu DDJJ de Ledgera. Si tuviste pérdidas, también puedes declararlas para compensar con otras rentas.",
      },
      {
        type: "h2",
        content: "Plazos para declarar",
      },
      {
        type: "ul",
        content: [
          "Personas naturales: hasta el 30 de abril de cada año (declaración de renta)",
          "Empresas primera categoría: según calendario SII (abril–mayo)",
          "Cierre del período en Ledgera: recomendamos cerrar el período tributario en diciembre para generar el snapshot de auditoría",
        ],
      },
    ],
  },
  {
    slug: "metodo-fifo-criptomonedas-chile",
    title: "El método FIFO y las criptomonedas: por qué el orden importa en tu declaración",
    summary:
      "El SII exige calcular el mayor valor usando el costo de adquisición cronológico. Un error en el orden de tus ventas puede significar pagar de más o de menos.",
    tag: "Motor FIFO",
    tagColor: "#7C3AED",
    readTime: "6 min",
    date: "28 de abril, 2025",
    sections: [
      {
        type: "p",
        content:
          "FIFO significa «First In, First Out» (primero en entrar, primero en salir). Es el criterio contable que determina qué unidades de una criptomoneda se consideran vendidas cuando realizas una operación de salida.",
      },
      {
        type: "h2",
        content: "¿Por qué importa el método?",
      },
      {
        type: "p",
        content:
          "Imagina que compraste 0.5 BTC en enero a $15.000.000 y otros 0.5 BTC en octubre a $40.000.000. Si en diciembre vendes 0.5 BTC, ¿cuál es tu costo base: $15M u $40M? La respuesta cambia radicalmente tu impuesto a pagar.",
      },
      {
        type: "ul",
        content: [
          "Con FIFO: vendes los de enero → costo base $15M → ganancia $X",
          "Con LIFO (no permitido en Chile): vendes los de octubre → costo base $40M → ganancia mucho menor",
          "El SII exige FIFO por su criterio de «mayor valor» cronológico",
        ],
      },
      {
        type: "h2",
        content: "Cómo funciona el motor FIFO de Ledgera",
      },
      {
        type: "p",
        content:
          "Cuando registras una venta en Ledgera, el motor procesa automáticamente tu historial de compras ordenado cronológicamente. Descuenta las unidades más antiguas primero, calcula el costo base real en CLP usando el tipo de cambio BCCh de la fecha de compra y determina la ganancia neta.",
      },
      {
        type: "step",
        content: [
          "Registras una compra: 1 ETH el 10 de enero a USD 2.000 (TCO BCCh: $850 → costo CLP $1.700.000)",
          "Registras otra compra: 1 ETH el 15 de marzo a USD 3.000 (TCO BCCh: $870 → costo CLP $2.610.000)",
          "Registras una venta: 1 ETH el 20 de noviembre a USD 4.000 (TCO BCCh: $900 → precio CLP $3.600.000)",
          "Ledgera calcula: ganancia = $3.600.000 − $1.700.000 = $1.900.000 (usa el ETH de enero, el más antiguo)",
        ],
      },
      {
        type: "h2",
        content: "Lotes parciales y múltiples compras",
      },
      {
        type: "p",
        content:
          "El motor de Ledgera maneja lotes fraccionados. Si vendes 0.3 ETH y tu lote más antiguo tiene 0.5 ETH, consume 0.3 ETH de ese lote y deja 0.2 ETH con su costo original para futuras ventas. Esto se refleja con precisión en tu reporte tributario.",
      },
      {
        type: "callout",
        content:
          "Ledgera mantiene un registro inmutable de cada lote y su costo base. Puedes revisar el detalle FIFO de cualquier venta en la sección «Tributario → Detalle de eventos».",
      },
      {
        type: "h2",
        content: "Auditoría del motor",
      },
      {
        type: "p",
        content:
          "Todos los cálculos FIFO de Ledgera son auditables. Desde la sección «Auditoría» puedes descargar la trazabilidad completa en PDF (con QR de verificación) o CSV. Cada reporte incluye un hash SHA-256 que garantiza que los datos no han sido modificados.",
      },
    ],
  },
  {
    slug: "fiscalizacion-sii-criptomonedas",
    title: "¿Qué pasa si el SII me fiscaliza por mis operaciones cripto?",
    summary:
      "El SII puede cruzar información de exchanges con tus declaraciones. Conoce qué documentación pedir, cómo responder y por qué la trazabilidad auditada es tu mejor defensa.",
    tag: "Fiscalización",
    tagColor: "#F59E0B",
    readTime: "7 min",
    date: "15 de abril, 2025",
    sections: [
      {
        type: "p",
        content:
          "La fiscalización del SII en materia de criptomonedas es creciente. El servicio tiene acceso a información de exchanges que operan en Chile y puede cruzar depósitos bancarios en CLP con movimientos no declarados.",
      },
      {
        type: "h2",
        content: "Señales de alerta para el SII",
      },
      {
        type: "ul",
        content: [
          "Depósitos bancarios en CLP que no correlacionan con rentas declaradas",
          "Operaciones en exchanges domiciliados en Chile reportadas al SII",
          "Diferencias entre el Formulario 22 y registros de terceros",
          "Cuentas con movimientos de alto volumen sin justificación tributaria",
        ],
      },
      {
        type: "h2",
        content: "¿Qué documentación piden?",
      },
      {
        type: "p",
        content:
          "En una fiscalización, el SII puede solicitar el historial completo de operaciones, la metodología de cálculo del costo base, los respaldos de tipo de cambio aplicados y evidencia de que los montos declarados son correctos.",
      },
      {
        type: "h2",
        content: "Cómo te protege Ledgera ante una fiscalización",
      },
      {
        type: "p",
        content:
          "Ledgera genera reportes verificables con código único y hash de integridad SHA-256. Cada reporte queda registrado en nuestra base de datos y el SII o tu contador puede verificar su autenticidad en ledgera.cl/verify/report/[código].",
      },
      {
        type: "step",
        content: [
          "Cierra tu período tributario en Ledgera al final del año desde «Auditoría → Cerrar período»",
          "Descarga el PDF de trazabilidad de auditoría (incluye QR de verificación)",
          "Descarga tu DDJJ en PDF con el código único del reporte",
          "Guarda ambos documentos y entrégalos a tu contador como respaldo",
        ],
      },
      {
        type: "callout",
        content:
          "El snapshot de cierre de período en Ledgera es inmutable. Una vez cerrado, el sistema genera un hash del estado del portafolio que no puede modificarse retroactivamente. Esto es exactamente lo que el SII necesita ver.",
      },
      {
        type: "h2",
        content: "Declaración rectificatoria",
      },
      {
        type: "p",
        content:
          "Si detectas un error en períodos anteriores, puedes reabrir el período en Ledgera (dejando registro del motivo en el historial de auditoría), corregir los movimientos y generar una nueva declaración rectificatoria para el SII.",
      },
    ],
  },
  {
    slug: "tipo-cambio-bcch-criptomonedas",
    title: "Tipo de cambio oficial BCCh para valorizar criptomonedas: todo lo que debes saber",
    summary:
      "Para convertir tus operaciones en USD a CLP debes usar el tipo de cambio oficial del Banco Central de Chile. Aprende cuándo y cómo se aplica en tu declaración.",
    tag: "Normativa",
    tagColor: "#0EA5E9",
    readTime: "5 min",
    date: "5 de abril, 2025",
    sections: [
      {
        type: "p",
        content:
          "El Banco Central de Chile publica diariamente el «dólar observado» (también llamado TCO). Este es el tipo de cambio oficial que el SII exige usar para convertir operaciones en USD a pesos chilenos.",
      },
      {
        type: "h2",
        content: "¿Qué tipo de cambio usar y cuándo?",
      },
      {
        type: "ul",
        content: [
          "Fecha de compra: usar el TCO del día de la compra para calcular el costo base en CLP",
          "Fecha de venta: usar el TCO del día de la venta para calcular el precio de venta en CLP",
          "La ganancia = precio venta CLP − costo base CLP",
          "NO se debe usar el tipo de cambio del día de la declaración",
        ],
      },
      {
        type: "h2",
        content: "¿Ledgera aplica el TCO automáticamente?",
      },
      {
        type: "p",
        content:
          "Sí. Cuando registras un movimiento en USD, Ledgera consulta automáticamente el TCO del Banco Central para esa fecha y convierte el monto a CLP. El tipo de cambio aplicado queda registrado en el detalle de cada operación y aparece en tu reporte tributario.",
      },
      {
        type: "callout",
        content:
          "Si registras una operación con fecha de fin de semana o feriado, Ledgera usa el TCO del día hábil anterior, que es la práctica aceptada por el SII.",
      },
      {
        type: "h2",
        content: "¿Y si la operación fue en otra moneda (EUR, USDT)?",
      },
      {
        type: "p",
        content:
          "Para monedas distintas al USD, el criterio correcto es convertir primero a USD al tipo de cambio de mercado del día y luego aplicar el TCO BCCh. Ledgera admite registrar el monto directamente en CLP si ya tienes el valor convertido, o en USD para la conversión automática.",
      },
      {
        type: "h2",
        content: "Impacto del tipo de cambio en tu impuesto",
      },
      {
        type: "p",
        content:
          "La variación cambiaria puede aumentar o reducir tu ganancia tributaria aunque el precio del activo en USD haya sido el mismo. Por ejemplo: si el BTC no se movió en USD pero el peso chileno se depreció, tu ganancia en CLP es mayor aunque en USD no hayas ganado nada.",
      },
    ],
  },
  {
    slug: "diferencia-persona-natural-empresa-cripto",
    title: "Persona natural vs. empresa: cómo tributan distinto las criptomonedas en Chile",
    summary:
      "Las personas naturales declaran mayor valor como renta ocasional; las empresas bajo primera categoría. La distinción cambia el monto, el formulario y los plazos.",
    tag: "Normativa",
    tagColor: "#0EA5E9",
    readTime: "6 min",
    date: "20 de marzo, 2025",
    sections: [
      {
        type: "p",
        content:
          "En Chile, el tratamiento tributario de las criptomonedas depende de si eres persona natural o empresa. La diferencia es importante: cambia la tasa, el formulario y la forma en que Ledgera genera tu reporte.",
      },
      {
        type: "h2",
        content: "Persona natural: mayor valor esporádico",
      },
      {
        type: "p",
        content:
          "Si inviertes como persona natural, las ganancias por venta de cripto se clasifican como «mayor valor en la enajenación de bienes». Tributan en el Global Complementario o con el impuesto único del 10% si el bien tiene más de un año.",
      },
      {
        type: "ul",
        content: [
          "Formulario: F22 (declaración anual de renta)",
          "Plazo: hasta el 30 de abril",
          "Tasa: global complementario (progresivo) o 10% único si cumple requisitos de permanencia",
          "En Ledgera: usar el reporte «Estricto» que muestra solo ventas realizadas",
        ],
      },
      {
        type: "h2",
        content: "Empresa: primera categoría",
      },
      {
        type: "p",
        content:
          "Si operas a través de una empresa (SpA, SRL, SA), las ganancias cripto son parte de los resultados del negocio y tributan bajo el régimen de primera categoría al 27%.",
      },
      {
        type: "ul",
        content: [
          "Formulario: F22 empresa + declaraciones mensuales PPM",
          "Plazo: según calendar SII (abril–mayo para declaración anual)",
          "Tasa: 27% primera categoría",
          "En Ledgera: el plan Empresa incluye configuración de régimen tributario",
        ],
      },
      {
        type: "callout",
        content:
          "Ledgera genera dos tipos de reporte: Estricto (ventas realizadas, para personas naturales y empresas) e Informativo (incluye valorización actual del portafolio, útil para contadores).",
      },
      {
        type: "h2",
        content: "Contador: gestión de múltiples perfiles",
      },
      {
        type: "p",
        content:
          "Si eres contador y gestionas clientes con distintos perfiles (algunos como persona natural, otros como empresa), el plan Contador de Ledgera te permite administrar hasta 5 clientes desde una sola cuenta. Cada cliente tiene su portafolio separado, su propio historial de auditoría y sus propios reportes verificables.",
      },
    ],
  },
  {
    slug: "como-importar-historial-binance-buda",
    title: "Cómo importar tu historial de Binance, Buda u Orionx a Ledgera",
    summary:
      "Descarga tu CSV de operaciones desde los principales exchanges chilenos y conviértelo en un portafolio tributario completo en menos de 5 minutos.",
    tag: "Tutorial",
    tagColor: "#16A34A",
    readTime: "4 min",
    date: "10 de marzo, 2025",
    sections: [
      {
        type: "p",
        content:
          "Si llevas tiempo operando en exchanges, ingresar cada movimiento manualmente es impráctico. Ledgera permite importar tu historial completo desde un archivo CSV y clasifica cada operación automáticamente.",
      },
      {
        type: "h2",
        content: "Cómo descargar tu historial desde Binance",
      },
      {
        type: "step",
        content: [
          "Ingresa a Binance → Billetera → Órdenes → Historial de órdenes",
          "Selecciona el rango de fechas que necesitas (máximo 3 meses por descarga)",
          "Haz clic en «Exportar historial completo» y elige formato CSV",
          "Espera el correo de Binance con el enlace de descarga",
        ],
      },
      {
        type: "h2",
        content: "Cómo descargar desde Buda.com",
      },
      {
        type: "step",
        content: [
          "Ingresa a Buda → Mi cuenta → Movimientos",
          "Selecciona el activo y el período",
          "Haz clic en «Exportar» → CSV",
          "El archivo incluye fecha, tipo, cantidad y precio en CLP",
        ],
      },
      {
        type: "h2",
        content: "Importar en Ledgera",
      },
      {
        type: "step",
        content: [
          "Ve a «Portafolio» en el menú lateral de Ledgera",
          "Haz clic en el botón «Importar CSV»",
          "Selecciona el exchange de origen (Binance, Buda u Orionx)",
          "Sube el archivo CSV descargado",
          "Ledgera procesa y mapea automáticamente cada columna",
          "Revisa la vista previa y confirma la importación",
        ],
      },
      {
        type: "callout",
        content:
          "Si tienes operaciones duplicadas entre importaciones, Ledgera las detecta por fecha + cantidad + exchange y no las duplica. Siempre revisa el resumen de importación antes de confirmar.",
      },
      {
        type: "h2",
        content: "Después de importar",
      },
      {
        type: "p",
        content:
          "Una vez importado el historial, ve a «Tributario» para ver el resumen anual generado por el motor FIFO. Todos los tipos de cambio BCCh se aplican automáticamente. Si el historial cubre más de un año tributario, Ledgera los separa por período para que puedas generar cada declaración de forma independiente.",
      },
    ],
  },
];

function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Artículo no encontrado · Ledgera" };
  return {
    title: `${article.title} · Ledgera`,
    description: article.summary,
  };
}

/* ─── Componente ─────────────────────────────────────────────────────────── */

const sectionBg = "#0A1F2E";
const darkBg = "#071520";

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <main
      style={{
        fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
        background: sectionBg,
        color: "#F1F5F9",
        minHeight: "100vh",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(10,31,46,0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 2.5rem",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/bienvenida" style={{ textDecoration: "none" }}>
            <Logo variant="light" size="lg" showSubtitle />
          </Link>
          <Link
            href="/blog"
            style={{
              fontSize: "14px",
              color: "#64748B",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M13 8H3M7 4L3 8l4 4"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Blog
          </Link>
        </div>
        <Link
          href="/register"
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#ffffff",
            textDecoration: "none",
            padding: "8px 18px",
            borderRadius: "8px",
            background: "#16A34A",
          }}
        >
          Comenzar gratis
        </Link>
      </nav>

      {/* Article header */}
      <section
        style={{
          background: darkBg,
          padding: "5rem 2rem 4rem",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: article.tagColor,
                background: `${article.tagColor}18`,
                border: `1px solid ${article.tagColor}30`,
                borderRadius: "100px",
                padding: "4px 14px",
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
              }}
            >
              {article.tag}
            </span>
            <span style={{ fontSize: "13px", color: "#475569" }}>
              {article.readTime} de lectura · {article.date}
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              color: "#F1F5F9",
              letterSpacing: "-0.03em",
              margin: "0 0 1.25rem",
              lineHeight: 1.2,
            }}
          >
            {article.title}
          </h1>
          <p
            style={{
              fontSize: "17px",
              color: "#94A3B8",
              margin: 0,
              lineHeight: 1.65,
              maxWidth: "640px",
            }}
          >
            {article.summary}
          </p>
        </div>
      </section>

      {/* Article body */}
      <article style={{ padding: "4rem 2rem 6rem", maxWidth: "760px", margin: "0 auto" }}>
        {article.sections.map((section, i) => {
          if (section.type === "h2") {
            return (
              <h2
                key={i}
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                  fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
                  fontWeight: 700,
                  color: "#F1F5F9",
                  margin: "2.5rem 0 1rem",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                }}
              >
                {section.content as string}
              </h2>
            );
          }
          if (section.type === "p") {
            return (
              <p
                key={i}
                style={{
                  fontSize: "16px",
                  color: "#CBD5E1",
                  margin: "0 0 1.25rem",
                  lineHeight: 1.75,
                }}
              >
                {section.content as string}
              </p>
            );
          }
          if (section.type === "ul") {
            return (
              <ul
                key={i}
                style={{
                  margin: "0 0 1.5rem",
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {(section.content as string[]).map((item, j) => (
                  <li
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "15px",
                      color: "#94A3B8",
                      lineHeight: 1.6,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      style={{ flexShrink: 0, marginTop: "3px" }}
                    >
                      <circle cx="8" cy="8" r="7" stroke="#16A34A" strokeWidth="1.2" />
                      <path
                        d="M5 8l2 2 4-4"
                        stroke="#16A34A"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          if (section.type === "ol" || section.type === "step") {
            return (
              <ol
                key={i}
                style={{
                  margin: "0 0 1.5rem",
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {(section.content as string[]).map((item, j) => (
                  <li
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px",
                      fontSize: "15px",
                      color: "#94A3B8",
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: "rgba(22,163,74,0.12)",
                        border: "1px solid rgba(22,163,74,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#4ADE80",
                        marginTop: "1px",
                      }}
                    >
                      {j + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            );
          }
          if (section.type === "callout") {
            return (
              <div
                key={i}
                style={{
                  margin: "1.5rem 0",
                  padding: "1.25rem 1.5rem",
                  background: "rgba(22,163,74,0.07)",
                  border: "1px solid rgba(22,163,74,0.22)",
                  borderRadius: "12px",
                  borderLeft: "3px solid #16A34A",
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    color: "#86EFAC",
                    margin: 0,
                    lineHeight: 1.65,
                  }}
                >
                  {section.content as string}
                </p>
              </div>
            );
          }
          return null;
        })}

        {/* CTA inline */}
        <div
          style={{
            marginTop: "4rem",
            padding: "2rem",
            background: "rgba(22,163,74,0.06)",
            border: "1px solid rgba(22,163,74,0.18)",
            borderRadius: "16px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#F1F5F9",
              margin: "0 0 0.5rem",
            }}
          >
            ¿Listo para ordenar tus cripto?
          </p>
          <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 1.25rem" }}>
            Crea tu cuenta gratis y empieza hoy — sin tarjeta de crédito.
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 24px",
              borderRadius: "9px",
              background: "#16A34A",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Comenzar gratis
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer
        style={{
          background: "#040C13",
          padding: "2rem 2.5rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "12px", color: "#334155" }}>
          © {new Date().getFullYear()} Ledgera · Chile
        </span>
      </footer>
    </main>
  );
}
