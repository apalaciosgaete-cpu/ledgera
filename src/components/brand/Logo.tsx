type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
}

const sizes: Record<LogoSize, { scale: number; width: number; height: number }> = {
  sm: { scale: 0.72, width: 160, height: 72 },
  md: { scale: 1, width: 224, height: 94 },
  lg: { scale: 1.32, width: 296, height: 124 },
};

const officialLabel = "LEDGERA — Inteligencia financiera para crecer";

export function Logo({ size = "md" }: LogoProps) {
  const s = sizes[size];

  return (
    <span
      aria-label={officialLabel}
      title="LEDGERA"
      style={{
        display: "inline-flex",
        width: s.width,
        height: s.height,
        maxWidth: "100%",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        userSelect: "none",
      }}
    >
      <span
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 4,
          transform: `scale(${s.scale})`,
          transformOrigin: "center",
        }}
      >
        <span style={{ position: "relative", display: "block", width: 86, height: 42 }}>
          <span style={{ position: "absolute", left: 14, bottom: 7, width: 56, height: 20, border: "3px solid #d7a94a", borderTop: 0, borderRadius: "0 0 22px 22px", transform: "skewX(-18deg)", boxShadow: "0 0 10px rgba(215,169,74,.28)" }} />
          <span style={{ position: "absolute", left: 26, bottom: 17, width: 7, height: 18, borderRadius: 2, background: "linear-gradient(180deg,#f8e7a1,#b9822d)" }} />
          <span style={{ position: "absolute", left: 40, bottom: 17, width: 7, height: 28, borderRadius: 2, background: "linear-gradient(180deg,#f8e7a1,#b9822d)" }} />
          <span style={{ position: "absolute", left: 54, bottom: 17, width: 7, height: 38, borderRadius: 2, background: "linear-gradient(180deg,#f8e7a1,#b9822d)" }} />
          <span style={{ position: "absolute", left: 15, bottom: 22, width: 64, height: 6, borderTop: "4px solid #d7a94a", borderRadius: "60%", transform: "rotate(-31deg)", transformOrigin: "right center", boxShadow: "0 0 10px rgba(215,169,74,.24)" }} />
        </span>
        <span style={{ display: "block", color: "#eef1f6", fontFamily: "Montserrat, Inter, Arial, sans-serif", fontSize: 31, fontWeight: 800, letterSpacing: 6.2, lineHeight: "32px", textShadow: "0 2px 8px rgba(0,0,0,.45)" }}>LEDGERA</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#c8a765", fontFamily: "Inter, Arial, sans-serif", fontSize: 5.8, fontWeight: 800, letterSpacing: 1.3, lineHeight: "8px", textTransform: "uppercase" }}>
          <span style={{ width: 32, height: 1, background: "#c8a765", opacity: .8 }} />
          Inteligencia financiera para crecer
          <span style={{ width: 32, height: 1, background: "#c8a765", opacity: .8 }} />
        </span>
      </span>
    </span>
  );
}

export function LogoIcon({ size = 44 }: { size?: number }) {
  return (
    <span aria-label="LEDGERA" style={{ display: "inline-grid", placeItems: "center", width: size, height: size, background: "transparent" }}>
      <span style={{ position: "relative", display: "block", width: size, height: size }}>
        <span style={{ position: "absolute", left: size * 0.15, bottom: size * 0.12, width: size * 0.7, height: size * 0.28, border: `${Math.max(2, size * 0.08)}px solid #d7a94a`, borderTop: 0, borderRadius: "0 0 999px 999px", transform: "skewX(-18deg)" }} />
        <span style={{ position: "absolute", left: size * 0.3, bottom: size * 0.36, width: size * 0.11, height: size * 0.26, background: "linear-gradient(180deg,#f8e7a1,#b9822d)", borderRadius: 2 }} />
        <span style={{ position: "absolute", left: size * 0.48, bottom: size * 0.36, width: size * 0.11, height: size * 0.42, background: "linear-gradient(180deg,#f8e7a1,#b9822d)", borderRadius: 2 }} />
        <span style={{ position: "absolute", left: size * 0.15, bottom: size * 0.5, width: size * 0.72, height: size * 0.08, borderTop: `${Math.max(2, size * 0.08)}px solid #d7a94a`, borderRadius: "60%", transform: "rotate(-31deg)", transformOrigin: "right center" }} />
      </span>
    </span>
  );
}

export default Logo;
