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
  console.log("[AUTH] Génération de l'URL d'authentification Microsoft");
  console.log("[AUTH] Paramètres:", { 
    scopes: MICROSOFT_CONFIG.scopes,
    redirectUri: MICROSOFT_CONFIG.redirectUri 
  });

  const authCodeUrlParameters = {
    scopes: MICROSOFT_CONFIG.scopes,
    redirectUri: MICROSOFT_CONFIG.redirectUri,
  };

  try {
    const url = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
    console.log("[AUTH] URL d'authentification générée avec succès:", url);
    return url;
  } catch (error) {
    console.error("[AUTH] Erreur lors de la génération de l'URL d'authentification:", error);
    throw new Error("Impossible de générer l'URL d'authentification");
  }
}

/**
 * Échange le code d'autorisation contre des tokens
 * et stocke les informations dans la session
 */
export async function handleCallback(req: AuthenticatedRequest, code: string): Promise<void> {
  console.log("[AUTH] Traitement du callback avec code d'autorisation");
  
  try {
    const tokenRequest = {
      code,
      scopes: MICROSOFT_CONFIG.scopes,
      redirectUri: MICROSOFT_CONFIG.redirectUri,
    };

    console.log("[AUTH] Demande de token avec les paramètres:", {
      codeLength: code.length,
      scopes: MICROSOFT_CONFIG.scopes,
      redirectUri: MICROSOFT_CONFIG.redirectUri
    });

    const tokenResponse = await msalInstance.acquireTokenByCode(tokenRequest);

    if (tokenResponse) {
      console.log("[AUTH] Token obtenu avec succès");
      console.log("[AUTH] Informations du token:", {
        accessTokenLength: tokenResponse.accessToken.length,
        expiresOn: tokenResponse.expiresOn,
        accountId: tokenResponse.account?.homeAccountId
      });

      // Stocke les informations dans la session
      req.session.isAuthenticated = true;
      req.session.accessToken = tokenResponse.accessToken;
      // @ts-ignore - refreshToken existe dans la réponse
      req.session.refreshToken = tokenResponse.refreshToken;
      req.session.tokenExpires = tokenResponse.expiresOn ? 
        new Date(tokenResponse.expiresOn).getTime() : 
        Date.now() + 3600 * 1000;
      req.session.account = tokenResponse.account;
      
      console.log("[AUTH] Session mise à jour avec les informations d'authentification");
      console.log("[AUTH] État de la session:", {
        isAuthenticated: req.session.isAuthenticated,
        hasAccessToken: !!req.session.accessToken,
        hasRefreshToken: !!req.session.refreshToken,
        tokenExpires: new Date(req.session.tokenExpires).toISOString(),
        sessionID: req.sessionID
      });
    } else {
      console.error("[AUTH] Aucune réponse de token reçue");
    }
  } catch (error) {
    console.error("[AUTH] Erreur lors de l'échange du code d'autorisation:", error);
    throw new Error("Échec de l'authentification");
  }
}

/**
 * Rafraîchit le token d'accès s'il a expiré
 * @returns true si le token a été rafraîchi avec succès, false sinon
 */
export async function refreshToken(req: AuthenticatedRequest): Promise<boolean> {
  console.log("[AUTH] Tentative de rafraîchissement du token");
  console.log("[AUTH] État actuel de la session:", {
    isAuthenticated: req.session.isAuthenticated,
    hasAccessToken: !!req.session.accessToken,
    hasRefreshToken: !!req.session.refreshToken,
    tokenExpires: req.session.tokenExpires ? new Date(req.session.tokenExpires).toISOString() : null,
    sessionID: req.sessionID,
    currentTime: new Date().toISOString()
  });

  try {
    if (!req.session.refreshToken) {
      console.error("[AUTH] Pas de refresh token disponible dans la session");
      return false;
    }

    const tokenRequest = {
      refreshToken: req.session.refreshToken,
      scopes: MICROSOFT_CONFIG.scopes,
    };

    console.log("[AUTH] Demande de rafraîchissement avec les paramètres:", {
      refreshTokenLength: req.session.refreshToken.length,
      scopes: MICROSOFT_CONFIG.scopes
    });

    const tokenResponse = await msalInstance.acquireTokenByRefreshToken(tokenRequest);
    
    if (tokenResponse) {
      console.log("[AUTH] Token rafraîchi avec succès");
      console.log("[AUTH] Nouvelles informations du token:", {
        accessTokenLength: tokenResponse.accessToken.length,
        expiresOn: tokenResponse.expiresOn
      });

      // Mise à jour de la session avec les nouveaux tokens
      req.session.accessToken = tokenResponse.accessToken;
      // @ts-ignore - refreshToken existe dans la réponse
      req.session.refreshToken = tokenResponse.refreshToken;
      req.session.tokenExpires = tokenResponse.expiresOn ? 
        new Date(tokenResponse.expiresOn).getTime() : 
        Date.now() + 3600 * 1000;
      
      console.log("[AUTH] Session mise à jour avec les nouveaux tokens");
      console.log("[AUTH] Nouvel état de la session:", {
        isAuthenticated: req.session.isAuthenticated,
        hasAccessToken: !!req.session.accessToken,
        hasRefreshToken: !!req.session.refreshToken,
        tokenExpires: new Date(req.session.tokenExpires).toISOString(),
        sessionID: req.sessionID
      });
      
      return true;
    }
    console.error("[AUTH] Aucune réponse reçue lors du rafraîchissement du token");
    return false;
  } catch (error) {
    console.error("[AUTH] Erreur lors du rafraîchissement du token:", error);
    console.error("[AUTH] Détails de l'erreur:", JSON.stringify(error, null, 2));
    return false;
  }
} 