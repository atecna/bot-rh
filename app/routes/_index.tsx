import { useEffect, useState } from "react";
import { AudioVisualizer } from "~/components/AudioVisualiser";
import RecordingButton from "~/components/RecordingButton";
import { useSocket } from "~/context"; // Ton custom hook Socket.io
import { useAudioRecorder } from "~/utils/hooks/useAudioRecorder";

export default function Index() {
  const [currentStatus, setCurrentStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [pholonText, setPholonText] = useState("");
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Récupération du socket
  const socket = useSocket();

  // Récupération du hook d’enregistrement audio
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    permissionGranted,
  } = useAudioRecorder();

  // -------------------------------
  // Socket.io: écoute des événements
  // -------------------------------
  useEffect(() => {
    if (!socket) return;

    // Exemple: un "status" envoyé par le serveur
    socket.on("status", (data) => {
      setCurrentStatus(data);
    });

    // Exemple: texte final transcrit
    socket.on("transcription", (text: string) => {
      setTranscription(text);
      setPholonText("");
      setAudioChunks([]); // reset des chunks reçus
    });

    // Exemple: streaming de la réponse
    socket.on("stream-response", (chunk: string) => {
      setIsProcessing(true);
      setPholonText((prev) => prev + chunk);
    });

    // Exemple: on reçoit des chunks audio depuis le serveur pour visualisation
    socket.on("audio-chunk", (chunk: Buffer) => {
      const blob = new Blob([chunk], { type: "audio/mp3" });
      setAudioChunks((prev) => [...prev, blob]);
    });

    // Fin de stream
    socket.on("stream-end", () => {
      setIsProcessing(false);
      setCurrentStatus("");
    });

    // Erreurs
    socket.on("error", (error: string) => {
      console.error("Socket error:", error);
      setIsProcessing(false);
      setCurrentStatus("");
    });

    return () => {
      socket.off("status");
      socket.off("transcription");
      socket.off("stream-response");
      socket.off("audio-chunk");
      socket.off("stream-end");
      socket.off("error");
    };
  }, [socket]);

  // -------------------------------
  // Envoi du blob final au serveur
  // -------------------------------
  useEffect(() => {
    if (audioBlob && socket) {
      // On suppose que tu veux l’envoyer immédiatement
      setIsProcessing(true);
      socket.emit("audio-data", audioBlob);
    }
  }, [audioBlob, socket]);

  // -------------------------------
  // Handlers pour l’enregistrement
  // (ici on utilise PointerEvents pour
  // être compatible mobile + desktop)
  // -------------------------------
  const handlePointerDown = () => {
    startRecording();
  };

  const handlePointerUp = () => {
    stopRecording();
  };

  // -------------------------------
  // Rendu
  // -------------------------------
  return (
    <div className="flex flex-col items-center justify-center h-screen relative">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-center z-0"
        style={{ backgroundImage: "url('/pholon.png')" }}
      />

      {/* Bouton pour accéder à un historique */}
      <a href="/history" className="absolute top-0 right-0 p-4 z-10">
        <img src="/history.svg" width={24} alt="history" />
      </a>

      {/* Zone d’affichage du texte transcrit / généré */}
      <div className="absolute top-1/4 left-0 right-0 flex flex-col items-center gap-4 p-4 z-10">
        {transcription && (
          <p className="text-white bg-black/50 p-4 rounded-lg">
            &ldquo;{transcription}&rdquo;
          </p>
        )}
        {pholonText && (
          <p className="text-white bg-blue-500/50 p-4 rounded-lg max-w-2xl">
            {pholonText}
          </p>
        )}

        {/* Message si le micro est refusé */}
        {permissionGranted === false && (
          <p className="text-red-500 bg-black/50 p-2 rounded-md">
            Accès au micro refusé. Vérifiez vos paramètres.
          </p>
        )}
      </div>

      {/* Bouton d'enregistrement */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
        <RecordingButton
          isRecording={isRecording}
          // Ici on utilise des PointerEvents
          // Si tu préfères rester sur le tactile only :
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}

          isThinking={isProcessing}
          currentStatus={currentStatus}
        />
      </div>

      {/* Visualisation audio (chunks reçus) */}
      <AudioVisualizer audioChunks={audioChunks} />
    </div>
  );
}
