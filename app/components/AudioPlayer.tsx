/**
 * Composant de lecture audio qui gère la lecture séquentielle des chunks audio
 */
import { useEffect, useRef } from "react";

interface AudioPlayerProps {
  audioChunks: Blob[];
}

export function AudioPlayer({ audioChunks }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);

  // Fonction pour jouer le prochain chunk dans la file
  const playNextChunk = async () => {
    const audio = audioRef.current;
    if (!audio || isPlayingRef.current || queueRef.current.length === 0) return;

    const nextChunk = queueRef.current[0];
    const url = URL.createObjectURL(nextChunk);
    
    try {
      isPlayingRef.current = true;
      audio.src = url;
      await audio.play();
    } catch (error) {
      console.error('Erreur de lecture:', error);
      isPlayingRef.current = false;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  // Gestion de la fin d'un chunk audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      isPlayingRef.current = false;
      queueRef.current.shift(); // Retire le chunk qui vient d'être joué
      playNextChunk(); // Tente de jouer le suivant
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  // Mise à jour de la file quand de nouveaux chunks arrivent
  useEffect(() => {
    if (audioChunks.length === 0) return;
    
    // Ajoute le nouveau chunk à la file
    const newChunk = audioChunks[audioChunks.length - 1];
    queueRef.current.push(newChunk);

    // Si rien n'est en cours de lecture, on démarre
    if (!isPlayingRef.current) {
      playNextChunk();
    }
  }, [audioChunks]);

  return (
    <audio ref={audioRef}>
      <track kind="captions" />
    </audio>
  );
}
