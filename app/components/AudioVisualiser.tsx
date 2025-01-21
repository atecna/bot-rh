// AudioVisualizer.js
import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  audioChunks: Blob[];
}

export function AudioVisualizer({ audioChunks }: AudioVisualizerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const queueIndexRef = useRef<number>(0);

  const cleanup = () => {
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const playNextInQueue = () => {
      cleanup();
      
      if (queueIndexRef.current >= audioChunks.length) {
        queueIndexRef.current = 0;
        return;
      }

      const chunk = audioChunks[queueIndexRef.current];
      const url = URL.createObjectURL(chunk);
      currentUrlRef.current = url;
      audio.src = url;
      audio.play().catch(console.error);
      queueIndexRef.current++;
    };

    audio.onended = playNextInQueue;
    
    // Si on a de nouveaux chunks et qu'on ne joue rien, on commence
    if (audioChunks.length > 0 && !audio.src) {
      queueIndexRef.current = 0;
      playNextInQueue();
    }

    return () => {
      audio.onended = null;
      cleanup();
    };
  }, [audioChunks]);

  return (
    <audio ref={audioRef} style={{ display: "none" }}>
      <track kind="captions" />
    </audio>
  );
}
