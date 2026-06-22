"use client";
import { useEffect } from "react";
export default function ImpuestosRedirectPage() {
  useEffect(() => { window.location.href = "/experto/tributario"; }, []);
  return null;
}
