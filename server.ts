import dotenv from "dotenv";
dotenv.config();

console.log("=== Variables d'environnement ===");
console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);
console.log("ELEVENLABS_API_KEY:", process.env.ELEVENLABS_API_KEY);
console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL);
console.log("MAX_TOKENS:", process.env.MAX_TOKENS);
console.log("TEMPERATURE:", process.env.TEMPERATURE);
console.log("TOP_P:", process.env.TOP_P);
console.log("TOP_K:", process.env.TOP_K);
console.log("BASE_PATH:", process.env.BASE_PATH);


import { createServer } from "http";
import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import { Server } from "socket.io";
import { handleSocket } from './app/back/ws.server.js';
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Création du fichier data.md au démarrage
console.log("Création du fichier data.md...");
try {
  // Vérifier si le dossier scripts existe
  if (fs.existsSync(path.join(process.cwd(), "scripts", "create-data.js"))) {
    execSync("node scripts/create-data.js", { stdio: "inherit" });
    console.log("Fichier data.md créé avec succès.");
  } else {
    console.warn("Le script create-data.js n'existe pas. Le fichier data.md ne sera pas mis à jour.");
  }
} catch (error) {
  console.error("Erreur lors de la création du fichier data.md:", error);
}

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
      vite.createServer({
        server: { middlewareMode: true },
      }),
    );

// Définir le chemin de base depuis la variable d'environnement
const BASE_PATH = process.env.BASE_PATH || '';

// Créer l'application Express principale
const app = express();

// Créer une application Express pour Remix
const remixApp = express();

// Créer le gestionnaire Remix
const remixHandler = createRequestHandler({
  // @ts-expect-error build type mismatch with vite dev server
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : async () => {
        // En production, on s'assure que les routes sont correctement chargées
        const build = await import("./build/server/index.js");
        return build;
      },
});

// Configurer l'application Remix
remixApp.use(remixHandler);

// Création du serveur HTTP à partir de l'application Express
const httpServer = createServer(app);

// Attachement du serveur socket.io au serveur HTTP
const io = new Server(httpServer, {
  path: BASE_PATH ? `${BASE_PATH}/socket.io` : '/socket.io',
});

// Rendre l'instance io disponible globalement
declare global {
  var io: any;
}
global.io = io;

// Gestion des connexions WebSocket
io.on("connection", (socket) => {
  console.log(socket.id, "connected");

  // Gestion des WebSockets
  handleSocket(socket);
});

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Middleware de journalisation
app.use(morgan("tiny"));

// Configuration en fonction du chemin de base
console.log("[INFO] Application configurée à la racine");

// En mode développement, on utilise le middleware Vite
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
}

// Middleware pour les assets statiques en mode production
if (!viteDevServer) {
  app.use(
    `${BASE_PATH}/assets`,
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
}

// Monter l'application Remix à la racine
app.use(remixApp);

const port = process.env.PORT || 3000;

// Démarrage du serveur HTTP
httpServer.listen(port, () => {
  const basePath = BASE_PATH || '';
  console.log(`Express server listening at http://localhost:${port}${basePath}`);
});