import { prisma } from "@/lib/prisma";
import { getUserById } from "@/modules/identity/infrastructure/userRepository";
import { normalizePlan, Plan } from "@/modules/subscription/domain/planFeatures";

const FREE_IMPORT_SOURCE_LIMIT = 1;

export class ImportSourceLimitError extends Error {
  readonly code = "IMPORT_SOURCE_LIMIT";
  readonly status = 403;

  constructor() {
    super(
      "El plan Gratuito permite una sola fuente de importación. Activa Personal para agregar otro exchange o proveedor.",
    );
    this.name = "ImportSourceLimitError";
  }
}

export function normalizeImportSource(source: string): string {
  const normalized = source.trim().toUpperCase();

  if (normalized.startsWith("BINANCE")) return "BINANCE";
  if (normalized === "BUDA.COM") return "BUDA";

  return normalized;
}

export function isImportSourceLimitError(
  error: unknown,
): error is ImportSourceLimitError {
  return error instanceof ImportSourceLimitError;
}

export async function enforceImportSourceLimit(input: {
  userId: string;
  source: string;
}): Promise<void> {
  const user = await getUserById(input.userId);
  if (!user) throw new Error("Usuario no encontrado.");

  if (user.role === "admin") return;

  const plan = normalizePlan(user.subscriptionPlan);
  if (plan !== Plan.FREE) return;

  const requestedSource = normalizeImportSource(input.source);
  if (!requestedSource) return;

  const connections = await prisma.exchangeConnection.findMany({
    where: { userId: input.userId },
    select: { exchange: true },
  });

  const configuredSources = new Set(
    connections
      .map((connection) => normalizeImportSource(connection.exchange))
      .filter(Boolean),
  );

  if (configuredSources.has(requestedSource)) return;
  if (configuredSources.size < FREE_IMPORT_SOURCE_LIMIT) return;

  throw new ImportSourceLimitError();
}
