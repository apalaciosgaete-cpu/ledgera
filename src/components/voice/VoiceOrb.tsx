"use client";

import { useEffect, useRef } from "react";
import type { VoiceEngineState } from "@/modules/voice/voiceEngine";
import { getAudioLevel } from "@/modules/voice/audioPlayer";

type Props = {
  state: VoiceEngineState | "listening";
};

export function VoiceOrb({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(0);

  const isPlaying = state === "playing";
  const isListening = state === "listening";
  const active = isPlaying || isListening;

  // Escala el orbe más pequeño para WealthFlowPage (gridColumn context)
  // El caller controla el tamaño via style wrapper si necesita custom
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
      const level = isPlaying ? getAudioLevel() : 0;
      const listeningLevel = isListening ? 0.3 + 0.15 * Math.sin(t * 2.5) : 0;

      // Pulsos externos
      if (active) {
        for (let i = 3; i >= 1; i--) {
          const pulseMultiplier = isPlaying ? (1 + level) : (0.5 + listeningLevel * 0.3);
          const pulseR = BASE_R + i * SIZE * 0.07 + Math.sin(t * 1.2 + i) * SIZE * 0.025 * pulseMultiplier;
          const alpha = (0.06 - i * 0.015) * (0.7 + 0.3 * Math.sin(t + i)) * pulseMultiplier;
          const pulseColor = isListening ? "rgba(167,139,250," : "rgba(74,222,128,";
          const grad = ctx.createRadialGradient(CX, CY, BASE_R * 0.5, CX, CY, pulseR);
          grad.addColorStop(0, `${pulseColor}${alpha * 1.5})`);
          grad.addColorStop(1, `${pulseColor}0)`);
          ctx.beginPath();
          ctx.arc(CX, CY, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // Orb principal
      const wobble = isPlaying
        ? Math.sin(t * 2.1) * SIZE * 0.012 + level * SIZE * 0.045
        : isListening
          ? Math.sin(t * 2.5) * SIZE * 0.008 + listeningLevel * SIZE * 0.015
          : 0;
      const r = BASE_R + wobble;

      const gradient = ctx.createRadialGradient(
        CX - r * 0.25, CY - r * 0.25, r * 0.05,
        CX, CY, r,
      );

      if (isListening) {
        gradient.addColorStop(0, "rgba(196,181,253,0.92)");
        gradient.addColorStop(0.45, "rgba(139,92,246,0.85)");
        gradient.addColorStop(1, "rgba(91,53,245,0.65)");
      } else if (isPlaying) {
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

      // Ondas de sonido
      if (active) {
        ctx.save();
        const waveAlpha = isPlaying
          ? 0.4 + 0.4 * level + 0.15 * Math.sin(t * 3)
          : 0.15 + 0.15 * Math.sin(t * 2);
        ctx.globalAlpha = waveAlpha;
        const waveCount = isPlaying ? 5 : 3;
        const waveColor = isListening ? "rgba(167,139,250," : "rgba(74,222,128,";
        for (let i = 0; i < waveCount; i++) {
          const waveMultiplier = isPlaying
            ? (0.5 + level * 1.2 + 0.2 * Math.sin(t * 1.5 + i))
            : (0.5 + listeningLevel + 0.1 * Math.sin(t * 1.8 + i));
          const waveR = r + (i + 1) * SIZE * 0.045 * waveMultiplier;
          ctx.beginPath();
          ctx.arc(CX, CY, waveR, 0, Math.PI * 2);
          const strokeAlpha = isPlaying
            ? 0.22 - i * 0.035 + level * 0.1
            : 0.12 - i * 0.025 + listeningLevel * 0.06;
          ctx.strokeStyle = `${waveColor}${strokeAlpha})`;
          ctx.lineWidth = isPlaying ? 1.2 + level * 1.5 : 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      phaseRef.current += active ? (isPlaying ? 0.045 : 0.03) : 0.018;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active, isPlaying, isListening]);

  const glowFilter = isListening
    ? "drop-shadow(0 0 28px rgba(139,92,246,0.35)) drop-shadow(0 0 56px rgba(91,53,245,0.15))"
    : isPlaying
      ? "drop-shadow(0 0 32px rgba(74,222,128,0.40)) drop-shadow(0 0 64px rgba(22,163,74,0.20))"
      : "drop-shadow(0 0 20px rgba(30,80,140,0.30))";

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={480}
      style={{
        width: "min(42vw, 260px)",
        height: "min(42vw, 260px)",
        display: "block",
        filter: glowFilter,
        transition: "filter 0.6s ease",
      }}
    />
  );
}
