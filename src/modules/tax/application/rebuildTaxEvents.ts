// src/modules/tax/application/rebuildTaxEvents.ts
import { prisma } from "@/lib/prisma";
import { TAX_ENGINE_METADATA } from "@/modules/tax/domain/taxEngineVersion";
import { resolveTaxCategory } from "@/modules/tax/domain/resolveTaxCategory";
import { createTaxPeriodSnapshot } from "@/modules/tax/infrastructure/taxPeriodSnapshotRepository";

interface InventoryLot {
  quantity:    number;
  unitCostUsd: number;
}

interface MovementDto {
  id:         string;
  type:       string;
  symbol:     string;
  quantity:   number | string;
  priceUsd:   number | string;
  feeUsd:     number | string;
  executedAt: Date | string;
}

interface TaxEventCreateInput {
  movementId:           string;
  userId:               string;
  symbol:               string;
  eventType:            string;
  quantity:             number;
  effectiveTaxCategory: string;
  averageCostUsdAtSale: number;
  proceedsGrossUsd:     number;
  proceedsNetUsd:       number;
  costBasisUsd:         number;
  feeUsd:               number;
  realizedPnlUsd:       number;
  usdClp:               number;
  proceedsGrossClp:     number;
  proceedsNetClp:       number;
  costBasisClp:         number;
  feeClp:               number;
  realizedPnlClp:       number;
  executedAt:           Date;
  taxYear:              number;
}

interface TaxEventLite {
  id:                   string;
  movementId:           string;
  effectiveTaxCategory: string;
  realizedPnlUsd:       number | null;
  realizedPnlClp:       number | null;
  executedAt:           Date;
}

interface RebuildResult {
  ok:      boolean;
  message: string;
  data?: {
    totalMovements:   number;
    totalEvents:      number;
    warnings:         Array<{ movementId: string; symbol: string; message: string }>;
    taxEngineVersion: string;
  };
  error?: unknown;
}

function round(value: number, decimals = 8) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeSymbol(symbol: string): string {
  return String(symbol ?? "").trim().toUpperCase();
}

function addBuyLot(params: {
  inventory:  Record<string, InventoryLot[]>;
  symbol:     string;
  quantity:   number;
  priceUsd:   number;
  feeUsd:     number;
}) {
  const { inventory, symbol, quantity, priceUsd, feeUsd } = params;
  const totalCostUsd = quantity * priceUsd + feeUsd;
  const unitCostUsd  = quantity > 0 ? totalCostUsd / quantity : 0;
  inventory[symbol]  = inventory[symbol] ?? [];
  inventory[symbol].push({ quantity, unitCostUsd });
}

function consumeFifoLots(params: {
  inventory: Record<string, InventoryLot[]>;
  symbol:    string;
  quantity:  number;
}) {
  const { inventory, symbol, quantity } = params;
  const lots            = inventory[symbol] ?? [];
  let remainingQuantity = quantity;
  let costBasisUsd      = 0;

  while (remainingQuantity > 0 && lots.length > 0) {
    const lot              = lots[0];
    const consumedQuantity = Math.min(remainingQuantity, lot.quantity);
    costBasisUsd          += consumedQuantity * lot.unitCostUsd;
    lot.quantity          -= consumedQuantity;
    remainingQuantity     -= consumedQuantity;
    if (lot.quantity <= 0.00000001) lots.shift();
  }

  const consumedQuantity     = quantity - remainingQuantity;
  const averageCostUsdAtSale = consumedQuantity > 0 ? costBasisUsd / consumedQuantity : 0;

  return { consumedQuantity, missingQuantity: remainingQuantity, averageCostUsdAtSale, costBasisUsd };
}

