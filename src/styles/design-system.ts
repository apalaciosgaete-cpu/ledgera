// src/styles/design-system.ts
export const ui = {
  // ─── Layout ──────────────────────────────────────────────────────────────────
  page:      "space-y-6 p-6",
  container: "mx-auto w-full max-w-7xl",

  // ─── Superficies ─────────────────────────────────────────────────────────────
  card:    "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
  cardAlt: "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-alt)]",
  cardSoft: "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-alt)]",
  section: "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]",

  // ─── Tipografía ───────────────────────────────────────────────────────────────
  title:    "text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] font-[var(--font-display)]",
  subtitle: "text-sm text-[var(--color-text-secondary)]",
  label:    "text-sm text-[var(--color-text-muted)]",

  // ─── Botones ──────────────────────────────────────────────────────────────────
  buttonPrimary:
    "inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]",

  buttonSecondary:
    "inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-alt)]",

  buttonDark:
    "inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-text-light)] transition hover:bg-[var(--color-primary-hover)]",

  buttonDanger:
    "inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-danger)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-danger-hover)]",

  buttonGhost:
    "inline-flex items-center justify-center rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]",

  // ─── Badges ───────────────────────────────────────────────────────────────────
  badgeOk:      "border border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent-hover)]",
  badgeWarning: "border border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning-hover)]",
  badgeRisk:    "border border-[var(--color-danger)] bg-[var(--color-danger-muted)] text-[var(--color-danger-hover)]",

  // ─── Alertas ──────────────────────────────────────────────────────────────────
  alertOk:      "border border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent-hover)]",
  alertWarning: "border border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning-hover)]",
  alertRisk:    "border border-[var(--color-danger)] bg-[var(--color-danger-muted)] text-[var(--color-danger-hover)]",

  // ─── Tablas ───────────────────────────────────────────────────────────────────
  tableWrapper: "overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
  table:        "w-full text-sm",
  tableHead:    "bg-[var(--color-primary)] text-left text-[var(--color-text-light)]",
  tableRow:     "border-t border-[var(--color-border)] text-[var(--color-text-secondary)]",
  tableCell:    "p-3",
};