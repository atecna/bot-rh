import { ConversationHeaderProps } from "../types/chat";
import { motion } from "framer-motion";

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
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white text-black py-3 px-4 flex justify-between items-center border-b border-gray-100"
      >
        <motion.button 
          onClick={onMenuOpen}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-atecna-corail hover:text-atecna-corail/90 transition-colors"
          title="Voir les conversations"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>
        <motion.h1 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-medium text-atecna-vert-fonce"
        >
          {title}
        </motion.h1>
        <motion.button 
          onClick={onNewThread}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="text-atecna-bleu hover:text-atecna-bleu/90 transition-colors"
          title="Nouvelle conversation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      </motion.div>
    );
  }

  // Version desktop - complètement masquée
  return null;
} 