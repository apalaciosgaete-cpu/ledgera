"use client";
import { useEffect } from "react";
export default function FifoRedirectPage() {
  useEffect(() => { window.location.href = "/experto/auditoria"; }, []);
  return null;
}
