"use client";
import { useEffect } from "react";
export default function ImpuestosRedirectPage() {
  useEffect(() => { window.location.href = "/mi-situacion"; }, []);
  return null;
}
