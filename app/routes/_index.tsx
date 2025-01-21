import React, { useEffect, useState } from "react";
import { AudioVisualizer } from "~/components/AudioVisualiser";
import RecordingButton from "~/components/RecordingButton";
import { useSocket } from "~/context";
import { useAudioRecorder } from "~/utils/hooks/useAudioRecorder";

export default function Index() {
  const [currentStatus, setCurrentStatus] = useState("");
  const [isMediaAvailable, setIsMediaAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [pholonText, setPholonText] = useState("");
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const socket = useSocket();
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
  } = useAudioRecorder();

  useEffect(() => {
    if (!socket) return;
    
    socket.on("status", (data) => {
      setCurrentStatus(data);
    });

    socket.on("transcription", (text: string) => {
      setTranscription(text);
      setPholonText("");
      setAudioChunks([]);
    });

    socket.on("stream-response", (chunk: string) => {
      setIsProcessing(true);
      setPholonText(prev => prev + chunk);
    });

    socket.on("audio-chunk", (chunk: Buffer) => {
      const blob = new Blob([chunk], { type: "audio/mp3" });
      setAudioChunks(prev => [...prev, blob]);
    });

    socket.on("stream-end", () => {
      setIsProcessing(false);
      setCurrentStatus("");
    });

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

  useEffect(() => {
    if (audioBlob && socket) {
      setIsProcessing(true);
      socket.emit("audio-data", audioBlob);
    }
  }, [audioBlob, socket]);

  useEffect(() => {
    setIsMediaAvailable(
      typeof navigator.mediaDevices.getUserMedia !== "undefined"
    );
  }, []);

  const onStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    startRecording();
  };

  const onEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    stopRecording();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen relative">
      <div className="absolute inset-0 bg-cover bg-no-repeat bg-center z-0" 
           style={{ backgroundImage: "url('/pholon.png')" }} />
      
      <a href="/history" className="absolute top-0 right-0 p-4 z-10">
        <img src="/history.svg" width={24} alt="history" />
      </a>

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
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
        {isMediaAvailable ? (
          <RecordingButton
            isRecording={isRecording}
            onTouchStart={onStart}
            onTouchEnd={onEnd}
            isThinking={isProcessing}
            currentStatus={currentStatus}
          />
        ) : (
          <p className="text-white">Microphone non disponible</p>
        )}
      </div>

      <AudioVisualizer audioChunks={audioChunks} />
    </div>
  );
}
