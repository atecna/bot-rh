import { useRef, useEffect } from "react";
import Message from "./Message";
import { Message as MessageType } from "../types/chat";
import { motion, AnimatePresence } from "framer-motion";

interface MessageListProps {
  messages: MessageType[];
  copiedMessageId: string | null;
  onCopyMessage: (id: string) => void;
  onStarterClick?: (text: string) => void;
}

export default function MessageList({ messages, copiedMessageId, onCopyMessage, onStarterClick }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effet pour le scroll automatique vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fonction pour faire défiler vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (messages.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col items-center justify-center px-4 bg-gray-50"
      >
        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl w-full text-center"
        >
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-16 h-16 bg-atecna-bleu-ciel rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-atecna-bleu" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xl font-medium text-atecna-vert-fonce mb-3"
          >
            Comment puis-je vous aider aujourd'hui ?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-sm text-gray-500 max-w-md mx-auto mb-6"
          >
            Je suis votre assistant RH. Posez-moi des questions sur les congés, les procédures internes ou toute autre information RH.
          </motion.p>
          
          {/* Starters de conversation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col gap-3 max-w-md mx-auto"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStarterClick?.("Comment poser des congés payés ?")}
              className="py-3 px-4 bg-white rounded-xl shadow-sm border border-gray-200 text-left hover:border-atecna-corail transition-colors"
            >
              <span className="text-atecna-vert-fonce font-medium">Comment poser des congés payés ?</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStarterClick?.("Quelles sont les procédures pour le télétravail ?")}
              className="py-3 px-4 bg-white rounded-xl shadow-sm border border-gray-200 text-left hover:border-atecna-corail transition-colors"
            >
              <span className="text-atecna-vert-fonce font-medium">Quelles sont les procédures pour le télétravail ?</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStarterClick?.("Comment fonctionne la mutuelle d'entreprise ?")}
              className="py-3 px-4 bg-white rounded-xl shadow-sm border border-gray-200 text-left hover:border-atecna-corail transition-colors"
            >
              <span className="text-atecna-vert-fonce font-medium">Comment fonctionne la mutuelle d'entreprise ?</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-3xl mx-auto py-6 px-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: 0.05 * Math.min(index, 5), // Limiter le délai maximum
                ease: "easeOut" 
              }}
            >
              <Message
                id={message.id}
                text={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
                onCopy={onCopyMessage}
                isCopied={copiedMessageId === message.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-40" />
      </div>
    </div>
  );
} 