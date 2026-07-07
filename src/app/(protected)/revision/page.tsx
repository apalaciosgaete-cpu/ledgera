import Link from "next/link";
import { ui } from "@/styles/design-system";

const flow = ["Conexiones", "Importación", "Bandeja de revisión", "Libro Financiero", "Consolidado", "Tributario", "Auditoría"];

export default function RevisionPage() {
  return (
    <section className={ui.page}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div><h1 className={ui.title}>Bandeja de revisión</h1><p className={ui.label}>Punto de control previo al Libro Financiero. Aquí se revisarán eventos importados antes de convertirlos en movimientos financieros definitivos.</p></div>
        <div className="flex flex-wrap gap-3"><Link href="/integraciones" className={ui.buttonSecondary}>Ir a Conexiones</Link><Link href="/libro-financiero" className={ui.buttonSecondary}>Ver Libro Financiero</Link></div>
      </div>
      <div className={`${ui.card} space-y-4 p-6`}><div><p className="text-sm font-semibold uppercase tracking-wide text-text-faint">Estado actual</p><h2 className="mt-1 text-xl font-semibold text-text">Sin eventos pendientes</h2><p className="mt-2 text-sm text-text-soft">Todavía no hay importaciones pendientes de revisión. Cuando una conexión bancaria, exchange o wallet entregue datos ambiguos, aparecerán aquí antes de afectar el Libro Financiero.</p></div></div>
      <div className={`${ui.card} space-y-4 p-6`}><div><p className="text-sm font-semibold uppercase tracking-wide text-text-faint">Flujo operativo aprobado</p><div className="mt-4 flex flex-wrap gap-2">{flow.map((step, index) => <div key={step} className="flex items-center gap-2"><span className="rounded-full border border-border bg-bg-elev px-3 py-1 text-sm font-medium text-text-soft">{step}</span>{index < flow.length - 1 && <span className="text-text-faint">→</span>}</div>)}</div></div></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className={`${ui.card} p-4`}><p className={ui.label}>Eventos pendientes</p><p className="text-2xl font-semibold text-text">0</p></div><div className={`${ui.card} p-4`}><p className={ui.label}>Listos para aprobar</p><p className="text-2xl font-semibold text-text">0</p></div><div className={`${ui.card} p-4`}><p className={ui.label}>Observados</p><p className="text-2xl font-semibold text-text">0</p></div></div>
    </section>
  );
}
