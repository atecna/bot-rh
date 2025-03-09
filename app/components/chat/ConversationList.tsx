import { ConversationThread } from "../types/chat";
import { motion, AnimatePresence } from "framer-motion";

interface ConversationListProps {
  threads: ConversationThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: () => void;
  onClearThreads: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function ConversationList({
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onClearThreads,
  isMobile = false,
  onClose
}: ConversationListProps) {
  const handleThreadClick = (threadId: string) => {
    onSelectThread(threadId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleNewThread = () => {
    onCreateThread();
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleClearThreads = () => {
    onClearThreads();
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <motion.div 
      initial={isMobile ? { x: -300 } : { opacity: 0 }}
      animate={isMobile ? { x: 0 } : { opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex flex-col ${isMobile ? 'h-full' : 'h-screen'} bg-atecna-vert-fonce text-white`}
    >
      {/* En-tête */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-lg font-medium">Assistant RH</h1>
        {threads.length > 0 && (
          <motion.button 
            onClick={handleNewThread}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Nouvelle conversation"
            title="Nouvelle conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        )}
        {isMobile && (
          <motion.button 
            onClick={onClose} 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Fermer le menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </div>
      
      {/* Affichage spécial quand il n'y a pas de conversations */}
      {threads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl font-medium mb-3"
          >
            Aucune conversation
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-white/70 mb-8"
          >
            Commencez une nouvelle conversation avec l'assistant RH
          </motion.p>
          <motion.button 
            onClick={handleNewThread}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white text-atecna-vert-fonce font-medium rounded-lg py-3 px-6 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle conversation
          </motion.button>
        </div>
      ) : (
        <>
          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <AnimatePresence>
              <div className="space-y-0.5">
                {threads
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                  .map((thread, index) => (
                    <motion.button 
                      key={thread.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: 0.03 * Math.min(index, 10),
                        ease: "easeOut" 
                      }}
                      whileHover={{ x: 3 }}
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
                    </motion.button>
                  ))}
              </div>
            </AnimatePresence>
          </div>
          
          {/* Bouton pour effacer les conversations */}
          <div className="p-3 border-t border-white/10">
            <button 
              onClick={handleClearThreads}
              className="w-full text-white/60 hover:text-white/80 text-xs py-2 transition-colors flex items-center justify-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Effacer les conversations
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
} 