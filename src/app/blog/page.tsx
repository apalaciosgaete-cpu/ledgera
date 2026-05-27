// src/app/blog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { seoPageList } from "@/modules/seo/seoPageContent";

export const metadata: Metadata = {
  title: "Blog LEDGERA — Guías crypto, Binance e impuestos en Chile",
  description:
    "Guías prácticas para ordenar movimientos crypto, entender Binance, conciliar banco y preparar información tributaria en Chile.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog LEDGERA — Guías crypto, Binance e impuestos en Chile",
    description:
      "Aprende a ordenar movimientos crypto, revisar Binance y preparar información tributaria clara.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_34%),linear-gradient(135deg,#061522_0%,#082033_48%,#0B2A3F_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300"
          >
            LEDGERA
          </Link>

          <div className="mt-8 max-w-4xl space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Blog
            </p>

            <h1 className="text-4xl font-black tracking-[-0.05em] md:text-6xl">
              Guías para ordenar crypto, Binance e impuestos en Chile
            </h1>

            <p className="max-w-3xl text-lg leading-8 text-slate-200 md:text-xl">
              Contenido práctico para entender tus movimientos, conectar banco
              con exchange y preparar información financiera más clara.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10">
          <div className="grid gap-5 md:grid-cols-2">
            {seoPageList.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                  {page.keyword}
                </p>

                <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">
                  {page.title}
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {page.description}
                </p>

                <span className="mt-6 inline-flex text-sm font-black text-slate-950">
                  Leer guía →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
