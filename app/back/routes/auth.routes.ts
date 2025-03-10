/**
 * Routes d'authentification
 * 
 * Ce module définit toutes les routes liées à l'authentification Microsoft :
 * - /auth/login : Redirection vers la page de connexion Microsoft
 * - /auth/microsoft/callback : Traitement du retour de l'authentification
 * - /auth/logout : Déconnexion
 */

import express, { Router, Response } from "express";
import { AuthenticatedRequest } from "../types";
import { getAuthUrl, handleCallback } from "../auth/microsoft";
import { BASE_PATH, MICROSOFT_CONFIG, MICROSOFT_LOGOUT_URL } from "../config";

const router: Router = express.Router();

/**
 * Route pour la page de connexion
 * Redirige vers l'authentification Microsoft
 */
router.get("/login", async (req, res) => {
  try {
    const authUrl = await getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).send("Erreur lors de l'authentification");
  }
});

/**
 * Route de callback pour traiter le retour de l'authentification Microsoft
 */
// @ts-expect-error build type mismatch with vite dev server
router.get("/microsoft/callback", async (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Code d'autorisation manquant");
  }

  try {
    await handleCallback(req, code as string);
    // Rediriger vers la page d'accueil après une authentification réussie
    res.redirect(BASE_PATH || "/");
  } catch (error) {
    console.error("Erreur lors du traitement du callback:", error);
    res.status(500).send("Erreur lors de l'authentification");
  }
});

/**
 * Route de déconnexion
 * Détruit la session et redirige vers la page de déconnexion Microsoft
 */
router.get("/logout", (req: AuthenticatedRequest, res) => {
  // Construire l'URL de déconnexion
  const logoutUri = `${MICROSOFT_LOGOUT_URL}${encodeURIComponent(
    MICROSOFT_CONFIG.postLogoutRedirectUri
  )}`;

  // Détruire la session
  req.session.destroy(() => {
    res.redirect(logoutUri);
  });
});

export default router; 