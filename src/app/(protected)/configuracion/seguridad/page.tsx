"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SeguridadRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/configuracion?section=seguridad");
  }, [router]);

  return null;
}
