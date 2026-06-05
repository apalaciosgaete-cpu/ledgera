import { prisma } from "@/lib/prisma";
import { verifyAuditChain } from "@/modules/tax/application/auditChainService";

export interface IntegrityIssue {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  data: Record<string, unknown>;
}

export interface IntegrityCheckResult {
  status: "OK" | "RISK" | "CRITICAL";
  timestamp: Date;
  issues: IntegrityIssue[];
  summary: {
    total_audit_logs: number;
    chain_verified_logs: number;
    broken_chains: number;
    orphaned_records: number;
  };
}

export async function checkAuditIntegrity(
  userId: string,
): Promise<IntegrityCheckResult> {
  const issues: IntegrityIssue[] = [];

  // 1. Verify Declaration Audit Chain
  const declarationLogs = await prisma.taxDeclarationAuditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (declarationLogs.length > 0) {
    const isChainValid = verifyAuditChain(declarationLogs);
    if (!isChainValid) {
      issues.push({
        type: "BROKEN_DECLARATION_CHAIN",
        severity: "CRITICAL",
        description: "Declaration audit chain integrity violated",
        data: {
          totalLogs: declarationLogs.length,
          chainStartHash: declarationLogs[0]?.currentHash,
          chainEndHash: declarationLogs[declarationLogs.length - 1]?.currentHash,
        },
      });
    }
  }

  // 2. Verify Classification Audit Chain
  const classificationLogs =
    await prisma.taxClassificationAuditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

  if (classificationLogs.length > 0) {
    const isChainValid = verifyAuditChain(classificationLogs);
    if (!isChainValid) {
      issues.push({
        type: "BROKEN_CLASSIFICATION_CHAIN",
        severity: "CRITICAL",
        description: "Classification audit chain integrity violated",
        data: {
          totalLogs: classificationLogs.length,
        },
      });
    }
  }

  // 3. Check for orphaned Declarations (DDJJ sin auditoría)
  const declarations = await prisma.taxDeclaration.findMany({
    where: { userId, status: { not: "DRAFT" } },
  });

  for (const decl of declarations) {
    const auditCount = await prisma.taxDeclarationAuditLog.count({
      where: { declarationId: decl.id },
    });

    if (auditCount === 0) {
      issues.push({
        type: "ORPHANED_DECLARATION",
        severity: "HIGH",
        description: `Declaration ${decl.id} has no audit trail`,
        data: {
          declarationId: decl.id,
          status: decl.status,
          taxYear: decl.taxYear,
        },
      });
    }
  }

  // 4. Check for exportations without hash
  const exportLogs = await prisma.taxDeclarationAuditLog.findMany({
    where: { userId, action: "DECLARATION_EXPORTED", contentHash: null },
  });

  if (exportLogs.length > 0) {
    issues.push({
      type: "EXPORT_WITHOUT_HASH",
      severity: "MEDIUM",
      description: `${exportLogs.length} exports missing content hash`,
      data: {
        count: exportLogs.length,
        lastExportId: exportLogs[0]?.id,
      },
    });
  }

  // 5. Check for TaxEvents without movements
  const taxEventsWithoutMovements = await prisma.taxEvent.findMany({
    where: { userId, movementId: null },
  });

  if (taxEventsWithoutMovements.length > 0) {
    issues.push({
      type: "ORPHANED_TAX_EVENTS",
      severity: "MEDIUM",
      description: `${taxEventsWithoutMovements.length} tax events without linked movement`,
      data: {
        count: taxEventsWithoutMovements.length,
        firstEventId: taxEventsWithoutMovements[0]?.id,
      },
    });
  }

  // 6. Check for Movements with conflicting classifications
  const conflictingMovements = await prisma.portfolioMovement.findMany({
    where: { userId, taxEvent: { is: null }, deletedAt: null },
  });

  if (conflictingMovements.length > 0) {
    issues.push({
      type: "UNCLASSIFIED_MOVEMENTS",
      severity: "LOW",
      description: `${conflictingMovements.length} movements are unclassified`,
      data: {
        count: conflictingMovements.length,
      },
    });
  }

  // Determine status
  let status: "OK" | "RISK" | "CRITICAL" = "OK";
  if (issues.some((i) => i.severity === "CRITICAL")) {
    status = "CRITICAL";
  } else if (issues.some((i) => i.severity === "HIGH")) {
    status = "RISK";
  }

  const totalLogs =
    declarationLogs.length +
    classificationLogs.length +
    (await prisma.taxEventAuditLog.count({ where: { userId } })) +
    (await prisma.movementAuditLog.count({ where: { userId } }));

  const verifiedLogs =
    (declarationLogs.length > 0 ? 1 : 0) +
    (classificationLogs.length > 0 ? 1 : 0) +
    (await prisma.taxEventAuditLog.count({
      where: { userId, previousHash: { not: null } },
    })) +
    (await prisma.movementAuditLog.count({
      where: { userId, previousHash: { not: null } },
    }));

  return {
    status,
    timestamp: new Date(),
    issues,
    summary: {
      total_audit_logs: totalLogs,
      chain_verified_logs: verifiedLogs,
      broken_chains: issues.filter((i) => i.type.includes("CHAIN")).length,
      orphaned_records: issues.filter((i) => i.type.includes("ORPHANED"))
        .length,
    },
  };
}
