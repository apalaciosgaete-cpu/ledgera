type AssetLogoProps = {
  symbol: string;
};

const logoTheme: Record<string, { bg: string; fg: string }> = {
  XLM: { bg: "#0B74FF", fg: "#FFFFFF" },
  XRP: { bg: "#1F2933", fg: "#FFFFFF" },
  POL: { bg: "#8247E5", fg: "#FFFFFF" },
  MATIC: { bg: "#8247E5", fg: "#FFFFFF" },
  ALGO: { bg: "#111827", fg: "#FFFFFF" },
  BTC: { bg: "#F7931A", fg: "#FFFFFF" },
  ETH: { bg: "#EEF2FF", fg: "#4F46E5" },
  SOL: { bg: "#111827", fg: "#14F195" },
};

function StellarIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M6 17.2 22.2 8" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M5 20.8 21.2 11.6" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8.2 16.5a7 7 0 0 1 11.6-6.1" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M19.8 11.5a7 7 0 0 1-11.6 6.1" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function XrpIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M6 8.5c2.8 3 4.7 4.4 8 4.4s5.2-1.4 8-4.4" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M6 19.5c2.8-3 4.7-4.4 8-4.4s5.2 1.4 8 4.4" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PolygonIcon({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <path d="m10 11 5-3 5 3v6l-5 3-5-3z" stroke={color} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      <path d="m4 14 5-3 5 3v6l-5 3-5-3z" stroke={color} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      <path d="m16 14 5-3 5 3v6l-5 3-5-3z" stroke={color} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

function AlgoIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M9 23 17 5h3L12 23z" fill={color} />
      <path d="M14.5 23 20 11h3l-5.3 12z" fill={color} />
      <path d="M12 15h11v2.6H12z" fill={color} />
    </svg>
  );
}

function DefaultIcon({ symbol, color }: { symbol: string; color: string }) {
  return <span style={{ color, fontSize: "1rem", fontWeight: 900 }}>{symbol.slice(0, 1)}</span>;
}

export function AssetLogo({ symbol }: AssetLogoProps) {
  const normalized = symbol.trim().toUpperCase();
  const theme = logoTheme[normalized] ?? { bg: "#F1F5F9", fg: "#0F2A3D" };

  let icon = <DefaultIcon symbol={normalized} color={theme.fg} />;

  if (normalized === "XLM") icon = <StellarIcon color={theme.fg} />;
  if (normalized === "XRP") icon = <XrpIcon color={theme.fg} />;
  if (normalized === "POL" || normalized === "MATIC") icon = <PolygonIcon color={theme.fg} />;
  if (normalized === "ALGO") icon = <AlgoIcon color={theme.fg} />;

  return (
    <div
      style={{
        alignItems: "center",
        background: theme.bg,
        borderRadius: 999,
        boxShadow: "0 10px 24px rgba(15, 42, 61, 0.10)",
        display: "flex",
        height: 52,
        justifyContent: "center",
        width: 52,
      }}
    >
      {icon}
    </div>
  );
}
