import { getUsers, createUser, getUserByEmail } from "@/modules/identity/infrastructure/userRepository";
import { hashPassword } from "@/modules/identity/application/password";
import { sanitizeUser } from "@/modules/identity/application/sanitizeUser";
import { createPortfolio } from "@/modules/portfolio/infrastructure/portfolioRepository";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { sendWelcomeEmail } from "@/lib/emails/welcome";

const validRoles = ["personal", "contador", "empresa"] as const;
type Role = typeof validRoles[number];

function isValidRole(value: unknown): value is Role {
  return validRoles.includes(value as Role);
}

export async function GET() {
  try {
    const users = await getUsers();
    return ok(
      { count: users.length, users: users.map(sanitizeUser) },
      "Usuarios obtenidos correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email    = String(body.email    ?? "").trim().toLowerCase();
    const fullName = String(body.fullName ?? "").trim();
    const password = String(body.password ?? "");
    const role: Role = isValidRole(body.role) ? body.role : "personal";

    if (!email || !fullName || !password) {
      return fail("Faltan campos obligatorios: email, fullName, password.", 400);
    }

    if (password.length < 8) {
      return fail("La contraseña debe tener al menos 8 caracteres.", 400);
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return fail("El email ya está registrado.", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await createUser({ email, fullName, passwordHash, role });

    await createPortfolio(user.id);

    // Email de bienvenida — no bloquea si falla
    try {
      await sendWelcomeEmail({ to: email, fullName, role });
    } catch (emailError) {
      console.warn("[users/POST] Email bienvenida falló:", emailError);
    }

    return ok(sanitizeUser(user), "Usuario creado correctamente.", 201);
  } catch (error) {
    return serverError(error);
  }
}