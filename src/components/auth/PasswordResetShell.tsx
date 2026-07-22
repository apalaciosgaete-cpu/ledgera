"use client";

import { Logo } from "@/components/brand/Logo";
import { fonts } from "@/styles/tokens";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem 1.25rem", position: "relative", overflow: "hidden", backgroundColor: "#07111f", backgroundImage: "url('/Fondo_Loguin.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%,rgba(12,30,54,.18) 0%,rgba(3,9,20,.42) 72%,rgba(2,7,16,.72) 100%),linear-gradient(180deg,rgba(4,8,20,.16),rgba(4,8,20,.34))" }} />
    <div aria-hidden="true" style={{ position: "absolute", width: "min(38rem,90vw)", height: "min(38rem,90vw)", left: "50%", top: "48%", transform: "translate(-50%,-50%)", borderRadius: "999px", background: "rgba(14,165,233,.08)", filter: "blur(90px)" }} />
    <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440, display: "grid", gap: ".65rem", justifyItems: "center" }}>
      <Logo variant="light" size="lg" />
      <section style={{ width: "100%", boxSizing: "border-box", background: "rgba(8,13,28,.84)", border: "1px solid rgba(125,203,242,.22)", borderRadius: 20, padding: "1.8rem 2rem", boxShadow: "0 28px 72px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.035)", display: "grid", gap: "1rem", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>{children}</section>
    </div>
  </main>;
}

export const heading = { margin: 0, fontSize: "1.55rem", fontWeight: 900, color: "var(--text)", fontFamily: fonts.display };
export const description = { margin: 0, fontSize: 14, color: "var(--text-soft)", lineHeight: 1.55, fontFamily: fonts.body };
export const label = { display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6, fontFamily: fonts.body };
export const input = { width: "100%", padding: ".78rem .95rem", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--bg-sunken)", color: "var(--text)", fontSize: 14, fontFamily: fonts.body, boxSizing: "border-box" as const };
export const button = { width: "100%", border: "none", borderRadius: 13, padding: ".86rem 1rem", background: "var(--accent)", color: "var(--accent-contrast)", fontSize: 15, fontWeight: 850, fontFamily: fonts.body, cursor: "pointer" };
export const backLink = { color: "var(--accent)", fontSize: 13, fontWeight: 750, textDecoration: "none", fontFamily: fonts.body };
export const privacy = { margin: 0, paddingTop: ".8rem", borderTop: "1px solid rgba(255,255,255,.08)", color: "var(--text-soft)", fontSize: 12, lineHeight: 1.5, fontFamily: fonts.body };
export const errorStyle = { margin: 0, color: "var(--loss)", fontSize: 13, fontWeight: 600, fontFamily: fonts.body };
export const successStyle = { background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 10, padding: ".9rem", color: "var(--gain)", fontSize: 14, lineHeight: 1.55, fontFamily: fonts.body };
