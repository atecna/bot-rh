# Stage de build
FROM node:23-alpine AS builder

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci

# Copie des sources et build
COPY . .
RUN npm run build
RUN npx tsc --project tsconfig.server.json

# Stage de production
FROM node:23-alpine AS runner

WORKDIR /app

# Installation des dépendances de production + dotenv
COPY package*.json ./
RUN npm ci --production && npm install dotenv

# Copie des fichiers nécessaires depuis le stage de build
COPY --from=builder /app/build ./build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/app/resources ./app/resources
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Exposition du port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "./dist/server.js"] 