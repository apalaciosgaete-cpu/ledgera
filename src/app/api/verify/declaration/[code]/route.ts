import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyDeclarationHash } from "@/modules/tax-dj/application/verifyDeclarationHash";
import { verifyAuditChain } from "@/modules/tax/application/auditChainService";

type RouteContext = {
  params: Promise<{ code: string }>;
};

type PublicTaxDeclarationRecord = {
  id: string;
  userId: string;
  taxYear: number;
  declarationType: string;
  status: string;
  source: string;
  payloadJson: string;
  contentHash: string;
  generatedAt: Date;
  confirmedAt: Date | null;
  voidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function getDeclarationTypeLabel(type: string): string {
  switch (type) {
    case "DJ_CRYPTO_SUMMARY":
      return "Declaración resumen de criptoactivos";
    case "DJ_REALIZED_GAINS":
      return "Declaración de ganancias realizadas";
    case "DJ_FOREIGN_EXCHANGE_ACTIVITY":
      return "Declaración de actividad en exchanges extranjeros";
    case "DJ_TAX_SUPPORTING_LEDGER":
      return "Libro auxiliar tributario";
    default:
      return "Declaración tributaria LEDGERA";
  }
}

function getDeclarationStatusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "REVIEW":
      return "En revisión";
    case "CONFIRMED":
      return "Confirmada";
    case "EXPORTED":
      return "Exportada";
    case "VOIDED":
      return "Anulada";
    default:
      return "Estado no reconocido";
  }
}

function formatDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function parsePayloadJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeVerificationCode(value: string): string {
  return decodeURIComponent(value).trim().toLowerCase();
}

function isValidVerificationCode(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const normalizedCode = normalizeVerificationCode(code ?? "");

    if (!isValidVerificationCode(normalizedCode)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Código de verificación de declaración inválido.",
          data: null,
        },
        { status: 400 },
      );
    }

    const declaration = (await prisma.taxDeclaration.findFirst({
      where: {
        contentHash: normalizedCode,
      },
      orderBy: [{ generatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        userId: true,
        taxYear: true,
        declarationType: true,
        status: true,
        source: true,
        payloadJson: true,
        contentHash: true,
        generatedAt: true,
        confirmedAt: true,
        voidedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })) as PublicTaxDeclarationRecord | null;

    if (!declaration) {
      return NextResponse.json(
        {
          ok: false,
          message: "Declaración no encontrada o código inválido.",
          data: null,
        },
        { status: 404 },
      );
    }

    const payloadJson = parsePayloadJson(declaration.payloadJson);
    const integrity = verifyDeclarationHash({
      payloadJson,
      expectedHash: declaration.contentHash,
    });
    const auditLogs = await prisma.taxDeclarationAuditLog.findMany({
      where: {
        userId: declaration.userId,
        declarationId: declaration.id,
      },
      orderBy: { createdAt: "asc" },
    });
    const auditChainValid =
      auditLogs.length > 0 &&
      auditLogs.every((log) => Boolean(log.currentHash)) &&
      verifyAuditChain(
        auditLogs.filter(
          (log): log is typeof auditLogs[number] & { currentHash: string } =>
            log.currentHash !== null,
        ),
      );
    const isVoided = declaration.status === "VOIDED" || Boolean(declaration.voidedAt);
    const isPubliclyValid = integrity.valid && auditChainValid && !isVoided;

    return NextResponse.json({
      ok: true,
      message: isPubliclyValid
        ? "Declaración validada correctamente."
        : "La declaración existe, pero no se encuentra vigente o presenta inconsistencias.",
      data: {
        code: declaration.contentHash,
        declaration: {
          id: declaration.id,
          taxYear: declaration.taxYear,
          declarationType: declaration.declarationType,
          declarationTypeLabel: getDeclarationTypeLabel(declaration.declarationType),
          status: declaration.status,
          statusLabel: getDeclarationStatusLabel(declaration.status),
          source: declaration.source,
          generatedAt: declaration.generatedAt.toISOString(),
          generatedAtLabel: formatDate(declaration.generatedAt),
          confirmedAt: declaration.confirmedAt?.toISOString() ?? null,
          confirmedAtLabel: formatDate(declaration.confirmedAt),
          voidedAt: declaration.voidedAt?.toISOString() ?? null,
          voidedAtLabel: formatDate(declaration.voidedAt),
          createdAt: declaration.createdAt.toISOString(),
          updatedAt: declaration.updatedAt.toISOString(),
        },
        verification: {
          isValid: isPubliclyValid,
          integrityValid: integrity.valid,
          auditChainValid,
          auditEventCount: auditLogs.length,
          expectedHash: integrity.expectedHash,
          computedHash: integrity.computedHash,
          revokedOrVoided: isVoided,
        },
      },
    });
  } catch (error) {
    console.error("[verify/declaration]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible validar la declaración.",
        data: null,
      },
      { status: 500 },
    );
  }
}
