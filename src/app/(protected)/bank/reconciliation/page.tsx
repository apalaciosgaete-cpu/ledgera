"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReconciliationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/importaciones");
  }, [router]);

  return null;
}
