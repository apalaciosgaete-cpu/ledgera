"use client";
import { useEffect } from "react";
export default function AuditoriaRedirectPage() {
  useEffect(() => { window.location.href = "/experto/auditoria"; }, []);
  return null;
}
