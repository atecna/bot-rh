import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import fs from 'fs/promises';
import path from 'path';

const API_KEY = process.env.GOOGLE_API_KEY as string;
const genAI = new GoogleGenerativeAI(API_KEY);
const cacheManager = new GoogleAICacheManager(API_KEY);

const CACHE_NAME = 'guide-joueur-cache';
const MODEL = 'gemini-1.5-flash-001'; // Modèle compatible avec le streaming

export const action = async ({ request }: { request: Request }) => {
  const startTime = Date.now(); // Début du suivi du temps
  const encoder = new TextEncoder();

  const { question: rawQuestion } = await request.json();
  console.log(`[${Date.now() - startTime}ms] Reçu la question :`, rawQuestion);
  const question = rawQuestion + " Réponds en trois phrases maximum"
  try {
    // Étape 1 : Vérification des caches existants
    console.log(`[${Date.now() - startTime}ms] Vérification des caches...`);
    const caches = await cacheManager.list();
    let cache = caches.cachedContents?.find((c) => c.displayName === CACHE_NAME);

    // Étape 2 : Création du cache si nécessaire
    if (!cache) {
      console.log(`[${Date.now() - startTime}ms] Cache non trouvé, création en cours...`);
      const guidePath = path.resolve('./app/resources/guide_joueur.md');
      const guideContent = await fs.readFile(guidePath, 'utf-8');
      console.log(`[${Date.now() - startTime}ms] Fichier guide_joueur.md chargé.`);

      cache = await cacheManager.create({
        model: MODEL,
        displayName: CACHE_NAME,
        systemInstruction: 'Pholon est un guide expert sur Thyléa, utilisant le contenu suivant.',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Voici le guide complet du joueur :\n\n${guideContent}`,
              },
            ],
          },
        ],
        ttlSeconds: 3600, // 1 heure
      });
      console.log(`[${Date.now() - startTime}ms] Cache créé avec succès.`);
    } else {
      console.log(`[${Date.now() - startTime}ms] Cache trouvé, utilisation en cours...`);
    }

    // Étape 3 : Démarrage du streaming
    console.log(`[${Date.now() - startTime}ms] Démarrage du streaming...`);

    const stream = new ReadableStream({
      async start(controller) {
        const genModel = genAI.getGenerativeModelFromCachedContent(cache);
        const result = await genModel.generateContentStream({
          contents: [{ role: 'user', parts: [{ text: question }] }],
        });

        let chunkCount = 0; // Pour compter les chunks

        // Récupère les données en streaming
        for await (const chunk of result.stream) {
          chunkCount++;
          const chunkText = chunk.text();
          console.log(`[Chunk ${chunkCount} reçu]:`, chunkText);
          controller.enqueue(encoder.encode(chunkText));
          // Ajout d'un délai artificiel pour tester
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`[${Date.now() - startTime}ms] Streaming terminé. Total chunks : ${chunkCount}`);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error(`[${Date.now() - startTime}ms] Erreur API Gemini :`, error);
    return new Response('Erreur lors du streaming de la réponse.', {
      status: 500,
    });
  }
};