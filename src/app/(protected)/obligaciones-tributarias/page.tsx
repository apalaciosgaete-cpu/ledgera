import { cryptoFirstModules } from "@/modules/digital-operating-system";

const module = cryptoFirstModules.find((item) => item.key === "taxObligations")!;

const obligations = [
  {
    name: "Ventas crypto-fiat",
    description: "Operaciones que pueden generar resultado tributario.",
    status: "Por evaluar",
  },
  {
    name: "Intercambios entre activos",
    description: "Swaps o permutas que requieren clasificación tributaria.",
    status: "Por evaluar",
  },
  {
    name: "Rendimientos y airdrops",
    description: "Ingresos que pueden requerir reconocimiento o revisión.",
    status: "Por evaluar",
  },
];

export default function ObligacionesTributariasPage() {
  return (
    <main className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Patrimonio Digital
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              {module.label}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              {module.description}
            </p>
          </div>
          <span className="w-fit rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-800">
            Parcial
          </span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Control tributario
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Obligaciones por revisar
            </h2>
          </div>

          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
            {obligations.map((obligation) => (
              <article
                key={obligation.name}
                className="flex flex-col gap-3 bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-black text-slate-950">{obligation.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {obligation.description}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {obligation.status}
                </span>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Próxima acción
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            Identificar qué aplica
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Selecciona una categoría para determinar si existe una obligación tributaria asociada.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {module.examples.map((example) => (
              <button
                key={example}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                {example}
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
