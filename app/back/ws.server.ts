import { Socket } from "socket.io";
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
