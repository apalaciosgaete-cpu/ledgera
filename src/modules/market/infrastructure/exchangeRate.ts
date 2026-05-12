import "server-only";
import { prisma } from "@/lib/prisma";
import type { MovementDto } from "@/shared";
import { resolveTaxCategory } from "@/modules/tax/domain/resolveTaxCategory";
import { createTaxPeriodSnapshot } from "@/modules/tax/infrastructure/taxPeriodSnapshotRepository";
import { TAX_ENGINE_METADATA } from "@/modules/tax/domain/taxEngineVersion";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type InventoryLot = {
  quantity: number;
  unitCostUsd: number;
};

type TaxEventCreateInput = {
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: Date;
  quantity: number;
  effectiveTaxCategory: string;
  averageCostUsdAtSale: number;
  proceedsGrossUsd: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  feeUsd: number;
  realizedPnlUsd: number;
  usdClp: number;
  proceedsGrossClp: number;
  proceedsNetClp: number;
  costBasisClp: number;
  feeClp: number;
  realizedPnlClp: number;
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function round(value: number, decimals = 8) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase();
}

function addBuyLot(params: {
  inventory: Record<string, InventoryLot[]>;
  symbol: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
}) {
  const { inventory, symbol, quantity, priceUsd, feeUsd } = params;
  const totalCostUsd = quantity * priceUsd + feeUsd;
  const unitCostUsd = quantity > 0 ? totalCostUsd / quantity : 0;
  inventory[symbol] = inventory[symbol] ?? [];
  inventory[symbol].push({ quantity, unitCostUsd });
}

function consumeFifoLots(params: {
  inventory: Record<string, InventoryLot[]>;
  symbol: string;
  quantity: number;
}) {
  const { inventory, symbol, quantity } = params;
  const lots = inventory[symbol] ?? [];
  let remainingQuantity = quantity;
  let costBasisUsd = 0;

  while (remainingQuantity > 0 && lots.length > 0) {
    const lot = lots[0];
    const consumedQuantity = Math.min(remainingQuantity, lot.quantity);
    costBasisUsd += consumedQuantity * lot.unitCostUsd;
    lot.quantity -= consumedQuantity;
    remainingQuantity -= consumedQuantity;
    if (lot.quantity <= 0.00000001) lots.shift();
  }

  const consumedQuantity = quantity - remainingQuantity;
  const averageCostUsdAtSale =
    consumedQuantity > 0 ? costBasisUsd / consumedQuantity : 0;

  return { consumedQuantity, missingQuantity: remainingQuantity, averageCostUsdAtSale, costBasisUsd };
}

