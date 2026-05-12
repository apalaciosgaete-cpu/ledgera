// src/app/api/configuracion/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/shared/apiResponse";

const DEFAULTS: Record<string, { value: string; category: string }> = {
  TAX_FIFO_ENABLED:             { value: "true",             category: "tax" },
  TAX_STRICT_MODE:              { value: "false",            category: "tax" },
  TAX_DEFAULT_FIAT:             { value: "CLP",              category: "tax" },
  TAX_FX_PROVIDER:              { value: "mindicador",       category: "tax" },
  TAX_AUTO_REBUILD:             { value: "false",            category: "tax" },
  TAX_ALLOW_NEGATIVE_INVENTORY: { value: "false",            category: "tax" },
  COMPANY_RAZON_SOCIAL:         { value: "",                 category: "company" },
  COMPANY_RUT:                  { value: "",                 category: "company" },
  COMPANY_GIRO:                 { value: "",                 category: "company" },
  COMPANY_DIRECCION:            { value: "",                 category: "company" },
  COMPANY_REPRESENTANTE:        { value: "",                 category: "company" },
  COMPANY_EMAIL:                { value: "admin@ledgera.cl", category: "company" },
  SECURITY_SESSION_HOURS:       { value: "24",               category: "security" },
  SECURITY_MAX_LOGIN_ATTEMPTS:  { value: "5",                category: "security" },
  SECURITY_REQUIRE_2FA:         { value: "false",            category: "security" },
};

const ALLOWED_KEYS_BY_ROLE: Record<string, string[]> = {
  admin:    Object.keys(DEFAULTS),
  empresa:  Object.keys(DEFAULTS).filter(k => k.startsWith("COMPANY_")),
  contador: Object.keys(DEFAULTS).filter(k => k.startsWith("COMPANY_")),
  personal: [],
};

export async function GET() {
  try {
    const stored = await prisma.systemSetting.findMany();
    const result: Record<string, string> = {};
    for (const [key, def] of Object.entries(DEFAULTS)) {
      const found = stored.find((s: { key: string; value: string }) => s.key === key);
      result[key] = found ? found.value : def.value;
    }
    return ok(result, "Configuración cargada correctamente.");
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value, role, userId, userEmail } = body;

    if (!key || value === undefined || value === null) {
      return NextResponse.json({ error: "key y value son requeridos" }, { status: 400 });
    }

    if (!DEFAULTS[key]) {
      return NextResponse.json({ error: "Clave no reconocida" }, { status: 400 });
    }

    const allowedKeys = ALLOWED_KEYS_BY_ROLE[role ?? "personal"] ?? [];
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: "No tienes permiso para modificar esta clave" }, { status: 403 });
    }

    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    const oldValue = existing?.value ?? DEFAULTS[key].value;

    await prisma.systemSetting.upsert({
      where:  { key },
      update: { value },
      create: { key, value, category: DEFAULTS[key].category },
    });

    await prisma.settingsAuditLog.create({
      data: {
        key,
        oldValue,
        newValue:  value,
        userId:    userId    ?? "system",
        userEmail: userEmail ?? "system",
        action:    "UPDATE",
      },
    });

    return ok({ key, value }, "Configuración actualizada correctamente.");
  } catch (error) {
    return serverError(error);
  }
}