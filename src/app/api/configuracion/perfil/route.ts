import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateRut } from "@/modules/tax/application/validateRut";
import { requireAuth } from "@/shared";
import { ok, serverError } from "@/shared/apiResponse";

export const dynamic = "force-dynamic";

type ProfileBody = {
  fullName?: string;
  rut?: string;
  phone?: string;
  address?: string;
  commune?: string;
  country?: string;
};

const MAX_LENGTHS: Record<keyof Required<ProfileBody>, number> = {
  fullName: 120,
  rut: 20,
  phone: 30,
  address: 180,
  commune: 80,
  country: 80,
};

function clean(value: unknown, max: number) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim().slice(0, max);
  return text.length > 0 ? text : null;
}

function normalizeChileanPhone(value: unknown) {
  const text = clean(value, MAX_LENGTHS.phone);
  if (!text) return { valid: true as const, value: null };

  const rawDigits = text.replace(/\D/g, "");
  const digits = rawDigits.startsWith("56") ? rawDigits.slice(2) : rawDigits;

  if (digits.length !== 9) {
    return {
      valid: false as const,
      message: "El teléfono debe contener 9 dígitos chilenos, por ejemplo +56 9 1234 5678.",
    };
  }

  return {
    valid: true as const,
    value: `+56 ${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`,
  };
}

async function requireSession(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  return auth;
}

const profileSelect = {
  id: true,
  email: true,
  full_name: true,
  role: true,
  status: true,
  subscription_plan: true,
  subscription_expires_at: true,
  twoFactorEnabled: true,
  rut: true,
  phone: true,
  address: true,
  commune: true,
  country: true,
} as const;

function serializeProfile(user: {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  subscription_plan: string;
  subscription_expires_at: Date | null;
  twoFactorEnabled: boolean;
  rut: string | null;
  phone: string | null;
  address: string | null;
  commune: string | null;
  country: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    status: user.status,
    subscriptionPlan: user.subscription_plan,
    subscriptionExpiresAt: user.subscription_expires_at,
    twoFactorEnabled: user.twoFactorEnabled,
    rut: user.rut ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    commune: user.commune ?? "",
    country: user.country ?? "Chile",
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    if (session instanceof NextResponse) return session;
    if (!session) return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: profileSelect,
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "Usuario no encontrado." }, { status: 404 });
    }

    return ok(serializeProfile(user), "Perfil cargado correctamente.");
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession(req);
    if (session instanceof NextResponse) return session;
    if (!session) return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });

    const body = (await req.json()) as ProfileBody;
    const fullName = clean(body.fullName, MAX_LENGTHS.fullName);

    if (!fullName) {
      return NextResponse.json(
        { ok: false, message: "El nombre o razón social es obligatorio." },
        { status: 400 },
      );
    }

    const rutText = clean(body.rut, MAX_LENGTHS.rut);
    let normalizedRut: string | null = null;
    if (rutText) {
      const result = validateRut(rutText);
      if (!result.valid || !result.normalized) {
        return NextResponse.json(
          { ok: false, message: result.message ?? "El RUT ingresado no es válido." },
          { status: 400 },
        );
      }
      normalizedRut = result.normalized;
    }

    const normalizedPhone = normalizeChileanPhone(body.phone);
    if (!normalizedPhone.valid) {
      return NextResponse.json(
        { ok: false, message: normalizedPhone.message },
        { status: 400 },
      );
    }

    const updateResult = await prisma.users.updateMany({
      where: { id: session.user.id },
      data: {
        full_name: fullName,
        rut: normalizedRut,
        phone: normalizedPhone.value,
        address: clean(body.address, MAX_LENGTHS.address),
        commune: clean(body.commune, MAX_LENGTHS.commune),
        country: "Chile",
        updated_at: new Date(),
      },
    });

    if (updateResult.count !== 1) {
      return NextResponse.json({ ok: false, message: "Usuario no encontrado." }, { status: 404 });
    }

    const updated = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: profileSelect,
    });

    if (!updated) {
      return NextResponse.json({ ok: false, message: "Usuario no encontrado." }, { status: 404 });
    }

    await prisma.settingsAuditLog.create({
      data: {
        key: "USER_PROFILE",
        oldValue: null,
        newValue: "UPDATED",
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
      },
    });

    return ok(serializeProfile(updated), "Perfil actualizado correctamente.");
  } catch (error) {
    return serverError(error);
  }
}
