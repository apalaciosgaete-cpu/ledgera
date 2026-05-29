import { prisma } from "@/lib/prisma";
import { createStableSha256Hash } from "@/shared/hash";

export type IntegrityIssue = {
  code:       string;
  severity:   "LOW" | "MEDIUM" | "HIGH";
  entityType: string;
  entityId:   string;
  message:    string;
};

export type IntegrityCheckResult = {
  ok:     boolean;
  issues: IntegrityIssue[];
};

// ── Checks ────────────────────────────────────────────────────────────────────

async function checkConfirmedExchangeRecords(userId: string, issues: IntegrityIssue[]): Promise<void> {
  const confirmed = await prisma.exchangeImportRecord.findMany({
    where:  { userId, status: "CONFIRMED" },
    select: { id: true, movementId: true },
    take:   500,
  });
  const orphans = confirmed.filter((r) => !r.movementId);
  for (const r of orphans) {
    issues.push({
      code:       "EXCHANGE_CONFIRMED_NO_MOVEMENT",
      severity:   "HIGH",
      entityType: "ExchangeImportRecord",
      entityId:   r.id,
      message:    "Registro confirmado sin movimiento de portafolio vinculado.",
    });
  }
}

async function checkMatchedBankMovements(userId: string, issues: IntegrityIssue[]): Promise<void> {
  const matched = await prisma.bankMovement.findMany({
    where:  { userId, status: "MATCHED" },
    select: { id: true, matchedPortfolioMovementId: true },
    take:   500,
  });
  const orphans = matched.filter((m) => !m.matchedPortfolioMovementId);
  for (const m of orphans) {
    issues.push({
      code:       "BANK_MATCHED_NO_PORTFOLIO",
      severity:   "HIGH",
      entityType: "BankMovement",
      entityId:   m.id,
      message:    "Movimiento bancario marcado como conciliado sin movimiento de portafolio.",
    });
  }

  const withPm = matched.filter((m) => m.matchedPortfolioMovementId);
  const pmIds  = withPm.map((m) => m.matchedPortfolioMovementId!);
  if (pmIds.length > 0) {
    const existing = await prisma.portfolioMovement.findMany({
      where:  { id: { in: pmIds }, userId, deletedAt: null },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((p) => p.id));
    for (const m of withPm) {
      if (!existingIds.has(m.matchedPortfolioMovementId!)) {
        issues.push({
          code:       "BANK_PORTFOLIO_MOVEMENT_MISSING",
          severity:   "HIGH",
          entityType: "BankMovement",
          entityId:   m.id,
          message:    "Movimiento de portafolio vinculado no existe o fue eliminado.",
        });
      }
    }
  }
}

async function checkPortfolioMovementsWithoutTaxEvents(userId: string, issues: IntegrityIssue[]): Promise<void> {
  const movements = await prisma.portfolioMovement.findMany({
    where:  { userId, deletedAt: null, source: { not: "MANUAL" } },
    select: { id: true, type: true, executedAt: true, taxEvent: { select: { id: true } } },
    take:   500,
  });
  const noTax = movements.filter((m) => !m.taxEvent);
  for (const m of noTax) {
    issues.push({
      code:       "PORTFOLIO_NO_TAX_EVENT",
      severity:   "MEDIUM",
      entityType: "PortfolioMovement",
      entityId:   m.id,
      message:    `Movimiento ${m.type} sin evento tributario generado.`,
    });
  }
}

async function checkIntegrityChainHashes(userId: string, issues: IntegrityIssue[]): Promise<void> {
  const entries = await prisma.integrityChainEntry.findMany({
    where:   { userId },
    orderBy: [{ entityType: "asc" }, { entityId: "asc" }, { sequence: "asc" }],
    take:    1000,
  });

  const byEntity = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = `${e.entityType}:${e.entityId}`;
    if (!byEntity.has(key)) byEntity.set(key, []);
    byEntity.get(key)!.push(e);
  }

  for (const [, chain] of byEntity) {
    for (let i = 0; i < chain.length; i++) {
      const entry    = chain[i];
      const expected = createStableSha256Hash({
        userId:       entry.userId,
        entityType:   entry.entityType,
        entityId:     entry.entityId,
        action:       entry.action,
        sequence:     entry.sequence,
        previousHash: entry.previousHash,
        payloadHash:  entry.payloadHash,
      });
      if (entry.currentHash !== expected) {
        issues.push({
          code:       "INTEGRITY_HASH_MISMATCH",
          severity:   "HIGH",
          entityType: entry.entityType,
          entityId:   entry.entityId,
          message:    `Hash de integridad no válido en secuencia ${entry.sequence}.`,
        });
      }
      if (i > 0 && entry.previousHash !== chain[i - 1].currentHash) {
        issues.push({
          code:       "INTEGRITY_CHAIN_BROKEN",
          severity:   "HIGH",
          entityType: entry.entityType,
          entityId:   entry.entityId,
          message:    `Cadena rota: previousHash en secuencia ${entry.sequence} no coincide con el hash anterior.`,
        });
      }
    }
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function checkIntegrityChain(userId: string): Promise<IntegrityCheckResult> {
  const issues: IntegrityIssue[] = [];

  await Promise.all([
    checkConfirmedExchangeRecords(userId, issues),
    checkMatchedBankMovements(userId, issues),
    checkPortfolioMovementsWithoutTaxEvents(userId, issues),
    checkIntegrityChainHashes(userId, issues),
  ]);

  return { ok: issues.length === 0, issues };
}
