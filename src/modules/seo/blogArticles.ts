// src/modules/seo/blogArticles.ts

export type BlogSection = {
  type: "h2" | "p" | "ul" | "ol" | "callout" | "step";
  content: string | string[];
};

export type BlogArticle = {
  slug: string;
  title: string;
  summary: string;
  tag: string;
  tagColor: string;
  readTime: string;
  publishedLabel: string;
  publishedAt: string;
  updatedAt: string;
  sections: BlogSection[];
  related: Array<{
    label: string;
    href: string;
  }>;
};

const baseSections: BlogSection[] = [
  {
    type: "p",
    content:
      "Ordenar operaciones cripto no parte en una planilla vacía. Parte por reunir datos de exchanges, banco, wallets y documentos de respaldo para convertirlos en información revisable.",
  },
  {
    type: "h2",
    content: "Qué información conviene reunir",
  },
  {
    type: "ul",
    content: [
      "Historial de operaciones desde exchanges.",
      "Cartolas bancarias relacionadas con compras, ventas, depósitos o retiros.",
      "Fechas, montos, activos digitales, precios y comisiones.",
      "Transferencias entre wallets o cuentas propias.",
      "Criterio usado para calcular costo, resultado y respaldo.",
    ],
  },
  {
    type: "h2",
    content: "Por qué no basta con un CSV",
  },
  {
    type: "p",
    content:
      "Un archivo CSV puede contener operaciones, pero no siempre explica la historia completa. Un depósito en exchange puede venir desde un banco, una venta puede generar un retiro y una transferencia interna puede no representar una venta real.",
  },
  {
    type: "h2",
    content: "Cómo ayuda LEDGERA",
  },
  {
    type: "p",
    content:
      "LEDGERA permite revisar importaciones antes de confirmarlas, construir un portafolio limpio y preparar respaldo tributario trazable en PDF y Excel. El objetivo es facilitar la revisión, no reemplazar el criterio profesional.",
  },
  {
    type: "callout",
    content:
      "La obligación tributaria concreta depende del caso, del período y del criterio profesional aplicable. Valida siempre tu situación con un contador o asesor tributario.",
  },
];

const baseRelated = [
  { label: "Tributación cripto en Chile", href: "/impuestos-crypto-chile" },
  { label: "Declarar operaciones cripto", href: "/como-declarar-crypto-en-chile" },
  { label: "Conciliación banco-exchange", href: "/conciliacion-binance-banco" },
];

