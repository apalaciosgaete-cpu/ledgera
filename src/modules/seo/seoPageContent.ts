// src/modules/seo/seoPageContent.ts

export type SeoPageContent = {
  path: string;
  title: string;
  description: string;
  keyword: string;
  eyebrow: string;
  h1: string;
  intro: string;
  ctaLabel: string;
  ctaHref: string;
  sections: Array<{
    heading: string;
    body: string[];
    bullets?: string[];
  }>;
  related: Array<{
    label: string;
    href: string;
  }>;
};

export const seoPages = {
  impuestosCryptoChile: {
    path: "/impuestos-crypto-chile",
    title: "Impuestos crypto en Chile: ordena tus movimientos antes de declarar",
    description:
      "Organiza movimientos de Binance, revisa importaciones, concilia banco y exchange, y prepara información financiera clara para impuestos crypto en Chile.",
    keyword: "impuestos crypto chile",
    eyebrow: "Impuestos crypto Chile",
    h1: "Impuestos crypto en Chile: primero ordena tus movimientos",
    intro:
      "Antes de pensar en declarar criptomonedas, necesitas entender qué compraste, qué vendiste, qué transferiste y qué movimientos realmente corresponden a crypto. LEDGERA ayuda a ordenar ese historial desde Binance y movimientos bancarios para preparar información clara y trazable.",
    ctaLabel: "Ordenar mis movimientos crypto",
    ctaHref: "/login",
    sections: [
      {
        heading: "El problema no parte en el impuesto, parte en el desorden",
        body: [
          "Muchos usuarios llegan al período tributario con capturas, archivos CSV, movimientos bancarios y registros de Binance que no calzan entre sí.",
          "El problema real es que una transferencia bancaria, un depósito en exchange y una compra de activos pueden quedar separados en distintas fuentes. Sin conciliación, es difícil saber qué ocurrió realmente.",
        ],
        bullets: [
          "Movimientos duplicados entre Spot y Tax.",
          "Transferencias bancarias sin contexto.",
          "Compras y ventas mezcladas con retiros o depósitos.",
          "Dificultad para explicar el origen de cada movimiento.",
        ],
      },
      {
        heading: "Cómo ayuda LEDGERA",
        body: [
          "LEDGERA no manda todo directo al portafolio. Primero lleva cada importación a una bandeja de revisión, donde puedes confirmar, rechazar o buscar coincidencias con movimientos bancarios.",
          "Ese flujo reduce errores y permite construir un portafolio más limpio, con información útil para revisión financiera y tributaria.",
        ],
        bullets: [
          "Sincroniza Binance.",
          "Revisa importaciones antes de confirmarlas.",
          "Concilia movimientos bancarios con operaciones crypto.",
          "Genera una base ordenada para análisis tributario.",
        ],
      },
      {
        heading: "Información tributaria con trazabilidad",
        body: [
          "LEDGERA está pensado para preparar información ordenada. No reemplaza la revisión de un contador ni constituye asesoría tributaria personalizada.",
          "El objetivo es que llegues a esa revisión con datos claros: fechas, montos, activos, movimientos confirmados y relación entre banco y exchange.",
        ],
      },
    ],
    related: [
      {
        label: "Binance e impuestos en Chile",
        href: "/binance-impuestos-chile",
      },
      {
        label: "Cómo declarar criptomonedas en Chile",
        href: "/como-declarar-crypto-en-chile",
      },
      {
        label: "Conciliación Binance y banco",
        href: "/conciliacion-binance-banco",
      },
    ],
  },

  binanceImpuestosChile: {
    path: "/binance-impuestos-chile",
    title: "Binance e impuestos en Chile: por qué necesitas ordenar tus datos",
    description:
      "Binance entrega registros, pero no siempre explica tu historia financiera completa. LEDGERA ayuda a revisar, ordenar y conciliar movimientos Binance en Chile.",
    keyword: "binance impuestos chile",
    eyebrow: "Binance Chile",
    h1: "Binance e impuestos en Chile: los registros no bastan si no están ordenados",
    intro:
      "Binance puede entregar historial de operaciones, depósitos y retiros. Pero para entender tu situación financiera necesitas conectar esos datos con tus movimientos bancarios y confirmar qué eventos realmente corresponden a compras, ventas o transferencias.",
    ctaLabel: "Conectar Binance",
    ctaHref: "/login",
    sections: [
      {
        heading: "El historial de Binance no siempre cuenta toda la historia",
        body: [
          "Un depósito en Binance puede venir desde una transferencia bancaria. Una operación Spot puede estar relacionada con una compra previa. Un retiro puede ser una transferencia interna o una salida hacia otra plataforma.",
          "Si miras cada fuente por separado, puedes terminar con registros duplicados o movimientos sin explicación.",
        ],
        bullets: [
          "Depósitos externos.",
          "Retiros hacia otras cuentas.",
          "Compras y ventas Spot.",
          "Datos Tax y Spot que pueden representar el mismo evento económico.",
        ],
      },
      {
        heading: "LEDGERA usa revisión antes de confirmar",
        body: [
          "El flujo correcto no es importar todo automáticamente. LEDGERA sincroniza, normaliza y deja los movimientos en Importaciones para que puedas confirmar solo lo que corresponde.",
          "Esto evita contaminar el portafolio con duplicados y permite construir una base más confiable para análisis financiero y tributario.",
        ],
      },
      {
        heading: "Binance + banco en un mismo flujo",
        body: [
          "La diferencia clave es que LEDGERA no analiza Binance aislado. También permite importar cartolas bancarias y buscar coincidencias entre banco y exchange.",
          "Ese cruce es especialmente importante para usuarios que financiaron compras crypto mediante transferencias desde cuentas bancarias chilenas.",
        ],
      },
    ],
    related: [
      {
        label: "Impuestos crypto en Chile",
        href: "/impuestos-crypto-chile",
      },
      {
        label: "Conciliar Binance con banco",
        href: "/conciliacion-binance-banco",
      },
      {
        label: "Contador crypto en Chile",
        href: "/contador-crypto-chile",
      },
    ],
  },

  declararCryptoChile: {
    path: "/como-declarar-crypto-en-chile",
    title: "Cómo declarar criptomonedas en Chile: empieza por ordenar tu historial",
    description:
      "Guía práctica para preparar información crypto antes de declarar: movimientos, Binance, banco, portafolio y trazabilidad.",
    keyword: "declarar criptomonedas chile",
    eyebrow: "Guía práctica",
    h1: "Cómo declarar criptomonedas en Chile: primero prepara información confiable",
    intro:
      "Declarar criptomonedas no parte llenando formularios. Parte entendiendo tu historial: compras, ventas, depósitos, retiros, transferencias bancarias y movimientos confirmados.",
    ctaLabel: "Preparar mi historial crypto",
    ctaHref: "/login",
    sections: [
      {
        heading: "Paso 1: reúne tus fuentes",
        body: [
          "El primer paso es tener las fuentes que explican tu actividad: exchange, banco y registros manuales si corresponde.",
          "Para muchos usuarios, Binance y la cartola bancaria son las dos piezas principales del rompecabezas.",
        ],
        bullets: [
          "Historial Binance.",
          "Movimientos bancarios.",
          "Compras y ventas.",
          "Depósitos y retiros.",
          "Comisiones y fechas.",
        ],
      },
      {
        heading: "Paso 2: evita duplicados",
        body: [
          "Un mismo evento puede aparecer en más de una fuente. Por ejemplo, información Spot y Tax puede describir el mismo movimiento.",
          "LEDGERA usa una bandeja de importaciones para revisar antes de confirmar, reduciendo el riesgo de duplicar movimientos.",
        ],
      },
      {
        heading: "Paso 3: confirma solo lo que corresponde",
        body: [
          "Una vez revisadas las importaciones, los movimientos confirmados pasan al portafolio. Desde ahí se puede construir una base más limpia para revisar resultados y preparar información tributaria.",
          "Este enfoque permite separar ruido, movimientos bancarios normales y eventos crypto relevantes.",
        ],
      },
    ],
    related: [
      {
        label: "Impuestos crypto en Chile",
        href: "/impuestos-crypto-chile",
      },
      {
        label: "Binance impuestos Chile",
        href: "/binance-impuestos-chile",
      },
      {
        label: "Conciliación banco y Binance",
        href: "/conciliacion-binance-banco",
      },
    ],
  },

  conciliacionBinanceBanco: {
    path: "/conciliacion-binance-banco",
    title: "Conciliación Binance y banco: conecta transferencias con movimientos crypto",
    description:
      "Concilia movimientos bancarios con operaciones Binance para entender qué transferencias corresponden a compras, ventas, depósitos o retiros crypto.",
    keyword: "conciliación binance banco",
    eyebrow: "Conciliación crypto",
    h1: "Conciliación Binance y banco: entiende qué pasó con tu dinero",
    intro:
      "Para muchos usuarios, el problema no es solo Binance. El problema es conectar una transferencia bancaria con el movimiento crypto correspondiente. LEDGERA ordena ambos lados para ayudarte a encontrar coincidencias revisables.",
    ctaLabel: "Conciliar banco y Binance",
    ctaHref: "/login",
    sections: [
      {
        heading: "El banco muestra dinero, Binance muestra crypto",
        body: [
          "Una cartola bancaria puede mostrar transferencias, cargos o abonos. Binance puede mostrar depósitos, compras o retiros. Si esos mundos no se conectan, la trazabilidad queda incompleta.",
          "La conciliación permite revisar si una salida bancaria tiene relación con una compra crypto o si un ingreso puede venir desde un retiro o venta.",
        ],
      },
      {
        heading: "Buscar match antes de confirmar",
        body: [
          "LEDGERA permite buscar coincidencias entre movimientos bancarios y movimientos de portafolio ya confirmados.",
          "El sistema propone candidatos, pero el usuario conserva el control: confirma, ignora o deja en revisión.",
        ],
        bullets: [
          "Comparación por fecha.",
          "Comparación por monto estimado.",
          "Candidatos con explicación.",
          "Revisión humana antes de marcar conciliado.",
        ],
      },
      {
        heading: "Por qué esto importa para impuestos",
        body: [
          "La conciliación no solo ordena el portafolio. También ayuda a explicar el flujo financiero: desde dónde salió el dinero, cuándo llegó al exchange y qué operación se relaciona con ese movimiento.",
          "Ese contexto es clave para preparar información clara antes de revisar obligaciones tributarias.",
        ],
      },
    ],
    related: [
      {
        label: "Binance impuestos Chile",
        href: "/binance-impuestos-chile",
      },
      {
        label: "Cómo declarar crypto en Chile",
        href: "/como-declarar-crypto-en-chile",
      },
      {
        label: "Impuestos crypto Chile",
        href: "/impuestos-crypto-chile",
      },
    ],
  },

  contadorCryptoChile: {
    path: "/contador-crypto-chile",
    title: "Contador crypto en Chile: entrega información ordenada y trazable",
    description:
      "Prepara información clara para tu contador: movimientos Binance, banco, portafolio confirmado y trazabilidad crypto.",
    keyword: "contador crypto chile",
    eyebrow: "Para usuarios y contadores",
    h1: "Contador crypto en Chile: no llegues con archivos desordenados",
    intro:
      "Muchos contadores reciben historiales incompletos, Excel mezclados y movimientos difíciles de explicar. LEDGERA ayuda a transformar importaciones crypto y bancarias en información más clara para revisión profesional.",
    ctaLabel: "Ordenar información para mi contador",
    ctaHref: "/login",
    sections: [
      {
        heading: "El contador necesita trazabilidad, no solo archivos",
        body: [
          "Un archivo CSV aislado no siempre permite entender qué ocurrió. Para revisar actividad crypto, importa saber qué movimientos fueron confirmados, qué se descartó y cómo se relaciona el banco con el exchange.",
          "LEDGERA organiza esa información antes de que llegue a una revisión contable o tributaria.",
        ],
      },
      {
        heading: "Qué puede preparar LEDGERA",
        body: [
          "El foco no está en reemplazar el criterio profesional. El foco está en entregar una base más limpia y verificable.",
        ],
        bullets: [
          "Movimientos confirmados.",
          "Importaciones rechazadas o ignoradas.",
          "Relación banco ↔ exchange.",
          "Portafolio limpio.",
          "Base de eventos tributarios.",
        ],
      },
      {
        heading: "Menos tiempo limpiando, más tiempo revisando",
        body: [
          "Cuando la información llega ordenada, el contador puede concentrarse en revisar criterios, riesgos y tratamientos aplicables.",
          "Eso reduce fricción para usuarios crypto y mejora la calidad de la conversación tributaria.",
        ],
      },
    ],
    related: [
      {
        label: "Impuestos crypto Chile",
        href: "/impuestos-crypto-chile",
      },
      {
        label: "Cómo declarar criptomonedas",
        href: "/como-declarar-crypto-en-chile",
      },
      {
        label: "Conciliación banco y Binance",
        href: "/conciliacion-binance-banco",
      },
    ],
  },
} satisfies Record<string, SeoPageContent>;

export const seoPageList = Object.values(seoPages);
