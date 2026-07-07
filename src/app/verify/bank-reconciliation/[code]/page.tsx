import { Logo } from "@/components/brand/Logo";

type VerifyResponse = {
  ok: boolean;
  message: string;
  data?: {
    valid: boolean;
    reportType: string;
    validationCode: string;
    contentHash: string;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  };
};

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

async function verifyDocument(code: string): Promise<VerifyResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ledgera.cl";

  const response = await fetch(
    `${baseUrl}/api/verify/bank-reconciliation/${encodeURIComponent(code)}`,
    {
      cache: "no-store",
    },
  );

  return (await response.json()) as VerifyResponse;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function MetricCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "success" | "warning" }) {
  const toneClass = tone === "success"
    ? "border-accent bg-accent-soft text-gain"
    : tone === "warning"
      ? "border-warn bg-[rgba(252,211,77,0.14)] text-warn"
      : "border-border bg-bg-elev text-text";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-faint">{label}</p>
      <p className="mt-2 font-display text-2xl font-black tracking-[-0.04em] text-text">{value}</p>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-faint">{label}</p>
      <div className="mt-2 text-sm font-semibold leading-6 text-text">{children}</div>
    </div>
  );
}

export default async function VerifyBankReconciliationPage({ params }: PageProps) {
  const { code } = await params;
  const result = await verifyDocument(code);

  if (!result.ok || !result.data?.valid) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_34%),linear-gradient(135deg,var(--bg-sunken),var(--bg),var(--bg-elev))] px-6 py-12 text-text">
        <section className="mx-auto w-full max-w-2xl">
          <header className="mb-10 flex flex-col items-center text-center">
            <Logo variant="light" size="lg" showSubtitle />
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-loss">Documento no verificado</p>
            <h1 className="mt-4 font-display text-4xl font-black tracking-[-0.055em] text-text">Código inválido</h1>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-text-soft">
              No encontramos un reporte de conciliación asociado a este código.
            </p>
          </header>

          <div className="rounded-3xl border border-loss bg-[rgba(253,164,175,0.14)] p-7 text-center shadow-[var(--shadow-md)]">
            <p className="font-display text-xl font-black text-text">Verificación no disponible</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-text-soft">
              Revisa el código, escanea nuevamente el QR o solicita una copia actualizada del respaldo.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const metadata = result.data.metadata ?? {};

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_34%),linear-gradient(135deg,var(--bg-sunken),var(--bg),var(--bg-elev))] px-6 py-12 text-text">
      <section className="mx-auto w-full max-w-4xl">
        <header className="mb-10 flex flex-col items-center text-center">
          <Logo variant="light" size="lg" showSubtitle />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-accent">Documento verificado</p>
          <h1 className="mt-4 font-display text-4xl font-black tracking-[-0.055em] text-text sm:text-5xl">
            Reporte de conciliación financiera
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-text-soft">
            Este documento fue generado por LEDGERA y su hash coincide con un registro de verificación existente.
          </p>
        </header>

        <div className="rounded-3xl border border-border bg-bg-elev p-6 shadow-[var(--shadow-md)]">
          <div className="grid gap-5 rounded-2xl border border-border bg-bg-sunken p-5 text-sm">
            <DetailRow label="Código de verificación">
              <code className="break-all font-mono text-accent">{result.data.validationCode}</code>
            </DetailRow>
            <DetailRow label="Hash SHA-256">
              <code className="break-all font-mono text-xs text-accent">{result.data.contentHash}</code>
            </DetailRow>
            <DetailRow label="Fecha de generación">{formatDate(result.data.createdAt)}</DetailRow>
            <DetailRow label="Tipo de reporte">{result.data.reportType}</DetailRow>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <MetricCard label="Total" value={String(metadata.total ?? "—")} />
            <MetricCard label="Conciliados" value={String(metadata.matched ?? "—")} tone="success" />
            <MetricCard label="Pendientes" value={String(metadata.pending ?? "—")} tone="warning" />
            <MetricCard label="Ignorados" value={String(metadata.ignored ?? "—")} />
          </div>
        </div>
      </section>
    </main>
  );
}
