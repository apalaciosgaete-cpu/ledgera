"use client";

import { FormEvent, useState } from "react";

const initialState = {
  expectation: "",
  useful: "",
  clarity: "",
  feature: "",
  contact: "",
};

export default function FeedbackForm() {
  const [form, setForm] = useState(initialState);

  const update = (field: keyof typeof initialState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = "Opinión para mejorar LEDGERA";
    const body = [
      "Ayúdanos a mejorar LEDGERA",
      "",
      `Qué esperaba resolver: ${form.expectation || "No indicado"}`,
      `Qué parte fue más útil: ${form.useful || "No indicado"}`,
      `Qué información debería estar más clara: ${form.clarity || "No indicado"}`,
      `Función sugerida: ${form.feature || "No indicado"}`,
      `Contacto: ${form.contact || "No indicado"}`,
    ].join("\n");

    window.location.href = `mailto:admin@ledgera.cl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-[#24345F] bg-[#0B1430]/90 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.26)] sm:p-8">
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-black text-[#F2EBD8]">¿Qué esperabas resolver al entrar a LEDGERA?</span>
          <textarea
            value={form.expectation}
            onChange={(event) => update("expectation", event.target.value)}
            rows={3}
            className="rounded-2xl border border-[#24345F] bg-[#080E1F] px-4 py-3 text-sm text-[#F2EBD8] outline-none transition placeholder:text-[#7F8BA5] focus:border-[#C9A84C]"
            placeholder="Ej: ordenar movimientos Binance, preparar respaldo, revisar obligaciones..."
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-[#F2EBD8]">¿Qué parte te pareció más útil?</span>
          <textarea
            value={form.useful}
            onChange={(event) => update("useful", event.target.value)}
            rows={3}
            className="rounded-2xl border border-[#24345F] bg-[#080E1F] px-4 py-3 text-sm text-[#F2EBD8] outline-none transition placeholder:text-[#7F8BA5] focus:border-[#C9A84C]"
            placeholder="Cuéntanos qué te aportó valor o qué te gustaría mantener."
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-[#F2EBD8]">¿Qué información te gustaría ver más clara o mejor explicada?</span>
          <textarea
            value={form.clarity}
            onChange={(event) => update("clarity", event.target.value)}
            rows={3}
            className="rounded-2xl border border-[#24345F] bg-[#080E1F] px-4 py-3 text-sm text-[#F2EBD8] outline-none transition placeholder:text-[#7F8BA5] focus:border-[#C9A84C]"
            placeholder="Ej: impuestos, respaldos, importaciones, activos, declaraciones..."
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-[#F2EBD8]">¿Qué función te gustaría que LEDGERA incorporara próximamente?</span>
          <textarea
            value={form.feature}
            onChange={(event) => update("feature", event.target.value)}
            rows={3}
            className="rounded-2xl border border-[#24345F] bg-[#080E1F] px-4 py-3 text-sm text-[#F2EBD8] outline-none transition placeholder:text-[#7F8BA5] focus:border-[#C9A84C]"
            placeholder="Propón una mejora, integración o reporte que te ayudaría."
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-[#F2EBD8]">¿Quieres que te contactemos?</span>
          <input
            value={form.contact}
            onChange={(event) => update("contact", event.target.value)}
            className="min-h-[48px] rounded-2xl border border-[#24345F] bg-[#080E1F] px-4 text-sm text-[#F2EBD8] outline-none transition placeholder:text-[#7F8BA5] focus:border-[#C9A84C]"
            placeholder="Tu email o teléfono, opcional"
          />
        </label>
      </div>

      <button type="submit" className="mt-7 inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-[#C9A84C] px-7 text-sm font-black text-[#080E1F] transition hover:-translate-y-0.5 hover:bg-[#DDBB61]">
        Enviar opinión
      </button>
      <p className="mt-4 text-xs leading-5 text-[#7F8BA5]">
        El formulario abre tu cliente de correo con el mensaje preparado para admin@ledgera.cl. No se envía nada automáticamente sin tu revisión.
      </p>
    </form>
  );
}
