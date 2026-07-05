"use client";

import { FormEvent, useState } from "react";

const initialState = {
  name: "",
  email: "",
  reason: "Soporte",
  message: "",
};

export default function ContactForm() {
  const [form, setForm] = useState(initialState);

  const update = (field: keyof typeof initialState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = `Contacto LEDGERA · ${form.reason}`;
    const body = [
      "Contacto LEDGERA",
      "",
      `Nombre: ${form.name || "No indicado"}`,
      `Email: ${form.email || "No indicado"}`,
      `Motivo: ${form.reason}`,
      "",
      form.message || "Sin mensaje adicional.",
    ].join("\n");

    window.location.href = `mailto:admin@ledgera.cl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-[#24345F] bg-[#0B1430]/90 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.26)] sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-black text-[#F2EBD8]">Nombre</span>
          <input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            className="min-h-[48px] rounded-2xl border border-[#24345F] bg-[#080E1F] px-4 text-sm text-[#F2EBD8] outline-none transition placeholder:text-[#7F8BA5] focus:border-[#C9A84C]"
            placeholder="Tu nombre"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-black text-[#F2EBD8]">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            className="min-h-[48px] rounded-2xl border border-[#24345F] bg-[#080E1F] px-4 text-sm text-[#F2EBD8] outline-none transition placeholder:text-[#7F8BA5] focus:border-[#C9A84C]"
            placeholder="correo@empresa.cl"
          />
        </label>
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-sm font-black text-[#F2EBD8]">Motivo</span>
        <select
          value={form.reason}
          onChange={(event) => update("reason", event.target.value)}
          className="min-h-[48px] rounded-2xl border border-[#24345F] bg-[#080E1F] px-4 text-sm text-[#F2EBD8] outline-none transition focus:border-[#C9A84C]"
        >
          <option>Soporte</option>
          <option>Ventas</option>
          <option>Alianzas</option>
          <option>Prensa o contenidos</option>
          <option>Otro</option>
        </select>
      </label>

      <label className="mt-5 grid gap-2">
        <span className="text-sm font-black text-[#F2EBD8]">Mensaje</span>
        <textarea
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          rows={6}
          className="rounded-2xl border border-[#24345F] bg-[#080E1F] px-4 py-3 text-sm text-[#F2EBD8] outline-none transition placeholder:text-[#7F8BA5] focus:border-[#C9A84C]"
          placeholder="Cuéntanos brevemente qué necesitas."
        />
      </label>

      <button type="submit" className="mt-7 inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-[#C9A84C] px-7 text-sm font-black text-[#080E1F] transition hover:-translate-y-0.5 hover:bg-[#DDBB61]">
        Preparar correo
      </button>
      <p className="mt-4 text-xs leading-5 text-[#7F8BA5]">
        También puedes escribir directamente a admin@ledgera.cl.
      </p>
    </form>
  );
}
