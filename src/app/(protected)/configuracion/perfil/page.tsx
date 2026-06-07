"use client";

import { useAuth } from "@/modules/identity/client/authContext";
import ConfiguracionShell from "../ConfiguracionShell";

export default function PerfilPage() {
  const { user } = useAuth();
  const role = (user as { role?: string })?.role ?? "personal";
  const section = role === "personal" || role === "admin" ? "persona" : "empresa";
  return <ConfiguracionShell forcedSection={section} />;
}
