import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, Form, useActionData, useNavigation } from "@remix-run/react";
import { useState, useRef, useEffect, useMemo } from "react";
import NotionPagesList, { type NotionPage } from "~/components/NotionPagesList";
import SyncResults, { type SyncResult } from "~/components/SyncResults";
import { extractPagesFromMarkdown, generateMarkdownWithNotionToMd } from "~/services/notion.server";
import { v4 as uuidv4 } from 'uuid';
import ProgressBar from '~/components/ProgressBar';

// Types pour les résultats de l'action
type SyncError = { error: string };

interface SyncSuccess {
  success: boolean;
  results: Array<{
    id: string;
    title?: string;
    success: boolean;
    filePath?: string;
    error?: string;
  }>;
  message: string;
}

type ExtractedPages = {
  pages: Array<{
    id: string;
    title: string;
    url: string;
  }>;
};

type ActionData = SyncError | SyncSuccess | ExtractedPages;

// Action pour traiter la soumission du formulaire
export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const step = formData.get("step") as string;
    
    if (step === "extract") {
      // Étape 1: Extraire les pages du markdown
      const markdownContent = formData.get("markdownContent") as string;
      
      if (!markdownContent) {
        return json<SyncError>({ error: "Aucun contenu markdown fourni" }, { status: 400 });
      }
      
      const pages = await extractPagesFromMarkdown(markdownContent);
      
      if (!pages.length) {
        return json<SyncError>({ error: "Aucune page Notion trouvée dans le markdown" }, { status: 400 });
      }
      
      return json({ pages });
    } else if (step === "generate") {
      const pageIdsArray = formData.getAll("pageIds[]");
      const sessionId = formData.get("sessionId");
      
      if (!pageIdsArray || pageIdsArray.length === 0) {
        return json<SyncError>({ error: "Aucune page sélectionnée" }, { status: 400 });
      }
      
      if (!sessionId || typeof sessionId !== "string") {
        return json<SyncError>({ error: "ID de session invalide" }, { status: 400 });
      }
      
      const pageIds = pageIdsArray.map(id => id.toString());
      
      try {
        // Obtenir l'instance io du serveur global
        const io = global.io;
        
        if (!io) {
          return json<SyncError>({ error: "Serveur socket.io non disponible" }, { status: 500 });
        }
        
        const result = await generateMarkdownWithNotionToMd(pageIds, io, sessionId);
        
        if ("error" in result) {
          return json<SyncError>(
            { 
              error: result.error || "Erreur inconnue"
            }, 
            { status: 500 }
          );
        }
        
        return json<SyncSuccess>(result as SyncSuccess);
      } catch (error: any) {
        return json<SyncError>(
          { 
            error: `Erreur: ${error.message || "Erreur inconnue"}` 
          }, 
          { status: 500 }
        );
      }
    } else {
      return json<SyncError>({ error: "Étape invalide" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error);
    return json<SyncError>(
      { 
        error: error instanceof Error ? error.message : "Une erreur s'est produite" 
      }, 
      { status: 500 }
    );
  }
}

// Fonction pour vérifier si le résultat est une erreur
function isError(data: ActionData | undefined): data is SyncError {
  return data !== undefined && 'error' in data;
}

