import { prisma } from "@/lib/prisma";

const MINDICADOR_API = "https://mindicador.cl/api/dolar";
const BCCH_BDE_URL = "https://si3.bcentral.cl/Siete/ES/Siete/Cuadro/CAP_TIPO_CAMBIO/MN_TIPO_CAMBIO4/DOLAR_OBS_ADO";
const FETCH_TIMEOUT_MS = 7_500;
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

function formatBcchTableDate(dateKey: string): string | null {
  const [year, month, day] = dateKey.split("-").map(Number);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  if (!year || !month || !day || !months[month - 1]) return null;
  return `${String(day).padStart(2, "0")}.${months[month - 1]}.${year}`;
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
  const value = Number(exact?.valor);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&oacute;|&#243;|&#x0*F3;/gi, "ó")
    .replace(/&aacute;|&#225;|&#x0*E1;/gi, "á")
    .replace(/&eacute;|&#233;|&#x0*E9;/gi, "é")
    .replace(/&iacute;|&#237;|&#x0*ED;/gi, "í")
    .replace(/&uacute;|&#250;|&#x0*FA;/gi, "ú")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBcchBdeRate(html: string, dateKey: string): number | null {
  const expectedDate = formatBcchTableDate(dateKey);
  if (!expectedDate) return null;

  const normalized = htmlToPlainText(html)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const dateMatches = normalized.match(/\b\d{2}\.(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.\d{4}\b/g) ?? [];
  const dateIndex = dateMatches.indexOf(expectedDate);
  if (dateIndex < 0) return null;

  const seriesIndex = normalized.indexOf("dolar observado");
  if (seriesIndex < 0) return null;

  const values = normalized
    .slice(seriesIndex)
    .match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g) ?? [];
  const rawValue = values[dateIndex];
  if (!rawValue) return null;

  const value = Number(rawValue.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function fetchBcchCurrentRate(dateKey: string): Promise<number | null> {
  try {
    const response = await fetch(BCCH_BDE_URL, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "LEDGERA/1.0 (+https://ledgera.cl)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) return null;
    return parseBcchBdeRate(await response.text(), dateKey);
  } catch {
    return null;
  }
}

async function persistRate(date: Date, value: number, source: string): Promise<void> {
  await prisma.fxRate.upsert({
    where: { currency_date: { currency: "USD", date } },
    update: { valueClp: value, source },
    create: { currency: "USD", date, valueClp: value, source },
  });
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

    await persistRate(date, value, "mindicador.cl");
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
    const dateKey = toChileDateKey(new Date());
    const today = startOfUtcDay(dateKey);
    const officialValue = await fetchBcchCurrentRate(dateKey);

    if (officialValue) {
      await persistRate(today, officialValue, "bcentral.cl/bde");
      return officialValue;
    }

    return this.getDolarObservado(today, { forceRefresh: true });
  }
}
