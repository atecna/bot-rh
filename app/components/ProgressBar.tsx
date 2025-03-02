import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface ProgressBarProps {
  sessionId: string;
}

interface ProgressData {
  current: number;
  total: number;
  pageId?: string;
  pageTitle?: string;
}

interface CompleteData {
  success: boolean;
  message: string;
}

export default function ProgressBar({ sessionId }: ProgressBarProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [complete, setComplete] = useState<CompleteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialiser le socket
    const socketInstance = io({
      path: window.location.pathname.startsWith("/bot-rh") 
        ? "/bot-rh/socket.io" 
        : "/socket.io"
    });

    socketInstance.on("connect", () => {
      console.log("Connecté au serveur socket:", socketInstance.id);
      
      // Rejoindre la salle spécifique à cette session
      socketInstance.emit("join-sync-room", sessionId);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Erreur de connexion socket:", err);
      setError(`Erreur de connexion: ${err.message}`);
    });

    socketInstance.on("sync-progress", (data: ProgressData) => {
      console.log("Progression reçue:", data);
      setProgress(data);
      setError(null);
    });

    socketInstance.on("sync-complete", (data: CompleteData) => {
      console.log("Synchronisation terminée:", data);
      setComplete(data);
      
      // Réinitialiser après 5 secondes
      setTimeout(() => {
        setProgress(null);
        setComplete(null);
      }, 5000);
    });

    setSocket(socketInstance);

    // Nettoyage à la déconnexion
    return () => {
      socketInstance.off("connect");
      socketInstance.off("connect_error");
      socketInstance.off("sync-progress");
      socketInstance.off("sync-complete");
      socketInstance.disconnect();
    };
  }, [sessionId]);

  if (!progress && !complete && !error) {
    return null;
  }

  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="mt-4 p-4 border rounded-md bg-gray-50">
      {error && (
        <div className="text-red-500 mb-2">
          {error}
        </div>
      )}
      
      {progress && !complete && (
        <>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">
              Synchronisation en cours...
            </span>
            <span className="text-sm font-medium">
              {progress.current}/{progress.total} pages
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          {progress.pageTitle && (
            <div className="mt-2 text-sm text-gray-600">
              Traitement de: {progress.pageTitle}
            </div>
          )}
        </>
      )}
      
      {complete && (
        <div className={`mt-2 text-sm ${complete.success ? 'text-green-600' : 'text-red-600'}`}>
          {complete.message}
        </div>
      )}
    </div>
  );
} 