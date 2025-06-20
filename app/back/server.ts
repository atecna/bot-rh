/**
 * Point d'entrée principal du serveur Express
 * 
 * Ce fichier configure et démarre le serveur Express avec :
 * - L'authentification Microsoft
 * - Le support de Socket.io pour les WebSockets
 * - L'intégration avec Remix pour le rendu côté serveur
 * - La génération de contenu statique
 * 
 * L'architecture est organisée pour séparer les responsabilités :
 * - Configuration dans config.ts
 * - Types et interfaces dans types.ts
 * - Logique d'authentification dans auth/microsoft.ts
 * - Middleware d'authentification dans middleware/auth.middleware.ts
 * - Routes d'authentification dans routes/auth.routes.ts
 * - Gestion des WebSockets dans ws.server.ts
 */

import { createServer } from "http";
import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import session from "express-session";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Import des modules internes
import { 
  PORT, 
  BASE_PATH, 
  IS_PRODUCTION, 
  SESSION_CONFIG,
  SOCKET_IO_CONFIG 
} from "./config.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import { handleSocket } from "./ws.server.js";
import { AuthenticatedRequest } from "./types.js";

/**
 * Initialisation du fichier data.md au démarrage
 */
function initializeDataFile() {
  console.log("Initialisation du fichier data.md...");
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "create-data.js");
    if (fs.existsSync(scriptPath)) {
      execSync("node scripts/create-data.js", { stdio: "inherit" });
      console.log("Fichier data.md créé avec succès.");
    } else {
      console.warn(
        "Le script create-data.js n'existe pas. Le fichier data.md ne sera pas mis à jour."
      );
    }
  } catch (error) {
    console.error("Erreur lors de la création du fichier data.md:", error);
  }
}

/**
 * Configuration du serveur de développement Vite
 */
async function setupViteDevServer() {
  if (IS_PRODUCTION) {
    return undefined;
  }
  
  // Import dynamique de Vite uniquement en développement
  return import("vite").then((vite) =>
    vite.createServer({
      server: { middlewareMode: true },
    })
  );
}

/**
 * Fonction principale qui initialise et démarre le serveur
 */
async function startServer() {
  // Créer le fichier data.md
  // initializeDataFile();
  
  // Initialiser le serveur de développement Vite (si en mode dev)
  const viteDevServer = await setupViteDevServer();
  
  // Créer l'application Express principale
  const app = express();
  
  // Configuration pour le proxy inverse
  app.set('trust proxy', 1);
  
  // Configuration des middlewares de base
  app.use(compression());
  app.disable("x-powered-by");
  app.use(morgan("tiny"));
  app.use(cookieParser());
  
  // Configuration de la session
  // En production, il est recommandé d'utiliser un store de session persistant
  // comme Redis ou MongoDB, mais pour simplifier, nous utilisons MemoryStore
  // avec des logs supplémentaires pour le débogage
  const sessionMiddleware = session(SESSION_CONFIG);

  // Ajouter un middleware pour logger les cookies
  app.use((req, res, next) => {
    console.log(`[COOKIE_DEBUG] Cookies reçus pour ${req.path}:`, req.headers.cookie);
    next();
  });
  
  // Ajouter un middleware pour logger les sessions
  app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
      console.log(`[SESSION_DEBUG] Réponse envoyée pour ${req.path}, cookies:`, req.headers.cookie);
      return originalSend.call(this, body);
    };
    next();
  });
  
  app.use(sessionMiddleware);
  
  // Ajouter un middleware pour logger les sessions après leur initialisation
  app.use((req: AuthenticatedRequest, res, next) => {
    console.log(`[SESSION_DEBUG] Session après initialisation pour ${req.path}:`, {
      id: req.sessionID,
      isAuthenticated: req.session?.isAuthenticated,
      cookie: req.session?.cookie
    });
    
    // Intercepter la fin de la requête pour logger l'état final de la session
    res.on('finish', () => {
      console.log(`[SESSION_DEBUG] Fin de requête pour ${req.path}, session:`, {
        id: req.sessionID,
        isAuthenticated: req.session?.isAuthenticated
      });
    });
    
    next();
  });
  
  // Routes d'authentification (sans middleware d'authentification)
  app.use(`${BASE_PATH}/auth`, authRoutes);
  
  // Middleware d'authentification pour toutes les autres routes
  if (process.env.USE_AUTH !== "false") {
    app.use(authMiddleware);
  }
  
  // Créer l'application Express pour Remix
  const remixApp = express();
  
  // Gestionnaire Remix
  const remixHandler = createRequestHandler({
    // @ts-expect-error build type mismatch with vite dev server
    build: viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
      : async () => {
          const build = await import("../../build/server/index.js");
          return build;
      },
    getLoadContext: (req) => ({
      session: req.session,
    }),
  });
  
  // Configurer l'application Remix
  remixApp.use(remixHandler);
  
  // Configuration des assets statiques en production
  if (!viteDevServer) {
    app.use(
      `${BASE_PATH}/assets`,
      express.static("build/client/assets", { immutable: true, maxAge: "1y" })
    );
    app.use(express.static("build/client", { maxAge: "1h" }));
  } else {
    // En mode développement, on utilise le middleware Vite
    app.use(viteDevServer.middlewares);
  }
  
  // Monter l'application Remix à la racine
  app.use(remixApp);
  
  // Création du serveur HTTP
  const httpServer = createServer(app);
  
  // Configuration de Socket.io
  const io = new Server(httpServer, SOCKET_IO_CONFIG);
  
  // Rendre l'instance io disponible globalement
  global.io = io;
  
  // Gestion des connexions WebSocket
  io.on("connection", (socket) => {
    console.log(socket.id, "connected");
    handleSocket(socket);
  });
  
  // Démarrage du serveur HTTP
  httpServer.listen(PORT, () => {
    console.log(
      `Express server listening at http://localhost:${PORT}${BASE_PATH}`
    );
  });
}

// Exécuter la fonction principale
startServer().catch(console.error);

// Type global pour l'instance socket.io
declare global {
  var io: any;
} 