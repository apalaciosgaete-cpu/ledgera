"use client";

import { useEffect } from "react";

export default function PortafolioPage() {
  useEffect(() => {
    window.location.replace("/panel");
  }, []);

  return null;
}
