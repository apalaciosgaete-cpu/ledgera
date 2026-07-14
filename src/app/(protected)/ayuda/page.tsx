"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { fonts } from "@/styles/tokens";

type HelpCategory = {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: React.ReactNode;
};

type FaqItem = {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  href?: string;
  hrefLabel?: string;
};

const categories: HelpCategory[] = [
  {
    title: "Primeros pasos",
    description: "Configura tu cuenta, completa tu perfil y prepara tu expediente tributario.",
    href: "/configuracion",
    action: "Configurar cuenta",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    title: "Importaciones",
    description: "Carga operaciones desde exchanges, bancos o archivos y revisa movimientos pendientes.",
    href: "/importaciones",
    action: "Ir a importaciones",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    title: "Obligaciones tributarias",
    description: "Entiende qué operaciones se declaran, se respaldan o requieren revisión.",
    href: "/obligaciones-tributarias",
    action: "Revisar obligaciones",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    title: "Declaraciones y respaldos",
    description: "Genera reportes PDF, Excel y documentos verificables para trazabilidad tributaria.",
    href: "/declaraciones",
    action: "Ver declaraciones",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: "Expediente",
    description: "Consulta tu información financiera, tributaria y documental en un solo lugar.",
    href: "/mi-expediente",
    action: "Abrir expediente",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    title: "Seguridad y cuenta",
    description: "Gestiona 2FA, sesiones, perfil, suscripción, facturación y privacidad.",
    href: "/configuracion/seguridad",
    action: "Gestionar seguridad",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const faqs: FaqItem[] = [
  {
    question: "¿Qué es LEDGERA?",
    answer: "LEDGERA es un sistema operativo financiero y tributario para organizar operaciones, documentos, activos y obligaciones asociadas a criptoactivos en Chile.",
    category: "Primeros pasos",
    tags: ["ledgera", "producto", "criptoactivos", "chile"],
    href: "/como-funciona",
    hrefLabel: "Ver cómo funciona",
  },
  {
    question: "¿Qué es el Expediente?",
    answer: "El Expediente reúne tu información financiera y tributaria: perfil, operaciones, activos, documentos, respaldos, reportes y trazabilidad generada dentro de LEDGERA.",
    category: "Expediente",
    tags: ["expediente", "perfil", "documentos", "reportes"],
    href: "/mi-expediente",
    hrefLabel: "Abrir expediente",
  },
  {
    question: "¿Cómo importo operaciones desde Binance?",
    answer: "Desde Importaciones puedes cargar movimientos de Binance. LEDGERA procesa las operaciones, detecta inconsistencias y las prepara para revisión financiera y tributaria.",
    category: "Importaciones",
    tags: ["binance", "exchange", "importar", "movimientos"],
    href: "/importaciones",
    hrefLabel: "Ir a importaciones",
  },
  {
    question: "¿Qué significa que una operación esté pendiente?",
    answer: "Una operación pendiente requiere revisión antes de incorporarse completamente al expediente. Puede faltar clasificación, precio histórico, respaldo documental o conciliación con otros movimientos.",
    category: "Importaciones",
    tags: ["pendiente", "clasificacion", "precio", "conciliacion"],
    href: "/importaciones",
    hrefLabel: "Revisar importaciones",
  },
  {
    question: "¿Qué significa respaldar una operación?",
    answer: "Respaldar significa conservar evidencia y trazabilidad de una operación. Una operación puede requerir respaldo aunque no necesariamente genere impuesto a pagar.",
    category: "Obligaciones tributarias",
    tags: ["respaldar", "evidencia", "trazabilidad", "impuesto"],
    href: "/obligaciones-tributarias",
    hrefLabel: "Ver obligaciones",
  },
  {
    question: "¿Qué documentos puedo generar?",
    answer: "Puedes generar reportes, respaldos y declaraciones en PDF y Excel, según la información disponible en tu expediente y el estado de tus operaciones.",
    category: "Declaraciones y respaldos",
    tags: ["pdf", "excel", "declaracion", "reportes"],
    href: "/declaraciones",
    hrefLabel: "Ver declaraciones",
  },
  {
    question: "¿Cómo se usa el QR de verificación?",
    answer: "El QR permite verificar la trazabilidad de un reporte o declaración. Al escanearlo, se puede consultar la validación asociada al documento emitido por LEDGERA.",
    category: "Declaraciones y respaldos",
    tags: ["qr", "verificacion", "trazabilidad", "declaracion"],
    href: "/declaraciones",
    hrefLabel: "Revisar reportes",
  },
  {
    question: "¿Cómo hacer una consulta tributaria?",
    answer: "Usa el asistente de LEDGERA para consultar dudas sobre operaciones, documentos y obligaciones. La orientación debe revisarse contra la información disponible en tu expediente.",
    category: "Primeros pasos",
    tags: ["asistente", "consulta", "tributaria", "ayuda"],
  },
];

const quickLinks = [
  { label: "Importaciones", href: "/importaciones" },
  { label: "Documentación", href: "/documentacion" },
  { label: "Activos", href: "/cryptoactivos" },
  { label: "Obligaciones tributarias", href: "/obligaciones-tributarias" },
  { label: "Declaraciones", href: "/declaraciones" },
  { label: "Facturación", href: "/configuracion/facturacion" },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function AyudaPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalize(query.trim());

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return categories;
    return categories.filter((category) => normalize(`${category.title} ${category.description}`).includes(normalizedQuery));
  }, [normalizedQuery]);

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) return faqs;
    return faqs.filter((item) => normalize(`${item.question} ${item.answer} ${item.category} ${item.tags.join(" ")}`).includes(normalizedQuery));
  }, [normalizedQuery]);

  const hasResults = filteredCategories.length > 0 || filteredFaqs.length > 0;

  return (
    <main style={{ width: "100%", maxWidth: 1120, color: "var(--text)", fontFamily: fonts.body }}>
      <header style={{ display: "grid", gap: 14, marginBottom: 28 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, color: "var(--accent)", fontSize: 11, fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Soporte LEDGERA
          </p>
          <h1 style={{ color: "var(--text)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 880, lineHeight: 1.05, margin: 0, letterSpacing: "-0.045em", fontFamily: fonts.display }}>
            Centro de Ayuda
          </h1>
          <p style={{ color: "var(--text-soft)", fontSize: 15.5, lineHeight: 1.65, margin: 0, maxWidth: 760 }}>
            Encuentra guías para importar operaciones, revisar tu expediente, entender tus obligaciones tributarias y generar reportes desde LEDGERA.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: 760,
            minHeight: 50,
            padding: "0 14px",
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "var(--bg-elev)",
            boxShadow: "0 16px 36px rgba(0,0,0,0.10)",
          }}
        >
          <span aria-hidden="true" style={{ color: "var(--accent)", display: "inline-flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ayuda sobre Binance, declaraciones, expediente, FIFO, PDF o QR..."
            aria-label="Buscar en el centro de ayuda"
            style={{
              flex: 1,
              minWidth: 0,
              height: 48,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--text)",
              fontFamily: fonts.body,
              fontSize: 14,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--bg-sunken)",
                color: "var(--text-soft)",
                cursor: "pointer",
                fontWeight: 800,
                width: 30,
                height: 30,
              }}
            >
              ×
            </button>
          )}
        </div>
      </header>

      {!hasResults && (
        <section style={{ marginBottom: 28, background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <h2 style={{ margin: "0 0 6px", color: "var(--text)", fontSize: 17, fontWeight: 850, fontFamily: fonts.display }}>Sin resultados directos</h2>
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6 }}>
            Prueba con términos como Binance, importaciones, declaración, QR, expediente, 2FA, facturación o respaldos.
          </p>
        </section>
      )}

      {filteredCategories.length > 0 && (
        <section style={{ display: "grid", gap: 14, marginBottom: 30 }}>
          <SectionHeader
            title={normalizedQuery ? "Categorías relacionadas" : "Categorías principales"}
            description="Accede directamente al módulo donde puedes resolver o revisar cada tema."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
            {filteredCategories.map((category) => (
              <CategoryCard key={category.href} category={category} />
            ))}
          </div>
        </section>
      )}

      {filteredFaqs.length > 0 && (
        <section style={{ display: "grid", gap: 14, marginBottom: 30 }}>
          <SectionHeader
            title={normalizedQuery ? "Preguntas encontradas" : "Preguntas frecuentes"}
            description="Respuestas breves para las dudas operativas más comunes dentro de LEDGERA."
          />
          <div style={{ display: "grid", gap: 12 }}>
            {filteredFaqs.map((item) => (
              <FaqCard key={item.question} item={item} />
            ))}
          </div>
        </section>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(260px,0.8fr)", gap: 14 }}>
        <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <h2 style={{ margin: "0 0 8px", color: "var(--text)", fontSize: 17, fontWeight: 850, fontFamily: fonts.display }}>Soporte humano</h2>
          <p style={{ margin: "0 0 14px", color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6 }}>
            Si necesitas ayuda personalizada, escribe a soporte@ledgera.cl con el módulo, el problema y una captura o referencia del caso cuando corresponda.
          </p>
          <a
            href="mailto:soporte@ledgera.cl?subject=Solicitud%20de%20soporte%20LEDGERA"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 38,
              padding: "8px 14px",
              borderRadius: 9,
              border: "1px solid var(--border)",
              background: "var(--bg-sunken)",
              color: "var(--text)",
              textDecoration: "none",
              fontWeight: 850,
              fontSize: 13,
            }}
          >
            Contactar soporte →
          </a>
        </div>

        <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <h2 style={{ margin: "0 0 12px", color: "var(--text)", fontSize: 17, fontWeight: 850, fontFamily: fonts.display }}>Accesos rápidos</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  minHeight: 36,
                  padding: "8px 10px",
                  borderRadius: 9,
                  border: "1px solid var(--border)",
                  background: "var(--bg-sunken)",
                  color: "var(--text-soft)",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                {link.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <h2 style={{ margin: 0, color: "var(--text)", fontSize: 18, fontWeight: 850, letterSpacing: "-0.02em", fontFamily: fonts.display }}>{title}</h2>
      <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.55 }}>{description}</p>
    </div>
  );
}

