# Bot RH

Ce projet est un assistant RH conversationnel qui utilise l'API Gemini pour répondre aux questions des employés en se basant sur la documentation RH.

## Fonctionnalités

- Interface de chat conversationnelle
- Utilisation de l'API Gemini pour générer des réponses
- Consolidation automatique des données RH depuis le dossier `data`
- Streaming des réponses en temps réel

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
GOOGLE_API_KEY=votre_clé_api_gemini
GEMINI_MODEL=gemini-2.0-flash-exp
MAX_TOKENS=150
TEMPERATURE=0.7
TOP_P=0.9
TOP_K=40
```

## Utilisation

### Développement

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Génération du fichier de données

Le fichier `data.md` est généré automatiquement au démarrage de l'application. Vous pouvez également le générer manuellement avec :

```bash
npm run create-data
```

## Structure des données

Placez vos fichiers de documentation RH dans le dossier `data`. Le script de génération prend en charge :

- Fichiers Markdown (`.md`)
- Fichiers CSV (`.csv`) - convertis en tableaux Markdown
- Autres types de fichiers - inclus tels quels

## Architecture

- `app/components/ChatInterface.tsx` : Interface de chat
- `app/back/ask-pholon.ts` : Intégration avec l'API Gemini
- `scripts/create-data.js` : Script de génération du fichier de données
- `server.ts` : Serveur Express avec Socket.io

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
