// src/modules/identity/infrastructure/userRepository.ts
import { db } from "@/infrastructure/db/client";
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
  status:                  "active" | "inactive" | "suspended";
  role:                    string;
  email_verified_at:       Date | null;
  created_at:              Date;
  updated_at:              Date;
  subscription_plan:       string | null;
  subscription_expires_at: Date | null;
  two_factor_secret?:      string | null;
  two_factor_enabled?:     boolean | null;
}): User {
  return {
    id:                   row.id,
    email:                row.email,
    fullName:             row.full_name,
    passwordHash:         row.password_hash,
    status:               row.status,
    role:                 row.role as User["role"],
    emailVerifiedAt:      row.email_verified_at,
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
    subscriptionPlan:     (row.subscription_plan ?? "BASICO") as User["subscriptionPlan"],
    subscriptionExpiresAt: row.subscription_expires_at,
    twoFactorSecret:      row.two_factor_secret  ?? null,
    twoFactorEnabled:     row.two_factor_enabled ?? false,
  };
}

// ── Lee los campos reales de twoFactor desde la BD ───────────────────────────
const USER_SELECT = `
  id,
  email,
  full_name,
  password_hash,
  status,
  role,
  email_verified_at,
  created_at,
  updated_at,
  subscription_plan,
  subscription_expires_at,
  "twoFactorSecret"  as two_factor_secret,
  "twoFactorEnabled" as two_factor_enabled
`;

export async function getUsers(): Promise<User[]> {
  const result = await db.query(`
    select ${USER_SELECT}
    from users
    order by created_at desc
  `);
  return result.rows.map(mapRowToUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.query(
    `select ${USER_SELECT} from users where id = $1 limit 1`,
    [id],
  );
  if (result.rows.length === 0) return null;
  return mapRowToUser(result.rows[0]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.query(
    `select ${USER_SELECT} from users where email = $1 limit 1`,
    [email],
  );
  if (result.rows.length === 0) return null;
  return mapRowToUser(result.rows[0]);
}

export async function createUser(input: CreateUserInput): Promise<User> {
  // INSERT simple sin RETURNING complejo
  const insertResult = await db.query(
    `
      INSERT INTO users (email, full_name, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
    [input.email, input.fullName, input.passwordHash, input.role],
  );

  const newId = insertResult.rows[0].id;

  // SELECT separado con todos los campos
  const selectResult = await db.query(
    `SELECT ${USER_SELECT} FROM users WHERE id = $1 LIMIT 1`,
    [newId],
  );

  return mapRowToUser(selectResult.rows[0]);
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await db.query(
    `delete from users where id = $1`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function updateUserStatus(
  id:     string,
  status: "active" | "inactive" | "suspended",
): Promise<User | null> {
  const result = await db.query(
    `
      update users
      set status = $1, updated_at = now()
      where id = $2
      returning ${USER_SELECT}
    `,
    [status, id],
  );
  if (result.rows.length === 0) return null;
  return mapRowToUser(result.rows[0]);
}

export async function updateUserSubscription(
  input: UpdateSubscriptionInput,
): Promise<User | null> {
  const { PLAN_TO_ROLE } = await import("@/modules/identity/domain/user");
  const role = PLAN_TO_ROLE[input.plan];

  const result = await db.query(
    `
      update users
      set subscription_plan = $1,
          subscription_expires_at = $2,
          role = $3,
          updated_at = now()
      where id = $4
      returning ${USER_SELECT}
    `,
    [input.plan, input.expiresAt, role, input.userId],
  );
  if (result.rows.length === 0) return null;
  return mapRowToUser(result.rows[0]);
}