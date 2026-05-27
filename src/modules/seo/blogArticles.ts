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

export const blogArticles: BlogArticle[] = [
  {
    slug: "como-declarar-criptomonedas-sii-chile",
    title: "Cómo preparar información para declarar criptomonedas en Chile",
    summary:
      "Guía práctica para ordenar movimientos crypto, revisar FIFO, separar compras y ventas, y llegar con información clara a una revisión tributaria.",
    tag: "Declaración",
    tagColor: "#16A34A",
    readTime: "8 min",
    publishedLabel: "12 de mayo, 2025",
    publishedAt: "2025-05-12",
    updatedAt: "2026-05-27",
    sections: [
      {
        type: "p",
        content:
          "Antes de declarar criptomonedas, el trabajo crítico es ordenar el historial. Necesitas distinguir compras, ventas, swaps, depósitos, retiros, comisiones y movimientos bancarios relacionados con actividad crypto.",
      },
      {
        type: "h2",
        content: "Qué información conviene reunir",
      },
      {
        type: "ul",
        content: [
          "Historial de operaciones desde exchanges.",
          "Cartolas bancarias asociadas a compras o ventas crypto.",
          "Fechas, montos, activos, precios y comisiones.",
          "Transferencias entre wallets o exchanges.",
          "Criterio usado para calcular costo y resultado.",
        ],
      },
      {
        type: "h2",
        content: "Por qué no basta con un CSV",
      },
      {
        type: "p",
        content:
          "Un archivo CSV puede contener operaciones, pero no siempre explica la historia completa. Un depósito en exchange puede venir desde un banco, una venta puede generar un retiro, y una transferencia interna puede no representar una venta real.",
      },
      {
        type: "h2",
        content: "Cómo ayuda LEDGERA",
      },
      {
        type: "p",
        content:
          "LEDGERA permite revisar importaciones antes de confirmarlas, construir un portafolio limpio y preparar una base financiera-tributaria con trazabilidad. El objetivo es facilitar la revisión, no reemplazar el criterio profesional.",
      },
      {
        type: "callout",
        content:
          "La obligación tributaria concreta depende del caso, del período y del criterio profesional aplicable. Valida siempre tu situación con un contador o asesor tributario.",
      },
    ],
    related: [
      { label: "Impuestos crypto en Chile", href: "/impuestos-crypto-chile" },
      { label: "Método FIFO en criptomonedas", href: "/blog/metodo-fifo-criptomonedas-chile" },
      { label: "Conciliación banco y exchange", href: "/conciliacion-binance-banco" },
    ],
  },
  {
    slug: "metodo-fifo-criptomonedas-chile",
    title: "Método FIFO y criptomonedas: por qué el orden de tus movimientos importa",
    summary:
      "El FIFO permite reconstruir qué unidades se consideran vendidas primero. Entenderlo ayuda a revisar costos, ganancias y trazabilidad.",
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
          "FIFO significa First In, First Out: primero entra, primero sale. En un historial crypto, esto permite ordenar compras y ventas para identificar qué unidades se consumen cuando existe una venta o salida relevante.",
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
          "Ordena movimientos cronológicamente.",
          "Consume lotes antiguos antes que lotes nuevos.",
          "Permite calcular costo asociado a cada venta.",
          "Deja trazabilidad por movimiento y lote.",
        ],
      },
      {
        type: "h2",
        content: "Cómo lo aborda LEDGERA",
      },
      {
        type: "p",
        content:
          "LEDGERA procesa movimientos confirmados, no importaciones pendientes. Esto evita que datos duplicados o no revisados afecten el cálculo del portafolio y de la base tributaria.",
      },
      {
        type: "callout",
        content:
          "El cálculo FIFO debe revisarse dentro del contexto completo del contribuyente y de la normativa aplicable al período correspondiente.",
      },
    ],
    related: [
      { label: "Cómo preparar la declaración crypto", href: "/blog/como-declarar-criptomonedas-sii-chile" },
      { label: "Impuestos crypto en Chile", href: "/impuestos-crypto-chile" },
      { label: "Contador crypto en Chile", href: "/contador-crypto-chile" },
    ],
  },
  {
    slug: "fiscalizacion-sii-criptomonedas",
    title: "Fiscalización SII y criptomonedas: cómo ordenar respaldos antes de responder",
    summary:
      "Qué información conviene preparar si necesitas explicar operaciones crypto: historial, banco, exchange, criterio de cálculo y trazabilidad.",
    tag: "Fiscalización",
    tagColor: "#F59E0B",
    readTime: "7 min",
    publishedLabel: "15 de abril, 2025",
    publishedAt: "2025-04-15",
    updatedAt: "2026-05-27",
    sections: [
      {
        type: "p",
        content:
          "Una revisión tributaria exige claridad documental. En crypto, esa claridad suele depender de conectar exchange, banco, wallets, compras, ventas y criterios de valorización.",
      },
      {
        type: "h2",
        content: "Qué puede ser difícil de explicar",
      },
      {
        type: "ul",
        content: [
          "Depósitos bancarios sin relación clara con compras crypto.",
          "Retiros desde exchanges que no están asociados a una venta.",
          "Movimientos duplicados entre reportes Spot, Tax o CSV.",
          "Diferencias entre saldos de exchange y portafolio reconstruido.",
        ],
      },
      {
        type: "h2",
        content: "Qué respaldos conviene ordenar",
      },
      {
        type: "p",
        content:
          "Historial de operaciones, cartolas bancarias, reportes de movimientos confirmados, metodología de cálculo y trazabilidad de cambios son piezas útiles para una revisión profesional.",
      },
      {
        type: "h2",
        content: "Cómo ayuda LEDGERA",
      },
      {
        type: "p",
        content:
          "LEDGERA organiza movimientos, conserva trazabilidad y permite preparar reportes verificables. Eso facilita explicar cómo se construyó la información, aunque la respuesta tributaria final debe revisarse profesionalmente.",
      },
      {
        type: "callout",
        content:
          "Un reporte verificable ayuda a demostrar consistencia documental, pero no garantiza por sí solo la aceptación de un criterio por parte de la autoridad fiscal.",
      },
    ],
    related: [
      { label: "Impuestos crypto Chile", href: "/impuestos-crypto-chile" },
      { label: "Declarar criptomonedas en Chile", href: "/como-declarar-crypto-en-chile" },
      { label: "Preguntas frecuentes", href: "/preguntas" },
    ],
  },
  {
    slug: "tipo-cambio-bcch-criptomonedas",
    title: "Tipo de cambio y criptomonedas: cómo preparar valores en pesos chilenos",
    summary:
      "Para revisar operaciones crypto en Chile, conviene conservar fechas, moneda de origen, valor en USD o CLP y criterio de conversión utilizado.",
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
          "Cuando una operación crypto está expresada en USD u otra moneda, la revisión en Chile suele exigir una conversión ordenada a pesos chilenos. El punto crítico es conservar fecha, fuente y criterio aplicado.",
      },
      {
        type: "h2",
        content: "Qué datos necesitas conservar",
      },
      {
        type: "ul",
        content: [
          "Fecha de compra o venta.",
          "Activo involucrado.",
          "Monto en moneda de origen.",
          "Valor estimado en CLP.",
          "Fuente o criterio usado para convertir.",
        ],
      },
      {
        type: "h2",
        content: "Por qué importa la fecha",
      },
      {
        type: "p",
        content:
          "La conversión puede cambiar el resultado en pesos chilenos. Por eso conviene registrar el valor asociado a la fecha del movimiento y no mezclarlo con valores posteriores.",
      },
      {
        type: "h2",
        content: "Cómo ayuda LEDGERA",
      },
      {
        type: "p",
        content:
          "LEDGERA busca conservar el tipo de cambio aplicado y mostrarlo dentro de la trazabilidad del movimiento, para que el cálculo pueda revisarse junto al resto del historial.",
      },
      {
        type: "callout",
        content:
          "El criterio de conversión puede depender del tipo de operación, fuente disponible y período. Revisa el tratamiento final con un profesional.",
      },
    ],
    related: [
      { label: "Método FIFO crypto", href: "/blog/metodo-fifo-criptomonedas-chile" },
      { label: "Impuestos crypto Chile", href: "/impuestos-crypto-chile" },
      { label: "Cómo declarar crypto", href: "/como-declarar-crypto-en-chile" },
    ],
  },
  {
    slug: "diferencia-persona-natural-empresa-cripto",
    title: "Persona natural o empresa: por qué cambia la revisión de operaciones crypto",
    summary:
      "La forma de revisar operaciones crypto puede cambiar según el perfil del contribuyente, volumen, actividad y estructura usada.",
    tag: "Normativa",
    tagColor: "#0EA5E9",
    readTime: "6 min",
    publishedLabel: "20 de marzo, 2025",
    publishedAt: "2025-03-20",
    updatedAt: "2026-05-27",
    sections: [
      {
        type: "p",
        content:
          "No todos los casos crypto se revisan igual. El tratamiento puede cambiar si la actividad corresponde a una persona natural, una empresa, una operación ocasional o una actividad recurrente.",
      },
      {
        type: "h2",
        content: "Qué cambia entre perfiles",
      },
      {
        type: "ul",
        content: [
          "La forma de documentar ingresos y costos.",
          "El nivel de trazabilidad exigido internamente.",
          "La relación con contabilidad y reportes.",
          "La necesidad de separar clientes, empresas o portafolios.",
        ],
      },
      {
        type: "h2",
        content: "Por qué el contador necesita datos limpios",
      },
      {
        type: "p",
        content:
          "Cuando la información llega mezclada, el trabajo profesional se vuelve más lento y riesgoso. Separar movimientos confirmados, importaciones pendientes y conciliaciones facilita la revisión.",
      },
      {
        type: "h2",
        content: "Cómo ayuda LEDGERA",
      },
      {
        type: "p",
        content:
          "LEDGERA permite ordenar información por portafolio, movimientos y trazabilidad, para que la revisión contable o tributaria parta desde una base más clara.",
      },
      {
        type: "callout",
        content:
          "La clasificación tributaria final depende de hechos, documentos y criterio profesional. LEDGERA prepara información; no define por sí solo el tratamiento tributario aplicable.",
      },
    ],
    related: [
      { label: "Contador crypto en Chile", href: "/contador-crypto-chile" },
      { label: "Preguntas frecuentes", href: "/preguntas" },
      { label: "Planes LEDGERA", href: "/planes" },
    ],
  },
  {
    slug: "como-importar-historial-binance-buda",
    title: "Cómo preparar un historial de exchange para importarlo en LEDGERA",
    summary:
      "Antes de importar datos desde Binance, Buda, Orionx u otro exchange, revisa fechas, tipos de movimiento, duplicados y relación con tu banco.",
    tag: "Tutorial",
    tagColor: "#16A34A",
    readTime: "4 min",
    publishedLabel: "10 de marzo, 2025",
    publishedAt: "2025-03-10",
    updatedAt: "2026-05-27",
    sections: [
      {
        type: "p",
        content:
          "Importar un historial de exchange puede ahorrar tiempo, pero no conviene confirmar todo automáticamente. Primero hay que revisar formato, fechas, duplicados y relación con movimientos bancarios.",
      },
      {
        type: "h2",
        content: "Antes de importar",
      },
      {
        type: "ul",
        content: [
          "Descarga el historial en CSV cuando esté disponible.",
          "Revisa el rango de fechas exportado.",
          "Evita mezclar reportes que contienen el mismo evento económico.",
          "Conserva copia original del archivo descargado.",
        ],
      },
      {
        type: "h2",
        content: "Después de cargar datos",
      },
      {
        type: "p",
        content:
          "LEDGERA está diseñado para dejar los datos importados en revisión antes de confirmarlos. Eso permite detectar duplicados, ignorar movimientos irrelevantes y confirmar solo lo que debe afectar el portafolio.",
      },
      {
        type: "h2",
        content: "Conecta exchange y banco",
      },
      {
        type: "p",
        content:
          "Una importación de exchange gana valor cuando se puede contrastar con la cartola bancaria. Así puedes explicar transferencias, depósitos, retiros y operaciones relacionadas.",
      },
      {
        type: "callout",
        content:
          "La importación debe revisarse antes de usarse como base financiera o tributaria. Un CSV puede contener duplicados, omisiones o formatos distintos según el exchange.",
      },
    ],
    related: [
      { label: "Binance impuestos Chile", href: "/binance-impuestos-chile" },
      { label: "Conciliación banco y exchange", href: "/conciliacion-binance-banco" },
      { label: "Cómo funciona LEDGERA", href: "/como-funciona" },
    ],
  },
];

export function getBlogArticle(slug: string): BlogArticle | undefined {
  return blogArticles.find((article) => article.slug === slug);
}
