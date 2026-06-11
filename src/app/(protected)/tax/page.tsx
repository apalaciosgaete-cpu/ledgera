"use client";
import { useEffect } from "react";
export default function TaxRootRedirectPage() {
  useEffect(() => { window.location.href = "/experto/tributario"; }, []);
  return null;
}
