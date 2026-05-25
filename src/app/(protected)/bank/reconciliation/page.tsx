"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReconciliationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/bank/movements");
  }, [router]);

  return null;
}
