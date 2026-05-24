import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";

type ExportType = "matched" | "pending" | "ignored" | "audit";

const EXPORT_TYPES = new Set<ExportType>(["matched", "pending", "ignored", "audit"]);

const CSV_HEADERS = [
  "fecha_banco", "banco", "descripcion", "monto_clp", "direccion", "estado",
  "fecha_crypto", "tipo_crypto", "simbolo", "cantidad", "precio_usd", "origen_crypto",
  "confidence", "motivo", "fecha_conciliacion",
];

function esc(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells.map(esc).join(",");
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().replace("T", " ").slice(0, 19);
}

function csvResponse(lines: string[], filename: string): NextResponse {
  const body = [row(CSV_HEADERS), ...lines].join("\r\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as ExportType | null;

  if (!type || !EXPORT_TYPES.has(type)) {
    return fail("Parámetro type inválido. Usa: matched, pending, ignored, audit.", 400);
  }

  const userId = auth.user.id;
  const today  = new Date().toISOString().slice(0, 10);

  // ── matched ────────────────────────────────────────────────────────────────
  if (type === "matched") {
    const bankMovements = await prisma.bankMovement.findMany({
      where:   { userId, status: "MATCHED" },
      orderBy: { occurredAt: "desc" },
    });

    const portfolioIds = bankMovements
      .map(m => m.matchedPortfolioMovementId)
      .filter((id): id is string => id !== null);

    const portfolioMovements = portfolioIds.length > 0
      ? await prisma.portfolioMovement.findMany({ where: { id: { in: portfolioIds } } })
      : [];

    const portfolioById = new Map(portfolioMovements.map(p => [p.id, p]));

    const lines = bankMovements.map(m => {
      const p = m.matchedPortfolioMovementId
        ? (portfolioById.get(m.matchedPortfolioMovementId) ?? null)
        : null;
      return row([
        fmtDate(m.occurredAt),
        m.bankName,
        m.description,
        m.amountClp,
        m.direction,
        m.status,
        p ? fmtDate(p.executedAt) : null,
        p?.type,
        p?.symbol,
        p?.quantity,
        p?.priceUsd,
        p?.source,
        m.matchedConfidence,
        m.matchedReason,
        fmtDateTime(m.matchedAt),
      ]);
    });

    return csvResponse(lines, `conciliacion-matched-${today}.csv`);
  }

  // ── pending ────────────────────────────────────────────────────────────────
  if (type === "pending") {
    const bankMovements = await prisma.bankMovement.findMany({
      where:   { userId, status: { in: ["IMPORTED", "REVIEW"] } },
      orderBy: { occurredAt: "desc" },
    });

    const lines = bankMovements.map(m => row([
      fmtDate(m.occurredAt),
      m.bankName,
      m.description,
      m.amountClp,
      m.direction,
      m.status,
      null, null, null, null, null, null, null, null, null,
    ]));

    return csvResponse(lines, `conciliacion-pending-${today}.csv`);
  }

  // ── ignored ────────────────────────────────────────────────────────────────
  if (type === "ignored") {
    const bankMovements = await prisma.bankMovement.findMany({
      where:   { userId, status: "IGNORED" },
      orderBy: { updatedAt: "desc" },
    });

    const lines = bankMovements.map(m => row([
      fmtDate(m.occurredAt),
      m.bankName,
      m.description,
      m.amountClp,
      m.direction,
      m.status,
      null, null, null, null, null, null, null, null, null,
    ]));

    return csvResponse(lines, `conciliacion-ignored-${today}.csv`);
  }

  // ── audit ──────────────────────────────────────────────────────────────────
  const logs = await prisma.bankReconciliationAuditLog.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    take:    2000,
  });

  const bankIds      = [...new Set(logs.map(l => l.bankMovementId))];
  const portfolioIds = [...new Set(
    logs.map(l => l.portfolioMovementId).filter((id): id is string => id !== null),
  )];

  const [bankMovements, portfolioMovements] = await Promise.all([
    prisma.bankMovement.findMany({ where: { id: { in: bankIds } } }),
    portfolioIds.length > 0
      ? prisma.portfolioMovement.findMany({ where: { id: { in: portfolioIds } } })
      : Promise.resolve([]),
  ]);

  const bankById      = new Map(bankMovements.map(m => [m.id, m]));
  const portfolioById = new Map(portfolioMovements.map(m => [m.id, m]));

  const lines = logs.map(l => {
    const b = bankById.get(l.bankMovementId) ?? null;
    const p = l.portfolioMovementId ? (portfolioById.get(l.portfolioMovementId) ?? null) : null;
    return row([
      b ? fmtDate(b.occurredAt)  : null,
      b?.bankName,
      b?.description,
      b?.amountClp,
      b?.direction,
      l.action,
      p ? fmtDate(p.executedAt) : null,
      p?.type,
      p?.symbol,
      p?.quantity,
      p?.priceUsd,
      p?.source,
      l.confidence,
      l.reason,
      fmtDateTime(l.createdAt),
    ]);
  });

  return csvResponse(lines, `conciliacion-audit-${today}.csv`);
}
