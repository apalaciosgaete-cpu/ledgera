import type { CSSProperties } from "react";
import { colors, fonts } from "@/styles/tokens";

type LogoVariant = "light" | "dark";
type LogoSize    = "sm" | "md" | "lg";

interface LogoProps {
  variant?:     LogoVariant;
  size?:        LogoSize;
  showSubtitle?: boolean;
}

const sizes = {
  sm: { icon: 30, name: 16, sub: 8,  gap: 10 },
  md: { icon: 40, name: 22, sub: 10, gap: 12 },
  lg: { icon: 52, name: 28, sub: 11, gap: 14 },
};

// ─── Logo principal ───────────────────────────────────────────────────────────

export function Logo({
  variant      = "light",
  size         = "md",
  showSubtitle = true,
}: LogoProps) {
  const s         = sizes[size];
  const nameColor = variant === "light" ? "#F6F8FA" : colors.primary;
  const fillColor = variant === "light" ? "#F1F5F9" : colors.primary;

  const wrap: CSSProperties = {
    display:       "flex",
    alignItems:    "center",
    gap:           `${s.gap}px`,
    textDecoration: "none",
    userSelect:    "none",
  };

  const textWrap: CSSProperties = {
    display:       "flex",
    flexDirection: "column",
    gap:           "2px",
  };

  const nameStyle: CSSProperties = {
    fontFamily:    fonts.display,
    fontSize:      `${s.name}px`,
    fontWeight:    700,
    color:         nameColor,
    letterSpacing: "0.06em",
    lineHeight:    1,
  };

  const subStyle: CSSProperties = {
    fontFamily:    fonts.body,
    fontSize:      `${s.sub}px`,
    fontWeight:    600,
    color:         colors.warning,
    letterSpacing: "0.14em",
    lineHeight:    1,
  };

  return (
    <div style={wrap}>
      {/* ── Ícono L geométrica ── */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Trazo vertical */}
        <rect x="8" y="8"  width="10" height="28" rx="2" fill={fillColor} />
        {/* Trazo horizontal */}
        <rect x="8" y="30" width="22" height="10" rx="2" fill={fillColor} />
        {/* Acento ámbar */}
        <rect x="26" y="30" width="10" height="10" rx="2" fill={colors.warning} />
      </svg>

      {/* ── Wordmark ── */}
      <div style={textWrap}>
        <span style={nameStyle}>LEDGERA</span>
        {showSubtitle && <span style={subStyle}>FINANZAS OS</span>}
      </div>
    </div>
  );
}

// ─── Ícono solo (para app icon, favicon context) ──────────────────────────────

export function LogoIcon({ size = 44 }: { size?: number }) {
  const wrap: CSSProperties = {
    width:          size,
    height:         size,
    borderRadius:   Math.round(size * 0.22),
    background:     colors.accent,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  };

  const inner = Math.round(size * 0.72);

  return (
    <div style={wrap}>
      <svg width={inner} height={inner} viewBox="0 0 44 44" fill="none">
        <rect x="8"  y="8"  width="10" height="28" rx="2" fill="#ffffff" />
        <rect x="8"  y="30" width="22" height="10" rx="2" fill="#ffffff" />
        <rect x="26" y="30" width="10" height="10" rx="2" fill={colors.warning} />
      </svg>
    </div>
  );
}

export default Logo;