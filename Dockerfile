# Stage de build
FROM node:20-slim AS builder

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci

# Copie des sources et build
COPY . .
RUN npm run build

# Stage de production
FROM node:20-slim AS runner

WORKDIR /app

# Installation des dépendances de production uniquement
COPY package*.json ./
RUN npm ci --production && \
    npm install cross-env -g

# Copie des fichiers nécessaires depuis le stage de build
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/app/resources ./app/resources

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Exposition du port
EXPOSE 3000

# Utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 remixjs && \
    chown -R remixjs:nodejs /app
USER remixjs

# Commande de démarrage
CMD ["npm", "run", "start"] 