import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { listTaxPeriodAuditLogsByYear } from "@/modules/tax/infrastructure/taxPeriodAuditLogRepository";
import { listTaxPeriodSnapshotsByYear } from "@/modules/tax/infrastructure/taxPeriodSnapshotRepository";
import { createReportValidation } from "@/modules/reporting/application/createReportValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function esc(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(esc).join(";");
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function actionLabel(action: string) {
  switch (action) {
    case "CLOSE":  return "Cierre de periodo";
    case "REOPEN": return "Reapertura de periodo";
    default:       return action;
  }
}

function periodStatusLabel(status: string) {
  switch (status) {
    case "OPEN":     return "Abierto";
    case "CLOSED":   return "Cerrado";
    case "REOPENED": return "Reabierto";
    default:         return status;
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionFromRequest(req);
    if (!auth) return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });

    const yearParam = req.nextUrl.searchParams.get("year");
    const year      = yearParam ? Number(yearParam) : new Date().getFullYear();
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ ok: false, message: "Año inválido." }, { status: 400 });
    }

    const [closure, logs, snapshots] = await Promise.all([
      prisma.taxPeriodClose.findUnique({
        where: { userId_periodYear: { userId: auth.user.id, periodYear: year } },
      }),
      listTaxPeriodAuditLogsByYear(year),
      listTaxPeriodSnapshotsByYear(year),
    ]);

    const status = !closure ? "OPEN" : closure.reopenedAt ? "REOPENED" : "CLOSED";

    const payload = {
      year, status,
      closedAt:   closure?.closedAt?.toISOString()   ?? null,
      reopenedAt: closure?.reopenedAt?.toISOString() ?? null,
      logsCount:  logs.length,
      snapsCount: snapshots.length,
    };

    const validation = await createReportValidation({
      reportType: "AUDIT_TRAIL_CSV",
      userId: auth.user.id,
      periodYear: year,
      payload,
    });

    const appUrl          = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
    const verificationUrl = `${appUrl}/verify/report/${validation.hash}`;

    const lines: string[] = [];

    lines.push(row("TRAZABILIDAD DE AUDITORÍA TRIBUTARIA — LEDGERA"));
    lines.push(row("Periodo", year));
    lines.push(row("Estado", periodStatusLabel(status)));
    lines.push(row("Fecha cierre",    closure?.closedAt   ? formatDateTime(closure.closedAt)   : "Sin cerrar"));
    lines.push(row("Fecha reapertura", closure?.reopenedAt ? formatDateTime(closure.reopenedAt) : "—"));
    lines.push(row("Motivo cierre",   closure?.closedReason ?? "—"));
    lines.push(row("Generado",        formatDateTime(new Date())));
    lines.push(row("Hash verificación", validation.hash));
    lines.push(row("URL verificación",  verificationUrl));
    lines.push("");

    lines.push(row("HISTORIAL DE ACCIONES DEL PERIODO"));
    lines.push(row("Fecha", "Acción", "Actor", "Motivo"));
    if (logs.length === 0) {
      lines.push(row("Sin registros"));
    } else {
      logs.forEach((log) => {
        lines.push(row(
          formatDateTime(log.createdAt),
          actionLabel(log.action),
          log.actorEmail ?? "—",
          log.reason     ?? "—",
        ));
      });
    }
    lines.push("");

    lines.push(row("REGISTROS DE CIERRE"));
    lines.push(row("#", "Fecha", "Hash de integridad"));
    if (snapshots.length === 0) {
      lines.push(row("Sin registros"));
    } else {
      snapshots.forEach((snap, i) => {
        lines.push(row(i + 1, formatDateTime(snap.createdAt), snap.contentHash));
      });
    }

    const csv = "﻿" + lines.join("\r\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ledgera-trazabilidad-auditoria-${year}.csv"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (error) {
    console.error("audit export csv error:", error);
    return NextResponse.json({ ok: false, message: "Error al generar el CSV de trazabilidad." }, { status: 500 });
  }
}
