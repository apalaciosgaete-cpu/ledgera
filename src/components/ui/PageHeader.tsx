// src/components/ui/PageHeader.tsx
import type { CSSProperties, ReactNode } from "react";
import { colors, fonts, fontSize, fontWeight, lineHeight } from "@/styles/tokens";

interface PageHeaderProps {
  title:      string;
  subtitle?:  string;
  actions?:   ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const wrapStyle: CSSProperties = {
    display:        "flex",
    alignItems:     "flex-start",
    justifyContent: "space-between",
    marginBottom:   "28px",
    gap:            "16px",
  };

  const textStyle: CSSProperties = {
    display:       "flex",
    flexDirection: "column",
    gap:           "4px",
  };

  const h1Style: CSSProperties = {
    margin:      0,
    fontFamily:  fonts.display,
    fontSize:    fontSize["2xl"],       // 20px — uniforme en todos los módulos
    fontWeight:  fontWeight.bold,
    color:       colors.textPrimary,
    lineHeight:  lineHeight.tight,
    letterSpacing: "-0.01em",
  };

  const subtitleStyle: CSSProperties = {
    margin:     0,
    fontFamily: fonts.body,
    fontSize:   fontSize.md,            // 14px
    fontWeight: fontWeight.normal,
    color:      colors.textSecondary,
    lineHeight: lineHeight.normal,
  };

  return (
    <div style={wrapStyle}>
      <div style={textStyle}>
        <h1 style={h1Style}>{title}</h1>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}