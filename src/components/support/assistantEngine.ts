export type AssistantLink = {
  label: string;
  href: string;
};

export type AssistantReply = {
  text: string;
  links?: AssistantLink[];
  meta?: string;
  intent: AssistantIntent;
};

export type AssistantIntent =
  | "START"
  | "GREETING"
  | "IMPORT"
  | "PENDING"
  | "ASSETS"
  | "TAX_STATUS"
  | "DECLARATION"
  | "FX"
  | "SECURITY"
  | "PASSWORD"
  | "BILLING"
  | "SUPPORT"
  | "PERSONAL_TAX"
  | "UNKNOWN";

export type AssistantContext = {
  generatedAt: string;
  stage: "EMPTY" | "IMPORT_REVIEW" | "DATA_REVIEW" | "TAX_REVIEW" | "READY_TO_REPORT" | "REPORT_READY";
  nextAction: {
    title: string;
    detail: string;
    href: string;
    label: string;
  };
  counts: {
    movements: number;
    buys: number;
    sells: number;
    staking: number;
    assets: number;
    movementReview: number;
    imports: number;
    pendingImports: number;
    confirmedImports: number;
    taxEvents: number;
    declarations: number;
  };
  tax: {
    year: number | null;
    status: "REVIEW" | "POSSIBLE_PAYMENT" | "DECLARE" | "NO_TAX_EVENTS";
    reviewCount: number;
    taxableEventCount: number;
    netTaxableGainClp: number | null;
    preliminaryTaxBaseClp: number | null;
    updatedAt: string | null;
  };
  latestDeclaration: {
    taxYear: number;
    declarationType: string;
    status: string;
    generatedAt: string;
    isCurrent: boolean;
  } | null;
  exchanges: Array<{
    exchange: string;
    status: string;
    lastSyncAt: string | null;
  }>;
};

type IntentDefinition = {
  id: AssistantIntent;
  phrases: string[];
  keywords: string[];
  threshold: number;
};

const INTENTS: IntentDefinition[] = [
  {
    id: "START",
    phrases: [
      "donde debo empezar",
      "por donde empiezo",
      "por donde parto",
      "como comienzo",
      "como empiezo",
      "que hago primero",
      "que debo hacer ahora",
      "que hago ahora",
      "cual es el siguiente paso",
      "que me falta",
      "guiame",
      "no se que hacer",
      "como uso ledgera",
    ],
    keywords: ["empezar", "comenzar", "partir", "primero", "siguiente", "falta", "guiar", "inicio"],
    threshold: 3,
  },
  {
    id: "IMPORT",
    phrases: [
      "como importo",
      "subir operaciones",
      "cargar archivo",
      "conectar binance",
      "sincronizar exchange",
      "agregar operaciones",
    ],
    keywords: ["importar", "importacion", "binance", "exchange", "csv", "archivo", "cargar", "sincronizar", "operaciones"],
    threshold: 3,
  },
  {
    id: "PENDING",
    phrases: [
      "donde reviso pendientes",
      "que operaciones faltan",
      "por que esta pendiente",
      "como confirmo una operacion",
      "tengo errores",
    ],
    keywords: ["pendiente", "pendientes", "revisar", "revision", "confirmar", "inconsistencia", "error", "observacion"],
    threshold: 3,
  },
  {
    id: "ASSETS",
    phrases: [
      "como veo mis activos",
      "que activos tengo",
      "como se calcula el saldo",
      "ver trazabilidad",
      "base de costo",
    ],
    keywords: ["activo", "activos", "criptoactivo", "portafolio", "saldo", "trazabilidad", "costo", "inventario"],
    threshold: 3,
  },
  {
    id: "TAX_STATUS",
    phrases: [
      "estado tributario",
      "tengo impuestos por pagar",
      "debo pagar impuestos",
      "que significa el semaforo",
      "por que esta rojo",
      "por que esta amarillo",
      "por que esta verde",
      "cuanto impuesto",
    ],
    keywords: ["impuesto", "tributario", "semaforo", "pagar", "declarar", "rojo", "amarillo", "verde", "obligacion"],
    threshold: 3,
  },
  {
    id: "DECLARATION",
    phrases: [
      "como genero el respaldo",
      "donde descargo el pdf",
      "donde esta el excel",
      "puedo generar la declaracion",
      "mi respaldo esta actualizado",
    ],
    keywords: ["declaracion", "declaraciones", "pdf", "excel", "respaldo", "f22", "extracto", "descargar", "generar"],
    threshold: 3,
  },
  {
    id: "FX",
    phrases: ["valor del dolar", "tipo de cambio", "dolar observado", "fuente banco central"],
    keywords: ["dolar", "usd", "cambio", "banco", "central", "cotizacion"],
    threshold: 3,
  },
  {
    id: "SECURITY",
    phrases: ["codigo 2fa no funciona", "segundo factor", "recuperar 2fa", "seguridad de mi cuenta"],
    keywords: ["2fa", "autenticador", "seguridad", "codigo", "acceso"],
    threshold: 3,
  },
  {
    id: "PASSWORD",
    phrases: ["olvide mi clave", "recuperar contrasena", "cambiar password", "restablecer clave"],
    keywords: ["contrasena", "password", "clave", "restablecer"],
    threshold: 3,
  },
  {
    id: "BILLING",
    phrases: ["cambiar de plan", "ver mi suscripcion", "cancelar suscripcion", "problema con el cobro"],
    keywords: ["plan", "planes", "suscripcion", "facturacion", "precio", "cobro", "pago"],
    threshold: 3,
  },
  {
    id: "SUPPORT",
    phrases: ["contactar soporte", "hablar con una persona", "enviar opinion", "reportar un problema"],
    keywords: ["soporte", "contactar", "opinion", "feedback", "sugerencia", "problema", "persona"],
    threshold: 3,
  },
  {
    id: "PERSONAL_TAX",
    phrases: [
      "vivo fuera de chile",
      "soy residente en otro pais",
      "esto tributa en chile",
      "como calcula la ganancia",
      "puedo descontar la perdida",
    ],
    keywords: ["residencia", "domicilio", "sii", "renta", "ganancia", "perdida", "tributa", "chile", "extranjero"],
    threshold: 3,
  },
  {
    id: "GREETING",
    phrases: ["hola", "buenas", "que puedes hacer", "como funciona el asistente"],
    keywords: ["hola", "ayuda", "asistente"],
    threshold: 2,
  },
];

