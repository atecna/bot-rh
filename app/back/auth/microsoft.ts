/**
 * Service d'authentification Microsoft
 * 
 * Ce module gère l'authentification avec Microsoft via MSAL (Microsoft Authentication Library)
 * Il fournit des méthodes pour l'authentification, la gestion des tokens et la déconnexion.
 */

import { ConfidentialClientApplication } from "@azure/msal-node";
import { MSAL_CONFIG, MICROSOFT_CONFIG } from "../config";
import { AuthenticatedRequest } from "../types";

/**
 * Instance de l'application MSAL pour l'authentification Microsoft
 */
export const msalInstance = new ConfidentialClientApplication(MSAL_CONFIG);

/**
 * Génère l'URL d'authentification pour rediriger l'utilisateur
 * vers la page de connexion Microsoft
 */
export async function getAuthUrl(): Promise<string> {
  const authCodeUrlParameters = {
    scopes: MICROSOFT_CONFIG.scopes,
    redirectUri: MICROSOFT_CONFIG.redirectUri,
  };

  try {
    return await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL d'authentification:", error);
    throw new Error("Impossible de générer l'URL d'authentification");
  }
}

/**
 * Échange le code d'autorisation contre des tokens
 * et stocke les informations dans la session
 */
export async function handleCallback(req: AuthenticatedRequest, code: string): Promise<void> {
  try {
    const tokenRequest = {
      code,
      scopes: MICROSOFT_CONFIG.scopes,
      redirectUri: MICROSOFT_CONFIG.redirectUri,
    };

    const tokenResponse = await msalInstance.acquireTokenByCode(tokenRequest);

    if (tokenResponse) {
      // Stocke les informations dans la session
      req.session.isAuthenticated = true;
      req.session.accessToken = tokenResponse.accessToken;
      // @ts-ignore - refreshToken existe dans la réponse
      req.session.refreshToken = tokenResponse.refreshToken;
      req.session.tokenExpires = tokenResponse.expiresOn ? 
        new Date(tokenResponse.expiresOn).getTime() : 
        Date.now() + 3600 * 1000;
      req.session.account = tokenResponse.account;
    }
  } catch (error) {
    console.error("Erreur lors de l'échange du code d'autorisation:", error);
    throw new Error("Échec de l'authentification");
  }
}

/**
 * Rafraîchit le token d'accès s'il a expiré
 * @returns true si le token a été rafraîchi avec succès, false sinon
 */
export async function refreshToken(req: AuthenticatedRequest): Promise<boolean> {
  try {
    if (!req.session.refreshToken) {
      return false;
    }

    const tokenRequest = {
      refreshToken: req.session.refreshToken,
      scopes: MICROSOFT_CONFIG.scopes,
    };

    const tokenResponse = await msalInstance.acquireTokenByRefreshToken(tokenRequest);
    
    if (tokenResponse) {
      // Mise à jour de la session avec les nouveaux tokens
      req.session.accessToken = tokenResponse.accessToken;
      // @ts-ignore - refreshToken existe dans la réponse
      req.session.refreshToken = tokenResponse.refreshToken;
      req.session.tokenExpires = tokenResponse.expiresOn ? 
        new Date(tokenResponse.expiresOn).getTime() : 
        Date.now() + 3600 * 1000;
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token:", error);
    return false;
  }
} 