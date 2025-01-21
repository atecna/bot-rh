import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { textToSpeech } from './tts.server.js';
const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL = 'gemini-2.0-flash-exp';
const guidePath = path.resolve('./app/resources/guide_joueur.md');
const guideContent = fs.readFileSync(guidePath, 'utf-8');
const pholonPath = path.resolve('./app/resources/pholon.md');
const pholonContent = fs.readFileSync(pholonPath, 'utf-8');
export default async function askPholon(socket, rawQuestion) {
    const startTime = Date.now();
    let lastTime = startTime;
    let buffer = '';
    const logTiming = (message) => {
        const now = Date.now();
        const sinceLast = now - lastTime;
        const total = now - startTime;
        console.log(`[+${sinceLast}ms (total: ${total}ms)] ${message}`);
        lastTime = now;
    };
    logTiming('Reçu la question : ' + rawQuestion);
    const question = rawQuestion;
    try {
        logTiming('Guide chargé');
        const model = genAI.getGenerativeModel({ model: MODEL });
        const generationConfig = {
            maxOutputTokens: 150,
            temperature: 0.7,
            topP: 0.9,
            topK: 40
        };
        const result = await model.generateContentStream({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `Voici le guide complet du joueur que l'on appellera "GUIDE_PRINCIPAL" :\n\n${guideContent}` },
                        { text: `Voici les instruction pour être Pholon : \n\n${pholonContent}` },
                        { text: `RAPPELLE TOI QUE TU ES PHOLON, ET QUE TU REPONDS SOUS FORME D'UNE CONVERSATION. SOIT CLAIR, SOIT SIMPLE, SOIT NATURAL ET CONCIS` },
                        { text: `Essaye de répondre en moins de 100 mots, tout en terminant la phrase.` },
                        { text: `Voici la question du joueur à Pholon : ${question}` }
                    ]
                }
            ],
            generationConfig
        });
        let chunkCount = 0;
        for await (const chunk of result.stream) {
            chunkCount++;
            const chunkText = chunk.text();
            buffer += chunkText;
            // On divise le buffer en phrases complètes
            const sentences = buffer.match(/[^.!?]+[.!?]+/g) || [];
            if (sentences.length > 0) {
                // On envoie chaque phrase complète
                for (const sentence of sentences) {
                    const trimmedSentence = sentence.trim();
                    logTiming(`[Chunk ${chunkCount}] : ${trimmedSentence}`);
                    socket.emit('stream-response', trimmedSentence);
                    // Génération audio pour chaque phrase
                    await textToSpeech(socket, trimmedSentence);
                }
                // On garde le reste non terminé dans le buffer
                buffer = buffer.substring(buffer.lastIndexOf(sentences[sentences.length - 1]) + sentences[sentences.length - 1].length);
            }
        }
        // On traite le buffer final s'il contient une phrase complète
        const finalSentences = buffer.match(/[^.!?]+[.!?]+/g) || [];
        if (finalSentences.length > 0) {
            for (const sentence of finalSentences) {
                const trimmedSentence = sentence.trim();
                socket.emit('stream-response', trimmedSentence);
                await textToSpeech(socket, trimmedSentence);
            }
        }
        logTiming(`Streaming terminé. Total chunks : ${chunkCount}`);
        socket.emit('stream-end');
    }
    catch (error) {
        logTiming(`Erreur API : ${error}`);
        socket.emit('stream-error', 'Erreur lors du streaming de la réponse.');
    }
}
