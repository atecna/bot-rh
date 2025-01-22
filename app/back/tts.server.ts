import { Socket } from "socket.io";
import OpenAI from "openai";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "nPczCjzI2devNBz1zQrb"; // ID de la voix Brian

const openai = new OpenAI();

/**
 * Utilise l'API ElevenLabs pour convertir du texte en parole.
 * @param text - Texte à convertir.
 * @returns Buffer audio.
 * @throws Erreur si l'API ElevenLabs échoue.
 */
async function elevenLabsTTS(text: string): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY as string,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0,
          style: 1,
          use_speaker_boost: false,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur API ElevenLabs: ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Utilise l'API OpenAI comme solution de secours pour convertir du texte en parole.
 * @param text - Texte à convertir.
 * @returns Buffer audio.
 * @throws Erreur si l'API OpenAI échoue.
 */
async function openAITTS(text: string): Promise<Buffer> {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "onyx",
    input: text,
    speed: 1.13,
  });

  return Buffer.from(await mp3.arrayBuffer());
}

/**
 * Convertit du texte en parole en utilisant ElevenLabs avec fallback sur OpenAI.
 * @param socket - Instance de Socket.IO pour émettre les données audio.
 * @param text - Texte à convertir en parole.
 */
export async function textToSpeech(socket: Socket, text: string): Promise<void> {
  try {
    const buffer = await elevenLabsTTS(text);
    socket.emit("audio-chunk", buffer);
  } catch (error) {
    console.error("ElevenLabs échoué, tentative avec OpenAI TTS.");
    try {
      const buffer = await openAITTS(text);
      socket.emit("audio-chunk", buffer);
    } catch (openaiError) {
      console.error("Erreur TTS (fallback OpenAI):", openaiError);
      socket.emit("error", "Erreur lors de la synthèse vocale");
    }
  }
} 