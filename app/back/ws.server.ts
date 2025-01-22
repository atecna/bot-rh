import { Socket } from "socket.io";
import askPholon from "./ask-pholon.js";
import { transcribeAudio } from "./transcribe.server.js";

/**
 * Gère les connexions WebSocket et les événements associés
 * @param socket - Instance Socket.io pour la connexion client
 */
export function handleSocket(socket: Socket) {
  /**
   * Gère la réception d'une question textuelle
   * @event ask-question
   * @param {string} question - Question envoyée par le client
   */
  socket.on("ask-question", (question: string) => {
    console.log("[SERVER] Question reçue:", question);
    askPholon(socket, question);
  });

  /**
   * Gère la réception de données audio pour transcription et traitement
   * @event audio-data
   * @param {Blob} audioData - Données audio brutes envoyées par le client
   * @emits status - Émet l'état du traitement
   * @emits error - Émet les erreurs éventuelles
   */
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
