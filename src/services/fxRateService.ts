import { prisma } from "@/lib/prisma";

const MINDICADOR_API = "https://mindicador.cl/api/dolar";
const DAY_MS = 24 * 60 * 60 * 1000;

interface DolarObservadoResponse {
  serie?: Array<{ fecha: string; valor: number }>;
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function formatMindicadorDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
}

function previousBusinessDay(date: Date): Date {
  const adjusted = new Date(date);
  const day = adjusted.getUTCDay();

  if (day === 0) adjusted.setUTCDate(adjusted.getUTCDate() - 2);
  if (day === 6) adjusted.setUTCDate(adjusted.getUTCDate() - 1);

  return adjusted;
}

export class FxRateService {
  static async getDolarObservado(fecha: Date): Promise<number> {
    const dateKey = toUtcDateKey(fecha);
    const date = startOfUtcDay(dateKey);

    const cached = await prisma.fxRate.findUnique({
      where: { currency_date: { currency: "USD", date } },
    });

    if (cached && cached.valueClp > 0) {
      return cached.valueClp;
    }

    const response = await fetch(`${MINDICADOR_API}/${formatMindicadorDate(date)}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Mindicador error: ${response.status}`);
    }

    const data = (await response.json()) as DolarObservadoResponse;
    const value = data.serie?.[0]?.valor;

    if (!value || value <= 0) {
      throw new Error(`No hay dolar observado para ${dateKey}`);
    }

    await prisma.fxRate.upsert({
      where: { currency_date: { currency: "USD", date } },
      update: { valueClp: value, source: "mindicador" },
      create: { currency: "USD", date, valueClp: value, source: "mindicador" },
    });

    return value;
  }

  static async getRateForTransaction(fecha: Date): Promise<number> {
    return this.getDolarObservado(previousBusinessDay(fecha));
  }

  static async getRateForTransactionWithFallback(fecha: Date): Promise<number> {
    const adjusted = previousBusinessDay(fecha);

    try {
      return await this.getDolarObservado(adjusted);
    } catch {
      const date = startOfUtcDay(toUtcDateKey(adjusted));
      const closest = await prisma.fxRate.findFirst({
        where: { currency: "USD", date: { lte: date } },
        orderBy: { date: "desc" },
      });

      if (closest && closest.valueClp > 0) {
        return closest.valueClp;
      }

      throw new Error(`No hay tipo de cambio disponible para ${toUtcDateKey(adjusted)}`);
    }
  }

  static async syncDailyRate(): Promise<void> {
    const today = startOfUtcDay(toUtcDateKey(new Date()));
    const tomorrow = new Date(today.getTime() + DAY_MS);

    const existing = await prisma.fxRate.findFirst({
      where: {
        currency: "USD",
        date: { gte: today, lt: tomorrow },
      },
    });

    if (existing) return;

    await this.getRateForTransaction(today);
  }
}
