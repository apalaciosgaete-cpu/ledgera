import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { confirmImport } from "@/modules/integrations/binance/infrastructure/exchangeImportRepository";
import { fetchHistoricalCryptoPrice } from "@/modules/integrations/binance/application/fetchHistoricalCryptoPrice";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import { generateAnnualTaxSummary } from "@/modules/tax/application/generateAnnualTaxSummary";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AUTO_CONFIRM_TYPES = new Set([
  "SPOT_BUY",
  "SPOT_SELL",
  "EXTERNAL_DEPOSIT",
  "EXTERNAL_WITHDRAW",
]);

const MONTH_ES = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

type ParsedNormalized = {
  externalId:   string;
  movementType: string;
  symbol:       string;
  quantity:     number;
  priceUsd:     number;
  feeUsd:       number;
  occurredAt:   string;
  quoteAsset?:  string;
};

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body  = await request.json() as { year?: number; month?: number };
    const year  = typeof body.year  === "number" ? body.year  : null;
    const month = typeof body.month === "number" ? body.month : null;

    if (!year || !month || month < 1 || month > 12) {
      return fail("year y month válidos son obligatorios.", 400);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month,     1);

    const pending = await prisma.exchangeImportRecord.findMany({
      where: {
        userId:     auth.user.id,
        status:     "PENDING",
        occurredAt: { gte: startDate, lt: endDate },
      },
      orderBy: { occurredAt: "asc" },
    });

    let confirmed     = 0;
    let skippedReview = 0;
    const errors: string[] = [];

    for (const record of pending) {
      try {
        const eventType = record.normalizedEventType ?? "UNKNOWN";

        if (
          !AUTO_CONFIRM_TYPES.has(eventType) ||
          record.taxTreatment    === "REVIEW" ||
          record.inventoryEffect === "REVIEW"
        ) {
          await prisma.exchangeImportRecord.update({
            where: { id: record.id },
            data:  { status: "REVIEW" },
          });
          skippedReview++;
          continue;
        }

        const normalized = JSON.parse(record.normalizedJson ?? "{}") as ParsedNormalized;
        const occurredAt  = new Date(normalized.occurredAt);
        const isTransfer  = eventType === "EXTERNAL_DEPOSIT" || eventType === "EXTERNAL_WITHDRAW";
        const isBtcQuoted = !isTransfer && normalized.quoteAsset === "BTC";

        const priceUsd = (isTransfer || isBtcQuoted)
          ? await fetchHistoricalCryptoPrice(normalized.symbol, occurredAt)
          : normalized.priceUsd;

        const movement = await prisma.portfolioMovement.create({
          data: {
            userId:     auth.user.id,
            type:       normalized.movementType,
            symbol:     normalized.symbol,
            quantity:   normalized.quantity,
            priceUsd,
            feeUsd:     normalized.feeUsd,
            executedAt: occurredAt,
            source:     record.provider,
            externalId: normalized.externalId,
          },
        });

        await confirmImport(record.id, auth.user.id, movement.id);
        confirmed++;
      } catch (err) {
        errors.push(`${record.externalId}: ${err instanceof Error ? err.message : "error"}`);
      }
    }

    let taxRebuilt = false;
    if (confirmed > 0) {
      const rebuild = await rebuildTaxEvents(auth.user.id);
      taxRebuilt = rebuild.ok;
      if (taxRebuilt) await generateAnnualTaxSummary(auth.user.id);
    }

    const label    = `${MONTH_ES[month] ?? month} ${year}`;
    const reviewMsg = skippedReview > 0 ? `, ${skippedReview} requieren revisión manual` : "";

    return ok(
      { confirmed, skippedReview, taxRebuilt, errors },
      `${label}: ${confirmed} operaciones confirmadas${reviewMsg}.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
