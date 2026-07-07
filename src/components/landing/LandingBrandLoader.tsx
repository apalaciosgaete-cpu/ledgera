// src/components/landing/LandingBrandLoader.tsx
"use client";

import { useEffect, useState } from "react";

export default function LandingBrandLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const displayMs = prefersReducedMotion ? 1200 : 3300;
    const fadeMs = 520;

    const leaveTimer = window.setTimeout(() => setIsLeaving(true), displayMs);
    const hideTimer = window.setTimeout(() => setIsVisible(false), displayMs + fadeMs);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-label="Cargando LEDGERA"
      className={`fixed inset-0 z-[220] grid place-items-center overflow-hidden bg-[#020617] px-4 text-white transition-opacity duration-500 ${
        isLeaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_50%_66%,rgba(30,64,175,0.30),transparent_34%),linear-gradient(180deg,#020617_0%,#071126_48%,#020617_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(148,163,184,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative z-10 w-full max-w-[1040px] text-center">
        <img
          src="/brand/ledgera-3d-loader.svg?v=20260705-actual-loader"
          alt=""
          aria-hidden="true"
          className="mx-auto block w-full max-w-[960px] select-none drop-shadow-[0_36px_70px_rgba(8,47,73,0.42)]"
          draggable={false}
        />
        <p className="-mt-4 text-xs font-black uppercase tracking-[0.34em] text-sky-200/80 sm:-mt-8">
          Ordenando operaciones, activos y respaldo tributario
        </p>
      </div>
    </div>
  );
}