export function normalizeAssistantText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(value.split(" ").filter((token) => token.length > 1));
}

function scoreIntent(value: string, definition: IntentDefinition): number {
  const tokens = tokenSet(value);
  let score = 0;

  for (const phrase of definition.phrases) {
    if (value === phrase) score += 12;
    else if (value.includes(phrase)) score += 8;
  }

  for (const keyword of definition.keywords) {
    if (tokens.has(keyword)) score += 2;
    else if (keyword.length >= 5 && value.includes(keyword)) score += 1;
  }

  return score;
}

export function detectAssistantIntent(input: string): { intent: AssistantIntent; confidence: number } {
  const value = normalizeAssistantText(input);
  if (!value) return { intent: "UNKNOWN", confidence: 0 };

  const ranked = INTENTS
    .map((definition) => ({ definition, score: scoreIntent(value, definition) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];

  if (!best || best.score < best.definition.threshold) {
    return { intent: "UNKNOWN", confidence: 0 };
  }

  const separation = Math.max(0, best.score - (second?.score ?? 0));
  const confidence = Math.min(0.99, 0.52 + best.score * 0.035 + separation * 0.025);
  return { intent: best.definition.id, confidence };
}

function plural(value: number, singular: string, pluralValue: string): string {
  return `${value.toLocaleString("es-CL")} ${value === 1 ? singular : pluralValue}`;
}

function formatClp(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "fecha no disponible";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function protectedLink(label: string, href: string, isAuthenticated: boolean): AssistantLink {
  return isAuthenticated ? { label, href } : { label: "Iniciar sesión", href: "/login" };
}

function accountMeta(context: AssistantContext | null): string | undefined {
  return context ? "Respuesta basada en el estado actual de tu cuenta" : undefined;
}

export function buildNextStepReply(
  context: AssistantContext | null,
  isAuthenticated: boolean,
): AssistantReply {
  if (!isAuthenticated) {
    return {
      intent: "START",
      text:
        "El flujo correcto es: crear o abrir tu cuenta, importar operaciones, revisar pendientes, validar el estado tributario y finalmente generar el respaldo. Para empezar con datos reales, inicia sesión y entra en Importaciones.",
      links: [
        { label: "Iniciar sesión", href: "/login" },
        { label: "Crear cuenta", href: "/register" },
      ],
    };
  }

  if (!context) {
    return {
      intent: "START",
      text:
        "Tu punto de partida depende de lo que ya exista en la cuenta. Estoy intentando leer únicamente el resumen de avance; mientras tanto, el flujo es Importaciones → revisión de pendientes → Activos → estado tributario → Declaraciones.",
      links: [protectedLink("Abrir panel", "/panel", isAuthenticated)],
    };
  }

  const counts = context.counts;
  const detail = context.nextAction.detail;
  let evidence = "";

  switch (context.stage) {
    case "EMPTY":
      evidence = context.exchanges.length > 0
        ? ` Ya tienes ${plural(context.exchanges.length, "exchange conectado", "exchanges conectados")}; el siguiente paso es sincronizar o cargar sus operaciones.`
        : " Todavía no hay operaciones ni importaciones registradas.";
      break;
    case "IMPORT_REVIEW":
      evidence = ` En la cuenta hay ${plural(counts.imports, "registro importado", "registros importados")} y ${plural(counts.pendingImports, "pendiente", "pendientes")}.`;
      break;
    case "DATA_REVIEW":
      evidence = ` Ya existen ${plural(counts.movements, "operación", "operaciones")}, pero ${plural(counts.movementReview, "requiere", "requieren")} completar precio o clasificación.`;
      break;
    case "TAX_REVIEW":
      evidence = ` La cuenta contiene ${plural(counts.movements, "operación", "operaciones")}, ${plural(counts.assets, "activo", "activos")} y ${plural(counts.sells, "venta", "ventas")}.`;
      break;
    case "REPORT_READY":
      evidence = context.latestDeclaration
        ? ` El último respaldo fue generado el ${formatDate(context.latestDeclaration.generatedAt)} y ${context.latestDeclaration.isCurrent ? "está posterior a las últimas operaciones" : "quedó anterior a movimientos más recientes"}.`
        : "";
      break;
    case "READY_TO_REPORT":
      evidence = ` No se detectan pendientes operativos entre ${plural(counts.movements, "operación", "operaciones")} registradas.`;
      break;
  }

  return {
    intent: "START",
    text: `${context.nextAction.title}. ${detail}${evidence}`,
    links: [{ label: context.nextAction.label, href: context.nextAction.href }],
    meta: accountMeta(context),
  };
}

function buildTaxStatusReply(context: AssistantContext | null, isAuthenticated: boolean): AssistantReply {
  if (!context) {
    return {
      intent: "TAX_STATUS",
      text:
        "El semáforo depende de operaciones confirmadas, pendientes, ventas, costos y clasificación. Sin el contexto de la cuenta solo puedo explicar la regla general: verde significa sin acción detectada, amarillo requiere revisión y rojo indica una acción tributaria potencial.",
      links: [protectedLink("Ver estado tributario", "/obligaciones-tributarias", isAuthenticated)],
    };
  }

  const tax = context.tax;
  let conclusion: string;
  if (context.counts.pendingImports > 0 || context.counts.movementReview > 0 || tax.status === "REVIEW") {
    conclusion = `Tu estado debe permanecer en revisión porque existen ${plural(context.counts.pendingImports + context.counts.movementReview, "antecedente pendiente", "antecedentes pendientes")}.`;
  } else if (tax.status === "POSSIBLE_PAYMENT") {
    const base = formatClp(tax.preliminaryTaxBaseClp ?? tax.netTaxableGainClp);
    conclusion = `Se detecta una base positiva${base ? ` de aproximadamente ${base}` : ""}. Esto indica posible declaración y pago, sujeto a validación de antecedentes.`;
  } else if (tax.status === "DECLARE") {
    conclusion = "Se detectaron eventos que conviene declarar o respaldar, aunque el resumen actual no indica una base positiva de pago.";
  } else if (context.counts.movements === 0) {
    conclusion = "Todavía no hay información suficiente para evaluar el estado tributario.";
  } else {
    conclusion = "Con los datos registrados no se detectan eventos que impliquen pago, pero el resultado sigue condicionado a que la información esté completa.";
  }

  return {
    intent: "TAX_STATUS",
    text: `${conclusion} El análisis considera ${plural(context.counts.movements, "operación", "operaciones")}, ${plural(context.counts.sells, "venta", "ventas")} y ${plural(context.counts.taxEvents, "evento tributario", "eventos tributarios")}.`,
    links: [protectedLink("Ver detalle tributario", "/obligaciones-tributarias", isAuthenticated)],
    meta: accountMeta(context),
  };
}

export function buildAssistantReply(params: {
  input: string;
  pathname: string;
  isAuthenticated: boolean;
  context: AssistantContext | null;
}): AssistantReply {
  const { input, pathname, isAuthenticated, context } = params;
  const { intent, confidence } = detectAssistantIntent(input);
  const meta = accountMeta(context);

  if (intent === "START") return buildNextStepReply(context, isAuthenticated);

  if (intent === "GREETING") {
    const next = buildNextStepReply(context, isAuthenticated);
    return {
      intent,
      text: `Puedo revisar en qué etapa estás, explicar por qué aparece un pendiente, interpretar el estado tributario y llevarte a la acción correcta. ${next.text}`,
      links: next.links,
      meta: next.meta,
    };
  }

  if (intent === "IMPORT") {
    if (context?.counts.pendingImports) {
      return {
        intent,
        text: `La importación ya comenzó: tienes ${plural(context.counts.pendingImports, "registro pendiente", "registros pendientes")}. Antes de cargar más información, conviene revisar y confirmar esos registros para evitar duplicados o resultados incompletos.`,
        links: [protectedLink("Revisar importaciones", "/importaciones", isAuthenticated)],
        meta,
      };
    }

    const exchangeText = context?.exchanges.length
      ? `Ya tienes conectado: ${context.exchanges.map((item) => item.exchange).join(", ")}.`
      : "Puedes comenzar con Binance u otro origen disponible, mediante conexión o archivo.";
    return {
      intent,
      text: `${exchangeText} Después de importar, confirma los registros correctos y resuelve los que queden en revisión; solo entonces Activos y Obligaciones tributarias reflejarán un resultado confiable.`,
      links: [
        protectedLink("Abrir Importaciones", "/importaciones", isAuthenticated),
        protectedLink("Importar desde Binance", "/import/binance", isAuthenticated),
      ],
      meta,
    };
  }

  if (intent === "PENDING") {
    if (context) {
      const total = context.counts.pendingImports + context.counts.movementReview;
      const text = total > 0
        ? `Tienes ${plural(context.counts.pendingImports, "registro importado pendiente", "registros importados pendientes")} y ${plural(context.counts.movementReview, "operación con antecedentes incompletos", "operaciones con antecedentes incompletos")}. Revisa fecha, activo, cantidad, tipo, precio y clasificación antes de confirmar.`
        : `No se detectan pendientes operativos en las ${plural(context.counts.movements, "operación", "operaciones")} registradas. Tu siguiente paso es ${context.nextAction.title.toLowerCase()}.`;
      return {
        intent,
        text,
        links: [{ label: total > 0 ? "Resolver pendientes" : context.nextAction.label, href: total > 0 ? "/importaciones" : context.nextAction.href }],
        meta,
      };
    }
    return {
      intent,
      text: "Los pendientes se resuelven en Importaciones. Revisa fecha, activo, cantidad, tipo de operación, precio y fuente antes de confirmar.",
      links: [protectedLink("Revisar operaciones", "/importaciones", isAuthenticated)],
    };
  }

  if (intent === "ASSETS") {
    const summary = context
      ? `Tu cuenta tiene ${plural(context.counts.assets, "activo detectado", "activos detectados")} respaldados por ${plural(context.counts.movements, "operación", "operaciones")}.`
      : "Activos consolida las posiciones construidas desde operaciones confirmadas.";
    return {
      intent,
      text: `${summary} La sección muestra trazabilidad, cantidad, costo y observaciones; no debe interpretarse como el saldo en tiempo real de un exchange.`,
      links: [protectedLink("Abrir Activos", "/cryptoactivos", isAuthenticated)],
      meta,
    };
  }

  if (intent === "TAX_STATUS") return buildTaxStatusReply(context, isAuthenticated);

  if (intent === "DECLARATION") {
    if (context?.latestDeclaration) {
      return {
        intent,
        text: `Ya existe un respaldo del año tributario ${context.latestDeclaration.taxYear}, generado el ${formatDate(context.latestDeclaration.generatedAt)}. ${context.latestDeclaration.isCurrent ? "Está actualizado respecto de las operaciones registradas." : "Hay operaciones posteriores, por lo que conviene generar una nueva versión."}`,
        links: [protectedLink(context.latestDeclaration.isCurrent ? "Ver respaldos" : "Actualizar respaldo", "/declaraciones", isAuthenticated)],
        meta,
      };
    }
    if (context && (context.counts.pendingImports > 0 || context.counts.movementReview > 0)) {
      return {
        intent,
        text: `Antes de generar el PDF o Excel debes resolver ${plural(context.counts.pendingImports + context.counts.movementReview, "pendiente", "pendientes")}. Un respaldo generado con información incompleta puede cambiar después.`,
        links: [protectedLink("Resolver pendientes", "/importaciones", isAuthenticated)],
        meta,
      };
    }
    return {
      intent,
      text: "El PDF y el Excel se generan en Declaraciones después de confirmar las operaciones y revisar el resultado tributario. El PDF es el documento de lectura y el Excel conserva la trazabilidad estructurada.",
      links: [protectedLink("Generar respaldo", "/declaraciones", isAuthenticated)],
      meta,
    };
  }

  if (intent === "FX") {
    return {
      intent,
      text: "LEDGERA utiliza el dólar observado oficial del Banco Central para la fecha correspondiente. La fecha y la fuente deben acompañar al valor; una cotización anterior no debe presentarse como vigente.",
      links: [protectedLink("Volver al panel", "/panel", isAuthenticated)],
    };
  }

  if (intent === "SECURITY") {
    return {
      intent,
      text: "El segundo factor se administra en Seguridad. Verifica que la hora del dispositivo sea automática y usa el código vigente de seis dígitos. Nunca compartas códigos 2FA, contraseñas, claves privadas ni secretos de API.",
      links: [
        protectedLink("Abrir Seguridad", "/configuracion/seguridad", isAuthenticated),
        { label: "Recuperar 2FA", href: "/recuperar-2fa" },
      ],
    };
  }

  if (intent === "PASSWORD") {
    return {
      intent,
      text: isAuthenticated
        ? "Puedes cambiar la contraseña desde Seguridad. Si no recuerdas la clave, utiliza el flujo de recuperación; LEDGERA nunca debe pedirte la contraseña actual por chat o correo."
        : "Utiliza el flujo de recuperación de contraseña. LEDGERA nunca debe solicitarte la clave actual por chat o correo.",
      links: [
        isAuthenticated
          ? protectedLink("Abrir Seguridad", "/configuracion/seguridad", isAuthenticated)
          : { label: "Recuperar contraseña", href: "/forgot-password" },
      ],
    };
  }

  if (intent === "BILLING") {
    return {
      intent,
      text: "Puedes comparar planes y administrar la facturación desde Configuración. Cualquier cobro, cambio o cancelación debe requerir confirmación explícita antes de ejecutarse.",
      links: [
        { label: "Ver planes", href: "/planes" },
        protectedLink("Administrar facturación", "/configuracion/facturacion", isAuthenticated),
      ],
    };
  }

  if (intent === "SUPPORT") {
    return {
      intent,
      text: "Puedes enviar una opinión de producto o contactar soporte para un caso específico. Describe el problema y la pantalla en que ocurre, pero no incluyas contraseñas, códigos 2FA, claves privadas ni secretos de integración.",
      links: [
        { label: "Enviar opinión", href: "/opinion" },
        { label: "Contactar soporte", href: "/contacto" },
      ],
    };
  }

  if (intent === "PERSONAL_TAX") {
    const accountEvidence = context
      ? `En tu cuenta se observan ${plural(context.counts.sells, "venta", "ventas")}, ${plural(context.counts.staking, "registro de staking", "registros de staking")} y ${plural(context.counts.movementReview, "antecedente pendiente", "antecedentes pendientes")}. `
      : "";
    return {
      intent,
      text: `${accountEvidence}La respuesta tributaria personal puede depender de residencia, domicilio, período, naturaleza de la operación, costo y documentación. Puedo explicar el cálculo de LEDGERA y señalar qué antecedente falta, pero una conclusión jurídica definitiva requiere revisión profesional.`,
      links: [
        protectedLink("Abrir análisis tributario", "/obligaciones-tributarias", isAuthenticated),
        { label: "Solicitar revisión", href: "/contacto" },
      ],
      meta,
    };
  }

  const next = buildNextStepReply(context, isAuthenticated);
  const routeLabel = pathname === "/" ? "la página principal" : `la sección ${pathname}`;
  return {
    intent: "UNKNOWN",
    text: `No quiero inventar una respuesta. Entendí la consulta con baja certeza (${Math.round(confidence * 100)}%). Estás en ${routeLabel}. Lo prioritario según tu cuenta es: ${next.text}`,
    links: next.links,
    meta: next.meta,
  };
}
