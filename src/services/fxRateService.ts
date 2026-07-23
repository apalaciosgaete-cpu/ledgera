import { prisma } from "@/lib/prisma";

const MINDICADOR_API = "https://mindicador.cl/api/dolar";
const FETCH_TIMEOUT_MS = 5_000;
const CHILE_TIME_ZONE = "America/Santiago";

interface DolarObservadoResponse {
  serie?: Array<{ fecha: string; valor: number }>;
}

type RateOptions = {
  forceRefresh?: boolean;
};

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toChileDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) return toUtcDateKey(date);
  return `${year}-${month}-${day}`;
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

function readRateForDate(data: DolarObservadoResponse, dateKey: string): number | null {
  const series = Array.isArray(data.serie) ? data.serie : [];
  const exact = series.find((entry) => entry.fecha?.slice(0, 10) === dateKey);
  const candidate = exact ?? series[0];
  const value = Number(candidate?.valor);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export class FxRateService {
  static async getDolarObservado(fecha: Date, options: RateOptions = {}): Promise<number> {
    const dateKey = toUtcDateKey(fecha);
    const date = startOfUtcDay(dateKey);

    if (!options.forceRefresh) {
      const cached = await prisma.fxRate.findUnique({
        where: { currency_date: { currency: "USD", date } },
      });

      if (cached && cached.valueClp > 0) {
        return cached.valueClp;
      }
    }

    const response = await fetch(`${MINDICADOR_API}/${formatMindicadorDate(date)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Mindicador error: ${response.status}`);
    }

    const data = (await response.json()) as DolarObservadoResponse;
    const value = readRateForDate(data, dateKey);

    if (!value) {
      throw new Error(`No hay dolar observado para ${dateKey}`);
    }

    await prisma.fxRate.upsert({
      where: { currency_date: { currency: "USD", date } },
      update: { valueClp: value, source: "mindicador.cl" },
      create: { currency: "USD", date, valueClp: value, source: "mindicador.cl" },
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

  static async syncDailyRate(): Promise<number> {
    const today = startOfUtcDay(toChileDateKey(new Date()));
    return this.getDolarObservado(today, { forceRefresh: true });
  }
}