function IconFrame({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 40,
        height: 40,
        borderRadius: 11,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--accent)",
        background: "var(--accent-soft)",
        border: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function CategoryCard({ category }: { category: HelpCategory }) {
  return (
    <article
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 18,
        minHeight: 190,
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        gap: 14,
        boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
      }}
    >
      <IconFrame>{category.icon}</IconFrame>
      <div style={{ display: "grid", gap: 7, alignContent: "start" }}>
        <h3 style={{ margin: 0, color: "var(--text)", fontSize: 17, fontWeight: 850, fontFamily: fonts.display }}>{category.title}</h3>
        <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.55 }}>{category.description}</p>
      </div>
      <Link
        href={category.href}
        style={{
          minHeight: 38,
          padding: "8px 12px",
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--bg-sunken)",
          color: "var(--text)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 850,
        }}
      >
        {category.action}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function FaqCard({ item }: { item: FaqItem }) {
  return (
    <article
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "18px 20px",
        display: "grid",
        gap: 9,
      }}
    >
      <span
        style={{
          width: "fit-content",
          padding: "4px 8px",
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: "var(--bg-sunken)",
          color: "var(--accent)",
          fontSize: 11,
          fontWeight: 850,
        }}
      >
        {item.category}
      </span>
      <h3 style={{ color: "var(--text)", fontSize: 15.5, fontWeight: 850, margin: 0, fontFamily: fonts.body }}>{item.question}</h3>
      <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.62, margin: 0 }}>{item.answer}</p>
      {item.href && item.hrefLabel && (
        <Link href={item.href} style={{ color: "var(--accent)", textDecoration: "none", fontSize: 13, fontWeight: 850, width: "fit-content" }}>
          {item.hrefLabel} →
        </Link>
      )}
    </article>
  );
}
