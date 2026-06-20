// src/app/api/voice/welcome/route.ts
// API endpoint para sintetizar la bienvenida de LEDGERA usando TTS neuronal
// UX 3.1.3 — usa perfil activo desde voiceConfig o recibe profileId desde el frontend

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
  WELCOME_MESSAGE,
  VOICE_CONFIG,
  ACTIVE_VOICE_PROFILE,
  VOICE_PROFILES,
} from "@/modules/voice/voiceConfig";
import type { VoiceProfile } from "@/modules/voice/voiceConfig";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const body = (await request.json()) as {
      text?: string;
      /** Perfil A/B: "consultiva" | "profesional" | "ejecutiva" */
      profileId?: string;
      voiceId?: string;
      stability?: number;
      similarityBoost?: number;
      styleExaggeration?: number;
    } | null;

    const text = body?.text ?? WELCOME_MESSAGE;

    // Resolver perfil: si se envió profileId, usar ese; si no, usar el activo
    let profile: VoiceProfile;
    if (body?.profileId && VOICE_PROFILES[body.profileId]) {
      profile = VOICE_PROFILES[body.profileId];
    } else {
      profile = ACTIVE_VOICE_PROFILE;
    }

    const voiceId = body?.voiceId ?? profile.voiceId;

    // Formatear texto para TTS (normaliza pronunciación, limpia, estructura pausas)
    const formatted = formatForTTS(text, {
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
          "X-Voice-Profile": profile.id,
        },
      });
    }

    // Sintetizar con ElevenLabs usando parámetros del perfil
    const result = await synthesizeWithElevenLabs(formatted, {
      voiceId,
      stability: body?.stability ?? profile.stability,
      similarityBoost: body?.similarityBoost ?? profile.similarityBoost,
      styleExaggeration: body?.styleExaggeration ?? profile.styleExaggeration,
    });

    // Almacenar en caché
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
        "X-Voice-Profile": profile.id,
      },
    });
  } catch (error) {
    const err = error as { code?: string; message?: string; status?: number };
    console.error("[voice/welcome] Error:", err.message ?? error);

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
