# Architecture Backend

Ce dossier contient le code source du serveur backend de l'application. L'architecture a été conçue pour être modulaire, facile à comprendre et à maintenir.

## Structure des fichiers

```
app/back/
├── config.ts                 # Configuration centralisée de l'application
├── types.ts                  # Types et interfaces partagés
├── server.ts                 # Point d'entrée principal du serveur
├── auth/                     # Gestion de l'authentification
│   └── microsoft.ts          # Service d'authentification Microsoft
├── middleware/               # Middlewares Express
│   └── auth.middleware.ts    # Middleware d'authentification
├── routes/                   # Routes Express
│   └── auth.routes.ts        # Routes d'authentification
└── ws.server.ts              # Gestion des WebSockets
```

## Concepts clés

### Configuration (`config.ts`)

Centralise toutes les variables d'environnement et les constantes pour faciliter la maintenance et la configuration. Utilise `dotenv` pour charger les variables d'environnement depuis le fichier `.env`.

### Authentification Microsoft

L'authentification est gérée via Microsoft Azure AD en utilisant la bibliothèque MSAL (Microsoft Authentication Library).

1. **Service d'authentification** (`auth/microsoft.ts`) : 
   - Gère la connexion avec Microsoft
   - Rafraîchit les tokens d'accès
   - Stocke les informations d'authentification dans la session

2. **Middleware d'authentification** (`middleware/auth.middleware.ts`) :
   - Vérifie si l'utilisateur est authentifié
   - Vérifie la validité du token d'accès
   - Rafraîchit le token si nécessaire
   - Redirige vers la page de connexion si non authentifié

3. **Routes d'authentification** (`routes/auth.routes.ts`) :
   - `/auth/login` : Redirection vers la page de connexion Microsoft
   - `/auth/microsoft/callback` : Traitement du retour d'authentification
   - `/auth/logout` : Déconnexion et destruction de la session

### WebSockets (`ws.server.ts`)

Gère les connexions en temps réel avec les clients, permettant des communications bidirectionnelles.

### Serveur principal (`server.ts`)

Point d'entrée qui configure et démarre le serveur Express avec :
- Middlewares de base (compression, logging, etc.)
- Session et cookies
- Authentification
- Integration avec Remix pour le frontend
- WebSockets via Socket.io

## Flux d'authentification

1. L'utilisateur accède à une page protégée
2. Le middleware d'authentification vérifie s'il est authentifié
3. S'il n'est pas authentifié, redirection vers `/auth/login`
4. Redirection vers la page de connexion Microsoft
5. Après connexion, Microsoft redirige vers `/auth/microsoft/callback`
6. Échange du code d'autorisation contre des tokens
7. Stockage des tokens dans la session
8. Redirection vers la page initiale

## Technologies utilisées

- **Express** : Framework web pour Node.js
- **Socket.io** : Bibliothèque pour les WebSockets
- **MSAL** : Microsoft Authentication Library pour l'authentification Azure AD
- **Remix** : Framework fullstack pour le frontend
- **Vite** : Outil de build pour le développement 