"use client";

import { useAuth } from "@/modules/identity/client/authContext";
import ConfiguracionShell from "../ConfiguracionShell";

export default function PerfilPage() {
  return <ConfiguracionShell forcedSection="persona" />;
}
