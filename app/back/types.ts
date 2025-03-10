/**
 * Types et interfaces utilisés dans l'application
 * 
 * Ce fichier centralise les définitions de types pour assurer la cohérence
 * et éviter les duplications dans le code.
 */

import { Request as ExpressRequest } from "express";
import { Session, SessionData } from "express-session";

/**
 * Extension du type Request pour inclure les propriétés de session
 * liées à l'authentification Microsoft
 */
export interface AuthenticatedRequest extends ExpressRequest {
  session: Session & SessionData & {
    isAuthenticated?: boolean;
    accessToken?: string;
    refreshToken?: string;
    tokenExpires?: number;
    account?: any;
  };
} 