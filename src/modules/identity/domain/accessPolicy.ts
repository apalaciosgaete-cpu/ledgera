export type AccessPolicyUser = {
  id: string;
  email: string;
  role?: string | null;
};

export function isAdmin(user: AccessPolicyUser): boolean {
  return (
    user.role?.toLowerCase() === "admin" ||
    user.email.toLowerCase() === "admin@ledgera.cl"
  );
}

export function buildUserScopeWhere(user: AccessPolicyUser): { userId?: string } {
  if (isAdmin(user)) {
    return {};
  }

  return {
    userId: user.id,
  };
}