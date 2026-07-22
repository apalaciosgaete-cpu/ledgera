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
  sources?: Array<{
    label: string;
    href: string;
  }>;
};

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
    sections: [
      {
        heading: "Qué operaciones conviene identificar antes de revisar impuestos",
        body: [
          "La compra y la mera tenencia no cuentan la misma historia que una venta. Para reconstruir el período hay que separar adquisiciones, enajenaciones, swaps, pagos, recompensas y transferencias entre cuentas propias.",
          "El SII señala que el mayor valor obtenido en la compra y venta de criptomonedas constituye renta afecta a impuestos. El tratamiento concreto depende del contribuyente y de los antecedentes del caso.",
        ],
        bullets: ["Ventas de activos digitales por CLP u otra moneda.", "Intercambios entre activos que deben analizarse como operaciones separadas.", "Ingresos recibidos por servicios, staking u otras actividades.", "Transferencias propias que requieren trazabilidad, pero no deben confundirse automáticamente con ventas."],
      },
      {
        heading: "Cómo se construye una base tributaria trazable",
        body: [
          "El resultado debe poder explicarse desde el archivo original hasta cada operación confirmada: fecha, activo, cantidad, precio, comisión, tipo de cambio y clasificación aplicada.",
          "LEDGERA conserva esa relación y permite exportar respaldos en PDF y Excel para facilitar la revisión del contribuyente o de su profesional tributario.",
        ],
        bullets: ["Historial completo de exchanges y wallets.", "Cartolas bancarias vinculadas.", "Criterio de valorización y conversión a CLP.", "Documentos que acrediten origen, costo y destino de los fondos."],
      },
      {
        heading: "Persona natural y empresa no se revisan igual",
        body: [
          "La forma de determinar y declarar el resultado puede variar según se trate de una persona natural o de una empresa que lleva contabilidad. Por eso LEDGERA separa la organización de datos de la conclusión tributaria final.",
          "La plataforma prepara evidencia; no reemplaza el análisis de habitualidad, régimen tributario, renta efectiva ni otras circunstancias particulares.",
        ],
      },
    ],
    related: relatedBase,
    sources: [
      { label: "SII: Preguntas frecuentes sobre activos digitales", href: "https://www.sii.cl/preguntas_frecuentes/criptomonedas/arbol_faqs_criptomonedas_1653.htm" },
      { label: "SII: Tributación del mayor valor en criptomonedas", href: "https://www.sii.cl/preguntas_frecuentes/criptomonedas/001_250_7872.htm" },
      { label: "SII: Oficio N.º 963 de 2018", href: "https://www.sii.cl/normativa_legislacion/jurisprudencia_administrativa/ley_impuesto_renta/2018/ja963.htm" },
    ],
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
    sections: [
      { heading: "Qué entrega un exchange y qué suele faltar", body: ["El historial del exchange registra órdenes, conversiones, depósitos, retiros y comisiones, pero por sí solo no explica el origen bancario de los fondos ni identifica transferencias entre cuentas propias.", "LEDGERA incorpora los archivos en una etapa revisable para detectar formatos, duplicados y operaciones que requieren clasificación antes de afectar el portafolio."], bullets: ["Historial sin recortes de fechas.", "Depósitos y retiros además de trades.", "Comisiones y monedas utilizadas.", "Identificación de la cuenta y fuente de origen."] },
      { heading: "De registros técnicos a una historia financiera", body: ["Una transferencia bancaria puede financiar varias compras y una venta puede terminar en un retiro parcial. La conciliación conecta ambos lados sin inventar equivalencias cuando los montos o fechas no coinciden.", "El resultado es una secuencia revisable que conserva la fuente original y deja visibles las diferencias pendientes."] },
      { heading: "Control antes de confirmar", body: ["Los datos importados permanecen separados del historial confirmado hasta que el usuario los revisa. Esto evita que un archivo duplicado o una clasificación incorrecta altere saldos y cálculos posteriores."] },
    ],
    related: relatedBase,
    sources: [{ label: "SII: Preguntas frecuentes sobre activos digitales", href: "https://www.sii.cl/preguntas_frecuentes/criptomonedas/arbol_faqs_criptomonedas_1653.htm" }],
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
    sections: [
      { heading: "1. Reúne el período completo", body: ["Descarga los historiales de cada exchange y wallet utilizados durante el año, junto con cartolas bancarias y comprobantes. Un archivo parcial puede ocultar el costo de adquisición o transformar una transferencia propia en una aparente salida."], bullets: ["Operaciones de compra y venta.", "Swaps y conversiones.", "Depósitos, retiros y transferencias.", "Comisiones, recompensas y pagos recibidos."] },
      { heading: "2. Clasifica antes de calcular", body: ["Primero distingue operaciones que pueden representar una enajenación de movimientos que sólo trasladan activos entre cuentas del mismo titular. Después valida cantidades, fechas y monedas.", "La clasificación debe conservar una explicación y su vínculo con el registro original para que pueda ser revisada o corregida."] },
      { heading: "3. Determina costo y resultado en CLP", body: ["Una revisión tributaria necesita reconstruir el costo atribuible y el valor de la operación en pesos chilenos según un criterio consistente y documentado.", "LEDGERA organiza lotes, precios, comisiones y tipos de cambio; la aplicación jurídica y la declaración final deben validarse considerando el perfil del contribuyente y el año tributario."] },
      { heading: "4. Prepara el respaldo antes del Formulario 22", body: ["La declaración es el último paso, no el primero. Conserva el informe de operaciones, el detalle por activo, las fuentes utilizadas y las decisiones de clasificación que explican el resultado."] },
    ],
    related: relatedBase,
    sources: [
      { label: "SII: Tributación del mayor valor en criptomonedas", href: "https://www.sii.cl/preguntas_frecuentes/criptomonedas/001_250_7872.htm" },
      { label: "SII: Criterio para personas naturales", href: "https://www.sii.cl/preguntas_frecuentes/criptomonedas/001_250_7873.htm" },
    ],
  },
  conciliacionBinanceBanco: {
    path: "/conciliacion-binance-banco",
    title: "Conciliación Binance y banco en Chile",
    description: "Relaciona transferencias bancarias con depósitos, compras, ventas y retiros de Binance para construir trazabilidad financiera en Chile.",
    keyword: "conciliación Binance banco Chile",
    eyebrow: "Binance y banco",
    h1: "Conciliación Binance y banco: conecta pesos con operaciones cripto",
    intro: "Relaciona tus cartolas bancarias con depósitos, compras, ventas y retiros de Binance sin confundir transferencias con hechos tributarios.",
    ctaLabel: "Comenzar análisis",
    ctaHref: "/register",
    sections: [
      { heading: "Qué archivos de Binance necesitas", body: ["Descarga el historial completo del período e incluye trades, conversiones, depósitos, retiros y comisiones. Una exportación de órdenes aislada no permite reconstruir todo el flujo."], bullets: ["Spot y conversiones utilizadas.", "Depósitos y retiros fiat.", "Depósitos y retiros de activos digitales.", "Comisiones y referencias disponibles."] },
      { heading: "Relaciona depósitos con transferencias bancarias", body: ["LEDGERA compara fechas, montos y dirección del flujo entre la cartola y Binance. Una transferencia puede financiar varias compras posteriores, por lo que la conciliación no fuerza una equivalencia uno a uno.", "Toda coincidencia sugerida permanece revisable antes de confirmarse."] },
      { heading: "Distingue un retiro de una venta", body: ["Retirar cripto desde Binance hacia una wallet propia no equivale automáticamente a vender. La dirección de destino y la continuidad del activo permiten documentar el traslado."], bullets: ["Retiro cripto hacia wallet propia.", "Venta y retiro posterior en moneda fiat.", "Transferencia P2P que requiere respaldo adicional.", "Diferencias netas producidas por comisiones."] },
      { heading: "Resultado: trazabilidad desde el banco hasta Binance", body: ["La meta es poder explicar cómo ingresaron los fondos, qué operación se ejecutó, qué activo resultó y cómo salió o permaneció en custodia, conservando evidencia de cada tramo."] },
    ],
    related: relatedBase,
    sources: [{ label: "SII: Preguntas frecuentes sobre activos digitales", href: "https://www.sii.cl/preguntas_frecuentes/criptomonedas/arbol_faqs_criptomonedas_1653.htm" }],
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
    sections: [
      { heading: "Qué necesita un profesional para revisar bien", body: ["Un contador no debería recibir únicamente saldos finales o archivos con nombres ambiguos. Necesita operaciones completas, criterios de clasificación y evidencia que permita volver a la fuente."], bullets: ["Historial consolidado sin duplicados.", "Separación entre transferencias propias y operaciones con terceros.", "Costo, valorización y comisiones por operación.", "Cartolas y comprobantes vinculados."] },
      { heading: "Colaboración sin perder control", body: ["LEDGERA permite preparar información estructurada para que el profesional concentre su tiempo en el criterio tributario, las excepciones y la declaración, en lugar de reconstruir manualmente cada archivo."] },
      { heading: "El rol de LEDGERA y el del asesor", body: ["LEDGERA organiza, calcula y documenta según los datos confirmados. El profesional valida la aplicación normativa, el régimen del contribuyente y el tratamiento definitivo del período."] },
    ],
    related: relatedBase,
    sources: [
      { label: "SII: Tributación del mayor valor en criptomonedas", href: "https://www.sii.cl/preguntas_frecuentes/criptomonedas/001_250_7872.htm" },
      { label: "SII: Criptoactivos y contabilidad completa", href: "https://www.sii.cl/preguntas_frecuentes/criptomonedas/001_250_7832.htm" },
    ],
  },
} satisfies Record<string, SeoPageContent>;

export const seoPageList = Object.values(seoPages);
