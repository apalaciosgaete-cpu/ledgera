"use client";

import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    window.location.replace("/declaraciones");
  }, []);

  return null;
}
