// src/app/api/voice/speak/route.ts
// API endpoint general para sintetizar cualquier texto con TTS neuronal

import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/shared/apiResponse";
import { requireAuth } from "@/shared";
import { formatForTTS } from "@/modules/voice/voiceFormatter";
import { synthesizeWithElevenLabs } from "@/modules/voice/voiceProvider";
import {
  getCachedAudio,
  setCachedAudio,
} from "@/modules/voice/voiceCache";
import {
  VOICE_CONFIG,
  ELEVENLABS_VOICE_ID,
  NEURAL_VOICE_SETTINGS,
} from "@/modules/voice/voiceConfig";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const body = (await request.json()) as {
      text: string;
      voiceId?: string;
      stability?: number;
      similarityBoost?: number;
      styleExaggeration?: number;
    };

    if (!body.text?.trim()) {
      return fail("Texto requerido para sintetizar.", 400);
    }

    const voiceId = body.voiceId ?? ELEVENLABS_VOICE_ID;

    // Formatear texto para TTS
    const formatted = formatForTTS(body.text, {
      addPauses: true,
      preserveLineBreaks: true,
    });

    // Verificar caché
    const cached = getCachedAudio(formatted, voiceId);
    if (cached) {
      return new NextResponse(cached.audio, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "X-Voice-Provider": "elevenlabs",
          "X-Voice-Cache": "hit",
          "X-Voice-Lang": VOICE_CONFIG.lang,
        },
      });
    }

    // Sintetizar con ElevenLabs usando configuración base
    const result = await synthesizeWithElevenLabs(formatted, {
      voiceId,
      stability: body.stability ?? NEURAL_VOICE_SETTINGS.stability,
      similarityBoost: body.similarityBoost ?? NEURAL_VOICE_SETTINGS.similarityBoost,
      styleExaggeration: body.styleExaggeration ?? NEURAL_VOICE_SETTINGS.styleExaggeration,
    });

    // Cachear
    setCachedAudio(formatted, voiceId, {
      audio: result.audio,
      format: result.format,
      provider: result.provider,
      cachedAt: Date.now(),
    });

    return new NextResponse(result.audio, {
      status: 200,
      headers: {
        "Content-Type": `audio/${result.format}`,
        "X-Voice-Provider": result.provider,
        "X-Voice-Cache": "miss",
        "X-Voice-Lang": VOICE_CONFIG.lang,
      },
    });
  } catch (error) {
    const err = error as { code?: string; message?: string; status?: number };
    console.error("[voice/speak] Error:", err.message ?? error);

    return NextResponse.json(
      {
        ok: false,
        message: err.message ?? "Error al sintetizar voz",
        data: null,
        fallback: true,
      },
      { status: err.status ?? 502 },
    );
  }
}
