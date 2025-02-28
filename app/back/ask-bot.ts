import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { Socket } from 'socket.io';
import { OperationTimer } from '../utils/timer.server.js';

// Interface pour les messages de conversation
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}



/**
 * Traite le flux de réponse de l'IA
 */
async function processResponseStream(
  stream: AsyncIterable<{ text: () => string }>,
  socket: Socket,
  timer: OperationTimer
): Promise<void> {
  let buffer = '';
  let chunkCount = 0;
  let lastError = null;

  try {
    for await (const chunk of stream) {
      chunkCount++;
      try {
        const chunkText = chunk.text();
        buffer += chunkText;
        
        // Émettre le chunk au client
        socket.emit('stream-response', chunkText);
        
      } catch (parseError) {
        lastError = parseError;
        timer.log(`Erreur de parsing du chunk ${chunkCount}: ${parseError}`);
        continue;
      }
    }

    // Vérifier si la réponse semble complète
    const isResponseComplete = buffer.trim().endsWith('.') || 
                              buffer.trim().endsWith('?') || 
                              buffer.trim().endsWith('!') ||
                              buffer.trim().endsWith(')');
    
    // Si la réponse ne semble pas complète, envoyer un message de fin
    if (!isResponseComplete && buffer.length > 0) {
      socket.emit('stream-response', '...');
    }

    timer.log(`Streaming terminé. Total chunks : ${chunkCount}`);
    socket.emit('stream-end');
  } catch (streamError) {
    lastError = streamError;
    timer.log(`Erreur de streaming: ${streamError}`);
    
    // En cas d'erreur, essayer de terminer proprement la réponse
    if (buffer.length > 0) {
      socket.emit('stream-response', '...');
      socket.emit('stream-end');
    } else {
      socket.emit('error', 'Erreur lors du streaming de la réponse.');
    }
  } finally {
    // Assurer que stream-end est toujours envoyé
    if (lastError) {
      timer.log(`Finalisation après erreur: ${lastError}`);
    }
    socket.emit('stream-end');
  }
}

/**
 * Point d'entrée principal pour les requêtes à l'assistant
 */
export default async function askPholon(
  socket: Socket, 
  rawQuestion: string, 
  conversationHistory?: ConversationMessage[]
): Promise<void> {
  // Configuration depuis les variables d'environnement
  const CONFIG = {
    apiKey: process.env.GOOGLE_API_KEY as string,
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    dataPath: process.env.DATA_PATH || "./data.md",
    generationConfig: {
      maxOutputTokens: Number(process.env.MAX_TOKENS) || 150,
      temperature: Number(process.env.TEMPERATURE) || 0.7,
      topP: Number(process.env.TOP_P) || 0.9,
      topK: Number(process.env.TOP_K) || 40,
    },
  };

  // Initialisation de l'API
  console.log("CONFIG", CONFIG);
  const genAI = new GoogleGenerativeAI(CONFIG.apiKey);

  // Chargement des données au démarrage
  let DATA_CONTENT = "";
  try {
    DATA_CONTENT = fs.readFileSync(path.resolve(CONFIG.dataPath), "utf-8");
    console.log(
      `Données chargées depuis ${CONFIG.dataPath} (${DATA_CONTENT.length} caractères)`
    );
  } catch (error) {
    console.error(`Erreur lors du chargement des données: ${error}`);
    DATA_CONTENT = "Aucune donnée disponible.";
  }
  
  const timer = new OperationTimer();
  timer.log("Question reçue : " + rawQuestion);
  timer.log(
    "Historique de conversation : " +
      (conversationHistory?.length || 0) +
      " messages"
  );

  try {
    const model = genAI.getGenerativeModel({ model: CONFIG.model });

    // Construire le prompt avec l'historique de conversation si disponible
    const contents = [];

    // Ajouter d'abord les informations contextuelles
    contents.push({
      role: "user",
      parts: [
        { text: `Voici les données RH consolidées :\n\n${DATA_CONTENT}` },
        {
          text: "Tu es un assistant RH qui aide les employés à trouver des informations dans la documentation RH.",
        },
        {
          text: "Réponds de manière concise et précise, en citant les sources pertinentes, sous forme de lien A LA FIN DE TA REPONSE (en mettant les liens sous forme de [1](lien), [2](lien), [3](lien), etc.)",
        },
        {
          text: "Si tu ne connais pas la réponse, dis-le clairement et suggère où l'employé pourrait trouver l'information.",
        },
      ],
    });

    // Ajouter l'historique de conversation si disponible
    if (conversationHistory && conversationHistory.length > 0) {
      // Ajouter une réponse de l'assistant pour confirmer la compréhension du contexte
      contents.push({
        role: "assistant",
        parts: [
          {
            text: "J'ai compris le contexte. Je vais maintenant répondre à vos questions en tenant compte de notre conversation précédente.",
          },
        ],
      });

      // Ajouter l'historique des messages (limité aux 10 derniers messages pour éviter de dépasser les limites)
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg) => {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      });
    }

    // Ajouter la question actuelle
    contents.push({
      role: "user",
      parts: [{ text: rawQuestion }],
    });

    const prompt = { contents };

    const result = await model.generateContentStream({
      ...prompt,
      generationConfig: CONFIG.generationConfig,
    });

    await processResponseStream(result.stream, socket, timer);
  } catch (error) {
    timer.log(`Erreur : ${error}`);
    socket.emit("stream-error", "Erreur lors du streaming de la réponse.");
  }
}