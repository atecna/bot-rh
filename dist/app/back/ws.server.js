import askPholon from "./ask-pholon.js";
import { transcribeAudio } from "./transcribe.server.js";
export function handleSocket(socket) {
    socket.on("ask-question", (question) => {
        console.log("[SERVER] Question reçue:", question);
        askPholon(socket, question);
    });
    socket.on("audio-data", async (audioData) => {
        console.log("[SERVER] Audio reçu");
        try {
            const transcription = await transcribeAudio(socket, audioData);
            console.log("[SERVER] Transcription:", transcription);
            socket.emit("status", "Je réfléchis à ma réponse...");
            await askPholon(socket, transcription);
            // TODO: Implémenter la génération de la réponse audio
        }
        catch (error) {
            console.error("Erreur traitement audio:", error);
            socket.emit("error", "Erreur lors du traitement audio");
        }
    });
}
