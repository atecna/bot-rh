/**
 * Configuration centrale de l'application
 * 
 * Ce fichier centralise toutes les variables d'environnement et constantes
 * utilisées dans l'application pour faciliter la maintenance et la configuration.
 */

import dotenv from "dotenv";
import { LogLevel } from "@azure/msal-node";

// Chargement des variables d'environnement
dotenv.config();

// Configuration de base
export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const BASE_PATH = process.env.BASE_PATH || "";
export const IS_PRODUCTION = NODE_ENV === "production";
export const SESSION_SECRET = process.env.SESSION_SECRET || "votre_secret_de_session";
export const DOMAIN = process.env.DOMAIN || "innovation.atecna.fr";

// Configuration Microsoft Authentication
export const MICROSOFT_CONFIG = {
  clientId: process.env.MICROSOFT_CLIENT_ID || "",
  tenantId: process.env.MICROSOFT_TENANT_ID || "",
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
  redirectUri:
    process.env.MICROSOFT_REDIRECT_URI ||
    `http://localhost:${PORT}${BASE_PATH}/auth/microsoft/callback`,
  postLogoutRedirectUri:
    process.env.MICROSOFT_POST_LOGOUT_REDIRECT_URI ||
    `http://localhost:${PORT}${BASE_PATH}`,
  scopes: ["User.Read", "offline_access"],
};

// Configuration MSAL
export const MSAL_CONFIG = {
  auth: {
    clientId: MICROSOFT_CONFIG.clientId,
    authority: `https://login.microsoftonline.com/${MICROSOFT_CONFIG.tenantId}`,
    clientSecret: MICROSOFT_CONFIG.clientSecret,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: LogLevel, message: string) {
        console.log(`[MSAL] ${message}`);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose,
    },
  },
};

// Configuration des sessions
export const SESSION_CONFIG = {
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: "bot-rh.sid",
  proxy: true,
  cookie: {
    secure: IS_PRODUCTION,
    httpOnly: true,
    sameSite: IS_PRODUCTION ? 'none' as const : 'lax' as const,
    maxAge: 24 * 60 * 60 * 1000,
    path: BASE_PATH || '/',
    domain: IS_PRODUCTION ? DOMAIN : undefined,
  },
};

// Configuration socket.io
export const SOCKET_IO_CONFIG = {
  path: BASE_PATH ? `${BASE_PATH}/socket.io` : "/socket.io",
};

// URLs d'authentification Microsoft
export const MICROSOFT_LOGOUT_URL = `https://login.microsoftonline.com/${MICROSOFT_CONFIG.tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=`;

// Afficher les informations de configuration au démarrage
console.log("[CONFIG] Environnement:", {
  NODE_ENV,
  IS_PRODUCTION,
  PORT,
  BASE_PATH,
  DOMAIN
});

console.log("[CONFIG] Configuration Microsoft:", {
  clientId: MICROSOFT_CONFIG.clientId ? "défini" : "non défini",
  tenantId: MICROSOFT_CONFIG.tenantId ? "défini" : "non défini",
  clientSecret: MICROSOFT_CONFIG.clientSecret ? "défini" : "non défini",
  redirectUri: MICROSOFT_CONFIG.redirectUri,
  postLogoutRedirectUri: MICROSOFT_CONFIG.postLogoutRedirectUri,
  scopes: MICROSOFT_CONFIG.scopes
});

console.log("[CONFIG] Configuration des sessions:", {
  secure: SESSION_CONFIG.cookie.secure,
  httpOnly: SESSION_CONFIG.cookie.httpOnly,
  sameSite: SESSION_CONFIG.cookie.sameSite,
  path: SESSION_CONFIG.cookie.path,
  domain: SESSION_CONFIG.cookie.domain,
  maxAge: SESSION_CONFIG.cookie.maxAge / (60 * 60 * 1000) + " heures",
  name: SESSION_CONFIG.name,
  proxy: SESSION_CONFIG.proxy
});

// Vérifier la configuration Microsoft
if (IS_PRODUCTION) {
  if (!MICROSOFT_CONFIG.clientId || !MICROSOFT_CONFIG.tenantId || !MICROSOFT_CONFIG.clientSecret) {
    console.error("[CONFIG] ERREUR: Paramètres d'authentification Microsoft manquants en production!");
  }
  
  // Vérifier si l'URL de redirection est en HTTPS
  if (!MICROSOFT_CONFIG.redirectUri.startsWith('https://')) {
    console.error("[CONFIG] ERREUR: L'URL de redirection doit être en HTTPS en production!");
    console.error("[CONFIG] URL actuelle:", MICROSOFT_CONFIG.redirectUri);
  }
  
  // Vérifier si l'URL de redirection après déconnexion est en HTTPS
  if (!MICROSOFT_CONFIG.postLogoutRedirectUri.startsWith('https://')) {
    console.error("[CONFIG] ERREUR: L'URL de redirection après déconnexion doit être en HTTPS en production!");
    console.error("[CONFIG] URL actuelle:", MICROSOFT_CONFIG.postLogoutRedirectUri);
  }
  
  // Avertissement sur l'utilisation de MemoryStore
  console.warn("[CONFIG] ATTENTION: Vous utilisez MemoryStore pour les sessions en production.");
  console.warn("[CONFIG] Il est recommandé d'utiliser un store de session persistant comme Redis ou MongoDB.");
} 