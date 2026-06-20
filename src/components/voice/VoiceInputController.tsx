"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fonts } from "@/styles/tokens";
import { startListening, type STTState } from "@/modules/voice/speechToText";
import {
  VoiceConversationOrchestrator,
  type VoiceConversationSnapshot,
} from "@/modules/voice/conversationOrchestrator";

const LABEL_BY_STATE: Record<VoiceConversationSnapshot["state"], string> = {
  idle: "Micrófono listo",
  welcoming: "Dando bienvenida",
  listening: "Escuchando...",
  transcribing: "Transcribiendo...",
  thinking: "Preparando análisis...",
  speaking: "Hablando...",
  blocked: "Activa el micrófono o audio",
  error: "Error de audio",
};

type Props = {
  onTranscript: (transcript: string) => void;
  onBeforeListen?: () => void;
  disabled?: boolean;
};

export function VoiceInputController({ onTranscript, onBeforeListen, disabled = false }: Props) {
  const stopListeningRef = useRef<(() => void) | null>(null);
  const orchestratorRef = useRef<VoiceConversationOrchestrator | null>(null);
  const [snapshot, setSnapshot] = useState<VoiceConversationSnapshot>({
    state: "idle",
    transcript: "",
    error: null,
  });

  useEffect(() => {
    orchestratorRef.current = new VoiceConversationOrchestrator({
      onStateChange: setSnapshot,
      onFinalTranscript: (transcript) => {
        onTranscript(transcript);
      },
    });

    return () => {
      stopListeningRef.current?.();
      orchestratorRef.current?.reset();
    };
  }, [onTranscript]);

  function mapSTTState(state: STTState, transcript: string) {
    const orchestrator = orchestratorRef.current;
    if (!orchestrator) return;

    if (state === "listening") {
      orchestrator.beginListening();
      return;
    }

    if (state === "processing") {
      orchestrator.beginTranscribing(transcript);
      return;
    }

    if (state === "unsupported") {
      orchestrator.block();
      return;
    }

    if (state === "error") {
      orchestrator.setError("No fue posible usar el micrófono.");
      return;
    }

    if (state === "idle" && snapshot.state !== "thinking") {
      orchestrator.setState("idle");
    }
  }

  function handleStartListening() {
    if (disabled) return;

    onBeforeListen?.();
    stopListeningRef.current?.();
    let latestTranscript = "";

    const stop = startListening({
      onResult: ({ transcript, final }) => {
        latestTranscript = transcript.trim();
        const orchestrator = orchestratorRef.current;
        if (!orchestrator) return;

        if (final && latestTranscript) {
          orchestrator.beginThinking(latestTranscript);
          stopListeningRef.current?.();
          stopListeningRef.current = null;
          return;
        }

        orchestrator.beginTranscribing(latestTranscript);
      },
      onStateChange: (state) => {
        mapSTTState(state, latestTranscript);
      },
      onError: (error) => {
        orchestratorRef.current?.setError(error || "No fue posible capturar voz.");
      },
    });

    if (!stop) {
      orchestratorRef.current?.block();
      return;
    }

    stopListeningRef.current = stop;
  }

  function handleStopListening() {
    stopListeningRef.current?.();
    stopListeningRef.current = null;
    orchestratorRef.current?.reset();
  }

  const isListening = useMemo(
    () => snapshot.state === "listening" || snapshot.state === "transcribing",
    [snapshot.state],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 12 }}>
      <button
        type="button"
        onClick={isListening ? handleStopListening : handleStartListening}
        disabled={disabled}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: 999,
          border: `1px solid ${isListening ? "rgba(74,222,128,0.45)" : "rgba(255,255,255,0.10)"}`,
          background: isListening ? "rgba(22,163,74,0.16)" : "rgba(255,255,255,0.04)",
          color: isListening ? "#4ADE80" : "#CBD5E1",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 18,
        }}
        aria-label={isListening ? "Detener micrófono" : "Activar micrófono"}
      >
        {isListening ? "■" : "🎙"}
      </button>

      <div style={{ minHeight: 40, textAlign: "center" }}>
        <p style={{ color: "#64748B", fontSize: 12, fontWeight: 700, margin: 0, fontFamily: fonts.body }}>
          {LABEL_BY_STATE[snapshot.state]}
        </p>
        {snapshot.transcript ? (
          <p style={{ color: "#CBD5E1", fontSize: 13, margin: "6px 0 0", fontFamily: fonts.body }}>
            “{snapshot.transcript}”
          </p>
        ) : null}
        {snapshot.error ? (
          <p style={{ color: "#F87171", fontSize: 12, margin: "6px 0 0", fontFamily: fonts.body }}>
            {snapshot.error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
