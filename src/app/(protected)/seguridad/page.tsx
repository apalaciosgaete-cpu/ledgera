"use client";
import { useEffect } from "react";
export default function SeguridadRedirectPage() {
  useEffect(() => { window.location.href = "/configuracion/seguridad"; }, []);
  return null;
}
