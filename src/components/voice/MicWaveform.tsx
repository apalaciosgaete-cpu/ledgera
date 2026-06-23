"use client";

import { useEffect, useRef } from "react";
import { getMicLevel } from "@/modules/voice/micMeter";

type Props = {
  /** Cuando es true, las barras reaccionan al nivel real del micrófono. */
  active: boolean;
};

const BAR_COUNT = 28;

/**
 * Ondas en vivo del micrófono del usuario. Confirma visualmente que LEDGERA
 * está captando la voz (las barras se mueven al hablar). Si no se mueven con
 * `active`, el micrófono no está entregando señal (permiso/dispositivo).
 */
export function MicWaveform({ active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const levelsRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const gap = 3;
    const barW = (W - gap * (BAR_COUNT - 1)) / BAR_COUNT;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      const level = active ? getMicLevel() : 0;
      const levels = levelsRef.current;

      // Desplaza el historial y empuja el nivel actual (efecto de onda viajera).
      for (let i = 0; i < BAR_COUNT - 1; i++) levels[i] = levels[i + 1];
      // Realce no lineal para que la voz hablada se note bien.
      levels[BAR_COUNT - 1] = Math.min(1, Math.pow(level, 0.65) * 1.6);

      for (let i = 0; i < BAR_COUNT; i++) {
        const v = levels[i];
        const h = active ? Math.max(2, v * H) : 2;
        const x = i * (barW + gap);
        const y = (H - h) / 2;
        const alpha = active ? 0.35 + v * 0.6 : 0.18;
        ctx.fillStyle = `rgba(74,222,128,${alpha})`;
        const r = Math.min(barW / 2, 2);
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, r);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={48}
      style={{ width: "100%", maxWidth: 280, height: 48, display: "block" }}
      aria-hidden="true"
    />
  );
}
