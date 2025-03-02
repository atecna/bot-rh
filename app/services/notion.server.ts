import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { NotionToMarkdown } from 'notion-to-md';
import { emitSyncProgress, emitSyncComplete } from "~/back/ws.server";

const NOTION_API_KEY = process.env.NOTION_API_KEY;

// Initialiser le client Notion
const notion = new Client({
  auth: NOTION_API_KEY,
});

// Initialiser NotionToMarkdown
const n2m = new NotionToMarkdown({ notionClient: notion, config: {
  parseChildPages: false,
  convertImagesToBase64: false,
  separateChildPage: true,
} });

// Fonction pour extraire les pages Notion depuis un markdown
export async function extractPagesFromMarkdown(markdownContent: string) {
  try {
    console.log("🔍 Extraction des pages Notion depuis le markdown");
    
    // Extraire tous les liens Notion du markdown
    const notionLinkRegex = /https:\/\/www\.notion\.so\/([^?]+)(\?pvs=\d+)?/g;
    const matches = [...markdownContent.matchAll(notionLinkRegex)];
    
    console.log(`🔍 Trouvé ${matches.length} liens Notion`);
    
    // Extraire les informations des liens
    const pages = matches
      .map(match => {
        const fullUrl = match[0];
        const pathPart = match[1];
        
        // Extraire l'ID et le titre du chemin
        let id = '';
        let title = '';
        
        // Format 1: page-title-32digitID
        const formatRegex = /(.+)-([a-f0-9]{32})$/;
        const formatMatch = pathPart.match(formatRegex);
        
        if (formatMatch) {
          title = formatMatch[1].replace(/-/g, ' ');
          id = formatMatch[2];
        } 
        // Format 2: 32digitID?...
        else if (pathPart.length >= 32) {
          id = pathPart.substring(0, 32);
          title = `Page ${id.substring(0, 8)}...`;
        }
        
        if (id) {
          return {
            id,
            title,
            url: fullUrl
          };
        }
        
        return null;
      })
      .filter(page => page !== null);
    
    console.log(`✅ Extrait ${pages.length} pages Notion valides`);
    
    return pages;
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction des pages Notion:', error);
    throw error;
  }
}

// Fonction pour extraire le titre d'une page Notion
function getPageTitle(page: any): string {
  let pageTitle = 'Page sans titre';
  try {
    if ('properties' in page && 
        page.properties && 
        'title' in page.properties) {
      const titleProperty = page.properties.title;
      if (titleProperty && 
          'title' in titleProperty && 
          Array.isArray(titleProperty.title) && 
          titleProperty.title.length > 0 && 
          titleProperty.title[0].plain_text) {
        pageTitle = titleProperty.title[0].plain_text;
      }
    }
  } catch (error) {
    console.error(`Erreur lors de l'extraction du titre de la page:`, error);
  }
  return pageTitle;
}

// Fonction pour récupérer et formater manuellement le contenu d'une page Notion
async function getFormattedPageContent(pageId: string) {
  try {
    // Récupérer les détails de la page
    const page = await notion.pages.retrieve({ page_id: pageId });
    const title = getPageTitle(page);
    
    // Récupérer tous les blocs de la page avec pagination
    let allBlocks: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;
    
    while (hasMore) {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
        start_cursor: startCursor,
      });
      
      allBlocks = [...allBlocks, ...response.results];
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }
    
    // Initialiser le contenu markdown
    let markdownContent = `---\n# ${title} / ${pageId}\n---\n\n`;
    
    // Parcourir tous les blocs et les convertir en markdown
    for (const block of allBlocks) {
      const blockContent = await formatBlock(block);
      if (blockContent) {
        markdownContent += blockContent + "\n\n";
      }
    }
    
    return { title, content: markdownContent };
  } catch (error) {
    console.error(`Erreur lors de la récupération du contenu de la page ${pageId}:`, error);
    throw error;
  }
}

