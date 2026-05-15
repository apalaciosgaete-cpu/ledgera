export type ResolvedSubscriptionState =
  | "ADMIN"
  | "ACTIVE"
  | "WARNING"
  | "EXPIRED"
  | "SUSPENDED"
  | "INACTIVE";

type UserSubscriptionLike = {
  role?: string | null;
  status?: string | null;
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
  daysRemaining: number | null;
  label: string;
  message: string;
};

const WARNING_DAYS = 7;

function normalizeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function calculateDaysRemaining(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;

  return Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export function resolveSubscriptionState(
  user: UserSubscriptionLike,
): SubscriptionStateResult {
  const role = user.role ?? null;
  const status = user.status ?? null;
  const plan = user.subscriptionPlan ?? null;
  const expiresAt = normalizeDate(user.subscriptionExpiresAt);
  const daysRemaining = calculateDaysRemaining(expiresAt);

  if (role === "admin") {
    return {
      state: "ADMIN",
      isAdmin: true,
      isActive: true,
      isExpired: false,
      isBlocked: false,
      plan,
      expiresAt,
      daysRemaining,
      label: "Administrador",
      message: "Acceso administrativo activo.",
    };
  }

  if (status === "suspended") {
    return {
      state: "SUSPENDED",
      isAdmin: false,
      isActive: false,
      isExpired: false,
      isBlocked: true,
      plan,
      expiresAt,
      daysRemaining,
      label: "Cuenta suspendida",
      message: "La cuenta fue suspendida temporalmente.",
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
      daysRemaining: null,
      label: "Suscripción inactiva",
      message: "La cuenta no tiene una suscripción activa.",
    };
  }

  if (daysRemaining !== null && daysRemaining < 0) {
    return {
      state: "EXPIRED",
      isAdmin: false,
      isActive: false,
      isExpired: true,
      isBlocked: true,
      plan,
      expiresAt,
      daysRemaining,
      label: "Suscripción vencida",
      message: "La suscripción expiró.",
    };
  }

  if (daysRemaining !== null && daysRemaining <= WARNING_DAYS) {
    return {
      state: "WARNING",
      isAdmin: false,
      isActive: true,
      isExpired: false,
      isBlocked: false,
      plan,
      expiresAt,
      daysRemaining,
      label: "Suscripción por vencer",
      message: `La suscripción vence en ${daysRemaining} día(s).`,
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
    daysRemaining,
    label: "Suscripción activa",
    message: "La cuenta tiene una suscripción activa.",
  };
}