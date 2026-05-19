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
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) return null;
  return mapRowToUser(user);
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

export async function getUserByStripeCustomerId(
  customerId: string,
): Promise<User | null> {
  const user = await prisma.users.findFirst({
    where: { stripe_customer_id: customerId },
  });
  if (!user) return null;
  return mapRowToUser(user);
}

export async function updateUserStripeSubscription(input: {
  userId:              string;
  stripeCustomerId:    string;
  stripeSubscriptionId: string;
  stripePriceId:       string;
  stripeStatus:        string;
  plan:                SubscriptionPlan;
  expiresAt:           Date;
}): Promise<void> {
  const { PLAN_TO_ROLE } = await import("@/modules/identity/domain/user");
  await prisma.users.update({
    where: { id: input.userId },
    data: {
      stripe_customer_id:      input.stripeCustomerId,
      stripe_subscription_id:  input.stripeSubscriptionId,
      stripe_price_id:         input.stripePriceId,
      stripe_status:           input.stripeStatus,
      subscription_plan:       input.plan,
      subscription_expires_at: input.expiresAt,
      role:                    PLAN_TO_ROLE[input.plan],
      updated_at:              new Date(),
    },
  });
}

export async function getStripeFieldsByUserId(
  userId: string,
): Promise<{ stripeCustomerId: string | null; stripeSubscriptionId: string | null; stripeStatus: string | null } | null> {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return null;
  return {
    stripeCustomerId:    user.stripe_customer_id,
    stripeSubscriptionId: user.stripe_subscription_id,
    stripeStatus:        user.stripe_status,
  };
}
