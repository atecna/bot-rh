import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import { Server } from "socket.io";
import { handleSocket } from './app/back/ws.server';
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

const remixHandler = createRequestHandler({
  // @ts-expect-error build type mismatch with vite dev server
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : await import("./build/server/index.js"),
});

const app = express();

// You need to create the HTTP server from the Express app
const httpServer = createServer(app);

// And then attach the socket.io server to the HTTP server
const io = new Server(httpServer);

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

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("build/client", { maxAge: "1h" }));

app.use(morgan("tiny"));

// handle SSR requests
app.all("*", remixHandler);

const port = process.env.PORT || 3000;

// instead of running listen on the Express app, do it on the HTTP server
httpServer.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});