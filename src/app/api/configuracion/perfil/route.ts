import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
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

function normalizeRut(value: unknown) {
  const text = clean(value, MAX_LENGTHS.rut);
  if (!text) return null;
  return text.toUpperCase().replace(/[^0-9K.-]/g, "");
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
    if (!session) return NextResponse.json({ ok: false, message: "No autorizado." }, { status: 401 });

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
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
      },
    });

    if (!user) return NextResponse.json({ ok: false, message: "Usuario no encontrado." }, { status: 404 });

    return ok(
      {
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
      },
      "Perfil cargado correctamente.",
    );
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

    const updated = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        full_name: fullName,
        rut: normalizeRut(body.rut),
        phone: clean(body.phone, MAX_LENGTHS.phone),
        address: clean(body.address, MAX_LENGTHS.address),
        commune: clean(body.commune, MAX_LENGTHS.commune),
        country: clean(body.country, MAX_LENGTHS.country) ?? "Chile",
        updated_at: new Date(),
      },
      select: {
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
      },
    });

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

    return ok(
      {
        id: updated.id,
        email: updated.email,
        fullName: updated.full_name,
        role: updated.role,
        status: updated.status,
        subscriptionPlan: updated.subscription_plan,
        subscriptionExpiresAt: updated.subscription_expires_at,
        twoFactorEnabled: updated.twoFactorEnabled,
        rut: updated.rut ?? "",
        phone: updated.phone ?? "",
        address: updated.address ?? "",
        commune: updated.commune ?? "",
        country: updated.country ?? "Chile",
      },
      "Perfil actualizado correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
