import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { OpinionForm } from "./OpinionForm";
import styles from "./opinion.module.css";

export const metadata: Metadata = {
  title: "Opinión | LEDGERA",
  description: "Ayúdanos a mejorar LEDGERA con feedback orgánico sobre claridad, utilidad y funcionamiento.",
};

export default function OpinionPage() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" aria-label="Inicio LEDGERA" className={styles.logoLink}>
            <Logo size="md" showSubtitle />
          </Link>
          <Link href="/" className={styles.homeLink}>← Inicio</Link>
        </header>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Ayúdanos a mejorar</p>
          <h1>Tu experiencia puede hacer LEDGERA más clara y útil.</h1>
          <p className={styles.lead}>
            Cuéntanos qué funcionó, qué faltó y qué deberíamos construir después.
            No buscamos respuestas perfectas: basta con una observación honesta.
          </p>
        </div>
        <OpinionForm />
      </section>
    </main>
  );
}
