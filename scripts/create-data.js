import fs from 'fs';
import path from 'path';
import process from 'process';

// Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_FILE = path.join(process.cwd(), 'data.md');


/**
 * Lit récursivement tous les fichiers d'un répertoire
 * @param {string} dir - Chemin du répertoire
 * @param {Array} result - Tableau pour stocker les résultats
 * @returns {Array} - Tableau des chemins de fichiers
 */
function readFilesRecursively(dir, result = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      readFilesRecursively(filePath, result);
    } else {
      result.push(filePath);
    }
  }

  return result;
}

/**
 * Supprime les liens Markdown du contenu
 * @param {string} markdownContent - Contenu Markdown à traiter
 * @returns {string} - Contenu Markdown sans liens
 */
function removeMarkdownLinks(markdownContent) {
  // Regex pour trouver les liens Markdown de type [texte](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  // Remplacer les liens par leur texte uniquement
  return markdownContent.replace(linkRegex, '$1');
}

/**
 * Extrait l'UUID d'un chemin de fichier Notion
 * @param {string} filePath - Chemin du fichier
 * @returns {string|null} - UUID extrait ou null si non trouvé
 */
function extractNotionUUID(filePath) {
  // Recherche un UUID à la fin du nom de fichier (format: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
  const uuidRegex = /([a-f0-9]{32})(?:\.md)?$/i;
  const match = filePath.match(uuidRegex);
  return match ? match[1] : null;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('Création du fichier data.md...');

  try {
    // Vérifier si le répertoire data existe
    if (!fs.existsSync(DATA_DIR)) {
      console.error(`Le répertoire ${DATA_DIR} n'existe pas.`);
      return;
    }

    // Récupérer tous les fichiers
    const files = readFilesRecursively(DATA_DIR);
    console.log(`${files.length} fichiers trouvés.`);

    // Créer le contenu du fichier markdown
    let markdownContent = '# Données consolidées\n\n';

    for (const file of files) {
      // Ignorer les fichiers cachés et .DS_Store
      if (path.basename(file).startsWith('.')) continue;
      
      // Ignorer les fichiers CSV
      const ext = path.extname(file).toLowerCase();
      if (ext === '.csv') continue;
      
      // Ne traiter que les fichiers markdown
      if (ext !== '.md') continue;

      // Obtenir le chemin relatif pour l'affichage
      const relativePath = path.relative(DATA_DIR, file);
      
      // Extraire l'UUID et créer un lien Notion si disponible
      const uuid = extractNotionUUID(relativePath);
      if (uuid) {
        markdownContent += `## ${relativePath} (https://notion.so/${uuid})\n\n`;
      } else {
        markdownContent += `## ${relativePath}\n\n`;
      }

      try {
        // Lire le contenu du fichier
        let content = fs.readFileSync(file, 'utf-8');
        
        // Supprimer les liens Markdown
        content = removeMarkdownLinks(content);
        
        // Ajouter le contenu markdown
        markdownContent += content;
      } catch (fileError) {
        console.error(`Erreur lors de la lecture du fichier ${file}:`, fileError);
        markdownContent += `*Erreur lors de la lecture du fichier: ${fileError.message}*\n`;
      }

      markdownContent += '\n\n';
    }

    // Écrire le fichier de sortie
    fs.writeFileSync(OUTPUT_FILE, markdownContent);
    console.log(`Fichier ${OUTPUT_FILE} créé avec succès.`);

  } catch (error) {
    console.error('Erreur lors de la création du fichier data.md:', error);
  }
}

// Exécuter la fonction principale
main().catch(console.error); 