"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/bank",                label: "Resumen" },
  { href: "/import/bank",         label: "Importar cartola" },
  { href: "/bank/reconciliation", label: "Conciliación" },
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
      borderBottom: "1px solid #E2E8F0",
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
              color:          active ? "#0F2A3D" : "#64748B",
              borderBottom:   active ? "2px solid #0F2A3D" : "2px solid transparent",
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