// Fonction pour récupérer tous les blocs enfants avec pagination
async function getAllChildBlocks(blockId: string): Promise<any[]> {
  let allBlocks: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined = undefined;
  
  while (hasMore) {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: startCursor,
    });
    
    allBlocks = [...allBlocks, ...response.results];
    hasMore = response.has_more;
    startCursor = response.next_cursor || undefined;
  }
  
  return allBlocks;
}

// Fonction pour formater un bloc Notion en markdown
async function formatBlock(block: any, depth = 0): Promise<string> {
  if (!block || !block.type) return '';
  
  const blockType = block.type;
  let content = '';
  
  // Traiter différents types de blocs
  switch (blockType) {
    case 'paragraph':
      // Traiter le texte riche normalement
      content = formatRichText(block.paragraph.rich_text);
      
      // Si le paragraphe est vide mais a des enfants, il pourrait s'agir d'un bloc spécial
      if (content.trim() === '' && block.has_children) {
        content = await handleSpecialBlock(block);
      }
      break;
    case 'heading_1':
      content = `# ${formatRichText(block.heading_1.rich_text)}`;
      break;
    case 'heading_2':
      content = `## ${formatRichText(block.heading_2.rich_text)}`;
      break;
    case 'heading_3':
      content = `### ${formatRichText(block.heading_3.rich_text)}`;
      break;
    case 'bulleted_list_item':
      content = `- ${formatRichText(block.bulleted_list_item.rich_text)}`;
      break;
    case 'numbered_list_item':
      content = `1. ${formatRichText(block.numbered_list_item.rich_text)}`;
      break;
    case 'to_do':
      const checked = block.to_do.checked ? 'x' : ' ';
      content = `- [${checked}] ${formatRichText(block.to_do.rich_text)}`;
      break;
    case 'toggle':
      content = `<details>\n<summary>${formatRichText(block.toggle.rich_text)}</summary>\n`;
      if (block.has_children) {
        const children = await getAllChildBlocks(block.id);
        for (const child of children) {
          content += await formatBlock(child, depth + 1) + '\n';
        }
      }
      content += '</details>';
      break;
    case 'child_page':
      content = `## ${block.child_page.title}`;
      break;
    case 'image':
      const imageType = block.image.type;
      const imageUrl = imageType === 'external' ? block.image.external.url : block.image.file.url;
      const imageCaption = block.image.caption.length > 0 
        ? formatRichText(block.image.caption) 
        : 'image';
      content = `![${imageCaption}](${imageUrl})`;
      break;
    case 'divider':
      content = '---';
      break;
    case 'quote':
      content = `> ${formatRichText(block.quote.rich_text)}`;
      break;
    case 'code':
      const codeLanguage = block.code.language || 'plaintext';
      content = `\`\`\`${codeLanguage}\n${formatRichText(block.code.rich_text)}\n\`\`\``;
      break;
    case 'callout':
      const emoji = block.callout.icon && block.callout.icon.type === 'emoji' 
        ? block.callout.icon.emoji + ' ' 
        : '';
      content = `> ${emoji}${formatRichText(block.callout.rich_text)}`;
      break;
    case 'bookmark':
      const bookmarkUrl = block.bookmark.url;
      content = `[${bookmarkUrl}](${bookmarkUrl})`;
      break;
    case 'table':
      if (block.has_children) {
        const tableRows = await getAllChildBlocks(block.id);
        
        let tableContent = '';
        let headerRow = '';
        let separatorRow = '';
        
        // Traiter chaque ligne du tableau
        for (let i = 0; i < tableRows.length; i++) {
          const row = tableRows[i] as any;
          if (row.type === 'table_row') {
            const cells = row.table_row.cells.map((cell: any[]) => 
              formatRichText(cell)
            ).join(' | ');
            
            if (i === 0) {
              headerRow = `| ${cells} |`;
              separatorRow = `| ${row.table_row.cells.map(() => '---').join(' | ')} |`;
            } else {
              tableContent += `| ${cells} |\n`;
            }
          }
        }
        
        content = `${headerRow}\n${separatorRow}\n${tableContent}`;
      }
      break;
    case 'child_database':
      // Traiter les bases de données intégrées
      content = await handleDatabase(block);
      break;
    default:
      // Pour les types de blocs non gérés explicitement
      if (block[blockType] && block[blockType].rich_text) {
        content = formatRichText(block[blockType].rich_text);
      }
  }
  
  // Si le bloc a des enfants (sauf pour les types déjà traités avec des enfants)
  if (block.has_children && 
      !['toggle', 'table', 'child_database'].includes(blockType)) {
    const children = await getAllChildBlocks(block.id);
    
    let childContent = '';
    for (const child of children) {
      childContent += await formatBlock(child, depth + 1) + '\n\n';
    }
    
    if (childContent) {
      content += '\n' + childContent;
    }
  }
  
  return content;
}

