type VerifyResponse = {
  ok: boolean;
  message: string;
  data?: {
    valid:          boolean;
    reportType:     string;
    validationCode: string;
    contentHash:    string;
    createdAt:      string;
    metadata:       Record<string, unknown> | null;
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

export default async function VerifyBankReconciliationPage({ params }: PageProps) {
  const { code } = await params;
  const result = await verifyDocument(code);

  if (!result.ok || !result.data?.valid) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <section className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
            Documento no verificado
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Código inválido
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            No encontramos un reporte de conciliación asociado a este código.
          </p>
        </section>
      </main>
    );
  }

  const metadata = result.data.metadata ?? {};

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
          Documento verificado
        </p>

        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Reporte de conciliación financiera
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Este documento fue generado por LEDGERA y su hash coincide con un registro
          de verificación existente.
        </p>

        <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Código de verificación
            </p>
            <p className="mt-1 font-mono text-slate-900">
              {result.data.validationCode}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Hash SHA-256
            </p>
            <p className="mt-1 break-all font-mono text-xs text-slate-900">
              {result.data.contentHash}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Fecha de generación
            </p>
            <p className="mt-1 text-slate-900">
              {formatDate(result.data.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Tipo de reporte
            </p>
            <p className="mt-1 text-slate-900">
              {result.data.reportType}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400">Total</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {String(metadata.total ?? "—")}
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs text-green-600">Conciliados</p>
            <p className="mt-1 text-xl font-semibold text-green-800">
              {String(metadata.matched ?? "—")}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-600">Pendientes</p>
            <p className="mt-1 text-xl font-semibold text-amber-800">
              {String(metadata.pending ?? "—")}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400">Ignorados</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {String(metadata.ignored ?? "—")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
