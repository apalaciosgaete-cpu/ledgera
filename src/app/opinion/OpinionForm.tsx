"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import styles from "./opinion.module.css";

const MAX_ANSWER_LENGTH = 1200;

const questions = [
  {
    name: "expectation",
    label: "¿Qué esperabas resolver al entrar a LEDGERA?",
    placeholder: "Por ejemplo: ordenar mis operaciones y entender qué debo declarar…",
  },
  {
    name: "useful",
    label: "¿Qué parte te pareció más útil?",
    placeholder: "Cuéntanos qué te ayudó o te dio más claridad…",
  },
  {
    name: "clarity",
    label: "¿Qué información te gustaría ver más clara o mejor explicada?",
    placeholder: "Puede ser una palabra, una pantalla o un paso del proceso…",
  },
  {
    name: "feature",
    label: "¿Qué función te gustaría que incorporáramos próximamente?",
    placeholder: "Describe la mejora que más valor tendría para ti…",
  },
] as const;

type AnswerName = (typeof questions)[number]["name"];

type FormState = Record<AnswerName, string> & {
  contactRequested: boolean;
  email: string;
  website: string;
};

const initialState: FormState = {
  expectation: "",
  useful: "",
  clarity: "",
  feature: "",
  contactRequested: false,
  email: "",
  website: "",
};

export function OpinionForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateAnswer(name: AnswerName, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const hasAnswer = questions.some(({ name }) => form[name].trim().length >= 3);
    if (!hasAnswer) {
      setError("Escribe al menos una respuesta para poder enviarla.");
      return;
    }

    if (form.contactRequested && !form.email.trim()) {
      setError("Ingresa tu correo si quieres que te contactemos.");
      return;
    }

    setSubmitting(true);

    try {
      await httpClient("/api/opinion", {
        method: "POST",
        body: form,
        timeoutMs: 15000,
      });
      setSubmitted(true);
      setForm(initialState);
    } catch (requestError) {
      setError(
        isHttpClientError(requestError)
          ? requestError.message
          : "No pudimos enviar tu opinión. Intenta nuevamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className={styles.successCard} aria-live="polite">
        <div className={styles.successIcon} aria-hidden="true">✓</div>
        <p className={styles.successEyebrow}>Opinión recibida</p>
        <h2>Gracias por ayudarnos a mejorar LEDGERA.</h2>
        <p>
          Tu respuesta ya fue enviada al equipo. La revisaremos como parte de las
          próximas mejoras del producto.
        </p>
        <div className={styles.successActions}>
          <button type="button" onClick={() => setSubmitted(false)} className={styles.secondaryButton}>
            Enviar otra opinión
          </button>
          <Link href="/" className={styles.primaryLink}>Volver al inicio</Link>
        </div>
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formHeader}>
        <div>
          <p className={styles.formStep}>Tu experiencia</p>
          <h2>Cuéntanos con tus palabras</h2>
        </div>
        <span className={styles.optionalNote}>Responde al menos una</span>
      </div>

      <div className={styles.questions}>
        {questions.map((question, index) => (
          <label key={question.name} className={styles.question} htmlFor={question.name}>
            <span className={styles.questionNumber}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.questionContent}>
              <span className={styles.questionLabel}>{question.label}</span>
              <textarea
                id={question.name}
                name={question.name}
                value={form[question.name]}
                onChange={(event) => updateAnswer(question.name, event.target.value)}
                placeholder={question.placeholder}
                maxLength={MAX_ANSWER_LENGTH}
                rows={3}
                disabled={submitting}
              />
              <span className={styles.characterCount}>
                {form[question.name].length}/{MAX_ANSWER_LENGTH}
              </span>
            </span>
          </label>
        ))}
      </div>

      <fieldset className={styles.contactBlock}>
        <legend>
          <span className={styles.questionNumber}>05</span>
          <span>¿Quieres que te contactemos sobre tu opinión?</span>
        </legend>
        <div className={styles.contactOptions}>
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="contactRequested"
              checked={form.contactRequested}
              onChange={() => setForm((current) => ({ ...current, contactRequested: true }))}
              disabled={submitting}
            />
            <span>Sí, pueden escribirme</span>
          </label>
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="contactRequested"
              checked={!form.contactRequested}
              onChange={() => setForm((current) => ({ ...current, contactRequested: false, email: "" }))}
              disabled={submitting}
            />
            <span>No, gracias</span>
          </label>
        </div>

        {form.contactRequested && (
          <label className={styles.emailField} htmlFor="email">
            <span>Correo de contacto</span>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="tu@correo.cl"
              maxLength={254}
              required
              disabled={submitting}
            />
          </label>
        )}
      </fieldset>

      <label className={styles.honeypot} aria-hidden="true">
        Sitio web
        <input
          name="website"
          value={form.website}
          onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>

      <div className={styles.formFooter}>
        <p>
          Usaremos tus respuestas solo para mejorar LEDGERA. El correo es opcional y
          se tratará según nuestra <Link href="/privacidad">Política de Privacidad</Link>.
        </p>
        <button type="submit" className={styles.submitButton} disabled={submitting}>
          {submitting ? "Enviando…" : "Enviar mi opinión"}
          {!submitting && <span aria-hidden="true">→</span>}
        </button>
      </div>

      <div className={styles.status} aria-live="polite" role="status">
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    </form>
  );
}
