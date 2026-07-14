"use client";

type LogoutButtonProps = {
  onClick: () => void;
  label?: string;
  fullWidth?: boolean;
};

export function LogoutButton({ onClick, label = "Cerrar sesión", fullWidth = true }: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: fullWidth ? "100%" : "auto",
        padding: "9px 12px",
        borderRadius: 8,
        border: "none",
        background: "transparent",
        color: "var(--loss)",
        cursor: "pointer",
        textAlign: "left",
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.25,
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
