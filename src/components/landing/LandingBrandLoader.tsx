// src/components/landing/LandingBrandLoader.tsx
"use client";

import { useEffect, useState } from "react";

const letters = ["L", "E", "D", "G", "E", "R", "A"] as const;

export default function LandingBrandLoader() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const hasPlayed = window.sessionStorage.getItem("ledgera-landing-loader") === "played";
    if (hasPlayed) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const displayMs = prefersReducedMotion ? 900 : 2500;
    const fadeMs = 480;

    setIsVisible(true);

    const leaveTimer = window.setTimeout(() => setIsLeaving(true), displayMs);
    const hideTimer = window.setTimeout(() => {
      window.sessionStorage.setItem("ledgera-landing-loader", "played");
      setIsVisible(false);
    }, displayMs + fadeMs);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[220] grid place-items-center overflow-hidden bg-[#020617] px-6 text-white transition-opacity duration-500 ${
        isLeaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <style>{`
        .ledgera-loader-word {
          perspective: 900px;
          transform-style: preserve-3d;
        }

        .ledgera-loader-letter {
          display: inline-block;
          margin-right: -0.095em;
          background: linear-gradient(180deg, #ffffff 0%, #eef3fb 18%, #8f9bae 44%, #ffffff 59%, #536073 100%);
          background-clip: text;
          color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.58);
          filter: drop-shadow(0 12px 0 rgba(7, 17, 38, 0.98)) drop-shadow(12px 18px 22px rgba(0, 0, 0, 0.62)) drop-shadow(0 0 22px rgba(56, 189, 248, 0.36));
          opacity: 0;
          transform: translateY(36px) rotateX(18deg) translateZ(-34px) scale(0.94);
          transform-origin: 50% 80%;
          animation: ledgeraLetterIn 720ms cubic-bezier(.16, 1, .3, 1) forwards;
          text-shadow:
            0 1px 0 rgba(255, 255, 255, 0.95),
            0 3px 0 rgba(173, 186, 205, 0.72),
            4px 7px 0 rgba(11, 22, 48, 0.98),
            9px 14px 0 rgba(4, 12, 28, 0.92);
        }

        .ledgera-loader-sweep {
          animation: ledgeraSweep 1100ms cubic-bezier(.16, 1, .3, 1) 1420ms forwards;
        }

        .ledgera-loader-line {
          transform-origin: left;
          animation: ledgeraLine 1800ms ease-out 280ms forwards;
        }

        @keyframes ledgeraLetterIn {
          0% {
            opacity: 0;
            transform: translateY(36px) rotateX(18deg) translateZ(-34px) scale(0.94);
          }
          62% {
            opacity: 1;
            transform: translateY(-4px) rotateX(0deg) translateZ(0) scale(1.018);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg) translateZ(0) scale(1);
          }
        }

        @keyframes ledgeraSweep {
          0% { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
          14% { opacity: .9; }
          78% { opacity: .52; }
          100% { transform: translateX(130%) skewX(-18deg); opacity: 0; }
        }

        @keyframes ledgeraLine {
          from { transform: scaleX(.08); opacity: .32; }
          to { transform: scaleX(1); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ledgera-loader-letter {
            animation: none;
            opacity: 1;
            transform: none;
          }

          .ledgera-loader-sweep,
          .ledgera-loader-line {
            animation: none;
          }
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(56,189,248,0.24),transparent_30%),radial-gradient(circle_at_50%_64%,rgba(30,64,175,0.30),transparent_32%),linear-gradient(180deg,#020617_0%,#071126_48%,#020617_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(148,163,184,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative z-10 w-full max-w-[1040px] text-center">
        <div className="ledgera-loader-word relative mx-auto inline-block select-none overflow-hidden pb-12 pt-6 font-display text-[clamp(4.4rem,12vw,10.5rem)] font-black leading-none tracking-[-0.11em] sm:text-[clamp(5.5rem,11vw,11.5rem)]">
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="ledgera-loader-letter"
              style={{ animationDelay: `${180 + index * 130}ms` }}
            >
              {letter}
            </span>
          ))}
          <span className="ledgera-loader-sweep pointer-events-none absolute inset-y-6 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent mix-blend-screen" />
        </div>

        <div className="mx-auto -mt-4 h-px max-w-[620px] overflow-hidden rounded-full bg-sky-300/10">
          <div className="ledgera-loader-line h-full w-full scale-x-[0.08] bg-gradient-to-r from-transparent via-sky-300 to-transparent opacity-0" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.34em] text-sky-200/80">
          Ordenando operaciones, activos y respaldo tributario
        </p>
      </div>
    </div>
  );
}
