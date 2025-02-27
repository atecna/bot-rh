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
    <div className={`flex flex-col ${isMobile ? 'h-full' : 'h-screen'}`}>
      <div className={`p-4 ${isMobile ? 'bg-atecna-corail text-white flex justify-between items-center' : 'bg-atecna-corail text-white'}`}>
        <h1 className="text-xl font-bold">{isMobile ? "Conversations" : "Assistant RH"}</h1>
        {isMobile && (
          <button 
            onClick={onClose} 
            className="text-white"
            aria-label="Fermer le menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {!isMobile && <div className="text-xs opacity-80">Socket: {socketStatus}</div>}
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-atecna-vert-fonce font-medium">Conversations</h2>
          {!isMobile && (
            <button 
              onClick={createNewThread}
              className="p-1.5 rounded-full bg-atecna-vert-clair text-atecna-vert-fonce hover:bg-atecna-vert-clair/80 transition-colors"
              title="Nouvelle conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="space-y-1">
          {threads.length > 0 ? (
            threads
              .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
              .map(thread => (
                <button 
                  key={thread.id} 
                  className={`w-full text-left p-2 rounded text-sm truncate transition-colors ${
                    thread.id === activeThreadId
                      ? 'bg-atecna-vert-clair text-atecna-vert-fonce font-medium'
                      : 'hover:bg-atecna-vert-clair/50 text-atecna-vert-fonce'
                  }`}
                  onClick={() => handleThreadClick(thread.id)}
                  title={thread.title}
                  aria-pressed={thread.id === activeThreadId}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="truncate">{thread.title}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-5 mt-0.5">
                    {thread.updatedAt.toLocaleDateString()} · {thread.messages.length} messages
                  </div>
                </button>
              ))
          ) : (
            <div className="text-sm text-gray-500 italic p-2">Aucune conversation</div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-atecna-corail/20 space-y-2">
        <button 
          onClick={handleNewThread}
          className="w-full bg-atecna-bleu hover:bg-atecna-bleu/90 text-white px-3 py-2 rounded-md text-sm transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle conversation
        </button>
        
        <button 
          onClick={handleClearThreads}
          className="w-full bg-atecna-corail hover:bg-atecna-corail/90 text-white px-3 py-2 rounded-md text-sm transition-colors duration-200 flex items-center justify-center gap-2"
          title="Effacer l'historique"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Effacer tout
        </button>
      </div>
    </div>
  );
} 