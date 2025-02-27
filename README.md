# Bot RH

Ce projet est un assistant RH conversationnel qui utilise l'API Gemini pour répondre aux questions des employés en se basant sur la documentation RH.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [Structure des données](#structure-des-données)
- [Développement](#développement)
- [Déploiement](#déploiement)
- [Dépannage](#dépannage)

## Fonctionnalités

- Interface de chat conversationnelle interactive
- Utilisation de l'API Gemini pour générer des réponses contextuelles
- Consolidation automatique des données RH depuis le dossier `data`
- Streaming des réponses en temps réel
- Support de différents formats de documentation (Markdown, CSV, etc.)
- Historique de conversation pour des réponses contextuelles

## Prérequis

- Node.js (v20 ou supérieur)
- npm ou yarn
- Clé API Google Gemini

## Installation

1. Clonez le dépôt :
```bash
git clone [url-du-repo]
cd bot-rh
```

2. Installez les dépendances :
```bash
npm install
# ou avec yarn
yarn install
```

## Configuration

1. Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
GOOGLE_API_KEY=votre_clé_api_gemini
GEMINI_MODEL=gemini-2.0-flash-exp
MAX_TOKENS=150
TEMPERATURE=0.7
TOP_P=0.9
TOP_K=40
```

2. Paramètres de configuration :
   - `GOOGLE_API_KEY` : Votre clé API pour accéder à Gemini (obligatoire)
   - `GEMINI_MODEL` : Modèle Gemini à utiliser (par défaut: gemini-2.0-flash-exp)
   - `MAX_TOKENS` : Nombre maximum de tokens pour les réponses
   - `TEMPERATURE` : Contrôle la créativité des réponses (0.0-1.0)
   - `TOP_P` et `TOP_K` : Paramètres de sampling pour la génération de texte
   - `DATA_PATH` : Chemin vers le fichier de données (par défaut: ./data.md)

## Utilisation

### Développement

Pour lancer l'application en mode développement :

```bash
npm run dev
# ou
yarn dev
```

L'application sera accessible à l'adresse `http://localhost:3000` par défaut.

### Production

Pour déployer en production :

```bash
npm run build
npm start
# ou
yarn build
yarn start
```

### Génération du fichier de données

Le fichier `data.md` est généré automatiquement au démarrage de l'application. Vous pouvez également le générer manuellement avec :

```bash
npm run create-data
# ou
yarn create-data
```

## Structure du projet

```
bot-rh/
├── app/
│   ├── components/       # Composants React
│   │   ├── ChatInterface.tsx  # Interface principale du chat
│   │   ├── chat/         # Sous-composants du chat
│   │   ├── types/        # Types TypeScript
│   │   └── utils/        # Utilitaires pour les composants
│   ├── back/             # Logique backend
│   │   ├── ask-bot.ts    # Intégration avec l'API Gemini
│   │   └── ws.server.ts  # Gestion des WebSockets
│   ├── routes/           # Routes de l'application
│   ├── utils/            # Utilitaires généraux
│   ├── resources/        # Ressources statiques
│   ├── entry.client.tsx  # Point d'entrée client
│   ├── entry.server.tsx  # Point d'entrée serveur
│   ├── root.tsx          # Composant racine
│   ├── context.tsx       # Contextes React
│   └── tailwind.css      # Styles CSS
├── data/                 # Documentation RH source
├── scripts/              # Scripts utilitaires
│   └── create-data.js    # Script de génération du fichier data.md
├── public/               # Fichiers statiques publics
├── build/                # Dossier de build (généré)
├── server.ts             # Serveur Express avec Socket.io
├── vite.config.ts        # Configuration Vite
├── tsconfig.json         # Configuration TypeScript
├── tsconfig.server.json  # Configuration TypeScript pour le serveur
├── .env                  # Variables d'environnement
├── Dockerfile            # Configuration Docker
└── README.md
```

## Structure des données

Placez vos fichiers de documentation RH dans le dossier `data`. Le script de génération prend en charge :

- Fichiers Markdown (`.md`) - utilisés directement
- Fichiers CSV (`.csv`) - convertis automatiquement en tableaux Markdown
- Autres types de fichiers - inclus tels quels

Exemple d'organisation recommandée pour le dossier `data` :
```
data/
├── conges/
│   ├── politique-conges.md
│   └── jours-feries.csv
├── avantages/
│   └── mutuelle.md
└── procedures/
    └── onboarding.md
```

Le script `create-data.js` analyse récursivement tous les fichiers du dossier `data` et génère un fichier `data.md` consolidé qui sera utilisé par l'assistant pour répondre aux questions.

## Développement

### Technologies utilisées

- **Frontend** : React, Remix, Tailwind CSS
- **Backend** : Express, Socket.io
- **IA** : API Google Gemini
- **Build** : Vite, TypeScript

### Architecture

- `app/components/ChatInterface.tsx` : Interface de chat utilisateur
- `app/back/ask-bot.ts` : Intégration avec l'API Gemini
- `scripts/create-data.js` : Script de génération du fichier de données consolidé
- `server.ts` : Serveur Express avec Socket.io pour la communication en temps réel

### Style et UI

Ce projet utilise [Tailwind CSS](https://tailwindcss.com/) pour le styling. Vous pouvez utiliser n'importe quel framework CSS de votre choix. Consultez la [documentation Vite sur le CSS](https://vitejs.dev/guide/features.html#css) pour plus d'informations.

## Déploiement

L'application peut être déployée sur n'importe quelle plateforme supportant Node.js :

1. Construisez l'application :
```bash
npm run build
```

2. Démarrez le serveur :
```bash
npm start
```

### Déploiement avec Docker

Un Dockerfile est inclus pour faciliter le déploiement :

```bash
# Construire l'image
docker build -t bot-rh .

# Exécuter le conteneur
docker run -p 3000:3000 -e GOOGLE_API_KEY=votre_clé_api_gemini bot-rh
```

## Dépannage

### Problèmes courants

- **Erreur d'API Key** : Vérifiez que votre clé API Gemini est correctement configurée dans le fichier `.env`
- **Erreur de génération de données** : Assurez-vous que le dossier `data` existe et contient des fichiers valides
- **Problèmes de connexion WebSocket** : Vérifiez que le serveur Express et Socket.io sont correctement configurés
- **Erreur "Module not found"** : Vérifiez que toutes les dépendances sont installées avec `npm install`

### Logs

Les logs du serveur peuvent être consultés dans la console lors de l'exécution. En cas de problème, vérifiez les messages d'erreur pour identifier la source du problème.

Pour toute autre question, veuillez consulter la documentation de l'API Gemini ou ouvrir une issue sur le dépôt du projet.
