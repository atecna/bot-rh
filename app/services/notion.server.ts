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

export async function extractPagesFromMarkdown(markdownContent: string) {
  try {
    const notionLinkRegex = /https:\/\/www\.notion\.so\/([^?]+)(\?pvs=\d+)?/g;
    const matches = [...markdownContent.matchAll(notionLinkRegex)];
    
    const pages = matches
      .map(match => {
        const fullUrl = match[0];
        const pathPart = match[1];
        
        let id = '';
        let title = '';
        
        const formatRegex = /(.+)-([a-f0-9]{32})$/;
        const formatMatch = pathPart.match(formatRegex);
        
        if (formatMatch) {
          title = formatMatch[1].replace(/-/g, ' ');
          id = formatMatch[2];
        } else if (pathPart.length >= 32) {
          id = pathPart.substring(0, 32);
          title = `Page ${id.substring(0, 8)}...`;
        }
        
        return id ? { id, title, url: fullUrl } : null;
      })
      .filter(page => page !== null);
    
    return pages;
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction des pages Notion:', error);
    throw error;
  }
}

function getPageTitle(page: any): string {
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
        return titleProperty.title[0].plain_text;
      }
    }
  } catch (error) {
    console.error(`Erreur lors de l'extraction du titre de la page:`, error);
  }
  return 'Page sans titre';
}

export async function generateMarkdownWithNotionToMd(
  pageIds: string[],
  io: any,
  sessionId: string
) {
  if (!pageIds || pageIds.length === 0) {
    return { error: "Aucune page sélectionnée" };
  }

  try {
    const dataDir = path.join(process.cwd(), "data_notion");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const total = pageIds.length;
    const results = [];
    let completed = 0;

    emitSyncProgress(io, sessionId, { current: completed, total });

    const processBatch = async (batch: string[]) => {
      const batchResults = await Promise.all(
        batch.map(async (pageId) => {
          try {
            const mdblocks = await n2m.pageToMarkdown(pageId);
            const mdString = n2m.toMarkdownString(mdblocks);
            
            const page = await notion.pages.retrieve({ page_id: pageId });
            const title = getPageTitle(page);
            
            emitSyncProgress(io, sessionId, { 
              current: ++completed, 
              total, 
              pageId, 
              pageTitle: title 
            });
            
            const safeFilename = title
              .replace(/[^a-z0-9]/gi, "_")
              .toLowerCase();
            const filePath = path.join(dataDir, `${safeFilename}.md`);
            
            const content = `---\n# ${title} / ${pageId}\n---\n\n${mdString.parent}`;
            fs.writeFileSync(filePath, content);
            
            return {
              id: pageId,
              title,
              success: true,
              filePath: `data_notion/${safeFilename}.md`,
            };
          } catch (error: any) {
            console.error(`Erreur lors de la génération du markdown pour la page ${pageId}:`, error);
            
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
    
    const BATCH_SIZE = 5;
    for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
      const batch = pageIds.slice(i, i + BATCH_SIZE);
      const batchResults = await processBatch(batch);
      results.push(...batchResults);
    }

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
    
    emitSyncComplete(io, sessionId, { 
      success: false, 
      message: `Erreur: ${error.message || "Erreur inconnue"}` 
    });
    
    return {
      error: `Erreur: ${error.message || "Erreur inconnue"}`,
    };
  }
} 