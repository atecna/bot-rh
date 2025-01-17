import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { Socket } from 'socket.io';

const API_KEY = process.env.GOOGLE_API_KEY as string;
const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL = 'gemini-2.0-flash-exp';

export default async function askPholon(socket: Socket, rawQuestion: string) {
  const startTime = Date.now();
  let lastTime = startTime;

  const logTiming = (message: string) => {
    const now = Date.now();
    const sinceLast = now - lastTime;
    const total = now - startTime;
    console.log(`[+${sinceLast}ms (total: ${total}ms)] ${message}`);
    lastTime = now;
  };

  logTiming('Reçu la question : ' + rawQuestion);
  const question = rawQuestion;

  try {
    const guidePath = path.resolve('./app/resources/guide_joueur.md');
    const guideContent = await fs.readFile(guidePath, 'utf-8');
    logTiming('Guide chargé');

    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContentStream({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Voici le guide complet du joueur :\n\n${guideContent}` },
            {
            text: question
          }]
        },
        {
          role: 'user',
          parts: [{ text: question }]
        }
      ],
    });

    let chunkCount = 0;
    for await (const chunk of result.stream) {
      chunkCount++;
      const chunkText = chunk.text();
      logTiming(`[Chunk ${chunkCount}] : ${chunkText}`);
      socket.emit('stream-response', chunkText);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    logTiming(`Streaming terminé. Total chunks : ${chunkCount}`);
    socket.emit('stream-end');

  } catch (error) {
    logTiming(`Erreur API Gemini : ${error}`);
    socket.emit('stream-error', 'Erreur lors du streaming de la réponse.');
  }
}