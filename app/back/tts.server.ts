import { Socket } from "socket.io";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "nPczCjzI2devNBz1zQrb"; // ID de la voix Brian

export async function textToSpeech(socket: Socket, text: string) {
  try {
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
          model_id: "eleven_multilingual_v2",// "eleven_flash_v2_5",
          voice_settings: {
            stability: 0.3,
            similarity_boost: 0,
            style: 1,
            use_speaker_boost: false
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    socket.emit("audio-chunk", buffer);
  } catch (error) {
    console.error("Erreur TTS:", error);
    socket.emit("error", "Erreur lors de la synthèse vocale");
  }
} 