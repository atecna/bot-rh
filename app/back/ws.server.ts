import type { Socket } from "socket.io";
import askPholon from "./ask-bot.js";

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Gère les connexions WebSocket et les événements associés
 * @param socket - Instance Socket.io pour la connexion client
 */
export function handleSocket(socket: Socket) {
  console.log("Client connecté:", socket.id);
  
  socket.on("join-sync-room", (sessionId: string) => {
    socket.join(sessionId);
    console.log(`Client ${socket.id} a rejoint la salle: ${sessionId}`);
  });
  
  socket.on("disconnect", () => {
    console.log("Client déconnecté:", socket.id);
  });

  /**
   * Gère la réception d'une question textuelle
   * @event ask-question
   * @param {string} question - Question envoyée par le client
   * @param {ConversationMessage[]} conversationHistory - Historique de la conversation
   */
  socket.on("ask-question", (question: string, conversationHistory?: ConversationMessage[]) => {
    console.log("[SERVER] Question reçue:", question);
    console.log("[SERVER] Historique de conversation reçu:", conversationHistory?.length || 0, "messages");
    askPholon(socket, question, conversationHistory);
  });
}

export function emitSyncProgress(io: any, sessionId: string, data: { current: number; total: number; pageId?: string; pageTitle?: string }) {
  io.to(sessionId).emit("sync-progress", data);
}

export function emitSyncComplete(io: any, sessionId: string, data: { success: boolean; message: string }) {
  io.to(sessionId).emit("sync-complete", data);
}
