import dotenv from "dotenv";
dotenv.config();

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
    : import("./build/server/index.js"),
});

// Configurer l'application Remix
remixApp.use(remixHandler);

// You need to create the HTTP server from the Express app
const httpServer = createServer(app);

// And then attach the socket.io server to the HTTP server
const io = new Server(httpServer, {
  path: BASE_PATH ? `${BASE_PATH}/socket.io` : '/socket.io',
});

// Then you can use `io` to listen the `connection` event and get a socket
// from a client
io.on("connection", (socket) => {
  // from this point you are on the WS connection with a specific client
  console.log(socket.id, "connected");

  // Gestion des WebSockets pour Pholon
  handleSocket(socket);
});

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Middleware de journalisation
app.use(morgan("tiny"));

// Middleware pour déboguer les requêtes
app.use((req, res, next) => {
  console.log(`[DEBUG] Requête: ${req.method} ${req.url}`);
  next();
});

// Configuration en fonction du chemin de base
console.log("[INFO] Application configurée à la racine");

// En mode développement, on utilise le middleware Vite
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
}

// Middleware pour les assets statiques en mode production
if (!viteDevServer) {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
}

// Monter l'application Remix à la racine
app.use(remixApp);

const port = process.env.PORT || 3000;

// instead of running listen on the Express app, do it on the HTTP server
httpServer.listen(port, () => {
  const basePath = BASE_PATH || '';
  console.log(`Express server listening at http://localhost:${port}${basePath}`);
});