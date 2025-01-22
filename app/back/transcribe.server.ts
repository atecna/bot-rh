import OpenAI from "openai";
import { Socket } from "socket.io";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Liste des termes spécifiques à l'univers de Thyléa pour améliorer la précision de la transcription */
const THYLEAN_TERMS = [
  "Pholon", "Anora", "Thyléa", "Kentimane", "Sydon", "Luthéria", "Mytros",
  "Volkan", "Pythor", "Vallus", "Kyrah", "Versi", "Estoria", "Arésie",
  "Praxys", "Gygans", "Stimfées", "Hoplites", "Kopis", "Chakram", "Xiphos",
  "Acaste", "Leyland", "Delphion", "Tesséla", "Moxéna", "l'Arbre-Cœur",
  "Morée", "Plume", "Icarus", "Paelias", "Electra", "Céruléen", "Mytros",
  "Arésien", "Enfers", "Ultros", "Arkelander", "Arkelon", "Xandéria",
  "Damon", "Ophéa", "Hexia", "Thémis", "Atrokos", "Odysséens"
].join(", ");

/**
 * Transcrit un fichier audio en texte en utilisant l'API OpenAI Whisper.
 * @param socket - Instance de Socket.IO pour émettre les statuts et résultats.
 * @param audioBlob - Données audio au format Blob à transcrire.
 * @returns Le texte transcrit.
 * @throws Erreur si la transcription échoue.
 */
export async function transcribeAudio(socket: Socket, audioBlob: Blob): Promise<string> {
  try {
    socket.emit("status", "Transcription audio en cours...");
    
    const audioFile = new File([audioBlob], "audio.webm", { 
      type: "audio/webm" 
    });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "fr",
      prompt: THYLEAN_TERMS,
    });

    const transcribedText = transcription.text.trim();
    socket.emit("transcription", transcribedText);
    return transcribedText;

  } catch (error) {
    console.error("Erreur de transcription:", error);
    socket.emit("error", "Échec de la transcription audio");
    throw new Error("Échec de la transcription audio");
  }
} 