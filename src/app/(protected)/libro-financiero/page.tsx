"use client";

import { useEffect } from "react";

export default function LibroFinancieroPage() {
  useEffect(() => {
    window.location.replace("/movements");
  }, []);

  return null;
}