// â”€â”€â”€ FX helper con persistencia automÃ¡tica â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function fetchMindicadorRate(date: Date): Promise<number | null> {
  try {
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    const dateStr = `${day}-${month}-${year}`;
    const url = `https://mindicador.cl/api/dolar/${dateStr}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = await response.json();
    const valor = data?.serie?.[0]?.valor;
    if (typeof valor === "number" && valor > 0) return valor;
    return null;
  } catch {
    return null;
  }
}

async function getUsdClp(date: Date): Promise<number> {
  const dateStr = date.toISOString().slice(0, 10);
  const dateKey = new Date(`${dateStr}T00:00:00.000Z`);

  // 1. Buscar en BD primero (cache)
  try {
    const cached = await prisma.fxRate.findFirst({
      where: { currency: "USD", date: { lte: dateKey } },
      orderBy: { date: "desc" },
    });
    if (cached && Number(cached.valueClp) > 0) return Number(cached.valueClp);
  } catch { /* continuar */ }

  // 2. Consultar mindicador.cl
  const rate = await fetchMindicadorRate(date);
  if (rate && rate > 0) {
    try {
      await prisma.fxRate.upsert({
        where: { currency_date: { currency: "USD", date: dateKey } },
        update: { valueClp: rate, source: "mindicador" },
        create: { currency: "USD", date: dateKey, valueClp: rate, source: "mindicador" },
      });
    } catch { /* no bloquear si falla la persistencia */ }
    return rate;
  }

  // 3. Fallback
  return 950;
}

// â”€â”€â”€ Snapshot previo al rebuild â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function snapshotBeforeRebuild(): Promise<void> {
  try {
    const existingEvents = await prisma.taxEvent.findMany({
      orderBy: [{ executedAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        movementId: true,
        symbol: true,
        executedAt: true,
        effectiveTaxCategory: true,
        realizedPnlUsd: true,
        realizedPnlClp: true,
        usdClp: true,
      },
    });

    if (existingEvents.length === 0) return;

    const yearMap: Record<number, typeof existingEvents> = {};
    for (const e of existingEvents) {
      const year = new Date(e.executedAt).getUTCFullYear();
      yearMap[year] = yearMap[year] ?? [];
      yearMap[year].push(e);
    }

    for (const year of Object.keys(yearMap).map(Number)) {
      const events = yearMap[year];
      const snapshotPayload = {
        year,
        type: "PRE_REBUILD_SNAPSHOT",
        taxEngine: TAX_ENGINE_METADATA,
        createdAt: new Date().toISOString(),
        totals: {
          totalEvents: events.length,
          totalPnlUsd: events.reduce((acc, e) => acc + (e.realizedPnlUsd ?? 0), 0),
          totalPnlClp: events.reduce((acc, e) => acc + (e.realizedPnlClp ?? 0), 0),
        },
        events,
      };
      await createTaxPeriodSnapshot({ year, snapshotPayload });
    }
  } catch (error) {
    console.warn("[rebuildTaxEvents] snapshot previo fallÃ³:", error);
  }
}

// â”€â”€â”€ Motor principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function rebuildTaxEvents() {
  try {
    const movements = (await prisma.portfolioMovement.findMany({
      where: { deletedAt: null },
      orderBy: [{ executedAt: "asc" }, { id: "asc" }],
    })) as MovementDto[];

    // â”€â”€â”€ Snapshot previo antes de borrar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await snapshotBeforeRebuild();

    // â”€â”€â”€ Borrar eventos actuales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await prisma.taxEvent.deleteMany();

    const inventory: Record<string, InventoryLot[]> = {};
    const events: TaxEventCreateInput[] = [];
    const warnings: Array<{ movementId: string; symbol: string; message: string }> = [];

    const yearSellCount: Record<number, number> = {};
    const symbolSellCount: Record<string, number> = {};
    const suggestedUpdates: Array<{ movementId: string; suggestedTaxCategory: string }> = [];

    for (const movement of movements) {
      const type = movement.type;
      const symbol = normalizeSymbol(movement.symbol);
      const quantity = Number(movement.quantity) || 0;
      const priceUsd = Number(movement.priceUsd) || 0;
      const feeUsd = Number(movement.feeUsd) || 0;

      if (!symbol) continue;
      if (!Number.isFinite(quantity) || quantity <= 0) continue;
      if (!Number.isFinite(priceUsd) || priceUsd < 0) continue;
      if (!Number.isFinite(feeUsd) || feeUsd < 0) continue;

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
      yearSellCount[year] = (yearSellCount[year] ?? 0) + 1;
      symbolSellCount[symbol] = (symbolSellCount[symbol] ?? 0) + 1;

      const proceedsGrossUsd = quantity * priceUsd;
      const proceedsNetUsd = proceedsGrossUsd - feeUsd;

      const fifo = consumeFifoLots({ inventory, symbol, quantity });

      if (fifo.missingQuantity > 0.00000001) {
        warnings.push({
          movementId: movement.id,
          symbol,
          message: "Venta con inventario insuficiente para cubrir completamente FIFO.",
        });
      }

      const costBasisUsd = round(fifo.costBasisUsd, 8);
      const realizedPnlUsd = round(proceedsNetUsd - costBasisUsd, 8);

      const resolved = resolveTaxCategory({
        eventType: "SELL",
        realizedPnlUsd,
        yearlySellCount: yearSellCount[year],
        symbolSellCount: symbolSellCount[symbol],
      });

      suggestedUpdates.push({
        movementId: movement.id,
        suggestedTaxCategory: resolved.suggestedTaxCategory,
      });

      const effectiveTaxCategory = (
        movement.appliedTaxCategory ||
        resolved.suggestedTaxCategory
      ).trim().toUpperCase();

      const usdClp = await getUsdClp(executedAt);

      events.push({
        movementId: movement.id,
        eventType: "SELL",
        symbol,
        executedAt,
        quantity: round(quantity, 8),
        effectiveTaxCategory,
        averageCostUsdAtSale: round(fifo.averageCostUsdAtSale, 8),
        proceedsGrossUsd: round(proceedsGrossUsd, 8),
        proceedsNetUsd: round(proceedsNetUsd, 8),
        costBasisUsd,
        feeUsd: round(feeUsd, 8),
        realizedPnlUsd,
        usdClp,
        proceedsGrossClp: round(proceedsGrossUsd * usdClp, 4),
        proceedsNetClp: round(proceedsNetUsd * usdClp, 4),
        costBasisClp: round(costBasisUsd * usdClp, 4),
        feeClp: round(feeUsd * usdClp, 4),
        realizedPnlClp: round(realizedPnlUsd * usdClp, 4),
      });
    }

    if (events.length > 0) {
      await prisma.taxEvent.createMany({ data: events });
    }

    for (const update of suggestedUpdates) {
      await prisma.portfolioMovement.updateMany({
        where: { id: update.movementId, appliedTaxCategory: null },
        data: { suggestedTaxCategory: update.suggestedTaxCategory },
      });
    }

    return {
      ok: true,
      message: "Eventos tributarios reconstruidos correctamente",
      data: {
        totalMovements: movements.length,
        totalEvents: events.length,
        warnings,
        taxEngineVersion: TAX_ENGINE_METADATA.version,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: "Error al reconstruir eventos tributarios",
    };
  }
}