// Composant principal de la page d'administration
export default function Admin() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [markdownContent, setMarkdownContent] = useState("");
  const [extractedPages, setExtractedPages] = useState<NotionPage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<"input" | "select">("input");
  const [sessionId, setSessionId] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();
  
  // Mettre à jour les pages extraites lorsque les données d'action changent
  useEffect(() => {
    if (
      navigation.state === "idle" && 
      actionData && 
      !isError(actionData) && 
      'pages' in actionData
    ) {
      setExtractedPages(actionData.pages);
      setCurrentStep("select");
    }
  }, [navigation.state, actionData]);
  
  // Réinitialiser le formulaire après une soumission réussie
  useEffect(() => {
    if (
      navigation.state === "idle" && 
      actionData && 
      !isError(actionData) && 
      'results' in actionData && 
      formRef.current
    ) {
      setMarkdownContent("");
      setExtractedPages([]);
      setSelectedPageIds([]);
      setCurrentStep("input");
    }
  }, [navigation.state, actionData]);
  
  useEffect(() => {
    // Générer un ID de session unique pour cette session
    setSessionId(uuidv4());
  }, []);
  
  // Convertir les résultats au format attendu par SyncResults
  const syncResults = useMemo(() => {
    if (!actionData) return [];
    
    if (isError(actionData)) return [];
    
    if ("pages" in actionData) {
      return actionData.pages.map(page => ({
        id: page.id,
        name: page.title || page.id,
        success: true
      }));
    }
    
    if ("results" in actionData) {
      return actionData.results.map(result => ({
        id: result.id,
        name: result.title || result.id,
        success: result.success,
        error: result.error,
        filePath: result.filePath
      }));
    }
    
    return [];
  }, [actionData]);
  
  // Gérer le changement de sélection
  const handleSelectionChange = (ids: string[]) => {
    setSelectedPageIds(ids);
  };
  
  // Revenir à l'étape de saisie du markdown
  const handleBackToInput = () => {
    setCurrentStep("input");
    setExtractedPages([]);
    setSelectedPageIds([]);
  };

  const handleGenerateMarkdown = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (selectedPageIds.length === 0) {
      return;
    }
    
    const formData = new FormData(event.target as HTMLFormElement);
    submit(formData, { method: "post" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Administration Notion</h1>
          <p className="mt-2 text-blue-100">Synchronisez vos pages Notion</p>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenu principal - change selon l'étape */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            {currentStep === "input" ? (
              <Form method="post" ref={formRef}>
                <input type="hidden" name="step" value="extract" />
                
                <h2 className="text-xl font-semibold mb-4">Synchronisation par Markdown</h2>
                <p className="text-gray-600 mb-4">
                  Collez le contenu Markdown de votre page Notion pour extraire les liens vers d'autres pages.
                </p>
                
                <div className="mt-4">
                  <label htmlFor="markdownContent" className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu Markdown
                  </label>
                  <textarea
                    id="markdownContent"
                    name="markdownContent"
                    rows={10}
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Collez ici le contenu Markdown de votre page Notion..."
                  ></textarea>
                </div>
                
                <div className="mt-4 flex justify-end">
                  {isSubmitting && (
                    <div className="text-sm text-blue-600 flex items-center mr-auto">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Extraction en cours...
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !markdownContent}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      isSubmitting || !markdownContent
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isSubmitting ? 'Extraction...' : 'Extraire les pages'}
                  </button>
                </div>
              </Form>
            ) : (
              <Form method="post" ref={formRef} onSubmit={handleGenerateMarkdown}>
                <input type="hidden" name="step" value="generate" />
                <input type="hidden" name="sessionId" value={sessionId} />
                
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Pages Notion trouvées</h2>
                  <button
                    type="button"
                    onClick={handleBackToInput}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Retour
                  </button>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Sélectionnez les pages que vous souhaitez synchroniser avec votre site.
                </p>
                
                {/* Champs cachés pour les IDs des pages sélectionnées */}
                {selectedPageIds.map(id => (
                  <input key={id} type="hidden" name="pageIds[]" value={id} />
                ))}
                
                {/* Liste des pages avec cases à cocher */}
                <NotionPagesList 
                  pages={extractedPages} 
                  onSelectionChange={handleSelectionChange} 
                />
                
                <div className="mt-4 flex justify-end">
                  {isSubmitting && (
                    <div className="text-sm text-blue-600 flex items-center mr-auto">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Synchronisation en cours...
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedPageIds.length === 0}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      isSubmitting || selectedPageIds.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isSubmitting ? 'Synchronisation...' : 'Synchroniser'}
                  </button>
                </div>
              </Form>
            )}
            
            {actionData && isError(actionData) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                {actionData.error}
              </div>
            )}
          </div>
        </div>
        
        {sessionId && <ProgressBar sessionId={sessionId} />}
      </main>
    </div>
  );
}
