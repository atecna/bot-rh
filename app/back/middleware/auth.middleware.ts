/**
 * Middleware d'authentification
 * 
 * Ce middleware vérifie si l'utilisateur est authentifié et si le token d'accès est valide.
 * Si le token a expiré, il tente de le rafraîchir. Si la vérification échoue,
 * l'utilisateur est redirigé vers la page de connexion.
 */

import { Response, NextFunction } from "express";
import { BASE_PATH } from "../config";
import { refreshToken } from "../auth/microsoft";
import { AuthenticatedRequest } from "../types";

/**
 * Vérifie si l'URL doit être exemptée de l'authentification
 */
function isExemptUrl(path: string): boolean {
  const isExempt = (
    path.startsWith(`${BASE_PATH}/auth/`) ||
    path.startsWith(`${BASE_PATH}/assets/`) ||
    path.startsWith(`${BASE_PATH}/socket.io`) ||
    // Ajouter d'autres chemins exemptés si nécessaire
    path === `${BASE_PATH}/favicon.ico`
  );
  
  if (isExempt) {
    console.log(`[AUTH_MIDDLEWARE] URL exemptée: ${path}`);
  }
  
  return isExempt;
}

/**
 * Middleware pour vérifier l'authentification et la validité du token
 */
export const authMiddleware = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  console.log(`[AUTH_MIDDLEWARE] Vérification d'authentification pour: ${req.path}`);
  console.log(`[AUTH_MIDDLEWARE] Méthode: ${req.method}, URL: ${req.originalUrl}`);
  console.log(`[AUTH_MIDDLEWARE] État de la session:`, {
    isAuthenticated: req.session.isAuthenticated,
    hasAccessToken: !!req.session.accessToken,
    hasRefreshToken: !!req.session.refreshToken,
    tokenExpires: req.session.tokenExpires ? new Date(req.session.tokenExpires).toISOString() : null,
    currentTime: new Date().toISOString(),
    sessionID: req.sessionID
  });

  // Vérifier si l'URL est exemptée
  if (isExemptUrl(req.path)) {
    return next();
  }

  // Vérifier si l'utilisateur est authentifié
  if (req.session.isAuthenticated) {
    console.log(`[AUTH_MIDDLEWARE] Utilisateur authentifié, vérification de la validité du token`);
    
    // Vérifier si le token d'accès est toujours valide
    const currentTime = Date.now();

    if (req.session.tokenExpires && currentTime < req.session.tokenExpires) {
      // Le token est encore valide
      console.log(`[AUTH_MIDDLEWARE] Token valide, expiration dans ${Math.floor((req.session.tokenExpires - currentTime) / 1000)} secondes`);
      return next();
    } else {
      // Le token a expiré, essayer de le rafraîchir
      console.log(`[AUTH_MIDDLEWARE] Token expiré ou manquant, tentative de rafraîchissement`);
      const refreshSuccessful = await refreshToken(req);
      
      if (refreshSuccessful) {
        console.log(`[AUTH_MIDDLEWARE] Rafraîchissement du token réussi, poursuite de la requête`);
        return next();
      } else {
        console.log(`[AUTH_MIDDLEWARE] Échec du rafraîchissement du token, redirection vers la page de connexion`);
      }
    }
  } else {
    console.log(`[AUTH_MIDDLEWARE] Utilisateur non authentifié, redirection vers la page de connexion`);
  }

  // Rediriger vers la page de connexion si non authentifié
  console.log(`[AUTH_MIDDLEWARE] Redirection vers ${BASE_PATH}/auth/login`);
  res.redirect(`${BASE_PATH}/auth/login`);
}; 