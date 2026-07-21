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

const taxGuideSections: BlogSection[] = [
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

const declarationSections: BlogSection[] = [
  { type: "p", content: "Preparar una declaración comienza antes del Formulario 22. El primer objetivo es reconstruir el período completo y separar los hechos que pueden producir un resultado tributario de los simples movimientos entre cuentas propias." },
  { type: "h2", content: "Paso 1: reúne todas las fuentes" },
  { type: "ul", content: ["Historial completo de cada exchange.", "Movimientos de wallets propias.", "Cartolas bancarias y comprobantes.", "Registros de pagos, recompensas y comisiones."] },
  { type: "h2", content: "Paso 2: clasifica cada operación" },
  { type: "p", content: "Distingue compras, ventas, swaps, depósitos, retiros, ingresos y transferencias propias. No clasifiques una salida como venta sólo porque abandonó un exchange: puede haber llegado a otra wallet del mismo titular." },
  { type: "h2", content: "Paso 3: reconstruye costo y valor en pesos" },
  { type: "p", content: "Cada resultado debe conservar fecha, cantidad, costo atribuible, valor de enajenación, comisiones y criterio de conversión a CLP. La consistencia del método importa tanto como el número final." },
  { type: "h2", content: "Paso 4: revisa el perfil del contribuyente" },
  { type: "p", content: "La determinación final varía según se trate de una persona natural o una empresa, su régimen y los antecedentes del caso. Entrega el respaldo a un profesional antes de presentar o rectificar la declaración." },
  { type: "callout", content: "El SII indica que el mayor valor obtenido en la compra y venta de criptomonedas constituye renta afecta a impuestos. La forma de declararlo depende del tipo de contribuyente y del caso concreto." },
];

const auditSections: BlogSection[] = [
  { type: "p", content: "Ante una revisión del SII, el desafío no es entregar más archivos: es demostrar cómo cada cifra se construyó desde operaciones identificables y documentos coherentes." },
  { type: "h2", content: "Arma una carpeta por período y fuente" },
  { type: "ul", content: ["Exportaciones originales de exchanges, sin editar.", "Cartolas bancarias y comprobantes relacionados.", "Direcciones de wallets y transacciones relevantes.", "Informe de costo, resultado, comisiones y tipos de cambio.", "Registro de correcciones y criterios aplicados."] },
  { type: "h2", content: "Explica las transferencias entre cuentas propias" },
  { type: "p", content: "Un retiro desde un exchange no acredita por sí solo una venta. Conserva la dirección de destino y la continuidad del activo cuando se trate de un traslado entre cuentas del mismo titular." },
  { type: "h2", content: "Reconcilia banco y exchange" },
  { type: "p", content: "Relaciona depósitos y retiros bancarios con las operaciones que los originaron. Documenta desfases, comisiones y agrupaciones cuando los montos no coincidan exactamente." },
  { type: "h2", content: "Entrega una trazabilidad reproducible" },
  { type: "p", content: "Un tercero debe poder pasar del total declarado al detalle por activo y desde allí al registro original. LEDGERA mantiene ese recorrido y permite exportarlo para revisión." },
  { type: "callout", content: "No alteres los archivos originales. Conserva una copia intacta y documenta por separado cualquier normalización o corrección realizada durante la revisión." },
];

const taxpayerProfileSections: BlogSection[] = [
  { type: "p", content: "Usar una sociedad no transforma automáticamente una operación en más conveniente ni elimina las obligaciones personales. La revisión cambia porque el contribuyente, la contabilidad y la forma de determinar la renta pueden ser diferentes." },
  { type: "h2", content: "Cuando opera una persona natural" },
  { type: "p", content: "El SII señala que el mayor valor obtenido por una persona natural puede quedar afecto a impuestos finales según corresponda. Se deben reconstruir costo, valor de enajenación y antecedentes del período, considerando siempre las circunstancias particulares." },
  { type: "h2", content: "Cuando opera una empresa" },
  { type: "p", content: "La empresa debe integrar las operaciones a su contabilidad y régimen tributario, respaldar activos, ingresos, costos y comisiones, y mantener separados sus fondos de los de socios o administradores." },
  { type: "ul", content: ["Titular real de las cuentas y wallets.", "Origen de los fondos utilizados.", "Registro contable de compras y ventas.", "Documentos emitidos o recibidos.", "Retiros, distribuciones o cuentas con relacionados."] },
  { type: "h2", content: "Preguntas antes de elegir una estructura" },
  { type: "ul", content: ["¿La actividad es personal o forma parte de un negocio organizado?", "¿Quién asume el riesgo y aporta los fondos?", "¿Existe operación recurrente, clientes o prestación de servicios?", "¿Qué régimen y obligaciones contables tendría la sociedad?", "¿Cómo se retirarán los recursos desde la empresa?"] },
  { type: "callout", content: "La elección entre persona natural y empresa exige análisis legal, contable y tributario previo. LEDGERA organiza la evidencia, pero no recomienda una estructura sin conocer el caso completo." },
];

const importSections: BlogSection[] = [
  { type: "p", content: "Una importación fiable conserva el archivo original y valida su contenido antes de incorporarlo al historial confirmado. El objetivo es detectar ausencias y duplicados cuando todavía pueden corregirse sin alterar resultados." },
  { type: "h2", content: "Descarga el historial correcto" },
  { type: "ul", content: ["Selecciona el período completo.", "Incluye trades, conversiones, depósitos y retiros.", "Descarga comisiones y recompensas cuando estén separadas.", "No cambies encabezados ni formatos antes de cargar."] },
  { type: "h2", content: "Revisa la vista previa" },
  { type: "p", content: "Comprueba fechas, zonas horarias, símbolos, cantidades y tipos de movimiento. Si el exchange divide el historial en varios archivos, verifica que no existan períodos solapados." },
  { type: "h2", content: "Resuelve duplicados y movimientos desconocidos" },
  { type: "p", content: "Un identificador repetido, una operación ya confirmada o una fila sin activo suficiente deben quedar pendientes. No confirmes en bloque datos que todavía no puedes explicar." },
  { type: "h2", content: "Concilia después de confirmar la fuente" },
  { type: "p", content: "Cuando el historial del exchange está limpio, relaciónalo con banco y wallets. Así puedes distinguir compras financiadas desde el banco, retiros de dinero y transferencias propias." },
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
    sections: taxGuideSections,
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
    sections: declarationSections,
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
    sections: auditSections,
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
    sections: taxpayerProfileSections,
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
    sections: importSections,
    related: [
      ...baseRelated,
      { label: "Cómo funciona LEDGERA", href: "/como-funciona" },
    ],
  },
];

export function getBlogArticle(slug: string): BlogArticle | undefined {
  return blogArticles.find((article) => article.slug === slug);
}
