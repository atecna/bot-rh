import { useSocket } from "~/context";
import { useEffect, useState, useRef } from "react";
import { ConversationThread, Message } from "./types/chat";
import { copyToClipboard } from "./utils/clipboard";
import ConversationList from "./chat/ConversationList";
import MessageList from "./chat/MessageList";
import MessageInput from "./chat/MessageInput";
import ConversationHeader from "./chat/ConversationHeader";

export default function ChatInterface() {
  // États
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [socketStatus, setSocketStatus] = useState<string>("non connecté");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Référence pour stocker le texte en cours de streaming
  const streamingTextRef = useRef<string>("");
  // ID du message en cours de streaming
  const streamingMessageIdRef = useRef<string | null>(null);
  
  // Récupération du socket
  const socket = useSocket();
  
  // Fonction utilitaire pour obtenir les messages du thread actif
  const activeMessages = (): Message[] => {
    if (!activeThreadId) return [];
    const thread = threads.find(t => t.id === activeThreadId);
    return thread ? thread.messages : [];
  };

  // Charger les threads depuis le localStorage au démarrage
  useEffect(() => {
    const savedThreads = localStorage.getItem('chatThreads');
    if (savedThreads) {
      try {
        const parsedThreads = JSON.parse(savedThreads);
        // Convertir les timestamps en objets Date
        const threadsWithDates = parsedThreads.map((thread: ConversationThread) => ({
          ...thread,
          createdAt: new Date(thread.createdAt),
          updatedAt: new Date(thread.updatedAt),
          messages: thread.messages.map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setThreads(threadsWithDates);
        
        // Définir le thread actif (le plus récent)
        if (threadsWithDates.length > 0) {
          const mostRecentThread = threadsWithDates.sort((a: ConversationThread, b: ConversationThread) => 
            b.updatedAt.getTime() - a.updatedAt.getTime()
          )[0];
          setActiveThreadId(mostRecentThread.id);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des threads:", error);
      }
    }
  }, []);

  // Sauvegarder les threads dans le localStorage à chaque mise à jour
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem('chatThreads', JSON.stringify(threads));
    }
  }, [threads]);

  // Effet pour vérifier l'état du socket
  useEffect(() => {
    if (socket) {
      console.log("Socket disponible:", socket.id);
      setSocketStatus(socket.connected ? "connecté" : "non connecté");
      
      socket.on("connect", () => {
        console.log("Socket connecté:", socket.id);
        setSocketStatus("connecté");
      });
      
      socket.on("disconnect", () => {
        console.log("Socket déconnecté");
        setSocketStatus("déconnecté");
      });
      
      return () => {
        socket.off("connect");
        socket.off("disconnect");
      };
    } else {
      console.log("Socket non disponible");
      setSocketStatus("non disponible");
    }
  }, [socket]);

  // Effet pour écouter les événements socket
  useEffect(() => {
    if (!socket || !activeThreadId) return;
    
    // Réinitialiser l'état au changement de thread ou de socket
    setIsProcessing(false);
    streamingTextRef.current = "";
    streamingMessageIdRef.current = null;
    
    // Gestion des réponses en streaming
    socket.on("stream-response", (chunk: string) => {
      console.log("Chunk reçu:", chunk);
      setIsProcessing(true);
      
      // Ajouter le chunk au texte en cours
      streamingTextRef.current += chunk;
      
      setThreads(prev => {
        const updatedThreads = [...prev];
        const threadIndex = updatedThreads.findIndex(t => t.id === activeThreadId);
        
        if (threadIndex === -1) return prev;
        
        const thread = updatedThreads[threadIndex];
        const messages = [...thread.messages];
        
        // Si nous avons déjà un message en cours de streaming
        if (streamingMessageIdRef.current) {
          // Trouver l'index du message en cours
          const messageIndex = messages.findIndex(m => m.id === streamingMessageIdRef.current);
          
          if (messageIndex !== -1) {
            // Mettre à jour le message existant avec le texte complet
            messages[messageIndex] = {
              ...messages[messageIndex],
              text: streamingTextRef.current
            };
          } else {
            // Si le message n'existe plus (cas rare), créer un nouveau
            const newMessageId = `assistant-${Date.now()}`;
            streamingMessageIdRef.current = newMessageId;
            
            messages.push({
              id: newMessageId,
              text: streamingTextRef.current,
              isUser: false,
              timestamp: new Date()
            });
          }
        } else {
          // Créer un nouveau message pour le streaming
          const newMessageId = `assistant-${Date.now()}`;
          streamingMessageIdRef.current = newMessageId;
          
          messages.push({
            id: newMessageId,
            text: streamingTextRef.current,
            isUser: false,
            timestamp: new Date()
          });
        }
        
        updatedThreads[threadIndex] = {
          ...thread,
          messages,
          updatedAt: new Date()
        };
        
        return updatedThreads;
      });
    });
    
    // Fin du streaming
    socket.on("stream-end", () => {
      console.log("Streaming terminé");
      setIsProcessing(false);
      
      // Finaliser le message avec un ID permanent
      if (streamingMessageIdRef.current) {
        setThreads(prev => {
          const updatedThreads = [...prev];
          const threadIndex = updatedThreads.findIndex(t => t.id === activeThreadId);
          
          if (threadIndex === -1) return prev;
          
          const thread = updatedThreads[threadIndex];
          const messages = [...thread.messages];
          
          // Trouver l'index du message en cours
          const messageIndex = messages.findIndex(m => m.id === streamingMessageIdRef.current);
          
          if (messageIndex !== -1) {
            // Remplacer l'ID temporaire par un ID permanent
            const permanentId = `assistant-final-${Date.now()}`;
            messages[messageIndex] = {
              ...messages[messageIndex],
              id: permanentId
            };
          }
          
          updatedThreads[threadIndex] = {
            ...thread,
            messages,
            updatedAt: new Date()
          };
          
          return updatedThreads;
        });
      }
      
      // Réinitialiser les références
      streamingTextRef.current = "";
      streamingMessageIdRef.current = null;
    });

    // Gestion des erreurs
    socket.on("error", (error: string) => {
      console.error("Socket error:", error);
      setIsProcessing(false);
      
      // Réinitialiser les références
      streamingTextRef.current = "";
      streamingMessageIdRef.current = null;
      
      if (activeThreadId) {
        setThreads(prev => prev.map(thread => {
          if (thread.id === activeThreadId) {
            return {
              ...thread,
              messages: [...thread.messages, {
                id: `error-${Date.now()}`,
                text: `Erreur: ${error}`,
                isUser: false,
                timestamp: new Date()
              }],
              updatedAt: new Date()
            };
          }
          return thread;
        }));
      }
    });

    return () => {
      socket.off("stream-response");
      socket.off("stream-end");
      socket.off("error");
    };
  }, [socket, activeThreadId]);

  // Fonction pour créer un nouveau thread
  const createNewThread = () => {
    const newThread: ConversationThread = {
      id: `thread-${Date.now()}`,
      title: `Conversation ${threads.length + 1}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setThreads(prev => [...prev, newThread]);
    setActiveThreadId(newThread.id);
    setInputValue("");
  };

  // Fonction pour effacer tous les threads
  const clearThreads = () => {
    localStorage.removeItem('chatThreads');
    setThreads([]);
    setActiveThreadId(null);
  };

  // Fonction pour envoyer un message
  const sendMessage = () => {
    if (!inputValue.trim() || !socket) {
      console.log("Impossible d'envoyer le message:", !inputValue.trim() ? "message vide" : "socket non disponible");
      return;
    }

    // Créer un nouveau thread si aucun n'est actif
    if (!activeThreadId) {
      const newThreadId = `thread-${Date.now()}`;
      const newThread: ConversationThread = {
        id: newThreadId,
        title: inputValue.length > 30 ? inputValue.substring(0, 30) + '...' : inputValue,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setThreads(prev => [...prev, newThread]);
      setActiveThreadId(newThreadId);
    }

    // Créer le message utilisateur
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };
    
    // Mettre à jour le thread actif avec le nouveau message
    setThreads(prev => prev.map(thread => {
      if (thread.id === activeThreadId) {
        // Si c'est le premier message, mettre à jour le titre
        if (thread.messages.length === 0) {
          thread.title = inputValue.length > 30 ? inputValue.substring(0, 30) + '...' : inputValue;
        }
        
        return {
          ...thread,
          messages: [...thread.messages, userMessage],
          updatedAt: new Date()
        };
      }
      return thread;
    }));
    
    // Envoyer au serveur avec l'historique des messages du thread actif
    const currentMessages = activeMessages();
    const conversationHistory = [...currentMessages, userMessage]
      .map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));
    
    socket.emit("ask-question", inputValue, conversationHistory);
    
    // Réinitialiser l'input
    setInputValue("");
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    console.log("Formulaire soumis");
    e.preventDefault();
    sendMessage();
  };

  // Gérer le clic sur le bouton d'envoi
  const handleButtonClick = () => {
    console.log("Bouton cliqué");
    sendMessage();
  };

  // Gérer la touche Entrée
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log("Touche Entrée pressée");
      e.preventDefault();
      sendMessage();
    }
  };

  // Gérer la copie d'un message
  const handleCopyMessage = (id: string) => {
    const message = activeMessages().find(m => m.id === id);
    if (message) {
      copyToClipboard(message.text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  // Obtenir le titre de la conversation active
  const getActiveThreadTitle = (): string => {
    if (!activeThreadId) return "Nouvelle conversation";
    const thread = threads.find(t => t.id === activeThreadId);
    return thread ? thread.title : "Conversation";
  };

  return (
    <div className="flex flex-col h-screen w-full mx-auto bg-white shadow-xl overflow-hidden md:flex-row">
      {/* Sidebar pour desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-atecna-rose border-r border-atecna-corail/20">
        <ConversationList 
          threads={threads}
          activeThreadId={activeThreadId}
          setActiveThreadId={setActiveThreadId}
          createNewThread={createNewThread}
          clearThreads={clearThreads}
          socketStatus={socketStatus}
        />
      </div>
      
      {/* Menu mobile déroulant */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" 
          role="dialog" 
          aria-modal="true"
        >
          <div 
            className="absolute top-0 left-0 w-3/4 h-full bg-atecna-rose overflow-y-auto" 
            role="document"
          >
            <ConversationList 
              threads={threads}
              activeThreadId={activeThreadId}
              setActiveThreadId={setActiveThreadId}
              createNewThread={createNewThread}
              clearThreads={clearThreads}
              isMobile={true}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
      
      {/* Contenu principal */}
      <div className="flex flex-col justify-between flex-1 max-w-full h-full">
        {/* En-tête */}
        <ConversationHeader 
          title={getActiveThreadTitle()}
          socketStatus={socketStatus}
          isMobile={true}
          onMenuOpen={() => setIsMobileMenuOpen(true)}
          onNewThread={createNewThread}
          onClearThreads={clearThreads}
        />
        
        {/* Zone des messages */}
        <MessageList 
          messages={activeMessages()}
          copiedMessageId={copiedMessageId}
          onCopyMessage={handleCopyMessage}
        />
        
        {/* Zone de saisie */}
        <MessageInput 
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSubmit={handleSubmit}
          handleKeyDown={handleKeyDown}
          handleButtonClick={handleButtonClick}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}