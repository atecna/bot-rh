import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { Socket } from 'socket.io';
import { textToSpeech } from './tts.server.js';
import { OperationTimer } from '../utils/timer.server.js';

// Configuration depuis les variables d'environnement
const CONFIG = {
  apiKey: process.env.GOOGLE_API_KEY as string,
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  resourcesPath: process.env.RESOURCES_PATH || './app/resources',
  generationConfig: {
    maxOutputTokens: Number(process.env.MAX_TOKENS) || 150,
    temperature: Number(process.env.TEMPERATURE) || 0.7,
    topP: Number(process.env.TOP_P) || 0.9,
    topK: Number(process.env.TOP_K) || 40
  }
};

// Initialisation de l'API
const genAI = new GoogleGenerativeAI(CONFIG.apiKey);

// Chargement des ressources au démarrage
const RESOURCES = {
  guideJoueur: loadResource('guide_joueur.md'),
  pholonInstructions: loadResource('pholon.md'),
  telamok: loadResource('telamok.md'),
  pnjs: loadResource('pnjs.md')
};

/**
 * Charge le contenu d'un fichier ressource
 * @param filename - Nom du fichier à charger
 */
function loadResource(filename: string): string {
  const filePath = path.resolve(CONFIG.resourcesPath, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Traite et envoie une phrase au client
 */
async function processSentence(
  socket: Socket, 
  sentence: string, 
  timer: OperationTimer,
  chunkCount?: number
): Promise<void> {
  const trimmedSentence = sentence.trim();
  timer.log(chunkCount ? `[Chunk ${chunkCount}] : ${trimmedSentence}` : trimmedSentence);
  socket.emit('stream-response', trimmedSentence);
  await textToSpeech(socket, trimmedSentence);
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

  try {
    for await (const chunk of stream) {
      chunkCount++;
      try {
        buffer += chunk.text();
        
        const sentences = buffer.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length > 0) {
          // Traiter chaque phrase de manière séquentielle
          for (const sentence of sentences) {
            await processSentence(socket, sentence, timer, chunkCount);
          }
          buffer = buffer.substring(
            buffer.lastIndexOf(sentences[sentences.length - 1]) + 
            sentences[sentences.length - 1].length
          );
        }
      } catch (parseError) {
        timer.log(`Erreur de parsing du chunk ${chunkCount}: ${parseError}`);
        continue;
      }
    }

    // Traiter le buffer final s'il reste du contenu
    if (buffer.trim()) {
      await processSentence(socket, buffer.trim(), timer);
    }

    timer.log(`Streaming terminé. Total chunks : ${chunkCount}`);
    socket.emit('stream-end');
  } catch (streamError) {
    timer.log(`Erreur de streaming: ${streamError}`);
    socket.emit('stream-error', 'Erreur lors du streaming de la réponse.');
  }
}

/**
 * Point d'entrée principal pour les requêtes à Pholon
 */
export default async function askPholon(socket: Socket, rawQuestion: string): Promise<void> {
  const timer = new OperationTimer();
  timer.log('Question reçue : ' + rawQuestion);

  try {
    const model = genAI.getGenerativeModel({ model: CONFIG.model });
    const prompt = {
      contents: [{
        role: 'user',
        parts: [
          { text: `Voici le guide complet du joueur que l'on appellera "GUIDE_PRINCIPAL" :\n\n${RESOURCES.guideJoueur}` },
          { text: `Voici les instructions pour être Pholon : \n\n${RESOURCES.pholonInstructions}` },
          { text: `Voici les informations sur la nécropole de Telamok : \n\n${RESOURCES.telamok}` },
          { text: `Voici les informations sur les PNJ que vous avez rencontrés : \n\n${RESOURCES.pnjs}` },
          { text: 'RAPPELLE TOI QUE TU ES PHOLON, ET QUE TU REPONDS SOUS FORME D\'UNE CONVERSATION. SOIT CLAIR, SOIT SIMPLE, SOIT NATURAL ET CONCIS' },
          { text: 'Essaye de répondre en moins de 100 mots, tout en terminant la phrase.' },
          { text: `Voici la question du joueur à Pholon : ${rawQuestion}` }
        ]
      }]
    };

    const result = await model.generateContentStream({
      ...prompt,
      generationConfig: CONFIG.generationConfig
    });

    await processResponseStream(result.stream, socket, timer);

  } catch (error) {
    timer.log(`Erreur : ${error}`);
    socket.emit('stream-error', 'Erreur lors du streaming de la réponse.');
  }
}