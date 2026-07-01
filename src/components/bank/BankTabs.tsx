"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/import/bank",    label: "Importar cartola" },
  { href: "/bank/movements", label: "Movimientos" },
];

export function BankTabs() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div style={{
      display:      "flex",
      gap:          "4px",
      marginBottom: "28px",
      borderBottom: "1px solid var(--border)",
      paddingBottom: "0",
    }}>
      {TABS.map(tab => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              height:         "36px",
              padding:        "0 16px",
              fontSize:       "13px",
              fontWeight:     active ? 600 : 400,
              color: active ? "var(--text)" : "var(--text-soft)",
              borderBottom: active ? "2px solid var(--border-strong)" : "2px solid transparent",
              textDecoration: "none",
              marginBottom:   "-1px",
              transition:     "all 0.15s ease",
              whiteSpace:     "nowrap",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
