import { ConversationHeaderProps } from "../types/chat";

export default function ConversationHeader({
  title,
  socketStatus,
  isMobile,
  onMenuOpen,
  onNewThread,
  onClearThreads
}: ConversationHeaderProps) {
  if (isMobile) {
    return (
      <div className="bg-white text-black p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <div className="text-xs opacity-80">Assistant RH</div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onMenuOpen}
            className="bg-atecna-corail hover:bg-atecna-corail/90 text-white p-1.5 rounded-md transition-colors"
            title="Voir les conversations"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button 
            onClick={onNewThread}
            className="bg-atecna-bleu hover:bg-atecna-bleu/90 text-white p-1.5 rounded-md transition-colors"
            title="Nouvelle conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button 
            onClick={onClearThreads}
            className="bg-atecna-corail hover:bg-atecna-corail/90 text-white p-1.5 rounded-md transition-colors"
            title="Effacer l'historique"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
      <h2 className="text-xl font-semibold text-atecna-vert-fonce">{title}</h2>
      <div className="flex items-center space-x-2">
        <div className="px-3 py-1 rounded-full bg-atecna-bleu-ciel text-atecna-bleu text-sm">
          Assistant RH
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          socketStatus === "connecté" 
            ? "bg-atecna-vert-clair text-atecna-vert-fonce" 
            : "bg-atecna-rose text-atecna-corail"
        }`}>
          {socketStatus}
        </div>
      </div>
    </div>
  );
} 