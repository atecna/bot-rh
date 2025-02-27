import { useRef, useEffect } from "react";
import Message from "./Message";
import { Message as MessageType } from "../types/chat";

interface MessageListProps {
  messages: MessageType[];
  copiedMessageId: string | null;
  onCopyMessage: (id: string) => void;
}

export default function MessageList({ messages, copiedMessageId, onCopyMessage }: MessageListProps) {
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
      <div className="text-center my-12 flex flex-col items-center">
        <div className="w-20 h-20 bg-atecna-bleu-ciel rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-atecna-bleu" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-atecna-vert-fonce">Bonjour ! Comment puis-je vous aider aujourd&apos;hui ?</p>
        <p className="text-sm text-gray-500 mt-2 max-w-md text-center">
          Je suis votre assistant RH. Posez-moi des questions sur les congés, les procédures internes ou toute autre information RH.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-atecna-rose/30 md:p-6" style={{ height: 'calc(100vh - 130px)' }}>
      {messages.map(message => (
        <Message
          key={message.id}
          id={message.id}
          text={message.text}
          isUser={message.isUser}
          timestamp={message.timestamp}
          onCopy={onCopyMessage}
          isCopied={copiedMessageId === message.id}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
} 