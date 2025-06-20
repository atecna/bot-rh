/**
 * Routes d'authentification
 * 
 * Ce module définit toutes les routes liées à l'authentification Microsoft :
 * - /auth/login : Redirection vers la page de connexion Microsoft
 * - /auth/microsoft/callback : Traitement du retour de l'authentification
 * - /auth/logout : Déconnexion
 */

import express, { Router, Response } from "express";
import { AuthenticatedRequest } from "../types.js";
import { getAuthUrl, handleCallback } from "../auth/microsoft.js";
import { BASE_PATH, MICROSOFT_CONFIG, MICROSOFT_LOGOUT_URL } from "../config.js";

const router: Router = express.Router();

/**
 * Route pour la page de connexion
 * Redirige vers l'authentification Microsoft
 */
router.get("/login", async (req: AuthenticatedRequest, res) => {
  console.log("[AUTH_ROUTES] Demande de connexion reçue");
  console.log("[AUTH_ROUTES] Informations de session:", {
    isAuthenticated: req.session?.isAuthenticated,
    hasAccessToken: !!req.session?.accessToken,
    sessionID: req.sessionID,
    cookies: req.headers.cookie
  });

  try {
    const authUrl = await getAuthUrl();
    console.log(`[AUTH_ROUTES] Redirection vers l'URL d'authentification Microsoft: ${authUrl}`);
    res.redirect(authUrl);
  } catch (error) {
    console.error("[AUTH_ROUTES] Erreur lors de la connexion:", error);
    res.status(500).send("Erreur lors de l'authentification");
  }
});

/**
 * Route de callback pour traiter le retour de l'authentification Microsoft
 */
// @ts-expect-error build type mismatch with vite dev server
router.get("/microsoft/callback", async (req: AuthenticatedRequest, res: Response) => {
  console.log("[AUTH_ROUTES] Callback Microsoft reçu");
  console.log("[AUTH_ROUTES] Query params:", req.query);
  console.log("[AUTH_ROUTES] Cookies:", req.headers.cookie);
  
  const { code, error, error_description } = req.query;

  if (error) {
    console.error(`[AUTH_ROUTES] Erreur retournée par Microsoft: ${error}, description: ${error_description}`);
    return res.status(400).send(`Erreur d'authentification: ${error_description || error}`);
  }

  if (!code) {
    console.error("[AUTH_ROUTES] Code d'autorisation manquant dans le callback");
    return res.status(400).send("Code d'autorisation manquant");
  }

  try {
    console.log("[AUTH_ROUTES] Traitement du code d'autorisation");
    await handleCallback(req, code as string);
    
    console.log("[AUTH_ROUTES] Authentification réussie, état de la session:", {
      isAuthenticated: req.session.isAuthenticated,
      hasAccessToken: !!req.session.accessToken,
      hasRefreshToken: !!req.session.refreshToken,
      tokenExpires: req.session.tokenExpires ? new Date(req.session.tokenExpires).toISOString() : null,
      sessionID: req.sessionID
    });
    
    // Forcer la sauvegarde de la session avant la redirection
    req.session.save((err: Error | null) => {
      if (err) {
        console.error("[AUTH_ROUTES] Erreur lors de la sauvegarde de la session:", err);
        return res.status(500).send("Erreur lors de la sauvegarde de la session");
      }
      
      // Rediriger vers la page d'accueil après une authentification réussie
      console.log(`[AUTH_ROUTES] Redirection vers la page d'accueil: ${BASE_PATH || "/"}`);
      res.redirect(BASE_PATH || "/");
    });
  } catch (error) {
    console.error("[AUTH_ROUTES] Erreur lors du traitement du callback:", error);
    res.status(500).send("Erreur lors de l'authentification");
  }
});

/**
 * Route de déconnexion
 * Détruit la session et redirige vers la page de déconnexion Microsoft
 */
router.get("/logout", (req: AuthenticatedRequest, res) => {
  console.log("[AUTH_ROUTES] Demande de déconnexion reçue");
  console.log("[AUTH_ROUTES] État de la session avant déconnexion:", {
    isAuthenticated: req.session.isAuthenticated,
    hasAccessToken: !!req.session.accessToken,
    sessionID: req.sessionID,
    cookies: req.headers.cookie
  });

  // Construire l'URL de déconnexion
  const logoutUri = `${MICROSOFT_LOGOUT_URL}${encodeURIComponent(
    MICROSOFT_CONFIG.postLogoutRedirectUri
  )}`;
  
  console.log(`[AUTH_ROUTES] URL de déconnexion: ${logoutUri}`);

  // Détruire la session
  req.session.destroy(() => {
    console.log("[AUTH_ROUTES] Session détruite, redirection vers la page de déconnexion Microsoft");
    
    // Supprimer le cookie de session
    res.clearCookie('bot-rh.sid');
    
    res.redirect(logoutUri);
  });
});

export default router; 