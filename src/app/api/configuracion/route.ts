import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SECURITY_POLICY_SETTINGS,
} from "@/modules/security/domain/securityPolicy";
import { requireAuth } from "@/shared";
import { ok, serverError } from "@/shared/apiResponse";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

const SEC = "SECURITY_";
const DEFAULTS: Record<string, { value: string; category: string }> = {
  TAX_FIFO_ENABLED: { value: "true", category: "tax" },
  TAX_STRICT_MODE: { value: "false", category: "tax" },
  TAX_DEFAULT_FIAT: { value: "CLP", category: "tax" },
  TAX_FX_PROVIDER: { value: "mindicador", category: "tax" },
  TAX_AUTO_REBUILD: { value: "false", category: "tax" },
  TAX_ALLOW_NEGATIVE_INVENTORY: { value: "false", category: "tax" },
  PN_NOMBRE: { value: "", category: "persona" },
  PN_RUT: { value: "", category: "persona" },
  PN_DIRECCION: { value: "", category: "persona" },
  PN_COMUNA: { value: "", category: "persona" },
  PN_CIUDAD: { value: "", category: "persona" },
  PN_PAIS: { value: "Chile", category: "persona" },
  PN_TELEFONO: { value: "", category: "persona" },
  PN_EMAIL: { value: "", category: "persona" },
  COMPANY_RAZON_SOCIAL: { value: "", category: "company" },
  COMPANY_RUT: { value: "", category: "company" },
  COMPANY_GIRO: { value: "", category: "company" },
  COMPANY_DIRECCION: { value: "", category: "company" },
  COMPANY_REPRESENTANTE: { value: "", category: "company" },
  COMPANY_EMAIL: { value: "", category: "company" },
  [SEC + "SESSION_HOURS"]: {
    value: DEFAULT_SECURITY_POLICY_SETTINGS.SECURITY_SESSION_HOURS,
    category: "security",
  },
  [SEC + "MAX_LOGIN_ATTEMPTS"]: {
    value: DEFAULT_SECURITY_POLICY_SETTINGS.SECURITY_MAX_LOGIN_ATTEMPTS,
    category: "security",
  },
  [SEC + "REQUIRE_2FA"]: { value: "false", category: "security" },
};

type ConfigUpdate = {
  key: string;
  value: string;
};

function allowedKeys(role = "personal") {
  const keys = Object.keys(DEFAULTS);
  if (role === "admin") return keys;
  if (role === "empresa" || role === "contador") {
    return keys.filter((key) => key.startsWith("COMPANY_"));
  }
  return keys.filter((key) => key.startsWith("PN_"));
}

async function requireSession(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  return auth;
}

function badRequest(message: string) {
  return NextResponse.json(
    { ok: false, message, error: message, data: null },
    { status: 400 },
  );
}

function forbidden(message: string) {
  return NextResponse.json(
    { ok: false, message, error: message, data: null },
    { status: 403 },
  );
}

function validateSecurityValue(key: string, value: string): string | null {
  if (key === "SECURITY_SESSION_HOURS") {
    const hours = Number(value);
    if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
      return "La expiración de sesión debe ser un número entero entre 1 y 720 horas.";
    }
  }

  if (key === "SECURITY_MAX_LOGIN_ATTEMPTS") {
    const attempts = Number(value);
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 20) {
      return "El máximo de intentos debe ser un número entero entre 1 y 20.";
    }
  }

  if (key === "SECURITY_REQUIRE_2FA" && !["true", "false"].includes(value)) {
    return "La política de 2FA debe ser verdadera o falsa.";
  }

  return null;
}

function parseUpdates(body: unknown): ConfigUpdate[] | NextResponse {
  if (typeof body !== "object" || body === null) {
    return badRequest("El cuerpo de la solicitud no es válido.");
  }

  const record = body as {
    key?: unknown;
    value?: unknown;
    updates?: unknown;
  };

  const rawUpdates = Array.isArray(record.updates)
    ? record.updates
    : [{ key: record.key, value: record.value }];

  if (rawUpdates.length === 0) {
    return badRequest("No se recibieron cambios para guardar.");
  }

  if (rawUpdates.length > 20) {
    return badRequest("Se recibieron demasiados cambios en una sola solicitud.");
  }

  const deduplicated = new Map<string, ConfigUpdate>();

  for (const rawUpdate of rawUpdates) {
    if (typeof rawUpdate !== "object" || rawUpdate === null) {
      return badRequest("Uno de los cambios no tiene un formato válido.");
    }

    const candidate = rawUpdate as { key?: unknown; value?: unknown };
    const key = typeof candidate.key === "string" ? candidate.key.trim() : "";

    if (!key || candidate.value === undefined || candidate.value === null) {
      return badRequest("Cada cambio debe incluir una clave y un valor.");
    }

    if (!DEFAULTS[key]) {
      return badRequest(`La clave ${key} no está reconocida.`);
    }

    const value = String(candidate.value).trim();
    const validationError = validateSecurityValue(key, value);
    if (validationError) return badRequest(validationError);

    deduplicated.set(key, { key, value });
  }

  return [...deduplicated.values()];
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    if (session instanceof NextResponse) return session;

    const keys = allowedKeys(session?.user.role);
    const stored = await prisma.systemSetting.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    });
    const storedByKey = new Map(stored.map((setting) => [setting.key, setting.value]));
    const result: Record<string, string> = {};

    for (const key of keys) {
      result[key] = storedByKey.get(key) ?? DEFAULTS[key].value;
    }

    return ok(result, "Configuración cargada correctamente.");
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession(req);
    if (session instanceof NextResponse) return session;
    if (!session) {
      return NextResponse.json(
        { ok: false, message: "No autenticado.", data: null },
        { status: 401 },
      );
    }

    const updates = parseUpdates(await req.json());
    if (updates instanceof NextResponse) return updates;

    const permittedKeys = new Set(allowedKeys(session.user.role));
    const unauthorizedKey = updates.find((update) => !permittedKeys.has(update.key));
    if (unauthorizedKey) {
      return forbidden(`No tienes permiso para modificar ${unauthorizedKey.key}.`);
    }

    await prisma.$transaction(async (transaction) => {
      const existingRows = await transaction.systemSetting.findMany({
        where: { key: { in: updates.map((update) => update.key) } },
        select: { key: true, value: true },
      });
      const existingByKey = new Map(
        existingRows.map((setting) => [setting.key, setting.value]),
      );

      for (const update of updates) {
        const oldValue = existingByKey.get(update.key) ?? DEFAULTS[update.key].value;

        await transaction.systemSetting.upsert({
          where: { key: update.key },
          update: { value: update.value },
          create: {
            key: update.key,
            value: update.value,
            category: DEFAULTS[update.key].category,
          },
        });

        await transaction.settingsAuditLog.create({
          data: {
            key: update.key,
            oldValue,
            newValue: update.value,
            userId: session.user.id,
            userEmail: session.user.email,
            action: "UPDATE",
          },
        });
      }
    });

    return ok(
      { updates },
      updates.length === 1
        ? "Configuración actualizada correctamente."
        : "Configuraciones actualizadas correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