export const blogArticles: BlogArticle[] = [
  {
    slug: "guia-impuestos-criptomonedas-chile",
    title: "Guía de tributación cripto en Chile: qué revisar y cómo ordenar operaciones",
    summary:
      "Guía para entender qué revisar antes de declarar operaciones cripto en Chile: ventas, swaps, staking, airdrops, FIFO, banco, exchange y respaldos.",
    tag: "Guía completa",
    tagColor: "#16A34A",
    readTime: "12 min",
    publishedLabel: "28 de mayo, 2026",
    publishedAt: "2026-05-28",
    updatedAt: "2026-05-28",
    sections: baseSections,
    related: [
      ...baseRelated,
      { label: "Método FIFO en activos digitales", href: "/blog/metodo-fifo-criptomonedas-chile" },
    ],
  },
  {
    slug: "como-declarar-criptomonedas-sii-chile",
    title: "Cómo preparar información para declarar operaciones cripto en Chile",
    summary:
      "Guía práctica para ordenar operaciones cripto, revisar FIFO, separar compras y ventas, y llegar con información clara a una revisión tributaria.",
    tag: "Declaración",
    tagColor: "#16A34A",
    readTime: "8 min",
    publishedLabel: "12 de mayo, 2025",
    publishedAt: "2025-05-12",
    updatedAt: "2026-05-27",
    sections: baseSections,
    related: [
      { label: "Guía de tributación cripto en Chile", href: "/blog/guia-impuestos-criptomonedas-chile" },
      ...baseRelated,
    ],
  },
  {
    slug: "metodo-fifo-criptomonedas-chile",
    title: "Método FIFO y activos digitales: por qué el orden de tus operaciones importa",
    summary:
      "El FIFO permite reconstruir qué unidades se consideran vendidas primero. Entenderlo ayuda a revisar costos, resultados y trazabilidad.",
    tag: "Motor FIFO",
    tagColor: "#7C3AED",
    readTime: "6 min",
    publishedLabel: "28 de abril, 2025",
    publishedAt: "2025-04-28",
    updatedAt: "2026-05-27",
    sections: [
      {
        type: "p",
        content:
          "FIFO significa First In, First Out: primero entra, primero sale. En un historial de activos digitales, esto permite ordenar compras y ventas para identificar qué unidades se consumen cuando existe una venta o salida relevante.",
      },
      {
        type: "h2",
        content: "Por qué el orden cambia el resultado",
      },
      {
        type: "p",
        content:
          "Si compras el mismo activo en distintos momentos y a distintos precios, vender una parte del saldo exige decidir qué costo corresponde a esa venta. FIFO usa los lotes más antiguos primero.",
      },
      {
        type: "ul",
        content: [
          "Ordena operaciones cronológicamente.",
          "Consume lotes antiguos antes que lotes nuevos.",
          "Permite calcular costo asociado a cada venta.",
          "Deja trazabilidad por operación y lote.",
        ],
      },
      {
        type: "h2",
        content: "Cómo lo aborda LEDGERA",
      },
      {
        type: "p",
        content:
          "LEDGERA procesa operaciones confirmadas, no importaciones pendientes. Esto evita que datos duplicados o no revisados afecten el cálculo del portafolio y del respaldo tributario.",
      },
      {
        type: "callout",
        content:
          "El cálculo FIFO debe revisarse dentro del contexto completo del contribuyente y de la normativa aplicable al período correspondiente.",
      },
    ],
    related: [
      { label: "Guía de tributación cripto en Chile", href: "/blog/guia-impuestos-criptomonedas-chile" },
      { label: "Cómo preparar la declaración", href: "/blog/como-declarar-criptomonedas-sii-chile" },
      ...baseRelated,
    ],
  },
  {
    slug: "fiscalizacion-sii-criptomonedas",
    title: "Revisión tributaria y activos digitales: cómo ordenar respaldos antes de responder",
    summary:
      "Qué información conviene preparar si necesitas explicar operaciones cripto: historial, banco, exchange, criterio de cálculo y trazabilidad.",
    tag: "Fiscalización",
    tagColor: "#F59E0B",
    readTime: "7 min",
    publishedLabel: "15 de abril, 2025",
    publishedAt: "2025-04-15",
    updatedAt: "2026-05-27",
    sections: baseSections,
    related: [
      ...baseRelated,
      { label: "Preguntas frecuentes", href: "/preguntas" },
    ],
  },
  {
    slug: "tipo-cambio-bcch-criptomonedas",
    title: "Tipo de cambio y activos digitales: cómo preparar valores en pesos chilenos",
    summary:
      "Para revisar operaciones cripto en Chile, conviene conservar fechas, moneda de origen, valor en USD o CLP y criterio de conversión utilizado.",
    tag: "Normativa",
    tagColor: "#0EA5E9",
    readTime: "5 min",
    publishedLabel: "5 de abril, 2025",
    publishedAt: "2025-04-05",
    updatedAt: "2026-05-27",
    sections: [
      {
        type: "p",
        content:
          "Cuando una operación cripto está expresada en USD u otra moneda, la revisión en Chile suele exigir una conversión ordenada a pesos chilenos. El punto crítico es conservar fecha, fuente y criterio aplicado.",
      },
      {
        type: "h2",
        content: "Qué datos necesitas conservar",
      },
      {
        type: "ul",
        content: [
          "Fecha de compra o venta.",
          "Activo digital involucrado.",
          "Monto en moneda de origen.",
          "Valor estimado en CLP.",
          "Fuente o criterio usado para convertir.",
        ],
      },
      {
        type: "h2",
        content: "Cómo ayuda LEDGERA",
      },
      {
        type: "p",
        content:
          "LEDGERA busca conservar el tipo de cambio aplicado y mostrarlo dentro de la trazabilidad de la operación, para que el cálculo pueda revisarse junto al resto del historial.",
      },
      {
        type: "callout",
        content:
          "El criterio de conversión puede depender del tipo de operación, fuente disponible y período. Revisa el tratamiento final con un profesional.",
      },
    ],
    related: baseRelated,
  },
  {
    slug: "diferencia-persona-natural-empresa-cripto",
    title: "Persona natural o empresa: por qué cambia la revisión de operaciones cripto",
    summary:
      "La forma de revisar operaciones cripto puede cambiar según el perfil del contribuyente, volumen, actividad y estructura usada.",
    tag: "Normativa",
    tagColor: "#0EA5E9",
    readTime: "6 min",
    publishedLabel: "20 de marzo, 2025",
    publishedAt: "2025-03-20",
    updatedAt: "2026-05-27",
    sections: baseSections,
    related: [
      ...baseRelated,
      { label: "Planes LEDGERA", href: "/planes" },
    ],
  },
  {
    slug: "como-importar-historial-binance-buda",
    title: "Cómo preparar un historial de exchange para importarlo en LEDGERA",
    summary:
      "Antes de importar datos desde un exchange, revisa fechas, tipos de operación, duplicados y relación con tu banco.",
    tag: "Tutorial",
    tagColor: "#16A34A",
    readTime: "4 min",
    publishedLabel: "10 de marzo, 2025",
    publishedAt: "2025-03-10",
    updatedAt: "2026-05-27",
    sections: baseSections,
    related: [
      ...baseRelated,
      { label: "Cómo funciona LEDGERA", href: "/como-funciona" },
    ],
  },
];

export function getBlogArticle(slug: string): BlogArticle | undefined {
  return blogArticles.find((article) => article.slug === slug);
}
