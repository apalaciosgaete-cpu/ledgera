"use client";

import { useEffect } from "react";

export default function RedirectPage() {
  useEffect(() => { window.location.href = "/experto/verificaciones"; }, []);
  return null;
}
