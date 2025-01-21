// useAudioRecorder.ts
import { useEffect, useRef, useState } from "react";

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const checkPermission = async () => {
    try {
      // Vérifie si l'API permissions est disponible
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (result.state === 'granted') {
          setPermissionGranted(true);
          return true;
        } else if (result.state === 'prompt') {
          // Si on doit demander, on teste l'accès
          return requestPermission();
        } else {
          setPermissionGranted(false);
          return false;
        }
      } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API permissions
        return requestPermission();
      }
    } catch (error) {
      // Certains navigateurs peuvent lever une erreur sur permissions.query
      return requestPermission();
    }
  };

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error("Erreur de permission microphone:", error);
      setPermissionGranted(false);
      return false;
    }
  };

  useEffect(() => {
    if (typeof navigator.mediaDevices !== 'undefined' && navigator.mediaDevices.getUserMedia!) {
      checkPermission();
    } else {
      setPermissionGranted(false);
    }
  }, []);

  const startRecording = async () => {
    // On vérifie toujours les permissions avant de commencer
    const hasPermission = await checkPermission();
    if (!hasPermission) return;

    setIsRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      const chunks: Blob[] = [];
      mediaRecorder.current.ondataavailable = (evt: BlobEvent) => {
        chunks.push(evt.data);
      };

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorder.current.start();
    } catch (error) {
      console.error("Error starting media recorder:", error);
      setIsRecording(false);
      setPermissionGranted(false); // On met à jour l'état si l'accès est refusé
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorder.current = null;
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    permissionGranted
  };
};
