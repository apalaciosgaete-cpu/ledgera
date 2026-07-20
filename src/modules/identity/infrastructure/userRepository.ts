import { prisma } from "@/lib/prisma";
import type {
  User,
  SubscriptionPlan,
  UserRole,
} from "@/modules/identity/domain/user";

interface CreateUserInput {
  email:        string;
  fullName:     string;
  passwordHash: string;
  role:         UserRole;
}

interface UpdateSubscriptionInput {
  userId:    string;
  plan:      SubscriptionPlan;
  expiresAt: Date;
}

const baseUserSelect = {
  id:                      true,
  email:                   true,
  full_name:               true,
  password_hash:           true,
  status:                  true,
  role:                    true,
  email_verified_at:       true,
  created_at:              true,
  updated_at:              true,
  subscription_plan:       true,
  subscription_expires_at: true,
  twoFactorSecret:         true,
  twoFactorEnabled:        true,
  rut:                     true,
  phone:                   true,
  address:                 true,
  commune:                 true,
  country:                 true,
} as const;

type BaseUserRow = {
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
};

function mapRowToUser(row: BaseUserRow): User {
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
    twoFactorSecret:       row.twoFactorSecret,
    twoFactorEnabled:      row.twoFactorEnabled,
    rut:                   row.rut ?? null,
    phone:                 row.phone ?? null,
    address:               row.address ?? null,
    commune:               row.commune ?? null,
    country:               row.country ?? "Chile",
  };
}

export async function getUsers(): Promise<User[]> {
  const users = await prisma.users.findMany({
    orderBy: { created_at: "desc" },
    select: baseUserSelect,
  });
  return users.map(mapRowToUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await prisma.users.findUnique({
    where: { id },
    select: baseUserSelect,
  });
  if (!user) return null;
  return mapRowToUser(user);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const lowerEmail = email.toLowerCase();
  const user = await prisma.users.findUnique({
    where: { email: lowerEmail },
    select: baseUserSelect,
  });
  if (user) return mapRowToUser(user);

  const users = await prisma.users.findMany({
    where: { email: { contains: lowerEmail } },
    take: 2,
    select: baseUserSelect,
  });
  const match = users.find((currentUser) => currentUser.email.toLowerCase() === lowerEmail);
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
    select: baseUserSelect,
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
      select: baseUserSelect,
    });
    return mapRowToUser(user);
  } catch {
    return null;
  }
}

/**
 * Changes commercial entitlements only. A subscription must never rewrite
 * the user's operational identity or account type.
 */
export async function updateUserSubscription(
  input: UpdateSubscriptionInput,
): Promise<User | null> {
  try {
    const user = await prisma.users.update({
      where: { id: input.userId },
      data: {
        subscription_plan:       input.plan,
        subscription_expires_at: input.expiresAt,
        updated_at:              new Date(),
      },
      select: baseUserSelect,
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
      select: baseUserSelect,
    });
    return mapRowToUser(user);
  } catch {
    return null;
  }
}
