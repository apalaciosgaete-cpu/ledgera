"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name:           string;
  initials:       string;
  avatarGradient: string;
  badgeBg:        string;
  badgeColor:     string;
  roleLabel:      string;
  isAdmin:        boolean;
  onLogout: () => void;
};


export function UserProfileDropdown({
  name, initials, avatarGradient, badgeBg, badgeColor, roleLabel, isAdmin, onLogout,
}: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Pill trigger */}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            "10px",
          background: open ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
          border:         `1px solid ${open ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)"}`,
          borderRadius:   "12px",
          padding:        "5px 6px 5px 10px",
          cursor:         "pointer",
          transition:     "all 0.15s ease",
        }}
      >
        <div style={{
          width:          "30px",
          height:         "30px",
          borderRadius:   "50%",
          background:     avatarGradient,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
        }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>
            {initials}
          </span>
        </div>
        <div className="hidden xl:flex" style={{ flexDirection: "column", gap: "4px", minWidth: 0 }}>
          <span style={{
            fontSize: "12px", fontWeight: 500, color: "var(--text)", lineHeight: 1,
            maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {name}
          </span>
          <span style={{
            display: "inline-flex", alignSelf: "flex-start",
            fontSize: "9px", fontWeight: 700, color: badgeColor,
            background: badgeBg, borderRadius: "4px", padding: "2px 6px",
            textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: "13px",
          }}>
            {roleLabel}
          </span>
        </div>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ marginLeft: "2px", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <path d="M2 4l4 4 4-4" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown panel — identity + config + logout only */}
      {open && (
        <div style={{
          position:     "absolute",
          top:          "calc(100% + 8px)",
          right:        0,
          width:        "220px",
          background: "var(--bg-elev)",
          border:       "1px solid rgba(255,255,255,0.1)",
          borderRadius: "14px",
          boxShadow:    "0 16px 40px rgba(0,0,0,0.5)",
          zIndex:       200,
          display:      "flex",
          flexDirection:"column",
          padding:      "8px",
        }}>
          {/* Identity header */}
          <div style={{
            padding:      "12px 12px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink:   0,
          }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
              {name}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-soft)" }}>
              {roleLabel}
            </p>
          </div>

          <div style={{ paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "10px",
                padding:      "9px 12px",
                borderRadius: "8px",
                fontSize:     "13px",
                fontWeight:   600,
                color: "var(--loss)",
                background:   "transparent",
                border:       "none",
                cursor:       "pointer",
                width:        "100%",
                textAlign:    "left",
                transition:   "all 0.15s ease",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
