"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AuthGuard } from "@/modules/identity/client/AuthGuard";
import { useAuth } from "@/modules/identity/client/authContext";

function AdminRoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isSupportChat = pathname === "/admin/chat" || pathname.startsWith("/admin/chat/");
  const isAdministrator = user?.role === "admin";
  const isSupport = user?.role === "support";
  const canRender = isAdministrator || (isSupport && isSupportChat);

  useEffect(() => {
    if (isLoading || !user || canRender) return;

    router.replace(isSupport ? "/admin/chat" : "/panel");
  }, [canRender, isLoading, isSupport, router, user]);

  if (isLoading || !user || !canRender) return null;

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminRoleGuard>{children}</AdminRoleGuard>
    </AuthGuard>
  );
}
