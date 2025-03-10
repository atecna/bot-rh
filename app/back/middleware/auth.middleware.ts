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
  return (
    path.startsWith(`${BASE_PATH}/auth/`) ||
    path.startsWith(`${BASE_PATH}/assets/`) ||
    path.startsWith(`${BASE_PATH}/socket.io`) ||
    // Ajouter d'autres chemins exemptés si nécessaire
    path === `${BASE_PATH}/favicon.ico`
  );
}

/**
 * Middleware pour vérifier l'authentification et la validité du token
 */
export const authMiddleware = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  // Vérifier si l'URL est exemptée
  if (isExemptUrl(req.path)) {
    return next();
  }

  // Vérifier si l'utilisateur est authentifié
  if (req.session.isAuthenticated) {
    // Vérifier si le token d'accès est toujours valide
    const currentTime = Date.now();

    if (req.session.tokenExpires && currentTime < req.session.tokenExpires) {
      // Le token est encore valide
      return next();
    } else {
      // Le token a expiré, essayer de le rafraîchir
      const refreshSuccessful = await refreshToken(req);
      
      if (refreshSuccessful) {
        return next();
      }
    }
  }

  // Rediriger vers la page de connexion si non authentifié
  res.redirect(`${BASE_PATH}/auth/login`);
}; 