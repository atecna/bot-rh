module.exports = {
  apps: [{
    name: "bot-rh",
    script: "npm",
    args: "start",
    cwd: "./",
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production"
    },
    // Utilisation de dotenv pour charger le fichier .env
    node_args: "-r dotenv/config",
    // Spécifie le chemin du fichier .env (ici à la racine)
    env_file: ".env"
  }]
};