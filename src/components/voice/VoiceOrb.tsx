"use client";

import { useEffect, useRef } from "react";
import type { VoiceEngineState } from "@/modules/voice/voiceEngine";
import { getAudioLevel } from "@/modules/voice/audioPlayer";

type Props = {
  state: VoiceEngineState;
};

export function VoiceOrb({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(0);

  const isPlaying = state === "playing";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = canvas.width;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const BASE_R = SIZE * 0.28;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, SIZE, SIZE);

      const t = phaseRef.current;
      const level = isPlaying ? getAudioLevel() : 0; // 0–1 sincronizado con audio real

      // Pulsos externos (solo cuando playing)
      if (isPlaying) {
        for (let i = 3; i >= 1; i--) {
          const pulseR = BASE_R + i * SIZE * 0.07 + Math.sin(t * 1.2 + i) * SIZE * 0.025 * (1 + level);
          const alpha = (0.06 - i * 0.015) * (0.7 + 0.3 * Math.sin(t + i)) * (1 + level);
          const grad = ctx.createRadialGradient(CX, CY, BASE_R * 0.5, CX, CY, pulseR);
          grad.addColorStop(0, `rgba(74,222,128,${alpha * 1.5})`);
          grad.addColorStop(1, "rgba(74,222,128,0)");
          ctx.beginPath();
          ctx.arc(CX, CY, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // Orb principal — tamaño pulsando con el audio real
      const wobble = isPlaying
        ? Math.sin(t * 2.1) * SIZE * 0.012 + level * SIZE * 0.045
        : 0;
      const r = BASE_R + wobble;

      const gradient = ctx.createRadialGradient(
        CX - r * 0.25, CY - r * 0.25, r * 0.05,
        CX, CY, r,
      );

      if (isPlaying) {
        gradient.addColorStop(0, "rgba(134,239,172,0.95)");
        gradient.addColorStop(0.45, "rgba(22,163,74,0.88)");
        gradient.addColorStop(1, "rgba(15,118,110,0.70)");
      } else {
        gradient.addColorStop(0, "rgba(100,160,200,0.80)");
        gradient.addColorStop(0.45, "rgba(30,80,140,0.70)");
        gradient.addColorStop(1, "rgba(7,27,40,0.60)");
      }

      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Brillo interior
      const shine = ctx.createRadialGradient(
        CX - r * 0.3, CY - r * 0.35, 0,
        CX - r * 0.3, CY - r * 0.35, r * 0.55,
      );
      shine.addColorStop(0, "rgba(255,255,255,0.22)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.fillStyle = shine;
      ctx.fill();

      // Ondas de sonido sincronizadas con nivel de audio real
      if (isPlaying) {
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.4 * level + 0.15 * Math.sin(t * 3);
        const waveCount = 5;
        for (let i = 0; i < waveCount; i++) {
          const waveR = r + (i + 1) * SIZE * 0.045 * (0.5 + level * 1.2 + 0.2 * Math.sin(t * 1.5 + i));
          ctx.beginPath();
          ctx.arc(CX, CY, waveR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(74,222,128,${0.22 - i * 0.035 + level * 0.1})`;
          ctx.lineWidth = 1.2 + level * 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      phaseRef.current += isPlaying ? 0.045 : 0.018;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={480}
      style={{
        width: "min(42vw, 260px)",
        height: "min(42vw, 260px)",
        display: "block",
        filter: isPlaying
          ? "drop-shadow(0 0 32px rgba(74,222,128,0.40)) drop-shadow(0 0 64px rgba(22,163,74,0.20))"
          : "drop-shadow(0 0 20px rgba(30,80,140,0.30))",
        transition: "filter 0.6s ease",
      }}
    />
  );
}
