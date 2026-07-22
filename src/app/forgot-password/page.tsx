"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";
import { AuthShell, backLink, button, description, errorStyle, heading, input, label, privacy, successStyle } from "@/components/auth/PasswordResetShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setSubmitting(true);
    try {
      const response = await httpClient<{ message: string }>("/api/password-reset/request", { method: "POST", body: { email, website } });
      setMessage(response.message); setEmail("");
    } catch (cause) {
      setError(isHttpClientError(cause) ? cause.message : "No fue posible procesar la solicitud.");
    } finally { setSubmitting(false); }
  }

  return <AuthShell>
    <h1 style={heading}>Recupera tu contraseña</h1>
    <p style={description}>Escribe el correo asociado a tu cuenta. Te enviaremos un enlace seguro para crear una contraseña nueva.</p>
    {message ? <div role="status" style={successStyle}>{message}<br /><span style={{ fontSize: 12 }}>Revisa también la carpeta de correo no deseado.</span></div> :
      <form onSubmit={submit} style={{ display: "grid", gap: ".9rem" }}>
        <div><label htmlFor="email" style={label}>Correo</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} style={input} placeholder="nombre@correo.cl" /></div>
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}><label htmlFor="website">Sitio web</label><input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></div>
        {error ? <p role="alert" style={errorStyle}>{error}</p> : null}
        <button disabled={submitting} style={button}>{submitting ? "Enviando..." : "Enviar enlace de recuperación"}</button>
      </form>}
    <Link href="/login" style={backLink}>← Volver a iniciar sesión</Link>
    <p style={privacy}>Por seguridad, la respuesta será la misma exista o no una cuenta asociada al correo.</p>
  </AuthShell>;
}
