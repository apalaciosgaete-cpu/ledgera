import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getUserById, updateUserProfile } from "@/modules/identity/infrastructure/userRepository";

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fail(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, message, data: null }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);

  const user = await getUserById(auth.user.id);
  if (!user) return fail("Usuario no encontrado.", 404);

  return ok({
    fullName: user.fullName,
    email:    user.email,
    rut:      user.rut,
    phone:    user.phone,
    address:  user.address,
    commune:  user.commune,
    country:  user.country ?? "Chile",
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return fail("No autorizado.", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Cuerpo inválido.", 400);
  }

  if (typeof body !== "object" || body === null) {
    return fail("Cuerpo inválido.", 400);
  }

  const { fullName, rut, phone, address, commune, country } = body as Record<string, unknown>;

  if (typeof fullName !== "string" || !fullName.trim()) {
    return fail("El nombre completo es requerido.", 400);
  }

  const updated = await updateUserProfile({
    userId:  auth.user.id,
    fullName: fullName.trim(),
    rut:     typeof rut === "string" && rut.trim() ? rut.trim() : null,
    phone:   typeof phone === "string" && phone.trim() ? phone.trim() : null,
    address: typeof address === "string" && address.trim() ? address.trim() : null,
    commune: typeof commune === "string" && commune.trim() ? commune.trim() : null,
    country: typeof country === "string" && country.trim() ? country.trim() : null,
  });

  if (!updated) return fail("No se pudo actualizar el perfil.", 500);

  return ok({
    fullName: updated.fullName,
    email:    updated.email,
    rut:      updated.rut,
    phone:    updated.phone,
    address:  updated.address,
    commune:  updated.commune,
    country:  updated.country ?? "Chile",
  });
}
