// src/modules/voice/micMeter.ts
// Medidor de nivel del MICRÓFONO del usuario (entrada), independiente del TTS.
// La Web Speech API (reconocimiento) no expone niveles de audio, así que abrimos
// el micrófono con getUserMedia + AnalyserNode solo para visualizar que se está
// captando la voz (ondas en vivo) y como diagnóstico de permiso/dispositivo.
"use client";

let stream: MediaStream | null = null;
let context: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let data: Uint8Array<ArrayBuffer> | null = null;

export type MicStartResult = {
  ok: boolean;
  /** Motivo de fallo si ok=false: "denied" | "no-device" | "unsupported" | "error" */
  reason?: "denied" | "no-device" | "unsupported" | "error";
};

/**
 * Abre el micrófono y prepara el analizador de nivel.
 * No conecta a los parlantes (evita eco/realimentación).
 */
export async function startMicMeter(): Promise<MicStartResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") return { ok: false, reason: "denied" };
    if (name === "NotFoundError" || name === "DevicesNotFoundError") return { ok: false, reason: "no-device" };
    return { ok: false, reason: "error" };
  }

  try {
    if (!context) context = new AudioContext();
    if (context.state === "suspended") await context.resume();

    const source = context.createMediaStreamSource(stream);
    analyser = context.createAnalyser();
    analyser.fftSize = 256;
    data = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    // Solo source → analyser. NO conectar a context.destination (evita eco).
    source.connect(analyser);
    return { ok: true };
  } catch {
    stopMicMeter();
    return { ok: false, reason: "error" };
  }
}

/** Nivel de amplitud del micrófono en tiempo real (0–1). */
export function getMicLevel(): number {
  if (!analyser || !data) return 0;
  analyser.getByteFrequencyData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  return sum / data.length / 255;
}

/** Cierra el micrófono y libera el stream. */
export function stopMicMeter(): void {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  analyser = null;
  data = null;
}
