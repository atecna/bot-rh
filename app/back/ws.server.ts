import { Socket } from "socket.io";
import askPholon from "./ask-pholon";
import { transcribeAudio } from "./transcribe.server";

export function handleSocket(socket: Socket) {
  socket.on("ask-question", (question: string) => {
    console.log("[SERVER] Question reçue:", question);
    askPholon(socket, question);
  });

  socket.on("audio-data", async (audioData: Blob) => {
    console.log("[SERVER] Audio reçu");
    try {
      const transcription = await transcribeAudio(socket, audioData);
      console.log("[SERVER] Transcription:", transcription);
      
      socket.emit("status", "Je réfléchis à ma réponse...");
      await askPholon(socket, transcription);
      // TODO: Implémenter la génération de la réponse audio
    } catch (error) {
      console.error("Erreur traitement audio:", error);
      socket.emit("error", "Erreur lors du traitement audio");
    }
  });
}