// Fonction pour formater le texte riche en markdown
function formatRichText(richText: any[]): string {
  if (!richText || richText.length === 0) return '';
  
  return richText.map(text => {
    if (!text.plain_text) return '';
    
    let formattedText = text.plain_text;
    
    // Appliquer les annotations
    if (text.annotations) {
      if (text.annotations.bold) formattedText = `**${formattedText}**`;
      if (text.annotations.italic) formattedText = `_${formattedText}_`;
      if (text.annotations.strikethrough) formattedText = `~~${formattedText}~~`;
      if (text.annotations.underline) formattedText = `<u>${formattedText}</u>`;
      if (text.annotations.code) formattedText = `\`${formattedText}\``;
    }
    
    // Ajouter le lien si présent
    if (text.href) {
      // Conserver tous les liens, y compris ceux vers des pages Notion
      formattedText = `[${formattedText}](${text.href})`;
    }
    
    return formattedText;
  }).join('');
}

// Fonction pour traiter les blocs spéciaux qui pourraient contenir des noms
async function handleSpecialBlock(block: any): Promise<string> {
  try {
    // Récupérer tous les blocs enfants avec pagination
    const children = await getAllChildBlocks(block.id);
    
    let content = '';
    
    // Parcourir tous les blocs enfants pour extraire le contenu
    for (const child of children) {
      const childBlock = child as any;
      if (childBlock.type === 'paragraph') {
        const text = formatRichText(childBlock.paragraph.rich_text);
        if (text.trim()) {
          content += text + '\n';
        }
      } else if (childBlock.type === 'bulleted_list_item') {
        const text = formatRichText(childBlock.bulleted_list_item.rich_text);
        if (text.trim()) {
          content += `- ${text}\n`;
        }
      } else {
        const blockContent = await formatBlock(childBlock);
        if (blockContent.trim()) {
          content += blockContent + '\n';
        }
      }
    }
    
    return content;
  } catch (error) {
    console.error('Erreur lors du traitement d\'un bloc spécial:', error);
    return '';
  }
}

// Fonction pour traiter les bases de données intégrées
async function handleDatabase(block: any): Promise<string> {
  try {
    // Récupérer les données de la base de données
    const databaseId = block.id;
    const database = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    });
    
    let content = '';
    
    // Extraire les noms des membres du CSE si c'est une base de données de membres
    if (database.results && database.results.length > 0) {
      for (const page of database.results) {
        // Essayer d'extraire le nom et le rôle
        let name = '';
        let role = '';
        
        const pageObj = page as any;
        if (pageObj.properties) {
          // Parcourir toutes les propriétés pour trouver le nom et le rôle
          for (const [key, value] of Object.entries(pageObj.properties)) {
            const prop = value as any;
            
            if (prop.type === 'title' && prop.title && prop.title.length > 0) {
              name = prop.title.map((t: any) => t.plain_text).join('');
            } else if (prop.type === 'rich_text' && prop.rich_text && prop.rich_text.length > 0) {
              const propText = prop.rich_text.map((t: any) => t.plain_text).join('');
              if (key.toLowerCase().includes('role') || key.toLowerCase().includes('fonction')) {
                role = propText;
              }
            } else if (prop.type === 'select' && prop.select && prop.select.name) {
              if (key.toLowerCase().includes('role') || key.toLowerCase().includes('fonction')) {
                role = prop.select.name;
              }
            }
          }
        }
        
        if (name) {
          if (role) {
            content += `**${name}** - ${role}\n`;
          } else {
            content += `**${name}**\n`;
          }
        }
      }
    }
    
    return content;
  } catch (error) {
    console.error('Erreur lors du traitement d\'une base de données:', error);
    return '';
  }
}

