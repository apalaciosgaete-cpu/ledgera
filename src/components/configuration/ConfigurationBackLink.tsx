import Link from "next/link";

export function ConfigurationBackLink({
  href = "/configuracion",
  label = "Configuración",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        width: "fit-content",
        color: "var(--text-soft)",
        fontSize: 12,
        fontWeight: 700,
        textDecoration: "none",
      }}
    >
      ← {label}
    </Link>
  );
}
