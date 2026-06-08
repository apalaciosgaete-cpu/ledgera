import { prisma } from "@/lib/prisma";
import type { User, SubscriptionPlan } from "@/modules/identity/domain/user";

interface CreateUserInput {
  email:        string;
  fullName:     string;
  passwordHash: string;
  role:         "personal" | "contador" | "empresa" | "admin";
}

interface UpdateSubscriptionInput {
  userId:    string;
  plan:      SubscriptionPlan;
  expiresAt: Date;
}

function mapRowToUser(row: {
  id:                      string;
  email:                   string;
  full_name:               string;
  password_hash:           string;
  status:                  string;
  role:                    string;
  email_verified_at:       Date | null;
  created_at:              Date;
  updated_at:              Date;
  subscription_plan:       string;
  subscription_expires_at: Date | null;
  twoFactorSecret:         string | null;
  twoFactorEnabled:        boolean;
  rut:                     string | null;
  phone:                   string | null;
  address:                 string | null;
  commune:                 string | null;
  country:                 string | null;
}): User {
  return {
    id:                    row.id,
    email:                 row.email,
    fullName:              row.full_name,
    passwordHash:          row.password_hash,
    status:                row.status as User["status"],
    role:                  row.role as User["role"],
    emailVerifiedAt:       row.email_verified_at,
    createdAt:             row.created_at,
    updatedAt:             row.updated_at,
    subscriptionPlan:      (row.subscription_plan ?? "BASICO") as User["subscriptionPlan"],
    subscriptionExpiresAt: row.subscription_expires_at,
    twoFactorSecret:       row.twoFactorSecret ?? null,
    twoFactorEnabled:      row.twoFactorEnabled ?? false,
    rut:                   row.rut ?? null,
    phone:                 row.phone ?? null,
    address:               row.address ?? null,
    commune:               row.commune ?? null,
    country:               row.country ?? "Chile",
  };
}

export async function getUsers(): Promise<User[]> {
  const users = await prisma.users.findMany({ orderBy: { created_at: "desc" } });
  return users.map(mapRowToUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await prisma.users.findUnique({ where: { id } });
  if (!user) return null;
  return mapRowToUser(user);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const lowerEmail = email.toLowerCase();
  const user = await prisma.users.findUnique({ where: { email: lowerEmail } });
  if (user) return mapRowToUser(user);
  // Fallback para emails con mayúsculas en BD legacy
  const users = await prisma.users.findMany({ where: { email: { contains: lowerEmail } }, take: 2 });
  const match = users.find(u => u.email.toLowerCase() === lowerEmail);
  return match ? mapRowToUser(match) : null;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const user = await prisma.users.create({
    data: {
      email:         input.email,
      full_name:     input.fullName,
      password_hash: input.passwordHash,
      role:          input.role,
    },
  });
  return mapRowToUser(user);
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await prisma.users.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function updateUserStatus(
  id:     string,
  status: "active" | "inactive" | "suspended",
): Promise<User | null> {
  try {
    const user = await prisma.users.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
    return mapRowToUser(user);
  } catch {
    return null;
  }
}

export async function updateUserSubscription(
  input: UpdateSubscriptionInput,
): Promise<User | null> {
  const { PLAN_TO_ROLE } = await import("@/modules/identity/domain/user");
  const role = PLAN_TO_ROLE[input.plan];

  try {
    const user = await prisma.users.update({
      where: { id: input.userId },
      data: {
        subscription_plan:       input.plan,
        subscription_expires_at: input.expiresAt,
        role,
        updated_at:              new Date(),
      },
    });
    return mapRowToUser(user);
  } catch {
    return null;
  }
}

export interface UpdateProfileInput {
  userId:   string;
  fullName: string;
  rut:      string | null;
  phone:    string | null;
  address:  string | null;
  commune:  string | null;
  country:  string | null;
}

export async function updateUserProfile(
  input: UpdateProfileInput,
): Promise<User | null> {
  try {
    const user = await prisma.users.update({
      where: { id: input.userId },
      data: {
        full_name:  input.fullName,
        rut:        input.rut,
        phone:      input.phone,
        address:    input.address,
        commune:    input.commune,
        country:    input.country,
        updated_at: new Date(),
      },
    });
    return mapRowToUser(user);
  } catch {
    return null;
  }
}