// Modifier la fonction generateMarkdownWithNotionToMd pour utiliser notre formatage personnalisé
export async function generateMarkdownWithNotionToMd(
  pageIds: string[],
  io: any,
  sessionId: string
) {
  if (!pageIds || pageIds.length === 0) {
    return { error: "Aucune page sélectionnée" };
  }

  try {
    // Vérifier si le dossier data_notion existe, sinon le créer
    const dataDir = path.join(process.cwd(), "data_notion");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const total = pageIds.length;
    const results = [];
    let completed = 0;

    // Émettre l'état initial
    emitSyncProgress(io, sessionId, { current: completed, total });

    // Traiter les pages en parallèle avec un maximum de 5 pages simultanées
    const processBatch = async (batch: string[]) => {
      const batchResults = await Promise.all(
        batch.map(async (pageId) => {
          try {
            // Utiliser notre fonction personnalisée pour récupérer et formater le contenu
            const { title, content } = await getFormattedPageContent(pageId);
            
            // Émettre la progression avec les détails de la page en cours
            emitSyncProgress(io, sessionId, { 
              current: ++completed, 
              total, 
              pageId, 
              pageTitle: title 
            });
            
            // Créer un nom de fichier sécurisé à partir du titre
            const safeFilename = title
              .replace(/[^a-z0-9]/gi, "_")
              .toLowerCase();
            const filePath = path.join(dataDir, `${safeFilename}.md`);
            
            // Écrire le fichier markdown
            fs.writeFileSync(filePath, content);
            
            console.log(`Markdown généré pour "${title}" et sauvegardé dans ${filePath}`);
            
            return {
              id: pageId,
              title,
              success: true,
              filePath: `data_notion/${safeFilename}.md`,
            };
          } catch (error: any) {
            console.error(`Erreur lors de la génération du markdown pour la page ${pageId}:`, error);
            
            // Incrémenter le compteur même en cas d'erreur
            emitSyncProgress(io, sessionId, { 
              current: ++completed, 
              total
            });
            
            return {
              id: pageId,
              error: `Erreur: ${error.message || "Erreur inconnue"}`,
              success: false,
            };
          }
        })
      );
      
      return batchResults;
    };
    
    // Traiter les pages par lots de 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
      const batch = pageIds.slice(i, i + BATCH_SIZE);
      const batchResults = await processBatch(batch);
      results.push(...batchResults);
    }

    // Émettre la complétion
    emitSyncComplete(io, sessionId, { 
      success: true, 
      message: `${results.filter(r => r.success).length}/${total} pages synchronisées` 
    });

    return {
      success: true,
      results,
      message: `${results.filter(r => r.success).length}/${total} pages synchronisées`,
    };
  } catch (error: any) {
    console.error("Erreur lors de la génération des fichiers markdown:", error);
    
    // Émettre l'erreur
    emitSyncComplete(io, sessionId, { 
      success: false, 
      message: `Erreur: ${error.message || "Erreur inconnue"}` 
    });
    
    return {
      error: `Erreur: ${error.message || "Erreur inconnue"}`,
    };
  }
} 