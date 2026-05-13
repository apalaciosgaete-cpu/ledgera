export type ResolvedSubscriptionState =
  | "ADMIN"
  | "ACTIVE"
  | "EXPIRED"
  | "INACTIVE";

type UserSubscriptionLike = {
  role?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: Date | string | null;
};

export type SubscriptionStateResult = {
  state: ResolvedSubscriptionState;
  isAdmin: boolean;
  isActive: boolean;
  isExpired: boolean;
  isBlocked: boolean;
  plan: string | null;
  expiresAt: Date | null;
};

function normalizeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function resolveSubscriptionState(
  user: UserSubscriptionLike,
): SubscriptionStateResult {
  const role = user.role ?? null;
  const plan = user.subscriptionPlan ?? null;
  const expiresAt = normalizeDate(user.subscriptionExpiresAt);

  if (role === "admin") {
    return {
      state: "ADMIN",
      isAdmin: true,
      isActive: true,
      isExpired: false,
      isBlocked: false,
      plan,
      expiresAt,
    };
  }

  if (!expiresAt) {
    return {
      state: "INACTIVE",
      isAdmin: false,
      isActive: false,
      isExpired: false,
      isBlocked: true,
      plan,
      expiresAt: null,
    };
  }

  const expired = expiresAt.getTime() <= Date.now();

  if (expired) {
    return {
      state: "EXPIRED",
      isAdmin: false,
      isActive: false,
      isExpired: true,
      isBlocked: true,
      plan,
      expiresAt,
    };
  }

  return {
    state: "ACTIVE",
    isAdmin: false,
    isActive: true,
    isExpired: false,
    isBlocked: false,
    plan,
    expiresAt,
  };
}