type DeclarationPayload = {
  summary?: {
    totalEvents?: number;
    totalSymbols?: number;
    totalProceedsUsd?: number;
    totalProceedsClp?: number;
    totalCostBasisUsd?: number;
    totalCostBasisClp?: number;
    totalFeesUsd?: number;
    totalFeesClp?: number;
    totalRealizedPnlUsd?: number;
    totalRealizedPnlClp?: number;
    pendingClassificationEvents?: number;
  };
  bySymbol?: Array<{
    symbol: string;
    events: number;
    quantity: number;
    proceedsUsd: number;
    proceedsClp: number;
    costBasisUsd: number;
    costBasisClp: number;
    feesUsd: number;
    feesClp: number;
    realizedPnlUsd: number;
    realizedPnlClp: number;
  }>;
  events?: Array<{
    taxEventId: string;
    movementId: string;
    eventType: string;
    symbol: string;
    executedAt: string;
    quantity: number;
    effectiveTaxCategory: string;
    proceedsNetUsd: number;
    proceedsNetClp: number;
    costBasisUsd: number;
    costBasisClp: number;
    feeUsd: number;
    feeClp: number;
    realizedPnlUsd: number;
    realizedPnlClp: number;
    usdClp: number;
  }>;
};

export type ExportDeclarationCsvInput = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  contentHash: string;
  generatedAt: Date | string;
  confirmedAt: Date | string | null;
  payloadJson: string;
};

function escapeCsv(value: unknown) {
  const str = String(value ?? "");

  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function parsePayload(value: string): DeclarationPayload {
  try {
    const parsed = JSON.parse(value) as DeclarationPayload;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeIsoDate(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function row(values: unknown[]) {
  return values.map(escapeCsv).join(",");
}

export function buildDeclarationCsv(input: ExportDeclarationCsvInput) {
  const payload = parsePayload(input.payloadJson);
  const rows: string[] = [];

  rows.push(row(["Documento", "Borrador DDJJ LEDGERA"]));
  rows.push(row(["ID declaración", input.id]));
  rows.push(row(["Año tributario", input.taxYear]));
  rows.push(row(["Tipo declaración", input.declarationType]));
  rows.push(row(["Estado", input.status]));
  rows.push(row(["Hash contenido", input.contentHash]));
  rows.push(row(["Generado", safeIsoDate(input.generatedAt)]));
  rows.push(row(["Confirmado", safeIsoDate(input.confirmedAt)]));
  rows.push("");

  rows.push(row(["Resumen"]));
  rows.push(row(["Total eventos", payload.summary?.totalEvents ?? 0]));
  rows.push(row(["Total activos", payload.summary?.totalSymbols ?? 0]));
  rows.push(row(["Ingresos USD", payload.summary?.totalProceedsUsd ?? 0]));
  rows.push(row(["Ingresos CLP", payload.summary?.totalProceedsClp ?? 0]));
  rows.push(row(["Costo USD", payload.summary?.totalCostBasisUsd ?? 0]));
  rows.push(row(["Costo CLP", payload.summary?.totalCostBasisClp ?? 0]));
  rows.push(row(["Fees USD", payload.summary?.totalFeesUsd ?? 0]));
  rows.push(row(["Fees CLP", payload.summary?.totalFeesClp ?? 0]));
  rows.push(row(["Resultado USD", payload.summary?.totalRealizedPnlUsd ?? 0]));
  rows.push(row(["Resultado CLP", payload.summary?.totalRealizedPnlClp ?? 0]));
  rows.push(row(["Eventos pendientes", payload.summary?.pendingClassificationEvents ?? 0]));
  rows.push("");

  rows.push(
    row([
      "Activo",
      "Eventos",
      "Cantidad",
      "Ingresos USD",
      "Ingresos CLP",
      "Costo USD",
      "Costo CLP",
      "Fees USD",
      "Fees CLP",
      "Resultado USD",
      "Resultado CLP",
    ]),
  );

  for (const item of payload.bySymbol ?? []) {
    rows.push(
      row([
        item.symbol,
        item.events,
        item.quantity,
        item.proceedsUsd,
        item.proceedsClp,
        item.costBasisUsd,
        item.costBasisClp,
        item.feesUsd,
        item.feesClp,
        item.realizedPnlUsd,
        item.realizedPnlClp,
      ]),
    );
  }

  rows.push("");

  rows.push(
    row([
      "ID evento",
      "ID movimiento",
      "Tipo evento",
      "Activo",
      "Fecha ejecución",
      "Cantidad",
      "Clasificación",
      "Ingreso neto USD",
      "Ingreso neto CLP",
      "Costo USD",
      "Costo CLP",
      "Fee USD",
      "Fee CLP",
      "Resultado USD",
      "Resultado CLP",
      "USD/CLP",
    ]),
  );

  for (const event of payload.events ?? []) {
    rows.push(
      row([
        event.taxEventId,
        event.movementId,
        event.eventType,
        event.symbol,
        event.executedAt,
        event.quantity,
        event.effectiveTaxCategory,
        event.proceedsNetUsd,
        event.proceedsNetClp,
        event.costBasisUsd,
        event.costBasisClp,
        event.feeUsd,
        event.feeClp,
        event.realizedPnlUsd,
        event.realizedPnlClp,
        event.usdClp,
      ]),
    );
  }

  return "\uFEFF" + rows.join("\n");
}

export function buildDeclarationCsvFilename(input: {
  taxYear: number;
  declarationType: string;
  id: string;
}) {
  return `ledgera-ddjj-${input.taxYear}-${input.declarationType.toLowerCase()}-${input.id.slice(
    0,
    8,
  )}.csv`;
}