async function fetchMindicadorRate(date: Date): Promise<number | null> {
  try {
    const d       = new Date(date);
    const day     = String(d.getUTCDate()).padStart(2, "0");
    const month   = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year    = d.getUTCFullYear();
    const url     = `https://mindicador.cl/api/dolar/${day}-${month}-${year}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data  = await response.json();
    const valor = data?.serie?.[0]?.valor;
    return typeof valor === "number" && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

async function getUsdClp(date: Date): Promise<number> {
  const dateStr = date.toISOString().slice(0, 10);
  const dateKey = new Date(`${dateStr}T00:00:00.000Z`);

  try {
    const exact = await prisma.fxRate.findFirst({
      where: { currency: "USD", date: dateKey },
    });
    if (exact && Number(exact.valueClp) > 0) return Number(exact.valueClp);
  } catch { /* continuar */ }

  const rate = await fetchMindicadorRate(date);
  if (rate && rate > 0) {
    try {
      await prisma.fxRate.upsert({
        where:  { currency_date: { currency: "USD", date: dateKey } },
        update: { valueClp: rate, source: "mindicador" },
        create: { currency: "USD", date: dateKey, valueClp: rate, source: "mindicador" },
      });
    } catch { /* no bloquear */ }
    return rate;
  }

  try {
    const closest = await prisma.fxRate.findFirst({
      where:   { currency: "USD", date: { lte: dateKey } },
      orderBy: { date: "desc" },
    });
    if (closest && Number(closest.valueClp) > 0) return Number(closest.valueClp);
  } catch { /* continuar */ }

  return 950;
}

async function snapshotBeforeRebuild(userId: string): Promise<void> {
  try {
    const existingEvents = await prisma.taxEvent.findMany({
      where: { userId },
      select: {
        id:                   true,
        movementId:           true,
        effectiveTaxCategory: true,
        realizedPnlUsd:       true,
        realizedPnlClp:       true,
        executedAt:           true,
      },
    });

    if (existingEvents.length === 0) return;

    const yearMap: Record<number, TaxEventLite[]> = {};
    for (const e of existingEvents) {
      const year    = new Date(e.executedAt).getUTCFullYear();
      yearMap[year] = yearMap[year] ?? [];
      yearMap[year].push(e as TaxEventLite);
    }

    for (const year of Object.keys(yearMap).map(Number)) {
      const events          = yearMap[year];
      const snapshotPayload = {
        year,
        userId,
        type:      "PRE_REBUILD_SNAPSHOT",
        taxEngine: TAX_ENGINE_METADATA,
        createdAt: new Date().toISOString(),
        totals: {
          totalEvents: events.length,
          totalPnlUsd: events.reduce((acc, e) => acc + (Number(e.realizedPnlUsd) ?? 0), 0),
          totalPnlClp: events.reduce((acc, e) => acc + (Number(e.realizedPnlClp) ?? 0), 0),
        },
        events,
      };
      await createTaxPeriodSnapshot({ year, snapshotPayload });
    }
  } catch (error) {
    console.warn("[rebuildTaxEvents] snapshot previo falló:", error);
  }
}

export async function rebuildTaxEvents(userId: string): Promise<RebuildResult> {
  try {
    const movements = (await prisma.portfolioMovement.findMany({
      where:   { deletedAt: null, userId },
      orderBy: [{ executedAt: "asc" }, { id: "asc" }],
    })) as MovementDto[];

    await snapshotBeforeRebuild(userId);
    await prisma.taxEvent.deleteMany({ where: { userId } });

    const inventory:        Record<string, InventoryLot[]>                                = {};
    const events:           TaxEventCreateInput[]                                          = [];
    const warnings:         Array<{ movementId: string; symbol: string; message: string }> = [];
    const yearSellCount:    Record<number, number>                                         = {};
    const symbolSellCount:  Record<string, number>                                         = {};
    const suggestedUpdates: Array<{ movementId: string; suggestedTaxCategory: string }>    = [];

    for (const movement of movements) {
      const type     = movement.type;
      const symbol   = normalizeSymbol(movement.symbol);
      const quantity = Number(movement.quantity) || 0;
      const priceUsd = Number(movement.priceUsd) || 0;
      const feeUsd   = Number(movement.feeUsd)   || 0;

      if (!symbol)                                     continue;
      if (!Number.isFinite(quantity) || quantity <= 0) continue;
      if (!Number.isFinite(priceUsd) || priceUsd < 0)  continue;
      if (!Number.isFinite(feeUsd)   || feeUsd   < 0)  continue;

      if (type === "BUY") {
        addBuyLot({ inventory, symbol, quantity, priceUsd, feeUsd });
        continue;
      }

      if (type !== "SELL") continue;

      const executedAt =
        movement.executedAt instanceof Date
          ? movement.executedAt
          : new Date(movement.executedAt);

      const year = executedAt.getUTCFullYear();
      yearSellCount[year]     = (yearSellCount[year]     ?? 0) + 1;
      symbolSellCount[symbol] = (symbolSellCount[symbol] ?? 0) + 1;

      const proceedsGrossUsd = quantity * priceUsd;
      const proceedsNetUsd   = proceedsGrossUsd - feeUsd;
      const fifo             = consumeFifoLots({ inventory, symbol, quantity });

      if (fifo.missingQuantity > 0.00000001) {
        warnings.push({
          movementId: movement.id,
          symbol,
          message: "Venta con inventario insuficiente para cubrir completamente FIFO.",
        });
      }

      const costBasisUsd   = round(fifo.costBasisUsd, 8);
      const realizedPnlUsd = round(proceedsNetUsd - costBasisUsd, 8);

      const resolved = resolveTaxCategory({
        eventType:       "SELL",
        realizedPnlUsd,
        yearlySellCount: yearSellCount[year]     ?? 0,
        symbolSellCount: symbolSellCount[symbol] ?? 0,
      });

      suggestedUpdates.push({
        movementId:           movement.id,
        suggestedTaxCategory: resolved.suggestedTaxCategory,
      });

      const usdClp = await getUsdClp(executedAt);

      events.push({
        movementId:           movement.id,
        userId,
        symbol,
        eventType:            "SELL",
        quantity:             round(fifo.consumedQuantity, 8),
        effectiveTaxCategory: resolved.suggestedTaxCategory,
        averageCostUsdAtSale: round(fifo.averageCostUsdAtSale, 8),
        proceedsGrossUsd:     round(proceedsGrossUsd, 8),
        proceedsNetUsd:       round(proceedsNetUsd, 8),
        costBasisUsd,
        feeUsd:               round(feeUsd, 8),
        realizedPnlUsd,
        usdClp,
        proceedsGrossClp:     round(proceedsGrossUsd * usdClp, 4),
        proceedsNetClp:       round(proceedsNetUsd   * usdClp, 4),
        costBasisClp:         round(costBasisUsd      * usdClp, 4),
        feeClp:               round(feeUsd            * usdClp, 4),
        realizedPnlClp:       round(realizedPnlUsd    * usdClp, 4),
        executedAt,
        taxYear:              year,
      });
    }

    if (events.length > 0) {
      await prisma.taxEvent.createMany({ data: events });
    }

    for (const update of suggestedUpdates) {
      await prisma.portfolioMovement.updateMany({
        where: { id: update.movementId, userId },
        data:  { suggestedTaxCategory: update.suggestedTaxCategory },
      }).catch(() => { /* campo puede no existir */ });
    }

    return {
      ok:      true,
      message: "Eventos tributarios reconstruidos correctamente",
      data: {
        totalMovements:   movements.length,
        totalEvents:      events.length,
        warnings,
        taxEngineVersion: TAX_ENGINE_METADATA.version,
      },
    };
  } catch (error) {
    console.error("[rebuildTaxEvents]", error);
    return {
      ok:      false,
      message: "Error al reconstruir eventos tributarios",
      error,
    };
  }
}