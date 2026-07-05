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

const commonSections = [
  {
    heading: "De datos dispersos a respaldo revisable",
    body: [
      "LEDGERA ordena operaciones cripto desde exchanges, banco y registros manuales antes de llevarlas al portafolio.",
      "El objetivo es construir una base clara para revisar activos digitales, obligaciones tributarias y documentación de respaldo.",
    ],
    bullets: [
      "Importaciones revisables antes de confirmar.",
      "Conciliación banco-exchange.",
      "Trazabilidad por activo y operación.",
      "Exportación de respaldo en PDF y Excel.",
    ],
  },
  {
    heading: "Revisión antes de declarar",
    body: [
      "La plataforma no reemplaza asesoría profesional. Entrega información ordenada para que el usuario, contador o equipo pueda revisar con mejor evidencia.",
      "La diferencia clave es partir desde operaciones confirmadas, no desde saldos sueltos ni planillas manuales.",
    ],
  },
];

const relatedBase = [
  { label: "Tributación cripto Chile", href: "/impuestos-crypto-chile" },
  { label: "Declarar operaciones cripto", href: "/como-declarar-crypto-en-chile" },
  { label: "Conciliación banco-exchange", href: "/conciliacion-binance-banco" },
];

export const seoPages = {
  impuestosCryptoChile: {
    path: "/impuestos-crypto-chile",
    title: "Tributación cripto en Chile: ordena operaciones antes de declarar",
    description: "Organiza operaciones cripto desde exchanges, banco y registros manuales para generar respaldo tributario trazable en Chile.",
    keyword: "tributación cripto chile",
    eyebrow: "Tributación cripto Chile",
    h1: "Tributación cripto en Chile: primero ordena tus operaciones",
    intro: "Antes de revisar una declaración, necesitas entender compras, ventas, depósitos, retiros y operaciones con activos digitales. LEDGERA ayuda a convertir ese historial en respaldo tributario trazable.",
    ctaLabel: "Comenzar análisis",
    ctaHref: "/register",
    sections: commonSections,
    related: relatedBase,
  },
  binanceImpuestosChile: {
    path: "/binance-impuestos-chile",
    title: "Operaciones de exchange en Chile: convierte registros en respaldo",
    description: "Los exchanges entregan registros, pero no siempre explican tu historia financiera completa. LEDGERA ayuda a revisar, ordenar y conciliar operaciones cripto.",
    keyword: "operaciones exchange chile",
    eyebrow: "Exchanges y respaldo",
    h1: "Tus exchanges entregan registros; LEDGERA los convierte en respaldo",
    intro: "Un exchange puede entregar historial de operaciones, depósitos y retiros. LEDGERA conecta esos datos con banco, portafolio y documentación para que puedas revisar con trazabilidad.",
    ctaLabel: "Comenzar análisis",
    ctaHref: "/register",
    sections: commonSections,
    related: relatedBase,
  },
  declararCryptoChile: {
    path: "/como-declarar-crypto-en-chile",
    title: "Cómo declarar operaciones cripto en Chile: empieza por ordenar tu historial",
    description: "Guía práctica para preparar información tributaria antes de declarar: operaciones cripto, exchanges, banco, portafolio y trazabilidad.",
    keyword: "declarar operaciones cripto chile",
    eyebrow: "Guía práctica",
    h1: "Cómo declarar operaciones cripto en Chile: primero prepara información confiable",
    intro: "Declarar operaciones cripto no parte llenando formularios. Parte entendiendo compras, ventas, depósitos, retiros, transferencias bancarias y movimientos confirmados.",
    ctaLabel: "Comenzar análisis",
    ctaHref: "/register",
    sections: commonSections,
    related: relatedBase,
  },
  conciliacionBinanceBanco: {
    path: "/conciliacion-binance-banco",
    title: "Conciliación banco y exchange: conecta transferencias con operaciones cripto",
    description: "Concilia movimientos bancarios con operaciones de exchange para entender compras, ventas, depósitos, retiros y respaldo tributario.",
    keyword: "conciliación banco exchange cripto",
    eyebrow: "Conciliación cripto",
    h1: "Conciliación banco y exchange: entiende qué pasó con tu dinero",
    intro: "El banco muestra dinero y el exchange muestra operaciones. LEDGERA ordena ambos lados para ayudarte a encontrar coincidencias revisables.",
    ctaLabel: "Comenzar análisis",
    ctaHref: "/register",
    sections: commonSections,
    related: relatedBase,
  },
  contadorCryptoChile: {
    path: "/contador-crypto-chile",
    title: "Contador para activos digitales: entrega información ordenada y trazable",
    description: "Prepara información clara para tu contador: operaciones cripto, banco, portafolio confirmado y respaldo tributario trazable.",
    keyword: "contador activos digitales chile",
    eyebrow: "Para usuarios y contadores",
    h1: "Contador para activos digitales: no llegues con archivos desordenados",
    intro: "LEDGERA ayuda a transformar importaciones cripto y bancarias en información clara para revisión profesional, con trazabilidad por activo y operación.",
    ctaLabel: "Comenzar análisis",
    ctaHref: "/register",
    sections: commonSections,
    related: relatedBase,
  },
} satisfies Record<string, SeoPageContent>;

export const seoPageList = Object.values(seoPages);
