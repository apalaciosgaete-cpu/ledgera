import type { SessionUser } from "@/shared";

export function isAdmin(user: SessionUser): boolean {
  return user.role === "admin" || user.email === "admin@ledgera.cl";
}

export function buildUserScopeWhere(user: SessionUser) {
  if (isAdmin(user)) return {};

  return {
    userId: user.id,
  };
}