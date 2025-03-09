import { ConversationThread } from "../types/chat";

interface ConversationListProps {
  threads: ConversationThread[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string) => void;
  createNewThread: () => void;
  clearThreads: () => void;
  isMobile?: boolean;
  onClose?: () => void;
  socketStatus?: string;
}

export default function ConversationList({
  threads,
  activeThreadId,
  setActiveThreadId,
  createNewThread,
  clearThreads,
  isMobile = false,
  onClose,
  socketStatus = "non connecté"
}: ConversationListProps) {
  const handleThreadClick = (threadId: string) => {
    setActiveThreadId(threadId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleNewThread = () => {
    createNewThread();
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleClearThreads = () => {
    clearThreads();
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className={`flex flex-col ${isMobile ? 'h-full' : 'h-screen'} bg-atecna-vert-fonce text-white`}>
      {/* En-tête */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-lg font-medium">Assistant RH</h1>
        {isMobile && (
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Fermer le menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Bouton nouvelle conversation */}
      <div className="p-3">
        <button 
          onClick={handleNewThread}
          className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-md py-2.5 px-3 text-sm transition-colors flex items-center gap-2 justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle conversation
        </button>
      </div>
      
      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-0.5">
          {threads.length > 0 ? (
            threads
              .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
              .map(thread => (
                <button 
                  key={thread.id} 
                  className={`w-full text-left p-2.5 rounded-md text-sm transition-colors ${
                    thread.id === activeThreadId
                      ? 'bg-white/20 text-white'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                  onClick={() => handleThreadClick(thread.id)}
                  title={thread.title}
                  aria-pressed={thread.id === activeThreadId}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="truncate">{thread.title}</span>
                  </div>
                </button>
              ))
          ) : (
            <div className="text-sm text-white/50 italic p-2 text-center">Aucune conversation</div>
          )}
        </div>
      </div>
      
      {/* Pied de page */}
      <div className="p-3 border-t border-white/10 mt-auto">
        <button 
          onClick={handleClearThreads}
          className="w-full text-white/70 hover:text-white/90 px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 justify-center"
          title="Effacer l'historique"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Effacer tout
        </button>
        <div className="text-xs text-white/40 text-center mt-2">
          {socketStatus === "connecté" ? "✓ Connecté" : "⚠ Non connecté"}
        </div>
      </div>
    </div>
  );
} 