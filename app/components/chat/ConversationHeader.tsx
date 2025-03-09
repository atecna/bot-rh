import { ConversationHeaderProps } from "../types/chat";

export default function ConversationHeader({
  title,
  socketStatus,
  isMobile,
  onMenuOpen,
  onNewThread,
  onClearThreads
}: ConversationHeaderProps) {
  // Version mobile simplifiée - uniquement pour le burger menu
  if (isMobile) {
    return (
      <div className="bg-white text-black py-3 px-4 flex justify-between items-center border-b border-gray-100">
        <button 
          onClick={onMenuOpen}
          className="text-atecna-corail hover:text-atecna-corail/90 transition-colors"
          title="Voir les conversations"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-medium text-atecna-vert-fonce">{title}</h1>
        <button 
          onClick={onNewThread}
          className="text-atecna-bleu hover:text-atecna-bleu/90 transition-colors"
          title="Nouvelle conversation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  }

  // Version desktop - complètement masquée
  return null;
} 