import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
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
  [SEC + "SESSION_HOURS"]: { value: "24", category: "security" },
  [SEC + "MAX_LOGIN_ATTEMPTS"]: { value: "5", category: "security" },
  [SEC + "REQUIRE_2FA"]: { value: "false", category: "security" },
};

function allowedKeys(role = "personal") {
  const keys = Object.keys(DEFAULTS);
  if (role === "admin") return keys;
  if (role === "empresa" || role === "contador") return keys.filter((key) => key.startsWith("COMPANY_"));
  return keys.filter((key) => key.startsWith("PN_"));
}

async function requireSession(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  return auth;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    if (session instanceof NextResponse) return session;

    const keys = allowedKeys(session?.user.role);
    const stored = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
    const result: Record<string, string> = {};

    for (const key of keys) {
      const found = stored.find((setting) => setting.key === key);
      result[key] = found?.value ?? DEFAULTS[key].value;
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
    if (!session) return NextResponse.json({}, { status: 401 });

    const { key, value } = await req.json();
    if (!key || value === undefined || value === null) {
      return NextResponse.json({ error: "key y value son requeridos" }, { status: 400 });
    }
    if (!DEFAULTS[key]) {
      return NextResponse.json({ error: "Clave no reconocida" }, { status: 400 });
    }
    if (!allowedKeys(session.user.role).includes(key)) {
      return NextResponse.json({ error: "No tienes permiso para modificar esta clave" }, { status: 403 });
    }

    const normalizedValue = String(value);
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    const oldValue = existing?.value ?? DEFAULTS[key].value;

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: normalizedValue },
      create: { key, value: normalizedValue, category: DEFAULTS[key].category },
    });
    await prisma.settingsAuditLog.create({
      data: { key, oldValue, newValue: normalizedValue, userId: session.user.id, userEmail: session.user.email, action: "UPDATE" },
    });

    return ok({ key, value: normalizedValue }, "Configuración actualizada correctamente.");
  } catch (error) {
    return serverError(error);
  }
}
